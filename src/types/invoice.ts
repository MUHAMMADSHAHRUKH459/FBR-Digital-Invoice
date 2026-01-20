// Invoice Types for FBR Digital Invoicing System

export interface InvoiceItem {
  id?: string;
  hsCode: string;
  productDescription: string;
  rate: string; // Tax rate as percentage string (e.g., "18%")
  uom: string;
  quantity: number;
  totalValues: number;
  valueSalesExcludingST: number;
  fixedNotifiedValueOrRetailPrice: number;
  salesTaxApplicable: number;
  salesTaxWithheldAtSource: number;
  extraTax: number;
  furtherTax: number;
  sroScheduleNo: string;
  fedPayable: number;
  discount: number;
  saleType: string;
  sroItemSerialNo: string;
}

export interface FBRInvoice {
  invoiceType: 'Sale Invoice' | 'Debit Note';
  invoiceDate: string;
  sellerNTNCNIC: string;
  sellerBusinessName: string;
  sellerProvince: string;
  sellerAddress: string;
  buyerNTNCNIC: string;
  buyerBusinessName: string;
  buyerProvince: string;
  buyerAddress: string;
  buyerRegistrationType: 'Registered' | 'Unregistered';
  invoiceRefNo?: string;
  scenarioId?: string; // For sandbox testing (SN001-SN028)
  items: InvoiceItem[];
}

export interface InvoiceStatus {
  itemSNo: string;
  statusCode: string;
  status: string;
  invoiceNo?: string;
  errorCode?: string;
  error?: string;
}

export interface FBRInvoiceResponse {
  invoiceNumber?: string;
  dated: string;
  validationResponse: {
    statusCode: string;
    status: string;
    errorCode?: string;
    error: string;
    invoiceStatuses: InvoiceStatus[] | null;
  };
}

export interface LocalInvoice {
  invoiceNumber: string;
  invoiceDate: string;
  customerName: string;
  customerAddress: string;
  customerPhone: string;
  customerNTN?: string;
  items: LocalInvoiceItem[];
  subTotal: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  notes?: string;
}

export interface LocalInvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

// FBR Reference Data Types
export interface Province {
  stateProvinceCode: number;
  stateProvinceDesc: string;
}

export interface UOMType {
  id: number;
  name: string;
}

export interface HSCode {
  code: string;
  description: string;
}

export interface TaxRate {
  saleTypeId: number;
  saleType: string;
  rate: number;
}

// FBR Error Codes
export interface FBRError {
  code: string;
  message: string;
  description: string;
}

// API Mode
export type APIMode = 'sandbox' | 'production';