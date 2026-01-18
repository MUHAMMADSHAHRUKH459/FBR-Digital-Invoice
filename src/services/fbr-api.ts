import { FBRInvoice, FBRInvoiceResponse } from '@/types/invoice';

// FBR API Endpoints
const FBR_API = {
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

// Get API token from environment
const getApiToken = (): string => {
  const token = process.env.NEXT_PUBLIC_FBR_API_TOKEN;
  if (!token) {
    console.warn('⚠️ FBR API Token not found. Using demo mode.');
    return 'demo_token';
  }
  return token;
};

// Check if production environment
const isProduction = (): boolean => {
  return process.env.NEXT_PUBLIC_FBR_ENV === 'production';
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

// Mock response for demo mode
const getMockResponse = (invoice: FBRInvoice, isValidateOnly: boolean = false): FBRInvoiceResponse => {
  const mockInvoiceNumber = `DEMO${Date.now()}`;
  
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

export class FBRApiService {
  
  /**
   * Post Invoice to FBR
   */
  static async postInvoice(invoice: FBRInvoice): Promise<FBRInvoiceResponse> {
    // Demo mode - return mock response
    if (isDemoMode()) {
      console.log('🎭 DEMO MODE: Returning mock response');
      console.log('Invoice data:', JSON.stringify(invoice, null, 2));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return getMockResponse(invoice, false);
    }

    try {
      const url = isProduction() 
        ? FBR_API.PRODUCTION.POST_INVOICE 
        : FBR_API.SANDBOX.POST_INVOICE;

      console.log('Posting invoice to:', url);
      console.log('Invoice data:', JSON.stringify(invoice, null, 2));

      const response = await fetch(url, {
        method: 'POST',
        headers: getApiConfig().headers,
        body: JSON.stringify(invoice)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Invalid or expired API token');
        }
        const errorText = await response.text();
        throw new Error(`FBR API Error: ${response.status} - ${errorText}`);
      }

      const data: FBRInvoiceResponse = await response.json();
      console.log('FBR Response:', data);
      return data;
    } catch (error) {
      console.error('FBR Post Invoice Error:', error);
      throw error;
    }
  }

  /**
   * Validate Invoice (without posting)
   */
  static async validateInvoice(invoice: FBRInvoice): Promise<FBRInvoiceResponse> {
    // Demo mode - return mock response
    if (isDemoMode()) {
      console.log('🎭 DEMO MODE: Validating invoice (mock)');
      console.log('Invoice data:', JSON.stringify(invoice, null, 2));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return getMockResponse(invoice, true);
    }

    try {
      const url = isProduction() 
        ? FBR_API.PRODUCTION.VALIDATE_INVOICE 
        : FBR_API.SANDBOX.VALIDATE_INVOICE;

      console.log('Validating invoice at:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: getApiConfig().headers,
        body: JSON.stringify(invoice)
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized: Invalid or expired API token');
        }
        const errorText = await response.text();
        throw new Error(`FBR API Error: ${response.status} - ${errorText}`);
      }

      const data: FBRInvoiceResponse = await response.json();
      console.log('Validation Response:', data);
      return data;
    } catch (error) {
      console.error('FBR Validate Invoice Error:', error);
      throw error;
    }
  }

  /**
   * Get Provinces from FBR
   */
  static async getProvinces() {
    try {
      const response = await fetch(FBR_API.REFERENCE.PROVINCES, {
        method: 'GET',
        headers: getApiConfig().headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch provinces');
      }

      return await response.json();
    } catch (error) {
      console.error('FBR Get Provinces Error:', error);
      // Return fallback data
      return [
        { stateProvinceCode: 1, stateProvinceDesc: 'PUNJAB' },
        { stateProvinceCode: 2, stateProvinceDesc: 'SINDH' },
        { stateProvinceCode: 3, stateProvinceDesc: 'KPK' },
        { stateProvinceCode: 4, stateProvinceDesc: 'BALOCHISTAN' }
      ];
    }
  }

  /**
   * Get UOM list from FBR
   */
  static async getUOM() {
    try {
      const response = await fetch(FBR_API.REFERENCE.UOM, {
        method: 'GET',
        headers: getApiConfig().headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch UOM');
      }

      return await response.json();
    } catch (error) {
      console.error('FBR Get UOM Error:', error);
      return [];
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
}