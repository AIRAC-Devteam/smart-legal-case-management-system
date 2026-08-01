from django.contrib import admin

from .models import Case, DefenseDraft, Document


@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "case_name",
        "case_number",
        "case_type",
        "province",
        "created_at",
    )
    search_fields = ("case_name", "case_number", "internal_ref")
    list_filter = ("case_type", "classification", "financial_status")


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("id", "original_name", "status", "extraction_engine", "created_at")
    list_filter = ("status", "extraction_engine")


@admin.register(DefenseDraft)
class DefenseDraftAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "case",
        "version",
        "title",
        "status",
        "model_name",
        "updated_at",
    )
    list_filter = ("status", "source_engine", "model_name")
    search_fields = (
        "title",
        "full_text",
        "case__case_name",
        "case__case_number",
        "case__internal_ref",
    )
    readonly_fields = ("version", "structured_data", "created_at", "updated_at")
