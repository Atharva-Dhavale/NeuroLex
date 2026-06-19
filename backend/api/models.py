from django.db import models
import os
import uuid
import json

def upload_path(instance, filename):
    """Generate a unique path for uploaded files"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('uploads', filename)

class Document(models.Model):
    """Modern, unified model for document processing"""
    STATUS_CHOICES = (
        ('uploaded', 'Uploaded'),
        ('extracted', 'Extracted'),
        ('processing', 'Processing'),
        ('processed', 'Processed'),
        ('validated', 'Validated'),
        ('error', 'Error'),
    )
    
    title = models.CharField(max_length=255, blank=True)
    file = models.FileField(upload_to=upload_path, blank=True, null=True)
    file_type = models.CharField(max_length=50, blank=True, default='txt')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploaded')
    
    # Content fields
    extracted_text = models.TextField(blank=True, null=True)
    structured_data = models.JSONField(blank=True, null=True)
    validation_results = models.JSONField(blank=True, null=True)
    
    def __str__(self):
        return self.title or f"Document {self.id}"
    
    def save(self, *args, **kwargs):
        # Set title from filename if not provided and file exists
        if not self.title and self.file:
            self.title = os.path.basename(self.file.name)
            
        # Ensure validation_results is valid JSON before saving
        if self.validation_results is not None:
            try:
                # Try to serialize and deserialize to ensure valid JSON
                json_str = json.dumps(self.validation_results)
                self.validation_results = json.loads(json_str)
            except (TypeError, ValueError, json.JSONDecodeError):
                # If serialization fails, set to a minimal valid JSON object
                self.validation_results = {
                    "overall_status": "error",
                    "explanation": "Validation results could not be properly serialized",
                    "issues": []
                }
                
        super().save(*args, **kwargs)
    
    class Meta:
        ordering = ['-created_at']

class TermSheetDocument(models.Model):
    """Model for storing uploaded term sheet documents"""
    PROCESSING_STATUS = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )
    
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to=upload_path)
    file_type = models.CharField(max_length=50)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=PROCESSING_STATUS, default='pending')
    
    def __str__(self):
        return self.title

class ExtractedTermSheet(models.Model):
    """Model for storing extracted and structured term sheet data"""
    document = models.ForeignKey(TermSheetDocument, on_delete=models.CASCADE, related_name='extracted_data')
    extracted_at = models.DateTimeField(auto_now_add=True)
    structured_data = models.JSONField()
    
    def __str__(self):
        return f"Extracted data for {self.document.title}"

class ValidationResult(models.Model):
    """Model for storing validation results"""
    VALIDATION_STATUS = (
        ('valid', 'Valid'),
        ('invalid', 'Invalid'),
        ('uncertain', 'Uncertain'),
    )
    
    term_sheet = models.ForeignKey(ExtractedTermSheet, on_delete=models.CASCADE, related_name='validations')
    validated_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=VALIDATION_STATUS)
    validation_details = models.JSONField()
    
    def __str__(self):
        return f"Validation for {self.term_sheet.document.title}: {self.status}"
        
    def save(self, *args, **kwargs):
        # Ensure validation_details is valid JSON before saving
        if self.validation_details is not None:
            try:
                # Try to serialize and deserialize to ensure valid JSON
                json_str = json.dumps(self.validation_details)
                self.validation_details = json.loads(json_str)
            except (TypeError, ValueError, json.JSONDecodeError):
                # If serialization fails, set to a minimal valid JSON object
                self.validation_details = {
                    "overall_status": "error",
                    "explanation": "Validation results could not be properly serialized",
                    "issues": []
                }
                
        super().save(*args, **kwargs)
