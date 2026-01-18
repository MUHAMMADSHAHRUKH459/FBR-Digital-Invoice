// FBR Constants

export const PROVINCES = [
  { code: 'Punjab', name: 'Punjab' },
  { code: 'Sindh', name: 'Sindh' },
  { code: 'KPK', name: 'Khyber Pakhtunkhwa' },
  { code: 'Balochistan', name: 'Balochistan' },
  { code: 'Islamabad', name: 'Islamabad Capital Territory' },
  { code: 'Gilgit-Baltistan', name: 'Gilgit-Baltistan' },
  { code: 'AJK', name: 'Azad Jammu & Kashmir' }
];

export const TAX_RATES = [
  { value: '0%', label: '0%', percentage: 0 },
  { value: '5%', label: '5%', percentage: 5 },
  { value: '10%', label: '10%', percentage: 10 },
  { value: '12%', label: '12%', percentage: 12 },
  { value: '15%', label: '15%', percentage: 15 },
  { value: '18%', label: '18%', percentage: 18 }
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
  { id: 3, name: 'Liters' },
  { id: 4, name: 'Meters' },
  { id: 5, name: 'Square Meter' },
  { id: 6, name: 'Cubic Meter' },
  { id: 7, name: 'Dozen' },
  { id: 8, name: 'Pair' },
  { id: 9, name: 'Set' },
  { id: 10, name: 'Box' },
  { id: 11, name: 'Carton' },
  { id: 12, name: 'Bundle' }
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
  { code: '6211.3200', description: 'Men\'s or boys\' track suits, of cotton' }
];

// Your Business Details
export const SELLER_INFO = {
  ntn: '3985694-4',
  strn: '32-77-8763-774-99',
  businessName: 'Ai Fashion (Tweet Gmt Irfan)',
  address: 'Shop # 74 Kareem Center Karachi',
  province: 'Sindh',
  location: 'Karachi',
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
    TAX_RATES: 'https://gw.fbr.gov.pk/pdi/v2/SaleTypeToRate'
  }
};