from django.db import migrations, models


def unlock_existing_defense_cases(apps, schema_editor):
    Case = apps.get_model("cases", "Case")
    DefenseDraft = apps.get_model("cases", "DefenseDraft")
    case_ids = list(
        DefenseDraft.objects.values_list("case_id", flat=True).distinct()
    )
    if case_ids:
        Case.objects.filter(id__in=case_ids).update(workflow_step=3)


class Migration(migrations.Migration):

    dependencies = [
        ("cases", "0006_defensedraft_attachment_snapshot_caseattachment"),
    ]

    operations = [
        migrations.AddField(
            model_name="case",
            name="workflow_step",
            field=models.PositiveSmallIntegerField(
                choices=[
                    (1, "تشکیل پرونده"),
                    (2, "تأیید اطلاعات"),
                    (3, "پیش‌نویس لایحه"),
                ],
                db_index=True,
                default=2,
            ),
        ),
        migrations.AddField(
            model_name="case",
            name="confirmed_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.RunPython(
            unlock_existing_defense_cases,
            migrations.RunPython.noop,
        ),
    ]
