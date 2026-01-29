"use client";

import { useState, ChangeEvent } from "react";
import * as XLSX from "xlsx";

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

interface ItemsTableProps {
  items: Item[];
  setItems: React.Dispatch<React.SetStateAction<Item[]>>;
}

export default function ItemsTable({ items, setItems }: ItemsTableProps) {
  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        hsCode: "",
        description: "",
        uom: "",
        quantity: 1,
        pricePerUnit: undefined,
        valueExclST: 0,
        taxRate: 18,
        taxAmount: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (confirm("Is item ko delete karna hai?")) {
      setItems((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updateItem = <K extends keyof Item>(
    index: number,
    field: K,
    value: Item[K]
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };

      // Auto tax calculation
      if (field === "valueExclST" || field === "taxRate" || field === "quantity" || field === "pricePerUnit") {
        const qty = Number(updated[index].quantity) || 1;
        const price = Number(updated[index].pricePerUnit) || 0;
        const excl = price * qty;
        updated[index].valueExclST = excl;
        const rate = Number(updated[index].taxRate) || 0;
        updated[index].taxAmount = (excl * rate) / 100;
      }

      return updated;
    });
  };

  const handleExcelImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<any>(sheet, { defval: "", header: 1 });

        // Skip header row (row 0)
        const newItems = json.slice(1).map((row: any[]) => {
          const description = String(row[1] || "");
          const qty = Number(row[2] || 1);
          const rate = Number(row[3] || 0);
          const valueExclST = Number(row[4] || rate * qty || 0);
          const gstRate = Number(row[6] || 18);
          const gstAmt = Number(row[7] || (valueExclST * gstRate) / 100 || 0);

          return {
            hsCode: "",
            description,
            uom: "Numbers, pieces, units",
            quantity: qty,
            pricePerUnit: rate,
            valueExclST,
            taxRate: gstRate,
            taxAmount: gstAmt,
          };
        });

        const filtered = newItems.filter(item => item.description.trim() !== "");

        setItems((prev) => [...prev, ...filtered]);
      } catch (err) {
        console.error("Excel import error:", err);
        alert("Excel import mein masla. Sheet format check karen (Description, Qty, Rate, Val Excl Tax, GST %, etc. columns hone chahiye).");
      }
    };

    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const totalExcl = items.reduce((sum, item) => sum + (item.valueExclST || 0), 0);
  const totalTax = items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
  const grandTotal = totalExcl + totalTax;

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Invoice Items
          </h2>
          <div className="flex gap-4">
            <button
              onClick={addItem}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition shadow-md hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Item
            </button>

            <label className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-medium cursor-pointer hover:bg-green-700 transition shadow-md hover:shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Import Excel
              <input type="file" accept=".xlsx,.xls" hidden onChange={handleExcelImport} />
            </label>
          </div>
        </div>
      </div>

      {/* Items Cards */}
      <div className="p-6 space-y-6">
        {items.length === 0 ? (
          <div className="py-16 text-center">
            <div className="max-w-md mx-auto">
              <svg className="w-20 h-20 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Items Added Yet</h3>
              <p className="text-gray-600 mb-8">Add your first item or import from Excel to start.</p>
              <button
                onClick={addItem}
                className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add First Item
              </button>
            </div>
          </div>
        ) : (
          items.map((item, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 hover:shadow-lg transition">
              {/* Item Header */}
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xl">
                    {i + 1}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Item #{i + 1}</h3>
                </div>
                <button
                  onClick={() => removeItem(i)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-lg transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* 2 inputs per row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* HS Code + Description */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">HS Code</label>
                  <input
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={item.hsCode}
                    placeholder="e.g. 6101.2000"
                    onChange={(e) => updateItem(i, "hsCode", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <input
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={item.description}
                    placeholder="e.g. Men's Denim Jeans - Blue"
                    onChange={(e) => updateItem(i, "description", e.target.value)}
                  />
                </div>

                {/* UOM + Quantity */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">UOM</label>
                  <input
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={item.uom}
                    placeholder="e.g. Numbers, pieces, units"
                    onChange={(e) => updateItem(i, "uom", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={item.quantity}
                    placeholder="e.g. 100"
                    onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                  />
                </div>

                {/* Price per Unit + Value Excl ST */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Price per Unit (Rs)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={item.pricePerUnit ?? ""}
                    placeholder="e.g. 315.00"
                    onChange={(e) => updateItem(i, "pricePerUnit", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Value Excl Tax (Rs)</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-right font-medium text-blue-700">
                    {item.valueExclST.toFixed(2)}
                  </div>
                </div>

                {/* Tax Rate + Tax Amount */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Tax Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    value={item.taxRate}
                    placeholder="e.g. 18"
                    onChange={(e) => updateItem(i, "taxRate", Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Tax Amount (Rs)</label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-right font-medium text-blue-700">
                    {item.taxAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      {items.length > 0 && (
        <div className="px-6 py-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-t">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
              <p className="text-sm text-gray-600 mb-2">Total Excl Tax</p>
              <p className="text-3xl font-bold text-gray-900">Rs {totalExcl.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
              <p className="text-sm text-gray-600 mb-2">Total Tax</p>
              <p className="text-3xl font-bold text-red-600">Rs {totalTax.toFixed(2)}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-green-500">
              <p className="text-sm text-gray-600 mb-2">Grand Total</p>
              <p className="text-4xl font-extrabold text-green-700">Rs {grandTotal.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}