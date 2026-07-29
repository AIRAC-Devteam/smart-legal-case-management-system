from rest_framework import serializers

from .models import Case, Document


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


class CaseSerializer(serializers.ModelSerializer):
    notification_document_detail = DocumentSerializer(
        source="notification_document",
        read_only=True,
    )

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
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "notification_document_detail",
        ]
