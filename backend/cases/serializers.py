from rest_framework import serializers

from .models import Case, DefenseDraft, Document


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
            "extraction_engine",
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
            "extraction_engine",
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
            "status",
            "source_engine",
            "model_name",
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
            "source_engine",
            "model_name",
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
            "defense_drafts_count",
            "latest_defense_draft",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "notification_document_detail",
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
