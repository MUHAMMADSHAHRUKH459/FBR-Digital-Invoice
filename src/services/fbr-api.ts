import { FBRInvoice, FBRInvoiceResponse, Province, UOMType, APIMode } from '@/types/invoice';
import { FBR_API, FBR_ERROR_CODES, UOM_OPTIONS } from '@/constants/fbr';

// Get API token from environment
const getApiToken = (): string => {
  const token = process.env.NEXT_PUBLIC_FBR_API_TOKEN;
  if (!token) {
    console.warn('⚠️ FBR API Token not found. Using demo mode.');
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

// API Configuration
const getApiConfig = () => ({
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getApiToken()}`
  }
});

// Get appropriate URL based on mode
const getApiUrl = (endpoint: 'POST_INVOICE' | 'VALIDATE_INVOICE'): string => {
  const mode = getApiMode();
  return mode === 'production' 
    ? FBR_API.PRODUCTION[endpoint] 
    : FBR_API.SANDBOX[endpoint];
};

// Mock response for demo mode
const getMockResponse = (invoice: FBRInvoice, isValidateOnly: boolean = false): FBRInvoiceResponse => {
  const mockInvoiceNumber = `DEMO${Date.now().toString().slice(-8)}`;
  
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
      console.log('Mode:', mode || getApiMode());
      console.log('Invoice data:', JSON.stringify(invoice, null, 2));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return getMockResponse(invoice, false);
    }

    try {
      const url = mode === 'production'
        ? FBR_API.PRODUCTION.POST_INVOICE
        : (mode === 'sandbox' ? FBR_API.SANDBOX.POST_INVOICE : getApiUrl('POST_INVOICE'));

      console.log('Posting invoice to:', url);
      console.log('Mode:', mode || getApiMode());
      console.log('Invoice data:', JSON.stringify(invoice, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: getApiConfig().headers,
        body: JSON.stringify(invoice)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(formatErrorMessage('401', 'Unauthorized - Invalid or expired API token'));
        }
        const errorText = await response.text();
        throw new Error(`FBR API Error: ${response.status} - ${errorText}`);
      }

      const data: FBRInvoiceResponse = await response.json();
      console.log('FBR Response:', data);
      
      // Add error descriptions to response
      if (data.validationResponse.errorCode) {
        data.validationResponse.error = formatErrorMessage(
          data.validationResponse.errorCode,
          data.validationResponse.error
        );
      }
      
      return data;
    } catch (error) {
      console.error('FBR Post Invoice Error:', error);
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
      console.log('Mode:', mode || getApiMode());
      console.log('Invoice data:', JSON.stringify(invoice, null, 2));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return getMockResponse(invoice, true);
    }

    try {
      const url = mode === 'production'
        ? FBR_API.PRODUCTION.VALIDATE_INVOICE
        : (mode === 'sandbox' ? FBR_API.SANDBOX.VALIDATE_INVOICE : getApiUrl('VALIDATE_INVOICE'));

      console.log('Validating invoice at:', url);
      console.log('Mode:', mode || getApiMode());

      const response = await fetch(url, {
        method: 'POST',
        headers: getApiConfig().headers,
        body: JSON.stringify(invoice)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(formatErrorMessage('401', 'Unauthorized - Invalid or expired API token'));
        }
        const errorText = await response.text();
        throw new Error(`FBR API Error: ${response.status} - ${errorText}`);
      }

      const data: FBRInvoiceResponse = await response.json();
      console.log('Validation Response:', data);
      
      // Add error descriptions to response
      if (data.validationResponse.errorCode) {
        data.validationResponse.error = formatErrorMessage(
          data.validationResponse.errorCode,
          data.validationResponse.error
        );
      }
      
      return data;
    } catch (error) {
      console.error('FBR Validate Invoice Error:', error);
      throw error;
    }
  }

  /**
   * Get Provinces from FBR
   * Reference: PDF Section 5.1
   */
  static async getProvinces(): Promise<Province[]> {
    // Return local fallback data directly
    const fallbackProvinces = [
      { stateProvinceCode: 1, stateProvinceDesc: 'PUNJAB' },
      { stateProvinceCode: 2, stateProvinceDesc: 'SINDH' },
      { stateProvinceCode: 3, stateProvinceDesc: 'SINIDH' },
      { stateProvinceCode: 4, stateProvinceDesc: 'KPK' },
      { stateProvinceCode: 5, stateProvinceDesc: 'BALOCHISTAN' },
      { stateProvinceCode: 6, stateProvinceDesc: 'ISLAMABAD' }
    ];

    // Skip API call in demo mode
    if (isDemoMode()) {
      return fallbackProvinces;
    }

    try {
      const response = await fetch(FBR_API.REFERENCE.PROVINCES, {
        method: 'GET',
        headers: getApiConfig().headers
      });

      if (!response.ok) {
        console.warn('Failed to fetch provinces from API, using local data');
        return fallbackProvinces;
      }

      const data = await response.json();
      return data.length > 0 ? data : fallbackProvinces;
    } catch (error) {
      console.error('FBR Get Provinces Error:', error);
      return fallbackProvinces;
    }
  }

  /**
   * Get UOM list from FBR
   * Reference: PDF Section 5.2
   * Returns local data - no API call needed
   */
  static async getUOM(): Promise<UOMType[]> {
    // Return local UOM data from constants
    return Promise.resolve(UOM_OPTIONS);
  }

  /**
   * Get Tax Rates from FBR
   * Reference: PDF Section 5.3
   */
  static async getTaxRates() {
    // Return local fallback data
    const fallbackRates = [
      { rate: 0, description: '0% (Zero Rated)' },
      { rate: 5, description: '5%' },
      { rate: 10, description: '10%' },
      { rate: 12, description: '12%' },
      { rate: 15, description: '15%' },
      { rate: 18, description: '18% (Standard)' }
    ];

    // Skip API call in demo mode
    if (isDemoMode()) {
      return fallbackRates;
    }

    try {
      const response = await fetch(FBR_API.REFERENCE.TAX_RATES, {
        method: 'GET',
        headers: getApiConfig().headers
      });

      if (!response.ok) {
        console.warn('Failed to fetch tax rates from API, using local data');
        return fallbackRates;
      }

      const data = await response.json();
      return data.length > 0 ? data : fallbackRates;
    } catch (error) {
      console.error('FBR Get Tax Rates Error:', error);
      return fallbackRates;
    }
  }

  /**
   * Check API Health
   */
  static async checkApiHealth(): Promise<boolean> {
    if (isDemoMode()) {
      return true; // Demo mode always healthy
    }
    
    try {
      const response = await fetch(FBR_API.REFERENCE.PROVINCES, {
        method: 'GET',
        headers: getApiConfig().headers
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