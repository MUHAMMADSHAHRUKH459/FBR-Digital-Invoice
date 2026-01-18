'use client';

import { useState } from 'react';
import { FBRInvoice, FBRInvoiceResponse } from '@/types/invoice';
import { FBRApiService } from '@/services/fbr-api';

export function useFBRInvoice() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const postInvoice = async (invoice: FBRInvoice): Promise<FBRInvoiceResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await FBRApiService.postInvoice(invoice);
      
      if (response.validationResponse.statusCode === '00' && 
          response.validationResponse.status === 'Valid') {
        return response;
      } else {
        const errorMsg = response.validationResponse.error || 'Invoice validation failed';
        setError(errorMsg);
        
        // Check for item-level errors
        if (response.validationResponse.invoiceStatuses) {
          const itemErrors = response.validationResponse.invoiceStatuses
            .filter(item => item.status === 'Invalid')
            .map(item => `Item ${item.itemSNo}: ${item.error}`)
            .join('\n');
          
          if (itemErrors) {
            setError(`${errorMsg}\n\n${itemErrors}`);
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

  const validateInvoice = async (invoice: FBRInvoice): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await FBRApiService.validateInvoice(invoice);
      
      if (response.validationResponse.statusCode === '00' && 
          response.validationResponse.status === 'Valid') {
        return true;
      } else {
        const errorMsg = response.validationResponse.error || 'Validation failed';
        setError(errorMsg);
        
        // Check for item-level errors
        if (response.validationResponse.invoiceStatuses) {
          const itemErrors = response.validationResponse.invoiceStatuses
            .filter(item => item.status === 'Invalid')
            .map(item => `Item ${item.itemSNo}: ${item.error}`)
            .join('\n');
          
          if (itemErrors) {
            setError(`${errorMsg}\n\n${itemErrors}`);
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