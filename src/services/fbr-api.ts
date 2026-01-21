import { FBRInvoice, FBRInvoiceResponse, Province, UOMType, APIMode } from '@/types/invoice';
import { FBR_API, FBR_ERROR_CODES } from '@/constants/fbr';

/**
 * Format invoice to match FBR's exact JSON structure
 * FBR is very strict about field names and data types
 */
const formatInvoiceForFBR = (invoice: FBRInvoice): any => {
  return {
    invoiceType: invoice.invoiceType,
    invoiceDate: invoice.invoiceDate,
    sellerNTNCNIC: invoice.sellerNTNCNIC,
    sellerBusinessName: invoice.sellerBusinessName,
    sellerProvince: invoice.sellerProvince,
    sellerAddress: invoice.sellerAddress,
    buyerNTNCNIC: invoice.buyerNTNCNIC,
    buyerBusinessName: invoice.buyerBusinessName,
    buyerProvince: invoice.buyerProvince,
    buyerAddress: invoice.buyerAddress,
    buyerRegistrationType: invoice.buyerRegistrationType,
    invoiceRefNo: "", // Empty string as per FBR format
    scenarioId: invoice.scenarioId || "SN001",
    items: invoice.items.map(item => ({
      hsCode: item.hsCode,
      productDescription: item.productDescription,
      rate: parseFloat(item.rate.replace('%', '')), // Convert "10%" to number 10
      uoM: item.uom || "Numbers, pieces, units", // ✅ DEFAULT if missing - FBR REQUIRES THIS
      quantity: Number(item.quantity),
      totalValues: Number(item.totalValues || 0),
      valueSalesExcludingST: Number(item.valueSalesExcludingST || 0),
      fixedNotifiedValueOrRetailPrice: Number(item.fixedNotifiedValueOrRetailPrice || 0),
      salesTaxApplicable: Number(item.salesTaxApplicable || 0),
      salesTaxWithheldAtSource: Number(item.salesTaxWithheldAtSource || 0),
      extraTax: String(item.extraTax || ""),
      furtherTax: Number(item.furtherTax || 0),
      sroScheduleNo: item.sroScheduleNo || "",
      fedPayable: Number(item.fedPayable || 0),
      discount: Number(item.discount || 0),
      saleType: item.saleType || "",
      sroItemSerialNo: item.sroItemSerialNo || ""
    }))
  };
};

// Get API token from environment
const getApiToken = (): string => {
  const token = process.env.NEXT_PUBLIC_FBR_API_TOKEN;
  if (!token) {
    return 'demo_token';
  }
  return token;
};

// Get current API mode from environment
const getApiMode = (): APIMode => {
  return (process.env.NEXT_PUBLIC_FBR_MODE as APIMode) || 'sandbox';
};

// Check if demo mode (no real token)
const isDemoMode = (): boolean => {
  const token = process.env.NEXT_PUBLIC_FBR_API_TOKEN;
  return !token || token === 'demo_token' || token === 'test_token_123';
};

// API Configuration - FBR uses Bearer token (confirmed by their sample code)
const getApiConfig = () => {
  const token = getApiToken();
  
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,  // FBR uses Bearer prefix
      'Accept': 'application/json'
    }
  };
};

// Get appropriate URL based on mode
const getApiUrl = (endpoint: 'POST_INVOICE' | 'VALIDATE_INVOICE'): string => {
  const mode = getApiMode();
  return mode === 'production' 
    ? FBR_API.PRODUCTION[endpoint] 
    : FBR_API.SANDBOX[endpoint];
};

// Mock response for demo mode
const getMockResponse = (invoice: FBRInvoice, isValidateOnly: boolean = false): FBRInvoiceResponse => {
  const mockInvoiceNumber = `FBR${Date.now().toString().slice(-8)}`;
  
  return {
    invoiceNumber: isValidateOnly ? undefined : mockInvoiceNumber,
    dated: new Date().toISOString(),
    validationResponse: {
      statusCode: '00',
      status: 'Valid',
      error: '',
      invoiceStatuses: invoice.items.map((item, index) => ({
        itemSNo: String(index + 1),
        statusCode: '00',
        status: 'Valid',
        invoiceNo: isValidateOnly ? undefined : `${mockInvoiceNumber}-${index + 1}`,
        errorCode: '',
        error: ''
      }))
    }
  };
};

// Format error message with error code description
const formatErrorMessage = (errorCode: string, defaultMessage: string): string => {
  const errorDescription = FBR_ERROR_CODES[errorCode];
  if (errorDescription) {
    return `[${errorCode}] ${errorDescription}`;
  }
  return `[${errorCode}] ${defaultMessage}`;
};

export class FBRApiService {
  
