// src/app/invoices/actions.ts

import { buildInvoicePayload } from "@/lib/buildInvoicePayload";

export async function validateInvoice(payload: any) {
  const res = await fetch("/api/invoice/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Validation failed");
  }

  return res.json();
}

export async function postInvoice(payload: any) {
  const res = await fetch("/api/invoice/post", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Posting failed");
  }

  return res.json();
}

export { buildInvoicePayload };