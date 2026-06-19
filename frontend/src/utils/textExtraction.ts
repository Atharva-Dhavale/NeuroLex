// import * as pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import Tesseract from 'tesseract.js';
import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import { logger } from './logger';

// Initialize PDF.js worker in a browser-safe way
const initPdfWorker = () => {
  if (typeof window === 'undefined') return; // Skip in SSR context

  try {
    // Use CDN or local worker based on environment
    const pdfjsVersion = pdfjsLib.version || '3.2.146';
    const workerUrl = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`;
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
    console.log('PDF.js worker initialized:', workerUrl);
  } catch (error) {
    console.error('Error initializing PDF.js worker:', error);
  }
};

// Call the init function
if (typeof window !== 'undefined') {
  initPdfWorker();
}

/**
 * Extract text from a PDF file
 * @param file PDF file to extract text from
 * @returns Promise that resolves to the extracted text
 */
export async function extractTextFromPDF(file: File): Promise<string> {
  try {
    // Ensure worker is initialized
    if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      initPdfWorker();
    }
    
    // Convert file to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load the PDF with PDF.js
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let extractedText = '';
    
    // Process each page
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Extract text from the page
        const pageText = textContent.items
          .map((item: any) => item.str ? item.str : '')
          .join(' ');
          
        extractedText += `Page ${i}:\n${pageText}\n\n`;
      } catch (pageError) {
        console.error(`Error extracting text from page ${i}:`, pageError);
        extractedText += `Page ${i}: [Error extracting text]\n\n`;
      }
    }
    
    // Check if we got meaningful text
    if (extractedText.trim().length < 20) {
      console.warn('PDF extraction returned minimal text, might be a scanned document');
    }
    
    return extractedText || 'No text could be extracted from this PDF.';
  } catch (error) {
    console.error('PDF extraction error:', error);
    throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract text from a DOCX file
 * @param file DOCX file to extract text from
 * @returns Promise that resolves to the extracted text
 */
export async function extractTextFromDOCX(file: File): Promise<string> {
  try {
    // Read the file as an ArrayBuffer
    const buffer = await file.arrayBuffer();
    // Use mammoth to extract the text
    const result = await mammoth.extractRawText({ arrayBuffer: buffer });
    return result.value || 'No text could be extracted from this document.';
  } catch (error) {
    console.error('DOCX extraction error:', error);
    throw new Error(`Failed to extract text from DOCX: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract text from a TXT file
 * @param file TXT file to extract text from
 * @returns Promise that resolves to the extracted text
 */
export async function extractTextFromTXT(file: File): Promise<string> {
  try {
    // Read the file as text
    return await file.text();
  } catch (error) {
    console.error('TXT extraction error:', error);
    throw new Error(`Failed to extract text from TXT file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract text from an image file using OCR
 * @param file Image file to extract text from
 * @returns Promise that resolves to the extracted text
 */
export async function extractTextFromImage(file: File): Promise<string> {
  try {
    // Create a URL for the image
    const imageUrl = URL.createObjectURL(file);
    
    // Use Tesseract.js for OCR
    console.log('Starting OCR process...');
    const result = await Tesseract.recognize(
      imageUrl,
      'eng', // English language
      { 
        logger: (message: unknown) => console.log('Tesseract progress:', message),
      }
    );
    
    // Clean up the URL
    URL.revokeObjectURL(imageUrl);
    
    const extractedText = result.data.text || '';
    console.log(`OCR complete, extracted ${extractedText.length} characters`);
    
    return extractedText || 'No text could be extracted from this image.';
  } catch (error) {
    console.error('Image OCR error:', error);
    throw new Error(`Failed to extract text from image: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract text from an Excel file
 * @param file Excel file to extract text from
 * @returns Promise that resolves to the extracted text
 */
export async function extractTextFromExcel(file: File): Promise<string> {
  try {
    // Read the file as an ArrayBuffer
    const buffer = await file.arrayBuffer();
    
    // Parse the Excel file
    const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
    
    // Extract text from all sheets
    let extractedText = '';
    
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Add sheet name as a header
      extractedText += `Sheet: ${sheetName}\n`;
      
      // Convert rows to text
      json.forEach((row: unknown) => {
        if (Array.isArray(row) && row.length > 0) {
          extractedText += row.join('\t') + '\n';
        }
      });
      
      extractedText += '\n';
    });
    
    return extractedText || 'No text could be extracted from this Excel file.';
  } catch (error) {
    console.error('Excel extraction error:', error);
    throw new Error(`Failed to extract text from Excel file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Extract text from any supported file type
 * @param file File to extract text from
 * @returns Promise that resolves to the extracted text
 */
export async function extractTextFromFile(file: File): Promise<string> {
  // Get the file extension from the filename
  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
  
  logger.info(`Extracting text from ${file.name} (${file.type}) - size: ${(file.size / 1024).toFixed(2)} KB`);
  
  if (!file || file.size === 0) {
    logger.error('Text extraction failed: Empty or invalid file');
    throw new Error('The file appears to be empty or invalid');
  }
  
  // Extract text based on file type
  try {
    let result = '';
    
    switch (fileExt) {
      case 'pdf':
        logger.info('Using PDF extraction method');
        result = await extractTextFromPDF(file);
        break;
      case 'docx':
      case 'doc':
        logger.info('Using DOCX extraction method');
        result = await extractTextFromDOCX(file);
        break;
      case 'txt':
      case 'md':
        logger.info('Using plain text extraction method');
        result = await extractTextFromTXT(file);
        break;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'bmp':
      case 'tiff':
      case 'tif':
        logger.info('Using OCR image extraction method');
        result = await extractTextFromImage(file);
        break;
      case 'xlsx':
      case 'xls':
      case 'csv':
        logger.info('Using Excel extraction method');
        result = await extractTextFromExcel(file);
        break;
      default:
        logger.error(`Unsupported file type: ${fileExt}`);
        throw new Error(`Unsupported file type: ${fileExt}`);
    }
    
    // Validate extracted text
    if (!result || result.trim().length < 10) {
      logger.warn(`Text extraction yielded minimal text (${result.length} chars)`);
      if (result.length === 0) {
        throw new Error('No text could be extracted from this file');
      }
    }
    
    logger.info(`Text extraction complete. Extracted ${result.length} characters.`);
    return result;
  } catch (error) {
    logger.error('Text extraction failed:', error);
    throw error;
  }
} 