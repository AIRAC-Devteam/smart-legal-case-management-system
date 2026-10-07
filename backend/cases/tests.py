from unittest.mock import patch
import io
import tempfile
from zipfile import ZipFile
from django.contrib.auth import get_user_model
from django.test import override_settings

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Case, CaseAttachment, DefenseDraft, Document, LegalSource


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
        self.client.force_authenticate(get_user_model().objects.create_user(username="tester"))
        self.media = tempfile.TemporaryDirectory()
        self.addCleanup(self.media.cleanup)
        self.override = override_settings(MEDIA_ROOT=self.media.name)
        self.override.enable()
        self.addCleanup(self.override.disable)

    def test_health(self):
        response = self.client.get("/api/v1/health/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["status"], "ok")
        self.assertNotIn("extraction_engine", response.data)
        self.assertNotIn("gemini_model", response.data)

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
        self.assertEqual(create_response.data["workflow_step"], Case.WorkflowStep.REVIEW)

        confirm_response = self.client.post(f"/api/v1/cases/{case_id}/confirm/")
        self.assertEqual(confirm_response.status_code, 200)
        self.assertEqual(confirm_response.data["workflow_step"], Case.WorkflowStep.DEFENSE)
        self.assertIsNotNone(confirm_response.data["confirmed_at"])

        patch_response = self.client.patch(
            f"/api/v1/cases/{case_id}/",
            {"city": "تهران"},
            format="json",
        )
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.data["city"], "تهران")
        self.assertEqual(patch_response.data["workflow_step"], Case.WorkflowStep.REVIEW)
        self.assertIsNone(patch_response.data["confirmed_at"])

        blocked_generation = self.client.post(
            f"/api/v1/cases/{case_id}/generate-defense/",
            {},
            format="json",
        )
        self.assertEqual(blocked_generation.status_code, 409)

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
            workflow_step=Case.WorkflowStep.DEFENSE,
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


def word_upload(text="ماده ۱: متن قانون", name="law.docx"):
    buffer = io.BytesIO()
    with ZipFile(buffer, "w") as archive:
        archive.writestr("word/document.xml", '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>' + text + '</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>متن جدول</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>')
    return SimpleUploadedFile(name, buffer.getvalue())


def complete_attachment_document(document):
    document.status = Document.Status.COMPLETED
    document.raw_text = "متن استخراج‌شده پیوست"
    document.extracted_data = {"document_type": "evidence"}
    document.save(update_fields=["status", "raw_text", "extracted_data"])


class LegalRepositoryTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(get_user_model().objects.create_user(username="legal-tester"))
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        settings = override_settings(MEDIA_ROOT=directory.name)
        settings.enable()
        self.addCleanup(settings.disable)
        self.case = Case.objects.create(
            case_name="پرونده",
            workflow_step=Case.WorkflowStep.DEFENSE,
        )

    @patch("cases.views.summarize_source", return_value="خلاصه قانون")
    def test_upload_full_text_and_retry(self, summarize):
        response = self.client.post("/api/v1/legal-sources/", {"file": word_upload()}, format="multipart")
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "ready")
        source = LegalSource.objects.get()
        self.assertIn("متن جدول", source.raw_text)
        self.assertIn("ماده ۱", summarize.call_args.args[0])
        self.assertNotIn("raw_text", response.data)
        text = self.client.get(f"/api/v1/legal-sources/{source.id}/text/")
        self.assertEqual(text.data["text"], source.raw_text)
        source.status = "failed"
        source.save()
        retry = self.client.post(f"/api/v1/legal-sources/{source.id}/retry/")
        self.assertEqual(retry.data["status"], "ready")

    @patch("cases.views.summarize_source", side_effect=RuntimeError("secret upstream error"))
    def test_failure_preserves_file_and_hides_upstream_details(self, summarize):
        response = self.client.post("/api/v1/legal-sources/", {"file": word_upload()}, format="multipart")
        self.assertEqual(response.data["status"], "failed")
        self.assertNotIn("secret", response.data["error_message"])
        self.assertTrue(LegalSource.objects.get().raw_text)

    def test_reject_invalid_uploads(self):
        for upload in [word_upload(name="law.pdf"), SimpleUploadedFile("fake.docx", b"invalid"), word_upload("x" * 200001)]:
            with self.subTest(name=upload.name):
                response = self.client.post("/api/v1/legal-sources/", {"file": upload}, format="multipart")
                self.assertEqual(response.status_code, 400)
        self.assertEqual(LegalSource.objects.count(), 0)

    @patch("cases.views.generate_defense_brief", return_value=defense_payload())
    def test_only_selected_full_sources_and_immutable_snapshot(self, generate):
        first = LegalSource.objects.create(title="منتخب", original_name="law.docx", raw_text="متن کامل قانون", status="ready", sha256="abc")
        LegalSource.objects.create(title="غیرمنتخب", raw_text="نباید ارسال شود", status="ready")
        response = self.client.post(f"/api/v1/cases/{self.case.id}/generate-defense/", {"source_ids": [first.id, first.id]}, format="json")
        self.assertEqual(response.status_code, 201)
        sources = generate.call_args.kwargs["legal_sources"]
        self.assertEqual(len(sources), 1)
        self.assertEqual(sources[0]["text"], first.raw_text)
        self.client.delete(f"/api/v1/legal-sources/{first.id}/")
        draft = DefenseDraft.objects.get()
        self.assertEqual(draft.source_snapshot, sources)
        self.client.patch(f"/api/v1/defense-drafts/{draft.id}/", {"source_snapshot": []}, format="json")
        draft.refresh_from_db()
        self.assertEqual(draft.source_snapshot, sources)

    @patch("cases.views.generate_defense_brief")
    def test_invalid_selection_never_calls_gemini(self, generate):
        failed = LegalSource.objects.create(title="ناموفق", status="failed")
        big = LegalSource.objects.create(title="بزرگ", status="ready", raw_text="x" * 400001)
        for ids in [[999], [failed.id], [big.id], "bad", ["bad"], list(range(1, 33))]:
            with self.subTest(ids=str(ids)[:30]):
                response = self.client.post(f"/api/v1/cases/{self.case.id}/generate-defense/", {"source_ids": ids}, format="json")
                self.assertEqual(response.status_code, 400)
        generate.assert_not_called()

    def test_repository_requires_authentication(self):
        self.client.force_authenticate(user=None)
        self.assertEqual(self.client.get("/api/v1/legal-sources/").status_code, 401)


class CaseAttachmentTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(
            get_user_model().objects.create_user(username="attachment-tester")
        )
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        settings = override_settings(MEDIA_ROOT=directory.name)
        settings.enable()
        self.addCleanup(settings.disable)
        self.case = Case.objects.create(
            case_name="پرونده پیوست",
            workflow_step=Case.WorkflowStep.DEFENSE,
        )

    @patch("cases.views.DocumentViewSet._process", side_effect=complete_attachment_document)
    def test_attachment_create_list_detail_and_delete(self, process):
        response = self.client.post(
            f"/api/v1/cases/{self.case.id}/attachments/",
            {
                "file": SimpleUploadedFile(
                    "evidence.pdf",
                    b"%PDF-1.4 attachment",
                    content_type="application/pdf",
                )
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "completed")
        attachment_id = response.data["id"]
        self.assertEqual(CaseAttachment.objects.filter(case=self.case).count(), 1)

        case_response = self.client.get(f"/api/v1/cases/{self.case.id}/")
        self.assertEqual(case_response.status_code, 200)
        self.assertEqual(len(case_response.data["attachments"]), 1)

        detail = self.client.get(
            f"/api/v1/cases/{self.case.id}/attachments/{attachment_id}/"
        )
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.data["raw_text"], "متن استخراج‌شده پیوست")

        deleted = self.client.delete(
            f"/api/v1/cases/{self.case.id}/attachments/{attachment_id}/"
        )
        self.assertEqual(deleted.status_code, 204)
        self.assertEqual(CaseAttachment.objects.count(), 0)
        self.assertEqual(Document.objects.count(), 0)
        self.assertTrue(process.called)

    @patch("cases.views.DocumentViewSet._process", side_effect=complete_attachment_document)
    def test_attachment_count_and_file_size_limits_are_enforced(self, process):
        for index in range(5):
            response = self.client.post(
                f"/api/v1/cases/{self.case.id}/attachments/",
                {
                    "file": SimpleUploadedFile(
                        f"evidence-{index}.pdf",
                        b"%PDF-1.4 attachment",
                        content_type="application/pdf",
                    )
                },
                format="multipart",
            )
            self.assertEqual(response.status_code, 201)

        too_many = self.client.post(
            f"/api/v1/cases/{self.case.id}/attachments/",
            {
                "file": SimpleUploadedFile(
                    "evidence-extra.pdf",
                    b"%PDF-1.4 attachment",
                    content_type="application/pdf",
                )
            },
            format="multipart",
        )
        self.assertEqual(too_many.status_code, 400)

        other_case = Case.objects.create(case_name="پرونده دوم")
        with patch.dict("os.environ", {"MAX_UPLOAD_MB": "1"}):
            too_large = self.client.post(
                f"/api/v1/cases/{other_case.id}/attachments/",
                {
                    "file": SimpleUploadedFile(
                        "large.pdf",
                        b"x" * (1024 * 1024 + 1),
                        content_type="application/pdf",
                    )
                },
                format="multipart",
            )
        self.assertEqual(too_large.status_code, 400)

    @patch("cases.views.generate_defense_brief", return_value=defense_payload())
    def test_attachment_ids_are_sent_and_snapshotted(self, generate):
        document = Document.objects.create(
            original_name="evidence.pdf",
            content_type="application/pdf",
            status=Document.Status.COMPLETED,
            raw_text="متن کامل پیوست",
            extracted_data={"document_type": "evidence"},
        )
        attachment = CaseAttachment.objects.create(case=self.case, document=document)

        response = self.client.post(
            f"/api/v1/cases/{self.case.id}/generate-defense/",
            {"attachment_ids": [attachment.id]},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        selected = generate.call_args.kwargs["attachments"]
        self.assertEqual(selected[0]["text"], "متن کامل پیوست")
        draft = DefenseDraft.objects.get(case=self.case)
        self.assertEqual(draft.attachment_snapshot, selected)

    @patch(
        "cases.views.recommend_legal_sources",
        return_value={
            "selected_source_ids": [1],
            "recommendations": [
                {"source_id": 1, "priority": "high", "reason": "مرتبط با موضوع پرونده"}
            ],
        },
    )
    def test_gemini_recommends_only_existing_ready_sources(self, recommend):
        source = LegalSource.objects.create(
            title="قانون منتخب",
            original_name="law.docx",
            raw_text="متن قانون",
            summary="خلاصه مرتبط",
            status="ready",
            sha256="abc",
        )
        recommend.return_value["selected_source_ids"] = [source.id, 999]
        recommend.return_value["recommendations"][0]["source_id"] = source.id

        response = self.client.post(
            f"/api/v1/cases/{self.case.id}/recommend-legal-sources/",
            {},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["selected_source_ids"], [source.id])
        self.assertEqual(response.data["recommendations"][0]["priority"], "high")
        self.assertTrue(recommend.called)
