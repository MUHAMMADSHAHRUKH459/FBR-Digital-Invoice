// src/lib/invoicepayload.ts

import { config } from "./config";

type Seller = {
  ntnCnic: string;
  businessName: string;
  strn: string;
  province: string;
  address: string;
  phone: string;
};

type Buyer = {
  ntnCnic: string;
  businessName: string;
  province: string;
  address: string;
  registrationType: "Registered" | "Unregistered";
};

type Item = {
  hsCode: string;
  description: string;
  uom: string;
  quantity: number;
  pricePerUnit?: number;
  valueExclST: number;
  taxRate: number;
  taxAmount: number;
};

export function buildInvoicePayload({
  seller,
  buyer,
  invoiceDate,
  invoiceRefNo,
  items,
}: {
  seller: Seller;
  buyer: Buyer;
  invoiceDate: string;
  invoiceRefNo: string;
  items: Item[];
}) {
  const isSandbox = config.fbr.mode === "sandbox";

  const payload = {
    invoiceType: "Sale Invoice",
    invoiceRefNo: invoiceRefNo || `INV-${Date.now()}`,
    invoiceDate: invoiceDate,

    sellerNTNCNIC: seller.ntnCnic,
    sellerBusinessName: seller.businessName,
    sellerProvince: seller.province,
    sellerAddress: seller.address,

    buyerNTNCNIC:
      buyer.registrationType === "Registered" ? buyer.ntnCnic : "",
    buyerBusinessName: buyer.businessName,
    buyerProvince: buyer.province,
    buyerAddress: buyer.address,

    // Sandbox mein mandatory
    scenarioId: isSandbox ? "SN001" : undefined,

    items: items.map((item) => {
      // --- Calculations (PDF required) ---
      const valueSalesExcludingST =
        item.pricePerUnit !== undefined
          ? item.quantity * item.pricePerUnit
          : item.valueExclST;

      const salesTaxApplicable = item.taxAmount;
      const totalValue = valueSalesExcludingST + salesTaxApplicable;

      return {
        hsCode: item.hsCode || "N/A",
        productDescription: item.description,
        uom: item.uom || "Numbers, pieces, units",
        quantity: item.quantity,

        fixedNotifiedValueOrRetailPrice: 0.0,

        valueSalesExcludingST: valueSalesExcludingST,
        salesTaxApplicable: salesTaxApplicable,
        totalValue: totalValue, // ✅ REQUIRED (fixes error 0300)

        rate: item.taxRate, // numeric (safe for sandbox)
        salesTaxWithheldAtSource: 0.0,
        extraTax: 0.0,
        furtherTax: 0.0,
        fedPayable: 0.0,
        discount: 0.0,

        sroScheduleNo: "",
        sroItemSerialNo: "",

        saleType: "Goods at standard rate",
      };
    }),
  };

  return payload;
}
