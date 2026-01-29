"use client";

import { useState } from "react";

type Item = {
  hsCode: string;
  description: string;
  uom: string;
  quantity: number;
  valueExclST: number;
  taxRate: number; // percent number (18, 17 etc)
  taxAmount: number;
};

export default function ItemsTable() {
  const [items, setItems] = useState<Item[]>([]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        hsCode: "",
        description: "",
        uom: "",
        quantity: 1,
        valueExclST: 0,
        taxRate: 18,
        taxAmount: 0,
      },
    ]);
  };

  // ✅ STRONGLY TYPED UPDATE FUNCTION
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

      // auto tax calculation
      if (field === "valueExclST" || field === "taxRate") {
        updated[index].taxAmount =
          (updated[index].valueExclST * updated[index].taxRate) / 100;
      }

      return updated;
    });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-700">
          Invoice Items
        </h2>

        <div className="flex gap-2">
          <button
            onClick={addItem}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
          >
            + Add Item
          </button>

          <label className="bg-gray-200 px-3 py-1 rounded text-sm cursor-pointer">
            Import Excel
            <input type="file" hidden />
          </label>
        </div>
      </div>

      <table className="w-full text-sm border">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2">HS Code</th>
            <th className="border p-2">Description</th>
            <th className="border p-2">UOM</th>
            <th className="border p-2">Qty</th>
            <th className="border p-2">Value (Excl ST)</th>
            <th className="border p-2">Tax %</th>
            <th className="border p-2">Tax Amt</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item, i) => (
            <tr key={i}>
              <td className="border p-1">
                <input
                  className="w-full border p-1"
                  value={item.hsCode}
                  onChange={(e) =>
                    updateItem(i, "hsCode", e.target.value)
                  }
                />
              </td>

              <td className="border p-1">
                <input
                  className="w-full border p-1"
                  value={item.description}
                  onChange={(e) =>
                    updateItem(i, "description", e.target.value)
                  }
                />
              </td>

              <td className="border p-1">
                <input
                  className="w-full border p-1"
                  value={item.uom}
                  onChange={(e) =>
                    updateItem(i, "uom", e.target.value)
                  }
                />
              </td>

              <td className="border p-1">
                <input
                  type="number"
                  className="w-full border p-1"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(i, "quantity", Number(e.target.value))
                  }
                />
              </td>

              <td className="border p-1">
                <input
                  type="number"
                  className="w-full border p-1"
                  value={item.valueExclST}
                  onChange={(e) =>
                    updateItem(
                      i,
                      "valueExclST",
                      Number(e.target.value)
                    )
                  }
                />
              </td>

              <td className="border p-1">
                <input
                  type="number"
                  className="w-full border p-1"
                  value={item.taxRate}
                  onChange={(e) =>
                    updateItem(i, "taxRate", Number(e.target.value))
                  }
                />
              </td>

              <td className="border p-1 text-right">
                {item.taxAmount.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {items.length === 0 && (
        <p className="text-gray-500 mt-4">
          No items added yet
        </p>
      )}
    </div>
  );
}
