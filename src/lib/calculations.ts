import { InvoiceItem } from '@/types/invoice';
import { TAX_CONSTANTS } from '@/constants/fbr';

/**
 * Calculate totals for a single invoice item based on FBR formulas
 * Reference: FBR PDF Section 4.1 - Item Calculations
 */
export function calculateInvoiceItemTotals(
  item: Partial<InvoiceItem>,
  isRegisteredBuyer: boolean = true
): Partial<InvoiceItem> {
  const quantity = item.quantity || 0;
  const valueSalesExcludingST = item.valueSalesExcludingST || 0;
  const rate = item.rate || '18%';
  const discount = item.discount || 0;
  const fixedNotifiedValueOrRetailPrice = item.fixedNotifiedValueOrRetailPrice || 0;
  
  // Extract percentage from rate string (e.g., "18%" -> 18)
  const taxPercentage = parseInt(rate.replace('%', '')) || 0;
  const taxRate = taxPercentage / 100;
  
  // Step 1: Calculate sales value (quantity * rate per unit)
  const salesValue = quantity * valueSalesExcludingST;
  
  // Step 2: Apply discount if any
  const salesValueAfterDiscount = salesValue - discount;
  
  // Step 3: Calculate Sales Tax (GST)
  // Formula: Sales Tax = (Sales Value - Discount) * Tax Rate
  const salesTax = salesValueAfterDiscount * taxRate;
  
  // Step 4: Calculate Further Tax
  // Registered: 1%, Unregistered: 3%
  const furtherTaxRate = isRegisteredBuyer 
    ? TAX_CONSTANTS.FURTHER_TAX_RATE 
    : TAX_CONSTANTS.FURTHER_TAX_UNREGISTERED;
  const furtherTax = salesValueAfterDiscount * furtherTaxRate;
  
  // Step 5: Calculate Sales Tax Withheld at Source (if applicable)
  // Usually 4.5% of sales tax for certain transactions
  const salesTaxWithheldAtSource = item.salesTaxWithheldAtSource || 0;
  
  // Step 6: Calculate Extra Tax (if applicable - from SRO or special cases)
  const extraTax = item.extraTax || 0;
  
  // Step 7: Calculate FED/Advance Tax (5.5% of sales tax)
  // Formula: Advance Tax = Sales Tax * 5.5%
  const fedPayable = salesTax * TAX_CONSTANTS.ADVANCE_TAX_RATE;
  
  // Step 8: Calculate Grand Total for this item
  // Formula: Total = Sales Value + Sales Tax + Further Tax + Extra Tax + FED - Discount
  const grandTotal = salesValueAfterDiscount + salesTax + furtherTax + extraTax;
  
  // Step 9: Calculate Net Total (including advance tax)
  // Formula: Net Total = Grand Total + Advance Tax
  const totalValues = grandTotal + fedPayable;
  
  return {
    ...item,
    salesTaxApplicable: Math.round(salesTax * 100) / 100,
    furtherTax: Math.round(furtherTax * 100) / 100,
    salesTaxWithheldAtSource: Math.round(salesTaxWithheldAtSource * 100) / 100,
    extraTax: Math.round(extraTax * 100) / 100,
    fedPayable: Math.round(fedPayable * 100) / 100,
    totalValues: Math.round(totalValues * 100) / 100
  };
}

/**
 * Calculate invoice totals from all items
 * Reference: FBR PDF Section 4.2 - Invoice Totals
 */
export function calculateInvoiceTotals(items: InvoiceItem[]) {
  // Sum all subtotals (value excluding ST)
  const subTotal = items.reduce((sum, item) => {
    const itemValue = (item.quantity * item.valueSalesExcludingST) - (item.discount || 0);
    return sum + itemValue;
  }, 0);
  
  // Sum all sales tax
  const salesTax = items.reduce((sum, item) => {
    return sum + (item.salesTaxApplicable || 0);
  }, 0);
  
  // Sum all further tax
  const furtherTax = items.reduce((sum, item) => {
    return sum + (item.furtherTax || 0);
  }, 0);
  
  // Sum all extra tax
  const extraTax = items.reduce((sum, item) => {
    return sum + (item.extraTax || 0);
  }, 0);
  
  // Sum all advance tax (FED)
  const advanceTax = items.reduce((sum, item) => {
    return sum + (item.fedPayable || 0);
  }, 0);
  
  // Sum all discounts
  const totalDiscount = items.reduce((sum, item) => {
    return sum + (item.discount || 0);
  }, 0);
  
  // Sum all sales tax withheld at source
  const totalWithheld = items.reduce((sum, item) => {
    return sum + (item.salesTaxWithheldAtSource || 0);
  }, 0);
  
  // Grand Total (including all taxes except advance tax)
  const grandTotal = subTotal + salesTax + furtherTax + extraTax;
  
  // Net Total (including advance tax)
  const netTotal = grandTotal + advanceTax;
  
  return {
    subTotal: Math.round(subTotal * 100) / 100,
    salesTax: Math.round(salesTax * 100) / 100,
    furtherTax: Math.round(furtherTax * 100) / 100,
    extraTax: Math.round(extraTax * 100) / 100,
    advanceTax: Math.round(advanceTax * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    totalWithheld: Math.round(totalWithheld * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
    netTotal: Math.round(netTotal * 100) / 100
  };
}

/**
 * Validate invoice item values
 */
export function validateInvoiceItem(item: Partial<InvoiceItem>): string[] {
  const errors: string[] = [];
  
  if (!item.productDescription || item.productDescription.trim() === '') {
    errors.push('Product description is required');
  }
  
  if (!item.hsCode || item.hsCode.trim() === '') {
    errors.push('HS Code is required');
  }
  
  if (!item.quantity || item.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }
  
  if (!item.valueSalesExcludingST || item.valueSalesExcludingST <= 0) {
    errors.push('Rate must be greater than 0');
  }
  
  if (!item.rate) {
    errors.push('Tax rate is required');
  }
  
  if (!item.uom || item.uom.trim() === '') {
    errors.push('Unit of Measurement (UOM) is required');
  }
  
  return errors;
}

/**
 * Calculate tax breakdown for display
 */
export function getTaxBreakdown(item: InvoiceItem) {
  const salesValue = (item.quantity * item.valueSalesExcludingST) - (item.discount || 0);
  
  return {
    salesValue: Math.round(salesValue * 100) / 100,
    salesTax: Math.round((item.salesTaxApplicable || 0) * 100) / 100,
    furtherTax: Math.round((item.furtherTax || 0) * 100) / 100,
    extraTax: Math.round((item.extraTax || 0) * 100) / 100,
    advanceTax: Math.round((item.fedPayable || 0) * 100) / 100,
    withheld: Math.round((item.salesTaxWithheldAtSource || 0) * 100) / 100,
    discount: Math.round((item.discount || 0) * 100) / 100,
    total: Math.round((item.totalValues || 0) * 100) / 100
  };
}

/**
 * Calculate tax percentage from amount and base value
 */
export function calculateTaxPercentage(taxAmount: number, baseValue: number): number {
  if (baseValue === 0) return 0;
  return Math.round((taxAmount / baseValue) * 100 * 100) / 100;
}

/**
 * Recalculate all items in invoice
 */
export function recalculateInvoiceItems(
  items: Partial<InvoiceItem>[],
  isRegisteredBuyer: boolean = true
): Partial<InvoiceItem>[] {
  return items.map(item => calculateInvoiceItemTotals(item, isRegisteredBuyer));
}