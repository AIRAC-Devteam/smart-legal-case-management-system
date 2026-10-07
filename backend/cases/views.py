import os
from pathlib import Path

from django.db import transaction
from django.db.models import Max, Q
from django.utils import timezone
from rest_framework import status, viewsets, serializers, mixins
from rest_framework.decorators import (
    action,
    api_view,
    permission_classes,
)

from rest_framework.permissions import AllowAny
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .models import Case, CaseAttachment, DefenseDraft, Document, LegalSource
from .serializers import (
    CaseAttachmentDetailSerializer,
    CaseAttachmentSerializer,
    LegalSourceSerializer,
)
from .services.legal_sources import read_word, summarize_source, MAX_SELECTED_CHARS
from .serializers import (
    CaseSerializer,
    DefenseDraftSerializer,
    DocumentSerializer,
)
from .services.defense_generator import (
    DefenseGenerationError,
    generate_defense_brief,
)
from .services.extraction import extract_document
from .services.legal_source_recommender import (
    LegalSourceRecommendationError,
    recommend_legal_sources,
)


ALLOWED_DOCUMENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
}
MAX_CASE_ATTACHMENTS = 5


@api_view(["GET"])
def health(request):
    return Response(
        {
            "status": "ok",
            "service": "legal-case-manager-backend",
        }
    )


