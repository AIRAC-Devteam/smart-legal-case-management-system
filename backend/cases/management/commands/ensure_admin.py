import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Ensure admin user exists"

    def handle(self, *args, **options):
        User = get_user_model()

        username = os.getenv(
            "DJANGO_ADMIN_USERNAME",
            "admin",
        )

        password = os.getenv(
            "DJANGO_ADMIN_PASSWORD",
            "password",
        )

        email = os.getenv(
            "DJANGO_ADMIN_EMAIL",
            "",
        )

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )

        user.email = email
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True

        user.set_password(password)

        user.save()

        if created:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Admin user "{username}" created.'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Admin user "{username}" updated.'
                )
            )