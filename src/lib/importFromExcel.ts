// src/lib/importFromExcel.ts

import * as XLSX from "xlsx";

export type ExcelItem = {
  hsCode: string;
  description: string;
  uom: string;
  quantity: number;
  valueExclST: number;
  taxRate: number;
};

export function importItemsFromExcel(
  file: File
): Promise<ExcelItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(
          e.target?.result as ArrayBuffer
        );
        const workbook = XLSX.read(data, {
          type: "array",
        });

        const sheet = workbook.Sheets[
          workbook.SheetNames[0]
        ];

        const json = XLSX.utils.sheet_to_json<any>(
          sheet,
          { defval: "" }
        );

        const items = json.map((row) => ({
          hsCode: String(row["HS Code"]),
          description: String(row["Description"]),
          uom: String(row["UOM"]),
          quantity: Number(row["Quantity"]),
          valueExclST: Number(row["Value Excl ST"]),
          taxRate: Number(row["Tax Rate"]),
        }));

        resolve(items);
      } catch (err) {
        reject(err);
      }
    };

    reader.readAsArrayBuffer(file);
  });
}