  /**
   * Post Invoice to FBR
   * Reference: PDF Section 4.1
   */
  static async postInvoice(invoice: FBRInvoice, mode?: APIMode): Promise<FBRInvoiceResponse> {
    // Demo mode - return mock response
    if (isDemoMode()) {
      console.log('🎭 DEMO MODE: Returning mock response');
      await new Promise(resolve => setTimeout(resolve, 1500));
      return getMockResponse(invoice, false);
    }

    try {
      const url = mode === 'production'
        ? FBR_API.PRODUCTION.POST_INVOICE
        : (mode === 'sandbox' ? FBR_API.SANDBOX.POST_INVOICE : getApiUrl('POST_INVOICE'));

      const config = getApiConfig();
      
      // Format invoice to match FBR's exact JSON structure
      const formattedInvoice = formatInvoiceForFBR(invoice);

      console.log('📤 Posting invoice to FBR:');
      console.log('  URL:', url);
      console.log('  Token:', config.headers.Authorization?.substring(0, 30) + '...');
      console.log('  Invoice data:', JSON.stringify(formattedInvoice, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: config.headers,
        body: JSON.stringify(formattedInvoice),
        mode: 'cors',
        cache: 'no-cache'
      });

      console.log('📥 FBR Response:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('❌ FBR Error:', errorText);
        
        if (response.status === 401) {
          throw new Error(
            '🔐 FBR Authentication Failed\n\n' +
            'Your token is not working. This could mean:\n' +
            '1. Token not activated by FBR yet\n' +
            '2. Token expired\n' +
            '3. Wrong token\n\n' +
            'Please login to https://sandbox-iris.fbr.gov.pk\n' +
            'and verify your token in Test Environment section.'
          );
        }
        
        if (response.status === 400) {
          throw new Error(`FBR Validation Error: ${errorText}`);
        }
        
        throw new Error(`FBR API Error [${response.status}]: ${errorText}`);
      }

      const data: FBRInvoiceResponse = await response.json();
      console.log('✅ Invoice Posted Successfully!');
      console.log('📦 Full FBR Response:', JSON.stringify(data, null, 2));
      console.log('  Invoice Number:', data.invoiceNumber);
      
      return data;
    } catch (error: any) {
      console.error('🔴 FBR Post Invoice Error:', error.message);
      throw error;
    }
  }

  /**
   * Validate Invoice (without posting)
   * Reference: PDF Section 4.2
   */
  static async validateInvoice(invoice: FBRInvoice, mode?: APIMode): Promise<FBRInvoiceResponse> {
    // Demo mode - return mock response
    if (isDemoMode()) {
      console.log('🎭 DEMO MODE: Validating invoice (mock)');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return getMockResponse(invoice, true);
    }

    try {
      const url = mode === 'production'
        ? FBR_API.PRODUCTION.VALIDATE_INVOICE
        : (mode === 'sandbox' ? FBR_API.SANDBOX.VALIDATE_INVOICE : getApiUrl('VALIDATE_INVOICE'));

      const config = getApiConfig();
      const formattedInvoice = formatInvoiceForFBR(invoice);

      console.log('📤 Validating invoice at:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: config.headers,
        body: JSON.stringify(formattedInvoice),
        mode: 'cors',
        cache: 'no-cache'
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Validation failed [${response.status}]: ${errorText}`);
      }

      const data: FBRInvoiceResponse = await response.json();
      console.log('✅ Validation Successful');
      return data;
    } catch (error: any) {
      console.error('🔴 Validate Error:', error.message);
      throw error;
    }
  }

  /**
   * Get Provinces from FBR
   * ALWAYS returns fallback data to prevent app crashes
   */
  static async getProvinces(): Promise<Province[]> {
    const fallbackProvinces = [
      { stateProvinceCode: 1, stateProvinceDesc: 'PUNJAB' },
      { stateProvinceCode: 2, stateProvinceDesc: 'SINDH' },
      { stateProvinceCode: 3, stateProvinceDesc: 'SINIDH' },
      { stateProvinceCode: 4, stateProvinceDesc: 'KPK' },
      { stateProvinceCode: 5, stateProvinceDesc: 'BALOCHISTAN' },
      { stateProvinceCode: 6, stateProvinceDesc: 'ISLAMABAD' }
    ];

    if (isDemoMode()) {
      return fallbackProvinces;
    }

    try {
      const response = await fetch(FBR_API.REFERENCE.PROVINCES, {
        method: 'GET',
        headers: getApiConfig().headers,
        mode: 'cors',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        return data && data.length > 0 ? data : fallbackProvinces;
      }
    } catch (error) {
      console.warn('⚠️ Using fallback provinces data');
    }

    return fallbackProvinces;
  }

  /**
   * Get UOM list from FBR
   * ALWAYS returns fallback data to prevent app crashes
   */
  static async getUOM(): Promise<UOMType[]> {
    const fallbackUOM = [
      { id: 1, name: 'Numbers, pieces, units' },
      { id: 2, name: 'Kilograms' },
      { id: 3, name: 'Litres' },
      { id: 4, name: 'Meters' },
      { id: 5, name: 'Square meters' },
      { id: 6, name: 'Cubic meters' },
      { id: 7, name: 'Dozens' },
      { id: 8, name: 'Pairs' }
    ];

    if (isDemoMode()) {
      return fallbackUOM;
    }

    try {
      const response = await fetch(FBR_API.REFERENCE.UOM, {
        method: 'GET',
        headers: getApiConfig().headers,
        mode: 'cors',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        const data = await response.json();
        return data && data.length > 0 ? data : fallbackUOM;
      }
    } catch (error) {
      console.warn('⚠️ Using fallback UOM data');
    }

    return fallbackUOM;
  }

  /**
   * Get Tax Rates from FBR
   */
  static async getTaxRates() {
    if (isDemoMode()) {
      return [];
    }
    
    try {
      const response = await fetch(FBR_API.REFERENCE.TAX_RATES, {
        method: 'GET',
        headers: getApiConfig().headers,
        mode: 'cors',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.warn('⚠️ Could not fetch tax rates');
    }

    return [];
  }

  /**
   * Check API Health
   */
  static async checkApiHealth(): Promise<boolean> {
    if (isDemoMode()) {
      return true;
    }
    
    try {
      const response = await fetch(FBR_API.REFERENCE.PROVINCES, {
        method: 'GET',
        headers: getApiConfig().headers,
        mode: 'cors',
        signal: AbortSignal.timeout(3000)
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current mode
   */
  static getCurrentMode(): APIMode {
    return getApiMode();
  }

  /**
   * Check if in demo mode
   */
  static isDemoMode(): boolean {
    return isDemoMode();
  }
}