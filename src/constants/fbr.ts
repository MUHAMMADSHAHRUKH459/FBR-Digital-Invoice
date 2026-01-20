// FBR Constants - Complete Implementation

export const PROVINCES = [
  { code: 'Punjab', name: 'Punjab' },
  { code: 'Sindh', name: 'Sindh' },
  { code: 'SINIDH', name: 'SINIDH' }, // FBR uses this variant
  { code: 'KPK', name: 'Khyber Pakhtunkhwa' },
  { code: 'Balochistan', name: 'Balochistan' },
  { code: 'Islamabad', name: 'Islamabad Capital Territory' },
  { code: 'Gilgit-Baltistan', name: 'Gilgit-Baltistan' },
  { code: 'AJK', name: 'Azad Jammu & Kashmir' }
];

export const TAX_RATES = [
  { value: '0%', label: '0% (Zero Rated)', percentage: 0 },
  { value: '5%', label: '5%', percentage: 5 },
  { value: '10%', label: '10%', percentage: 10 },
  { value: '12%', label: '12%', percentage: 12 },
  { value: '15%', label: '15%', percentage: 15 },
  { value: '18%', label: '18% (Standard)', percentage: 18 }
];

export const SALE_TYPES = [
  { id: 'standard', name: 'Goods at standard rate (default)' },
  { id: 'reduced', name: 'Goods at Reduced Rate' },
  { id: 'zero', name: 'Goods at zero-rate' },
  { id: 'exempt', name: 'Exempt Goods' },
  { id: 'third_schedule', name: '3rd Schedule Goods' },
  { id: 'services', name: 'Services' },
  { id: 'fed_st_mode', name: 'Goods (FED in ST Mode)' },
  { id: 'telecom', name: 'Telecommunication services' },
  { id: 'electricity', name: 'Electricity Supply to Retailers' },
  { id: 'mobile_phones', name: 'Mobile Phones' }
];

export const UOM_OPTIONS = [
  { id: 1, name: 'Numbers, pieces, units' },
  { id: 2, name: 'KG' },
  { id: 3, name: 'Kilograms' },
  { id: 4, name: 'Liters' },
  { id: 5, name: 'Litres' },
  { id: 6, name: 'Meters' },
  { id: 7, name: 'Square Meter' },
  { id: 8, name: 'Cubic Meter' },
  { id: 9, name: 'Dozen' },
  { id: 10, name: 'Pair' },
  { id: 11, name: 'Set' },
  { id: 12, name: 'Box' },
  { id: 13, name: 'Carton' },
  { id: 14, name: 'Bundle' }
];

export const INVOICE_TYPES = [
  { value: 'Sale Invoice', label: 'Sale Invoice' },
  { value: 'Debit Note', label: 'Debit Note' }
];

export const REGISTRATION_TYPES = [
  { value: 'Registered', label: 'Registered' },
  { value: 'Unregistered', label: 'Unregistered' }
];

// Textile/Garment specific HS Codes
export const TEXTILE_HS_CODES = [
  { code: '6109.1000', description: 'T-shirts, singlets and other vests, of cotton, knitted' },
  { code: '6109.9000', description: 'T-shirts, singlets and other vests, of other textile materials' },
  { code: '6110.2000', description: 'Jerseys, pullovers, of cotton, knitted' },
  { code: '6203.4200', description: 'Men\'s or boys\' trousers, of cotton' },
  { code: '6204.6200', description: 'Women\'s or girls\' trousers, of cotton' },
  { code: '6211.4200', description: 'Women\'s or girls\' track suits, of cotton' },
  { code: '6211.3200', description: 'Men\'s or boys\' track suits, of cotton' },
  { code: '8471.3010', description: 'Computer Equipment & Electronics' }
];

