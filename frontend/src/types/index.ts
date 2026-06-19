// Term Sheet Document Types
export interface TermSheetDocument {
  id: string | number;
  title: string;
  file?: string;
  file_type?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'uploaded' | 'extracted' | 'processed' | 'validated' | 'error';
  uploaded_at?: string;
  created_at?: string;
  updated_at?: string;
  extracted_text?: string;
  structured_data?: any;
  validation_results?: any;
  extracted_data?: ExtractedTermSheet[];
}

// Alias for backward compatibility
export type Document = TermSheetDocument;

// Extracted Term Sheet Types
export interface ExtractedTermSheet {
  id?: string | number;
  document?: string | number;
  extracted_at?: string;
  structured_data: TermSheetData;
  warning?: string;
}

// Structured Term Sheet Data
export interface TermSheetData {
  [key: string]: any;
  trade_id?: string;
  trade_date?: string;
  reference_spot_price?: string;
  notional_amount?: string;
  strike_price?: string;
  option_type?: string; // Call/Put
  position_type?: string; // Buying/Selling
  expiry_date?: string;
  business_calendar?: string;
  delivery_date?: string;
  premium_rate?: string;
  transaction_currency?: string; // Transaction CCY
  counter_currency?: string; // Counter CCY
  underlying_currency?: string;
  error?: string;
}

// Validation Result Types
export interface ValidationResult {
  id?: number;
  document_id?: string;
  term_sheet?: number;
  validated_at?: string;
  status?: 'valid' | 'invalid' | 'uncertain';
  validation_details?: ValidationDetails;
  validation_score?: number;
  is_valid?: boolean;
  explanation: string;
  recommendations: string[] | string;
  issue_categories?: IssueCategoryResult[];
  comparisons?: ComparisonResult[];
  issues: ValidationIssue[];
}

export interface IssueCategoryResult {
  category: string;
  score: number;
  description: string;
}

export interface ValidationDetails {
  overall_status: 'valid' | 'invalid' | 'uncertain' | 'error';
  issues?: ValidationIssue[];
  explanation: string;
  recommendations?: string | string[];
  rag_metadata?: RagMetadata;
  error?: string;
  raw_response?: string;
  [key: string]: any; // For any additional fields
}

export interface ValidationIssue {
  field?: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  recommendation?: string;
}

// RAG Metadata for enhanced validation
export interface RagMetadata {
  reference_sheet_id: string;
  similarity_score: number;
  comparison_summary: ComparisonItem[];
}

export interface ComparisonItem {
  field: string;
  extracted_value: any;
  reference_value: any;
  is_matched: boolean | null;
}

export interface ComparisonResult {
  field: string;
  yours: string;
  standard: string;
  match: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  warning?: string;
}

// Upload Form State
export interface UploadFormState {
  title: string;
  file: File | null;
  isUploading: boolean;
  error: string | null;
}

// Process State
export interface ProcessState {
  isProcessing: boolean;
  error: string | null;
}

// Validation State
export interface ValidationState {
  isValidating: boolean;
  error: string | null;
}

// Document State
export interface DocumentState {
  document: TermSheetDocument | null;
  isLoading: boolean;
  error: string | null;
  structuredData: TermSheetData | null;
  isProcessing: boolean;
  validationResults: ValidationResult | null;
  isValidating: boolean;
} 