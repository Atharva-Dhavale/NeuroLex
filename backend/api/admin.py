from django.contrib import admin
from .models import TermSheetDocument, ExtractedTermSheet, ValidationResult

@admin.register(TermSheetDocument)
class TermSheetDocumentAdmin(admin.ModelAdmin):
    list_display = ('title', 'file_type', 'uploaded_at', 'status')
    list_filter = ('status', 'file_type')
    search_fields = ('title',)

@admin.register(ExtractedTermSheet)
class ExtractedTermSheetAdmin(admin.ModelAdmin):
    list_display = ('document', 'extracted_at')
    list_filter = ('extracted_at',)

@admin.register(ValidationResult)
class ValidationResultAdmin(admin.ModelAdmin):
    list_display = ('term_sheet', 'validated_at', 'status')
    list_filter = ('status', 'validated_at')
