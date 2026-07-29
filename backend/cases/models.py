from django.db import models


class Document(models.Model):
    class Status(models.TextChoices):
        UPLOADED = "uploaded", "Uploaded"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"

    file = models.FileField(upload_to="notifications/%Y/%m/%d/")
    original_name = models.CharField(max_length=255, blank=True)
    content_type = models.CharField(max_length=100, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.UPLOADED,
    )
    extraction_engine = models.CharField(max_length=32, blank=True)
    extracted_data = models.JSONField(default=dict, blank=True)
    raw_text = models.TextField(blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Document #{self.pk} - {self.original_name or self.file.name}"


class Case(models.Model):
    CASE_TYPES = [
        ("legal", "حقوقی"),
        ("criminal", "کیفری"),
        ("quasi_judicial", "شبه قضایی"),
        ("administrative", "اداری"),
    ]
    CLASSIFICATIONS = [
        ("normal", "عادی"),
        ("confidential", "محرمانه"),
    ]
    FINANCIAL_STATUSES = [
        ("financial", "مالی"),
        ("non_financial", "غیر مالی"),
    ]
    CASE_STATUSES = [
        ("primary", "اصلی"),
        ("secondary", "فرعی"),
    ]
    SUBMITTED_BY_CHOICES = [
        ("organization", "سازمان/شرکت"),
        ("other", "دیگری"),
    ]

    case_name = models.CharField(max_length=255, blank=True)
    internal_ref = models.CharField(max_length=100, blank=True)
    case_number = models.CharField(max_length=150, db_index=True, blank=True)
    subject_category = models.CharField(max_length=255, blank=True)
    creation_date = models.CharField(max_length=32, blank=True)
    authority_category = models.CharField(max_length=255, blank=True)
    case_type = models.CharField(
        max_length=32,
        choices=CASE_TYPES,
        blank=True,
    )
    classification = models.CharField(
        max_length=32,
        choices=CLASSIFICATIONS,
        default="normal",
    )
    financial_status = models.CharField(
        max_length=32,
        choices=FINANCIAL_STATUSES,
        blank=True,
    )
    amount = models.DecimalField(
        max_digits=20,
        decimal_places=0,
        null=True,
        blank=True,
    )
    submitted_by = models.CharField(
        max_length=32,
        choices=SUBMITTED_BY_CHOICES,
        blank=True,
    )
    has_imprisonment = models.BooleanField(null=True, blank=True)
    case_status = models.CharField(
        max_length=32,
        choices=CASE_STATUSES,
        blank=True,
    )
    province = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    plaintiff_defendant = models.TextField(blank=True)
    description = models.TextField(blank=True)
    notification_data = models.JSONField(default=dict, blank=True)
    notification_document = models.ForeignKey(
        Document,
        on_delete=models.SET_NULL,
        related_name="cases",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.case_name or self.case_number or f"Case #{self.pk}"
