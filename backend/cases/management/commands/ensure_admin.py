from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Ensure default admin user exists"

    def handle(self, *args, **options):
        User = get_user_model()

        user, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )

        user.is_staff = True
        user.is_superuser = True
        user.is_active = True

        # Demo credentials requested for this project
        user.set_password("password")

        user.save()

        if created:
            self.stdout.write(
                self.style.SUCCESS("Admin user created.")
            )
        else:
            self.stdout.write(
                self.style.SUCCESS("Admin user updated.")
            )