// Your Business Details
export const SELLER_INFO = {
  ntn: 'A081797-5',
  strn: '3277876229942',
  registrationNumber: '4220108968444',
  businessName: 'MM ENTERPRISES',
  address: 'SHOP. NO # 818, 8TH FLOOR, REGAL TRADE SQUARE, SADDAR, KARACHI, PAKISTAN',
  province: 'SINIDH',
  location: 'Karachi',
  phone: '00923142392069',
  gstRate: 18
};

// FBR API Endpoints
export const FBR_API = {
  SANDBOX: {
    POST_INVOICE: 'https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata_sb',
    VALIDATE_INVOICE: 'https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata_sb'
  },
  PRODUCTION: {
    POST_INVOICE: 'https://gw.fbr.gov.pk/di_data/v1/di/postinvoicedata',
    VALIDATE_INVOICE: 'https://gw.fbr.gov.pk/di_data/v1/di/validateinvoicedata'
  },
  REFERENCE: {
    PROVINCES: 'https://gw.fbr.gov.pk/pdi/v1/provinces',
    UOM: 'https://gw.fbr.gov.pk/pdi/v1/uom',
    TAX_RATES: 'https://gw.fbr.gov.pk/pdi/v2/SaleTypeToRate',
    HS_CODES: 'https://gw.fbr.gov.pk/pdi/v1/hscodes'
  }
};

// FBR Logo URL
export const FBR_LOGO_URL = 'https://www.fbr.gov.pk/images/logo.png';

// FBR Sandbox Scenarios (Section 9-10 of PDF)
export const FBR_SCENARIOS = [
  { id: 'SN001', name: 'Normal Sale - Registered Buyer', description: 'Standard sale to registered buyer' },
  { id: 'SN002', name: 'Normal Sale - Unregistered Buyer', description: 'Standard sale to unregistered buyer' },
  { id: 'SN003', name: 'Export Sale', description: 'Export of goods (zero-rated)' },
  { id: 'SN004', name: 'Exempt Goods', description: 'Sale of exempt goods' },
  { id: 'SN005', name: 'Zero-Rated Goods', description: 'Sale of zero-rated goods' },
  { id: 'SN006', name: 'Third Schedule Goods', description: 'Goods under Third Schedule' },
  { id: 'SN007', name: 'Reduced Rate Goods', description: 'Goods at reduced rate' },
  { id: 'SN008', name: 'Services (Standard Rate)', description: 'Standard taxable services' },
  { id: 'SN009', name: 'FED in ST Mode', description: 'Federal Excise Duty in Sales Tax mode' },
  { id: 'SN010', name: 'Telecommunication Services', description: 'Telecom services' },
  { id: 'SN011', name: 'Electricity Supply', description: 'Electricity to retailers' },
  { id: 'SN012', name: 'Mobile Phones', description: 'Sale of mobile phones' },
  { id: 'SN013', name: 'Sale with Discount', description: 'Sale with discounts applied' },
  { id: 'SN014', name: 'Debit Note', description: 'Debit note issuance' },
  { id: 'SN015', name: 'Sales Return', description: 'Return of goods' },
  { id: 'SN016', name: 'Interstate Sale', description: 'Sale across provinces' },
  { id: 'SN017', name: 'Multiple Items', description: 'Invoice with multiple items' },
  { id: 'SN018', name: 'High Value Transaction', description: 'Transaction above threshold' },
  { id: 'SN019', name: 'Retail Sale', description: 'Retail customer sale' },
  { id: 'SN020', name: 'Wholesale Sale', description: 'Bulk wholesale sale' },
  { id: 'SN021', name: 'Import Sale', description: 'Sale of imported goods' },
  { id: 'SN022', name: 'Manufacturing Sale', description: 'Direct from manufacturer' },
  { id: 'SN023', name: 'Advance Payment', description: 'Advance payment received' },
  { id: 'SN024', name: 'Credit Sale', description: 'Sale on credit terms' },
  { id: 'SN025', name: 'Cash Sale', description: 'Cash payment sale' },
  { id: 'SN026', name: 'Mixed Goods', description: 'Different tax rates in one invoice' },
  { id: 'SN027', name: 'Special Rate Goods', description: 'Goods with special tax rates' },
  { id: 'SN028', name: 'Complex Transaction', description: 'Multiple taxes and conditions' }
];

