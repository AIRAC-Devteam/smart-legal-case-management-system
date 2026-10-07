from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CaseViewSet, DefenseDraftViewSet, DocumentViewSet, LegalSourceViewSet, health

router = DefaultRouter()
router.register("legal-sources", LegalSourceViewSet, basename="legal-source")
router.register("cases", CaseViewSet, basename="case")
router.register("documents", DocumentViewSet, basename="document")
router.register("defense-drafts", DefenseDraftViewSet, basename="defense-draft")

urlpatterns = [
    path("health/", health, name="health"),
    path("", include(router.urls)),
]
