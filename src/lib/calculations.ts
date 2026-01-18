import { InvoiceItem } from '@/types/invoice';

/**
 * Calculate totals for a single invoice item
 */
export function calculateInvoiceItemTotals(item: Partial<InvoiceItem>): Partial<InvoiceItem> {
  const quantity = item.quantity || 0;
  const valueSalesExcludingST = item.valueSalesExcludingST || 0;
  const rate = item.rate || '18%';
  
  // Extract percentage from rate string (e.g., "18%" -> 18)
  const taxPercentage = parseInt(rate.replace('%', '')) || 0;
  
  // Calculate sales value (quantity * rate)
  const salesValue = quantity * valueSalesExcludingST;
  
  // Calculate sales tax
  const salesTax = (salesValue * taxPercentage) / 100;
  
  // Calculate further tax (1% of sales value for registered buyers)
  const furtherTax = salesValue * 0.01;
  
  // Calculate total
  const total = salesValue + salesTax + furtherTax;
  
  return {
    ...item,
    salesTaxApplicable: Math.round(salesTax * 100) / 100,
    furtherTax: Math.round(furtherTax * 100) / 100,
    totalValues: Math.round(total * 100) / 100
  };
}

/**
 * Calculate invoice totals
 */
export function calculateInvoiceTotals(items: InvoiceItem[]) {
  const subTotal = items.reduce((sum, item) => {
    return sum + (item.quantity * item.valueSalesExcludingST);
  }, 0);
  
  const salesTax = items.reduce((sum, item) => {
    return sum + (item.salesTaxApplicable || 0);
  }, 0);
  
  const furtherTax = items.reduce((sum, item) => {
    return sum + (item.furtherTax || 0);
  }, 0);
  
  const extraTax = items.reduce((sum, item) => {
    return sum + (item.extraTax || 0);
  }, 0);
  
  const grandTotal = subTotal + salesTax + furtherTax + extraTax;
  
  return {
    subTotal: Math.round(subTotal * 100) / 100,
    salesTax: Math.round(salesTax * 100) / 100,
    furtherTax: Math.round(furtherTax * 100) / 100,
    extraTax: Math.round(extraTax * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100
  };
}