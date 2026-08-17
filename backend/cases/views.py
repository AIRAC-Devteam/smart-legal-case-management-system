import os
from pathlib import Path

from django.db import transaction
from django.db.models import Max, Q
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import (
    action,
    api_view,
    permission_classes,
)

from rest_framework.permissions import AllowAny
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from .models import Case, DefenseDraft, Document
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


ALLOWED_DOCUMENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
}


@api_view(["GET"])
def health(request):
    return Response(
        {
            "status": "ok",
            "service": "legal-case-manager-backend",
            "extraction_engine": "gemini",
            "gemini_model": os.getenv("GEMINI_MODEL", "gemini-3.6-flash"),
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
            document.error_message = str(exc)
        finally:
            document.processed_at = timezone.now()
            document.save()


class CaseViewSet(viewsets.ModelViewSet):
    queryset = (
        Case.objects.select_related("notification_document")
        .prefetch_related("defense_drafts")
        .all()
    )
    serializer_class = CaseSerializer

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
        case_data = self.get_serializer(case).data
        extracted_data = case.notification_data or {}

        try:
            result = generate_defense_brief(
                extracted_data=extracted_data,
                case_data=case_data,
            )
        except DefenseGenerationError as exc:
            return Response(
                {"detail": str(exc)},
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
