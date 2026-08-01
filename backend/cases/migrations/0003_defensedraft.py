from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("cases", "0002_document_file_and_content_type"),
    ]

    operations = [
        migrations.CreateModel(
            name="DefenseDraft",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("version", models.PositiveIntegerField(default=1)),
                ("title", models.CharField(blank=True, max_length=255)),
                ("full_text", models.TextField()),
                ("structured_data", models.JSONField(blank=True, default=dict)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("draft", "پیش‌نویس"),
                            ("under_review", "در حال بررسی"),
                            ("approved", "تأییدشده"),
                            ("archived", "بایگانی‌شده"),
                        ],
                        db_index=True,
                        default="draft",
                        max_length=24,
                    ),
                ),
                ("source_engine", models.CharField(default="gemini", max_length=32)),
                ("model_name", models.CharField(blank=True, max_length=100)),
                ("requires_legal_review", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                (
                    "case",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="defense_drafts",
                        to="cases.case",
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddConstraint(
            model_name="defensedraft",
            constraint=models.UniqueConstraint(
                fields=("case", "version"),
                name="unique_defense_draft_version_per_case",
            ),
        ),
    ]
