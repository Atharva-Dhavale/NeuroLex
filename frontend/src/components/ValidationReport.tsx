import { jsPDF } from 'jspdf';
// Import and augment jsPDF with autoTable
import autoTable from 'jspdf-autotable';
import { ValidationResult, ValidationIssue } from '@/types';

interface ValidationReportProps {
  validationResult: ValidationResult;
  fileName: string;
}

export const generateValidationReport = ({ validationResult, fileName }: ValidationReportProps) => {
  // Create document
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('NeuroLex Validation Report', 20, 20);
  doc.setFontSize(12);
  doc.text(`File: ${fileName}`, 20, 30);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 40);
  
  // Add overall status
  doc.setFontSize(16);
  doc.text('Overall Status', 20, 60);
  doc.setFontSize(12);
  
  const status = typeof validationResult.status === 'string' 
    ? validationResult.status 
    : validationResult.validation_details?.overall_status || 'uncertain';
  
  // Check for confidence in different possible locations in the object
  const confidenceValue = (validationResult as any).confidence || 
    (validationResult.validation_details as any)?.confidence || 
    '—';
  
  doc.text(`Status: ${status}`, 20, 70);
  doc.text(`Confidence: ${confidenceValue}${typeof confidenceValue === 'number' ? '%' : ''}`, 20, 80);
  
  // Add explanation
  const explanation = validationResult.explanation || 
    validationResult.validation_details?.explanation || 
    "No explanation provided";
  
  doc.setFontSize(16);
  doc.text('Summary', 20, 100);
  doc.setFontSize(12);
  
  const splitText = doc.splitTextToSize(explanation, 170);
  doc.text(splitText, 20, 110);
  
  // Get validation issues
  const issues = validationResult.issues || 
    validationResult.validation_details?.issues || 
    [];
  
  // Create table for validation issues
  if (issues.length > 0) {
    const issuesY = 110 + splitText.length * 7 + 20;
    doc.setFontSize(16);
    doc.text('Validation Issues', 20, issuesY);
    doc.setFontSize(12);
    
    const tableData = issues.map((issue: ValidationIssue) => [
      issue.field || 'N/A',
      issue.severity || 'N/A',
      issue.description || (issue as any).message || 'No description'
    ]);
    
    autoTable(doc, {
      startY: issuesY + 10,
      head: [['Field', 'Severity', 'Description']],
      body: tableData,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
    });
  }
  
  // Add recommendations if available
  const recommendations = validationResult.recommendations || 
    validationResult.validation_details?.recommendations || 
    [];
  
  if (recommendations.length > 0) {
    const finalY = issues.length > 0 ? 
      (doc as any).lastAutoTable.finalY + 20 : 
      110 + splitText.length * 7 + 20;
    
    doc.setFontSize(16);
    doc.text('Recommendations', 20, finalY);
    doc.setFontSize(12);
    
    const recommendationsData = Array.isArray(recommendations) ? 
      recommendations.map((rec: string, index: number) => [`${index + 1}`, rec]) :
      [['1', recommendations as string]];
    
    autoTable(doc, {
      startY: finalY + 10,
      head: [['#', 'Recommendation']],
      body: recommendationsData,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 5,
      },
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
    });
  }
  
  // Add RAG metadata if available
  if (validationResult.validation_details?.rag_metadata) {
    const rag = validationResult.validation_details.rag_metadata;
    const prevFinalY = (doc as any).lastAutoTable?.finalY || 
      (110 + splitText.length * 7 + 20 + (issues.length > 0 ? 40 : 0));
    
    doc.setFontSize(16);
    doc.text('Reference Analysis', 20, prevFinalY + 20);
    doc.setFontSize(12);
    
    doc.text(`Reference Document: ${rag.reference_sheet_id}`, 20, prevFinalY + 30);
    doc.text(`Similarity Score: ${(rag.similarity_score * 100).toFixed(1)}%`, 20, prevFinalY + 40);
    
    if (rag.comparison_summary && rag.comparison_summary.length > 0) {
      const comparisonData = rag.comparison_summary.map(comp => [
        comp.field,
        comp.extracted_value !== null ? String(comp.extracted_value) : 'Not specified',
        comp.reference_value !== null ? String(comp.reference_value) : 'Not specified',
        comp.is_matched ? 'Yes' : 'No'
      ]);
      
      autoTable(doc, {
        startY: prevFinalY + 50,
        head: [['Field', 'Extracted Value', 'Reference Value', 'Match']],
        body: comparisonData,
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 5,
        },
        headStyles: {
          fillColor: [99, 102, 241],
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
      });
    }
  }
  
  // Add footer with page number
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(
      `NeuroLex Validation Report - Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save the PDF
  doc.save(`validation-report-${fileName.replace(/\.[^/.]+$/, '')}.pdf`);
}; 