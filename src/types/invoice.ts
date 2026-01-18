// Invoice Types for FBR Digital Invoicing System

export interface InvoiceItem {
  id?: string;
  hsCode: string;
  productDescription: string;
  rate: string;
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
  scenarioId?: string;
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