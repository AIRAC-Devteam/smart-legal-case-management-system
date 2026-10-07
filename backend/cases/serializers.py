from rest_framework import serializers

from .models import Case, CaseAttachment, DefenseDraft, Document, LegalSource


class LegalSourceSerializer(serializers.ModelSerializer):
    character_count = serializers.SerializerMethodField()

    class Meta:
        model = LegalSource
        fields = ["id", "title", "original_name", "summary", "status", "error_message", "character_count", "created_at"]
        read_only_fields = fields

    def get_character_count(self, obj):
        return len(obj.raw_text)


class DocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            "id",
            "file",
            "file_url",
            "original_name",
            "content_type",
            "status",
            "extracted_data",
            "raw_text",
            "error_message",
            "created_at",
            "processed_at",
        ]
        read_only_fields = [
            "id",
            "file_url",
            "original_name",
            "content_type",
            "status",
            "extracted_data",
            "raw_text",
            "error_message",
            "created_at",
            "processed_at",
        ]

    def get_file_url(self, obj):
        if not obj.file:
            return None

        request = self.context.get("request")
        url = obj.file.url
        return request.build_absolute_uri(url) if request else url


class CaseAttachmentSerializer(serializers.ModelSerializer):
    document_id = serializers.IntegerField(source="document.id", read_only=True)
    original_name = serializers.CharField(source="document.original_name", read_only=True)
    content_type = serializers.CharField(source="document.content_type", read_only=True)
    status = serializers.CharField(source="document.status", read_only=True)
    extracted_data = serializers.JSONField(source="document.extracted_data", read_only=True)
    error_message = serializers.CharField(source="document.error_message", read_only=True)
    character_count = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = CaseAttachment
        fields = [
            "id",
            "document_id",
            "original_name",
            "content_type",
            "status",
            "extracted_data",
            "error_message",
            "character_count",
            "file_url",
            "created_at",
        ]
        read_only_fields = fields

    def get_character_count(self, obj):
        return len(obj.document.raw_text or "")

    def get_file_url(self, obj):
        if not obj.document.file:
            return None

        request = self.context.get("request")
        url = obj.document.file.url
        return request.build_absolute_uri(url) if request else url


class CaseAttachmentDetailSerializer(CaseAttachmentSerializer):
    raw_text = serializers.CharField(source="document.raw_text", read_only=True)

    class Meta(CaseAttachmentSerializer.Meta):
        fields = CaseAttachmentSerializer.Meta.fields + ["raw_text"]


class CaseSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Case
        fields = [
            "id",
            "case_name",
            "case_number",
            "internal_ref",
            "subject_category",
            "authority_category",
            "classification",
        ]


class DefenseDraftSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = DefenseDraft
        fields = [
            "id",
            "version",
            "title",
            "status",
            "requires_legal_review",
            "created_at",
            "updated_at",
        ]


class DefenseDraftSerializer(serializers.ModelSerializer):
    case_detail = CaseSummarySerializer(source="case", read_only=True)

    class Meta:
        model = DefenseDraft
        fields = [
            "id",
            "case",
            "case_detail",
            "version",
            "title",
            "full_text",
            "structured_data",
            "source_snapshot",
            "attachment_snapshot",
            "status",
            "requires_legal_review",
            "created_at",
            "updated_at",
            "reviewed_at",
        ]
        read_only_fields = [
            "id",
            "case_detail",
            "version",
            "structured_data",
            "source_snapshot",
            "attachment_snapshot",
            "requires_legal_review",
            "created_at",
            "updated_at",
            "reviewed_at",
        ]


class CaseSerializer(serializers.ModelSerializer):
    notification_document_detail = DocumentSerializer(
        source="notification_document",
        read_only=True,
    )
    defense_drafts_count = serializers.SerializerMethodField()
    latest_defense_draft = serializers.SerializerMethodField()
    attachments = CaseAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Case
        fields = [
            "id",
            "case_name",
            "internal_ref",
            "case_number",
            "subject_category",
            "creation_date",
            "authority_category",
            "case_type",
            "classification",
            "financial_status",
            "amount",
            "submitted_by",
            "has_imprisonment",
            "case_status",
            "province",
            "city",
            "plaintiff_defendant",
            "description",
            "notification_data",
            "notification_document",
            "notification_document_detail",
            "workflow_step",
            "confirmed_at",
            "attachments",
            "defense_drafts_count",
            "latest_defense_draft",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "workflow_step",
            "confirmed_at",
            "notification_document_detail",
            "attachments",
            "defense_drafts_count",
            "latest_defense_draft",
        ]

    def get_defense_drafts_count(self, obj):
        prefetched = getattr(obj, "_prefetched_objects_cache", {}).get("defense_drafts")
        if prefetched is not None:
            return len(prefetched)
        return obj.defense_drafts.count()

    def get_latest_defense_draft(self, obj):
        prefetched = getattr(obj, "_prefetched_objects_cache", {}).get("defense_drafts")
        latest = prefetched[0] if prefetched else obj.defense_drafts.first()
        if not latest:
            return None
        return DefenseDraftSummarySerializer(latest).data
