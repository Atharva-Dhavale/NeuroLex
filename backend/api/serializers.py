from rest_framework import serializers
from .models import TermSheetDocument, ExtractedTermSheet, ValidationResult, Document

class DocumentSerializer(serializers.ModelSerializer):
    """Serializer for the unified Document model"""
    class Meta:
        model = Document
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'extracted_text', 'structured_data', 'validation_results']

class TermSheetDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TermSheetDocument
        fields = '__all__'

class TermSheetDocumentDetailSerializer(serializers.ModelSerializer):
    extracted_data = serializers.SerializerMethodField()
    
    class Meta:
        model = TermSheetDocument
        fields = '__all__'
    
    def get_extracted_data(self, obj):
        extracted = obj.extracted_data.first()
        if extracted:
            return ExtractedTermSheetSerializer(extracted).data
        return None

class ExtractedTermSheetSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExtractedTermSheet
        fields = '__all__'

class ValidationResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = ValidationResult
        fields = '__all__' 