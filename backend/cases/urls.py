from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import CaseViewSet, DocumentViewSet, health

router = DefaultRouter()
router.register("cases", CaseViewSet, basename="case")
router.register("documents", DocumentViewSet, basename="document")

urlpatterns = [
    path("health/", health, name="health"),
    path("", include(router.urls)),
]
