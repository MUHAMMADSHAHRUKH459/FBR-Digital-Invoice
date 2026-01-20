'use client';

import { useState } from 'react';
import { FBRInvoice, FBRInvoiceResponse, APIMode } from '@/types/invoice';
import { FBRApiService } from '@/services/fbr-api';
import { FBR_ERROR_CODES } from '@/constants/fbr';

export function useFBRInvoice() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Post Invoice to FBR
   */
  const postInvoice = async (
    invoice: FBRInvoice, 
    mode?: APIMode
  ): Promise<FBRInvoiceResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await FBRApiService.postInvoice(invoice, mode);
      
      if (response.validationResponse.statusCode === '00' && 
          response.validationResponse.status === 'Valid') {
        return response;
      } else {
        const errorCode = response.validationResponse.errorCode || 'UNKNOWN';
        const errorMsg = response.validationResponse.error || 'Invoice validation failed';
        
        // Get error description from error codes
        const errorDescription = FBR_ERROR_CODES[errorCode] || errorMsg;
        
        setError(`${errorDescription}`);
        
        // Check for item-level errors
        if (response.validationResponse.invoiceStatuses) {
          const itemErrors = response.validationResponse.invoiceStatuses
            .filter(item => item.status === 'Invalid')
            .map(item => {
              const itemErrorCode = item.errorCode || 'UNKNOWN';
              const itemErrorDesc = FBR_ERROR_CODES[itemErrorCode] || item.error;
              return `Item ${item.itemSNo}: ${itemErrorDesc}`;
            })
            .join('\n');
          
          if (itemErrors) {
            setError(`${errorDescription}\n\nItem Errors:\n${itemErrors}`);
          }
        }
        
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to post invoice';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Validate Invoice without posting
   */
  const validateInvoice = async (
    invoice: FBRInvoice,
    mode?: APIMode
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await FBRApiService.validateInvoice(invoice, mode);
      
      if (response.validationResponse.statusCode === '00' && 
          response.validationResponse.status === 'Valid') {
        return true;
      } else {
        const errorCode = response.validationResponse.errorCode || 'UNKNOWN';
        const errorMsg = response.validationResponse.error || 'Validation failed';
        
        // Get error description from error codes
        const errorDescription = FBR_ERROR_CODES[errorCode] || errorMsg;
        
        setError(`${errorDescription}`);
        
        // Check for item-level errors
        if (response.validationResponse.invoiceStatuses) {
          const itemErrors = response.validationResponse.invoiceStatuses
            .filter(item => item.status === 'Invalid')
            .map(item => {
              const itemErrorCode = item.errorCode || 'UNKNOWN';
              const itemErrorDesc = FBR_ERROR_CODES[itemErrorCode] || item.error;
              return `Item ${item.itemSNo}: ${itemErrorDesc}`;
            })
            .join('\n');
          
          if (itemErrors) {
            setError(`${errorDescription}\n\nItem Errors:\n${itemErrors}`);
          }
        }
        
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Validation error';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    postInvoice,
    validateInvoice,
    loading,
    error
  };
}