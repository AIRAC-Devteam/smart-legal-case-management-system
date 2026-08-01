from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Case, DefenseDraft, Document


def defense_payload(full_text="متن لایحه"):
    return {
        "title": "پیش‌نویس لایحه دفاعیه",
        "authority": None,
        "case_number": "10",
        "plaintiff": "الف",
        "defendant": "ب",
        "subject": None,
        "claim_summary": "خلاصه ادعا",
        "defense_summary": "خلاصه دفاع",
        "defense_arguments": ["محور دفاع"],
        "requested_relief": ["رد دعوا"],
        "missing_information": [],
        "full_text": full_text,
        "review_notes": ["نیازمند بررسی کارشناس حقوقی"],
    }


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
        self.assertEqual(list_response.data[0]["defense_drafts_count"], 0)

        delete_response = self.client.delete(f"/api/v1/cases/{case_id}/")
        self.assertEqual(delete_response.status_code, 204)
        self.assertEqual(Case.objects.count(), 0)

    @patch("cases.views.generate_defense_brief")
    def test_generation_automatically_saves_versioned_draft(self, generate_defense_brief):
        case = Case.objects.create(
            case_name="الف علیه ب",
            case_number="10",
            notification_data={"plaintiff": "الف", "defendant": "ب"},
        )
        generate_defense_brief.side_effect = [
            defense_payload("متن نسخه اول"),
            defense_payload("متن نسخه دوم"),
        ]

        first = self.client.post(
            f"/api/v1/cases/{case.id}/generate-defense/",
            {},
            format="json",
        )
        second = self.client.post(
            f"/api/v1/cases/{case.id}/generate-defense/",
            {},
            format="json",
        )

        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 201)
        self.assertEqual(first.data["draft"]["version"], 1)
        self.assertEqual(second.data["draft"]["version"], 2)
        self.assertEqual(DefenseDraft.objects.filter(case=case).count(), 2)
        self.assertEqual(
            DefenseDraft.objects.get(case=case, version=2).full_text,
            "متن نسخه دوم",
        )
        self.assertTrue(first.data["requires_legal_review"])

    def test_defense_draft_list_filter_and_patch(self):
        first_case = Case.objects.create(case_name="پرونده اول", case_number="1")
        second_case = Case.objects.create(case_name="پرونده دوم", case_number="2")
        first_draft = DefenseDraft.objects.create(
            case=first_case,
            version=1,
            title="لایحه اول",
            full_text="متن اولیه",
        )
        DefenseDraft.objects.create(
            case=second_case,
            version=1,
            title="لایحه دوم",
            full_text="متن دوم",
        )

        list_response = self.client.get(
            f"/api/v1/defense-drafts/?case={first_case.id}"
        )
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.data), 1)
        self.assertEqual(list_response.data[0]["id"], first_draft.id)

        patch_response = self.client.patch(
            f"/api/v1/defense-drafts/{first_draft.id}/",
            {
                "full_text": "متن ویرایش‌شده",
                "status": "under_review",
            },
            format="json",
        )
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.data["full_text"], "متن ویرایش‌شده")
        self.assertEqual(patch_response.data["status"], "under_review")
        self.assertIsNotNone(patch_response.data["reviewed_at"])