class DocumentViewSet(viewsets.ModelViewSet):
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer
    parser_classes = [MultiPartParser, FormParser]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def create(self, request, *args, **kwargs):
        upload = request.FILES.get("file")
        if not upload:
            return Response(
                {"detail": "فایل الزامی است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            max_mb = int(os.getenv("MAX_UPLOAD_MB", "12"))
        except ValueError:
            max_mb = 12

        if upload.size > max_mb * 1024 * 1024:
            return Response(
                {"detail": f"حداکثر حجم فایل {max_mb} مگابایت است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        content_type = (upload.content_type or "").lower()
        if content_type not in ALLOWED_DOCUMENT_TYPES:
            return Response(
                {"detail": "فرمت مجاز: JPG، PNG، WEBP و PDF."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        document = Document.objects.create(
            file=upload,
            original_name=Path(upload.name).name,
            content_type=content_type,
        )

        auto_extract = str(request.data.get("auto_extract", "true")).lower() not in {
            "0",
            "false",
            "no",
        }
        if auto_extract:
            self._process(document)

        serializer = self.get_serializer(document, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], url_path="extract")
    def extract(self, request, pk=None):
        document = self.get_object()
        self._process(document)

        serializer = self.get_serializer(document, context={"request": request})
        http_status = (
            status.HTTP_200_OK
            if document.status == Document.Status.COMPLETED
            else status.HTTP_422_UNPROCESSABLE_ENTITY
        )
        return Response(serializer.data, status=http_status)

    @staticmethod
    def _process(document: Document):
        document.status = Document.Status.PROCESSING
        document.error_message = ""
        document.save(update_fields=["status", "error_message"])

        try:
            data, raw_text, engine = extract_document(document.file.path)
            document.extracted_data = data
            document.raw_text = raw_text
            document.extraction_engine = engine
            document.status = Document.Status.COMPLETED
            document.error_message = ""
        except Exception as exc:
            document.status = Document.Status.FAILED
            document.error_message = {
                   "استخراج متن از فایل انجام نشد."
            }
        finally:
            document.processed_at = timezone.now()
            document.save()


class LegalSourceViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin,
                         mixins.DestroyModelMixin, viewsets.GenericViewSet):
    queryset = LegalSource.objects.all()
    serializer_class = LegalSourceSerializer
    parser_classes = [MultiPartParser, FormParser]

    def create(self, request):
        upload = request.FILES.get("file")
        if not upload:
            return Response({"detail": "فایل Word را انتخاب کنید."}, status=400)
        text, digest = read_word(upload)
        title = str(request.data.get("title", "")).strip() or Path(upload.name).stem
        if len(title) > 255:
            return Response({"detail": "عنوان باید حداکثر ۲۵۵ نویسه باشد."}, status=400)
        source = LegalSource.objects.create(file=upload, title=title,
                    original_name=Path(upload.name).name, raw_text=text, sha256=digest)
        self._process(source)
        return Response(self.get_serializer(source).data, status=201)

    @staticmethod
    def _process(source):
        try:
            source.summary = summarize_source(source.raw_text)
            source.status = "ready"
            source.error_message = ""
        except Exception:
            source.status = "failed"
            source.error_message = "پردازش هوشمند انجام نشد. تنظیمات سرویس و اتصال را بررسی و دوباره تلاش کنید."
        source.save(update_fields=["summary", "status", "error_message"])

    @action(detail=True, methods=["post"])
    def retry(self, request, pk=None):
        source = self.get_object()
        claimed = LegalSource.objects.filter(pk=source.pk, status="failed").update(status="processing")
        if not claimed:
            return Response({"detail": "فقط سند ناموفق قابل پردازش مجدد است."}, status=409)
        self._process(source)
        return Response(self.get_serializer(source).data)

    @action(detail=True, methods=["get"])
    def text(self, request, pk=None):
        return Response({"text": self.get_object().raw_text})

    def perform_destroy(self, instance):
        instance.file.delete(save=False)
        instance.delete()


class CaseViewSet(viewsets.ModelViewSet):
    queryset = (
        Case.objects.select_related("notification_document")
        .prefetch_related("defense_drafts", "attachments__document")
        .all()
    )
    serializer_class = CaseSerializer

    def perform_update(self, serializer):
        # هر ویرایش پرونده نیازمند بازبینی و تأیید دوباره است.
        serializer.save(
            workflow_step=Case.WorkflowStep.REVIEW,
            confirmed_at=None,
        )

    @action(detail=True, methods=["post"], url_path="confirm")
    def confirm(self, request, pk=None):
        case = self.get_object()
        case.workflow_step = Case.WorkflowStep.DEFENSE
        case.confirmed_at = timezone.now()
        case.save(update_fields=["workflow_step", "confirmed_at", "updated_at"])
        return Response(
            self.get_serializer(case, context={"request": request}).data
        )

    @action(
        detail=True,
        methods=["get", "post"],
        url_path="attachments",
        parser_classes=[MultiPartParser, FormParser],
    )
    def attachments(self, request, pk=None):
        case = self.get_object()
        if request.method == "GET":
            queryset = case.attachments.select_related("document").all()
            return Response(
                CaseAttachmentSerializer(
                    queryset,
                    many=True,
                    context={"request": request},
                ).data
            )

        upload = request.FILES.get("file")
        if not upload:
            return Response(
                {"detail": "فایل پیوست الزامی است."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if case.attachments.count() >= MAX_CASE_ATTACHMENTS:
            return Response(
                {"detail": f"هر پرونده حداکثر {MAX_CASE_ATTACHMENTS} پیوست می‌تواند داشته باشد."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            max_mb = int(os.getenv("MAX_UPLOAD_MB", "12"))
        except ValueError:
            max_mb = 12
        if upload.size > max_mb * 1024 * 1024:
            return Response(
                {"detail": f"حداکثر حجم هر پیوست {max_mb} مگابایت است."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        content_type = (upload.content_type or "").lower()
        if content_type not in ALLOWED_DOCUMENT_TYPES:
            return Response(
                {"detail": "فرمت مجاز پیوست: JPG، PNG، WEBP و PDF."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            document = Document.objects.create(
                file=upload,
                original_name=Path(upload.name).name,
                content_type=content_type,
            )
            DocumentViewSet._process(document)
            attachment = CaseAttachment.objects.create(
                case=case,
                document=document,
            )

        return Response(
            CaseAttachmentSerializer(
                attachment,
                context={"request": request},
            ).data,
            status=status.HTTP_201_CREATED,
        )

    @action(
        detail=True,
        methods=["get", "delete"],
        url_path=r"attachments/(?P<attachment_id>\d+)",
    )
    def attachment_detail(self, request, pk=None, attachment_id=None):
        case = self.get_object()
        attachment = case.attachments.select_related("document").filter(
            pk=attachment_id
        ).first()
        if not attachment:
            return Response(
                {"detail": "پیوست این پرونده پیدا نشد."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if request.method == "GET":
            return Response(
                CaseAttachmentDetailSerializer(
                    attachment,
                    context={"request": request},
                ).data
            )

        document = attachment.document
        if document.file:
            document.file.delete(save=False)
        attachment.delete()
        document.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], url_path="recommend-legal-sources")
    def recommend_legal_sources(self, request, pk=None):
        case = self.get_object()
        ready_sources = LegalSource.objects.filter(status="ready").order_by("-created_at")
        if not ready_sources:
            return Response({"selected_source_ids": [], "recommendations": []})

        candidates = [
            {
                "id": source.id,
                "title": source.title,
                "original_name": source.original_name,
                "summary": source.summary,
            }
            for source in ready_sources
        ]
        try:
            result = recommend_legal_sources(
                case_data=self.get_serializer(case).data,
                legal_sources=candidates,
            )
        except LegalSourceRecommendationError as exc:
            return Response(
                {"detail": "لطفا دوباره تلاش کنید"},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        valid_ids = {source["id"] for source in candidates}
        recommendations = []
        seen = set()
        for item in result.get("recommendations", []):
            source_id = item.get("source_id")
            if source_id not in valid_ids or source_id in seen:
                continue
            seen.add(source_id)
            recommendations.append(
                {
                    "source_id": source_id,
                    "priority": item.get("priority", "medium"),
                    "reason": item.get("reason", ""),
                }
            )

        selected_ids = []
        for source_id in result.get("selected_source_ids", []):
            if source_id in valid_ids and source_id not in selected_ids:
                selected_ids.append(source_id)
        selected_ids = selected_ids[:30]

        return Response(
            {
                "selected_source_ids": selected_ids,
                "recommendations": recommendations,
            }
        )

    @action(detail=True, methods=["get"], url_path="defense-drafts")
    def defense_drafts(self, request, pk=None):
        case = self.get_object()
        drafts = case.defense_drafts.select_related("case").all()
        serializer = DefenseDraftSerializer(
            drafts,
            many=True,
            context={"request": request},
        )
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="generate-defense")
    def generate_defense(self, request, pk=None):
        case = self.get_object()
        if case.workflow_step < Case.WorkflowStep.DEFENSE:
            return Response(
                {"detail": "ابتدا اطلاعات پرونده را در مرحله تأیید اطلاعات بررسی و تأیید کنید."},
                status=status.HTTP_409_CONFLICT,
            )
        selection = serializers.ListField(child=serializers.IntegerField(min_value=1), max_length=30)
        ids = selection.run_validation(request.data.get("source_ids", []))
        ids = list(dict.fromkeys(ids))
        attachment_selection = serializers.ListField(
            child=serializers.IntegerField(min_value=1),
            max_length=MAX_CASE_ATTACHMENTS,
        )
        attachment_ids = attachment_selection.run_validation(
            request.data.get("attachment_ids", [])
        )
        attachment_ids = list(dict.fromkeys(attachment_ids))
        sources = {s.id: s for s in LegalSource.objects.filter(id__in=ids)}
        if len(sources) != len(ids) or any(s.status != "ready" for s in sources.values()):
            return Response({"detail": "یک یا چند منبع حذف شده یا آماده نیست. فهرست منابع را تازه‌سازی کنید."}, status=400)
        selected_sources = [{"id": sources[i].id, "title": sources[i].title,
                             "original_name": sources[i].original_name, "sha256": sources[i].sha256,
                             "text": sources[i].raw_text} for i in ids]
        if sum(len(s["text"]) for s in selected_sources) > MAX_SELECTED_CHARS:
            return Response({"detail": "مجموع متن منابع از ۴۰۰٬۰۰۰ نویسه بیشتر است. منابع کمتری انتخاب کنید؛ متن اسناد کوتاه نمی‌شود."}, status=400)

        attachments = {
            attachment.id: attachment
            for attachment in CaseAttachment.objects.select_related("document").filter(
                case=case,
                id__in=attachment_ids,
            )
        }
        if len(attachments) != len(attachment_ids) or any(
            attachment.document.status != Document.Status.COMPLETED
            for attachment in attachments.values()
        ):
            return Response(
                {"detail": "یک یا چند پیوست این پرونده آماده استفاده نیست. فهرست پیوست‌ها را تازه‌سازی کنید."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        selected_attachments = [
            {
                "id": attachment.id,
                "document_id": attachment.document_id,
                "original_name": attachment.document.original_name,
                "content_type": attachment.document.content_type,
                "extracted_data": attachment.document.extracted_data or {},
                "text": attachment.document.raw_text or "",
            }
            for attachment_id in attachment_ids
            for attachment in [attachments[attachment_id]]
        ]
        total_input_chars = sum(len(source["text"]) for source in selected_sources) + sum(
            len(attachment["text"]) for attachment in selected_attachments
        )
        if total_input_chars > MAX_SELECTED_CHARS:
            return Response(
                {"detail": "مجموع متن منابع قانونی و پیوست‌ها از ۴۰۰٬۰۰۰ نویسه بیشتر است. موارد کمتری انتخاب کنید؛ متن اسناد کوتاه نمی‌شود."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        case_data = self.get_serializer(case).data
        extracted_data = case.notification_data or {}

        try:
            result = generate_defense_brief(
                extracted_data=extracted_data,
                case_data=case_data,
                legal_sources=selected_sources,
                attachments=selected_attachments,
            )
        except DefenseGenerationError as exc:
            return Response(
                {"detail":"تولید پیش‌نویس لایحه در حال حاضر با مشکل مواجه شد. لطفاً دوباره تلاش کنید."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        with transaction.atomic():
            locked_case = Case.objects.select_for_update().get(pk=case.pk)
            last_version = (
                locked_case.defense_drafts.aggregate(max_version=Max("version"))[
                    "max_version"
                ]
                or 0
            )
            draft = DefenseDraft.objects.create(
                case=locked_case,
                version=last_version + 1,
                title=result.get("title") or "پیش‌نویس لایحه دفاعیه",
                full_text=result.get("full_text") or "",
                structured_data=result,
                source_snapshot=selected_sources,
                attachment_snapshot=selected_attachments,
                status=DefenseDraft.Status.DRAFT,
                source_engine="gemini",
                model_name=os.getenv("GEMINI_MODEL", "gemini-3.6-flash"),
                requires_legal_review=True,
            )

        return Response(
            {
                "status": "completed",
                "case_id": case.id,
                "draft": DefenseDraftSerializer(
                    draft,
                    context={"request": request},
                ).data,
                "defense": result,
                "requires_legal_review": True,
            },
            status=status.HTTP_201_CREATED,
        )


class DefenseDraftViewSet(viewsets.ModelViewSet):
    serializer_class = DefenseDraftSerializer
    http_method_names = ["get", "patch", "delete", "head", "options"]

    def get_queryset(self):
        queryset = DefenseDraft.objects.select_related("case").all()
        case_id = self.request.query_params.get("case")
        draft_status = self.request.query_params.get("status")
        query = self.request.query_params.get("q", "").strip()

        if case_id:
            queryset = queryset.filter(case_id=case_id)
        if draft_status:
            queryset = queryset.filter(status=draft_status)
        if query:
            queryset = queryset.filter(
                Q(title__icontains=query)
                | Q(full_text__icontains=query)
                | Q(case__case_name__icontains=query)
                | Q(case__case_number__icontains=query)
                | Q(case__internal_ref__icontains=query)
            )
        return queryset

    def perform_update(self, serializer):
        requested_status = serializer.validated_data.get("status")
        reviewed_at = serializer.instance.reviewed_at

        if requested_status in {
            DefenseDraft.Status.UNDER_REVIEW,
            DefenseDraft.Status.APPROVED,
        }:
            reviewed_at = reviewed_at or timezone.now()
        elif requested_status == DefenseDraft.Status.DRAFT:
            reviewed_at = None

        serializer.save(reviewed_at=reviewed_at)
