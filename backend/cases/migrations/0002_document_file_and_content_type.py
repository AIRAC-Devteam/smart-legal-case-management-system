from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("cases", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="document",
            name="file",
            field=models.FileField(upload_to="notifications/%Y/%m/%d/"),
        ),
        migrations.AddField(
            model_name="document",
            name="content_type",
            field=models.CharField(blank=True, max_length=100),
        ),
    ]
