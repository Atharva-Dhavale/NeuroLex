from django.urls import path
from .views import (
    DocumentListCreateView,
    DocumentDetailView,
    DocumentProcessView,
    DocumentValidateView,
    DocumentDeleteAllView,
)

urlpatterns = [
    # List / create / delete-all
    path('documents/', DocumentListCreateView.as_view(), name='document-list-create'),

    # Delete all (explicit endpoint for frontend)
    path('documents/delete_all/', DocumentDeleteAllView.as_view(), name='document-delete-all'),

    # Detail / delete single
    path('documents/<str:pk>/', DocumentDetailView.as_view(), name='document-detail'),

    # Actions
    path('documents/<str:pk>/process/', DocumentProcessView.as_view(), name='document-process'),
    path('documents/<str:pk>/validate/', DocumentValidateView.as_view(), name='document-validate'),
]