// FBR Error Codes (Section 7-8 of PDF)
export const FBR_ERROR_CODES: Record<string, string> = {
  // Success
  '00': 'Success - Invoice accepted',
  
  // Seller Errors (0001-0099)
  '0001': 'Seller not registered with FBR',
  '0002': 'Invalid Seller NTN/CNIC',
  '0003': 'Seller STRN not found',
  '0004': 'Seller province mismatch',
  '0005': 'Seller address invalid',
  '0006': 'Seller registration suspended',
  '0007': 'Seller not active',
  '0008': 'Invalid seller business name',
  
  // Buyer Errors (0101-0199)
  '0101': 'Buyer not registered with FBR',
  '0102': 'Invalid Buyer NTN/CNIC',
  '0103': 'Buyer province mismatch',
  '0104': 'Buyer address invalid',
  '0105': 'Buyer registration type mismatch',
  '0106': 'Unregistered buyer limit exceeded',
  
  // Invoice Errors (0201-0299)
  '0201': 'Invalid invoice date',
  '0202': 'Invoice date in future',
  '0203': 'Invoice already exists',
  '0204': 'Duplicate invoice number',
  '0205': 'Invalid invoice type',
  '0206': 'Invoice format error',
  '0207': 'Missing required fields',
  '0208': 'Invalid scenario ID',
  
  // Item Errors (0301-0399)
  '0301': 'Invalid HS Code',
  '0302': 'HS Code not found',
  '0303': 'Invalid quantity',
  '0304': 'Invalid rate/price',
  '0305': 'Invalid tax rate',
  '0306': 'Invalid UOM',
  '0307': 'Negative values not allowed',
  '0308': 'Item description required',
  '0309': 'Tax calculation mismatch',
  '0310': 'Invalid discount amount',
  
  // Tax Errors (0401-0499)
  '0401': 'Sales tax calculation error',
  '0402': 'Further tax calculation error',
  '0403': 'Extra tax not applicable',
  '0404': 'Withholding tax error',
  '0405': 'FED calculation error',
  '0406': 'Tax exemption not valid',
  '0407': 'Zero rate not applicable',
  '0408': 'Reduced rate not applicable',
  
  // System Errors (0501-0599)
  '0501': 'System error - Please try again',
  '0502': 'Database error',
  '0503': 'Network timeout',
  '0504': 'Service temporarily unavailable',
  '0505': 'Invalid request format',
  
  // Authentication Errors
  '401': 'Unauthorized - Invalid or expired token',
  '403': 'Forbidden - Access denied',
  '404': 'Endpoint not found',
  '500': 'Internal server error',
  '503': 'Service unavailable'
};

// Tax Calculation Constants
export const TAX_CONSTANTS = {
  ADVANCE_TAX_RATE: 0.055, // 5.5% advance tax on sales tax
  FURTHER_TAX_RATE: 0.01, // 1% further tax (registered buyers)
  FURTHER_TAX_UNREGISTERED: 0.03, // 3% further tax (unregistered buyers)
  WITHHOLDING_TAX_RATE: 0.045, // 4.5% withholding at source
  FED_STANDARD_RATE: 0.10, // 10% Federal Excise Duty
};

// Validation Rules
export const VALIDATION_RULES = {
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 999999,
  MIN_RATE: 0.01,
  MAX_RATE: 999999999.99,
  MAX_DISCOUNT_PERCENT: 100,
  MAX_UNREGISTERED_AMOUNT: 50000, // Rs. 50,000 limit for unregistered buyers
  NTN_LENGTH: 7,
  CNIC_LENGTH: 13,
  HS_CODE_MIN_LENGTH: 4,
  HS_CODE_MAX_LENGTH: 10
};