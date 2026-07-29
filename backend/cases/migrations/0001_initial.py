# Generated for the delivered MVP.
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Document",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("file", models.ImageField(upload_to="notifications/%Y/%m/%d/")),
                ("original_name", models.CharField(blank=True, max_length=255)),
                ("status", models.CharField(choices=[("uploaded", "Uploaded"), ("processing", "Processing"), ("completed", "Completed"), ("failed", "Failed")], default="uploaded", max_length=20)),
                ("extraction_engine", models.CharField(blank=True, max_length=32)),
                ("extracted_data", models.JSONField(blank=True, default=dict)),
                ("raw_text", models.TextField(blank=True)),
                ("error_message", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("processed_at", models.DateTimeField(blank=True, null=True)),
            ],
        ),
        migrations.CreateModel(
            name="Case",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("case_name", models.CharField(blank=True, max_length=255)),
                ("internal_ref", models.CharField(blank=True, max_length=100)),
                ("case_number", models.CharField(blank=True, db_index=True, max_length=150)),
                ("subject_category", models.CharField(blank=True, max_length=255)),
                ("creation_date", models.CharField(blank=True, max_length=32)),
                ("authority_category", models.CharField(blank=True, max_length=255)),
                ("case_type", models.CharField(blank=True, choices=[("legal", "حقوقی"), ("criminal", "کیفری"), ("quasi_judicial", "شبه قضایی"), ("administrative", "اداری")], max_length=32)),
                ("classification", models.CharField(choices=[("normal", "عادی"), ("confidential", "محرمانه")], default="normal", max_length=32)),
                ("financial_status", models.CharField(blank=True, choices=[("financial", "مالی"), ("non_financial", "غیر مالی")], max_length=32)),
                ("amount", models.DecimalField(blank=True, decimal_places=0, max_digits=20, null=True)),
                ("submitted_by", models.CharField(blank=True, choices=[("organization", "سازمان/شرکت"), ("other", "دیگری")], max_length=32)),
                ("has_imprisonment", models.BooleanField(blank=True, null=True)),
                ("case_status", models.CharField(blank=True, choices=[("primary", "اصلی"), ("secondary", "فرعی")], max_length=32)),
                ("province", models.CharField(blank=True, max_length=100)),
                ("city", models.CharField(blank=True, max_length=100)),
                ("plaintiff_defendant", models.TextField(blank=True)),
                ("description", models.TextField(blank=True)),
                ("notification_data", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("notification_document", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="cases", to="cases.document")),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
