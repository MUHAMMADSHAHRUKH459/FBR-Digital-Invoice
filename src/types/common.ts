// Common Types

export interface Customer {
  id: string;
  name: string;
  ntnCnic: string;
  registrationType: 'Registered' | 'Unregistered';
  province: string;
  address: string;
  phone?: string;
  email?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  hsCode: string;
  description: string;
  rate: number;
  uom: string;
  saleType: string;
  taxRate: number;
  createdAt: string;
}

export interface Province {
  stateProvinceCode: number;
  stateProvinceDesc: string;
}

export interface UOM {
  uoM_ID: number;
  description: string;
}

export interface TaxRate {
  ratE_ID: number;
  ratE_DESC: string;
  ratE_VALUE: number;
}

export interface SaleType {
  id: string;
  name: string;
  description: string;
}