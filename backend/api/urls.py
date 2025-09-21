from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TermSheetDocumentViewSet,
    ExtractedTermSheetViewSet,
    ValidationResultViewSet,
    DocumentViewSet
)

router = DefaultRouter()
router.register(r'term-sheets', TermSheetDocumentViewSet)
router.register(r'documents', DocumentViewSet)
router.register(r'extracted-data', ExtractedTermSheetViewSet)
router.register(r'validations', ValidationResultViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 