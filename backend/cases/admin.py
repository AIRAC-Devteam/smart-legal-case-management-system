from django.contrib import admin
from .models import Case, Document


@admin.register(Case)
class CaseAdmin(admin.ModelAdmin):
    list_display = ("id", "case_name", "case_number", "case_type", "province", "created_at")
    search_fields = ("case_name", "case_number", "internal_ref")


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ("id", "original_name", "status", "extraction_engine", "created_at")
    list_filter = ("status", "extraction_engine")
