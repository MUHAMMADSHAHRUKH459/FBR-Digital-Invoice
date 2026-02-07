// src/lib/mockFbrResponse.ts
// Ye mock hai real FBR response ka (based on PDF v1.12 samples + common success/error)

export type MockResponse = {
  success: boolean;
  data?: any;
  message?: string;
  errorCode?: string;
};

export function mockValidateInvoice(payload: any): MockResponse {
  // Simple validation check (real mein FBR bohot strict fields check karta hai)
  const requiredFields = [
    'invoiceType', 'invoiceDate', 'sellerNTNCNIC', 'sellerBusinessName',
    'sellerProvince', 'sellerAddress', 'buyerNTNCNIC', 'buyerBusinessName',
    'buyerProvince', 'buyerAddress', 'buyerRegistrationType', 'items'
  ];

  const missing = requiredFields.filter(field => !(field in payload));
  if (missing.length > 0) {
    return {
      success: false,
      message: `Missing required fields: ${missing.join(', ')}`,
      errorCode: "MISSING_FIELDS"
    };
  }

  if (payload.items.length === 0) {
    return {
      success: false,
      message: "At least one item required",
      errorCode: "NO_ITEMS"
    };
  }

  // Success mock
  return {
    success: true,
    data: {
      validationStatus: "VALID",
      messages: ["All fields validated successfully"],
      warnings: [] // agar kuch warnings ho to
    }
  };
}

export function mockPostInvoice(payload: any): MockResponse {
  // Assume validate pass ho gaya, ab post simulate
  const isValid = mockValidateInvoice(payload).success;

  if (!isValid) {
    return {
      success: false,
      message: "Validation failed before posting",
      errorCode: "VALIDATION_FAILED"
    };
  }

  // Mock success response (FBR se milne wala typical)
  return {
    success: true,
    data: {
      irn: `IRN-MOCK-${Date.now()}-${Math.floor(Math.random() * 10000)}`, // Invoice Registration Number
      qrCode: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA... (base64 QR string here ya generate kar lo later)",
      fiscalId: "FBR-MOCK-123456",
      status: "SUBMITTED",
      message: "Invoice posted successfully to FBR sandbox",
      timestamp: new Date().toISOString()
    }
  };
}

// Optional: Random error simulate karne ke liye (testing ke liye)
export function mockErrorResponse(): MockResponse {
  return {
    success: false,
    message: "Invalid NTN/CNIC format or unauthorized",
    errorCode: "401" // PDF se error codes jaise 401 unauthorized
  };
}