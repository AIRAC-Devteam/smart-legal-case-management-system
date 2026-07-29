from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Case, Document


class ApiSmokeTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health(self):
        response = self.client.get("/api/v1/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "ok")
        self.assertEqual(response.data["extraction_engine"], "gemini")

    @patch("cases.views.extract_document")
    def test_pdf_upload_and_extraction(self, extract_document):
        extract_document.return_value = (
            {
                "case_number": "123",
                "classification": "normal",
                "document_type": "notification",
            },
            "متن",
            "gemini",
        )

        upload = SimpleUploadedFile(
            "notice.pdf",
            b"%PDF-1.4 mock",
            content_type="application/pdf",
        )
        response = self.client.post(
            "/api/v1/documents/",
            {"file": upload},
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "completed")
        self.assertEqual(response.data["content_type"], "application/pdf")
        self.assertEqual(Document.objects.count(), 1)

    def test_case_crud(self):
        create_response = self.client.post(
            "/api/v1/cases/",
            {
                "case_name": "پرونده آزمایشی",
                "case_number": "1405-1",
                "classification": "normal",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, 201)
        case_id = create_response.data["id"]

        patch_response = self.client.patch(
            f"/api/v1/cases/{case_id}/",
            {"city": "تهران"},
            format="json",
        )
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.data["city"], "تهران")

        list_response = self.client.get("/api/v1/cases/")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.data), 1)

        delete_response = self.client.delete(f"/api/v1/cases/{case_id}/")
        self.assertEqual(delete_response.status_code, 204)
        self.assertEqual(Case.objects.count(), 0)

    @patch("cases.views.generate_defense_brief")
    def test_defense_is_generated_from_case_endpoint(self, generate_defense_brief):
        case = Case.objects.create(
            case_name="الف علیه ب",
            case_number="10",
            notification_data={"plaintiff": "الف", "defendant": "ب"},
        )
        generate_defense_brief.return_value = {
            "title": "پیش‌نویس لایحه دفاعیه",
            "authority": None,
            "case_number": "10",
            "plaintiff": "الف",
            "defendant": "ب",
            "subject": None,
            "claim_summary": "خلاصه",
            "defense_summary": "دفاع",
            "defense_arguments": [],
            "requested_relief": [],
            "missing_information": [],
            "full_text": "متن لایحه",
            "review_notes": [],
        }

        response = self.client.post(
            f"/api/v1/cases/{case.id}/generate-defense/",
            {},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["defense"]["full_text"], "متن لایحه")
        generate_defense_brief.assert_called_once()
