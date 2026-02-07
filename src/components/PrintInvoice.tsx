import Image from 'next/image';

interface PrintInvoiceProps {
  seller: {
    businessName: string;
    ntnCnic: string;
    strn?: string;
    province: string;
    address: string;
    phone: string;
  };
  buyer: {
    businessName: string;
    ntnCnic: string;
    province: string;
    address: string;
    phone?: string;
  };
  invoiceDate: string;
  invoiceRefNo: string;
  items: Array<{
    hsCode: string;
    description: string;
    quantity: number;
    uom: string;
    pricePerUnit?: number;
    valueExclST: number;
    taxRate: number;
    taxAmount: number;
  }>;
  response: any; // FBR response with qrCode
}

export default function PrintInvoice({
  seller,
  buyer,
  invoiceDate,
  invoiceRefNo,
  items,
  response,
}: PrintInvoiceProps) {
  const totalExcl = items.reduce((sum, item) => sum + (item.valueExclST || 0), 0);
  const totalTax = items.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
  const grandTotal = totalExcl + totalTax;

  return (
    <>
      {/* Print CSS - sirf invoice print hoga */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-invoice, .print-invoice * {
            visibility: visible !important;
          }
          .print-invoice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            min-height: 297mm !important;
            margin: 0 !important;
            padding: 10mm !important;
            box-sizing: border-box !important;
            background: white !important;
            color: black !important;
            font-family: Arial, sans-serif !important;
            font-size: 10pt !important;
          }
          header, footer, nav, button, .sidebar, .actions, .no-print, .header, .footer, #__next > *:not(.print-invoice) {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          table, div.grid, div.content {
            page-break-inside: avoid;
          }
        }
      `}</style>

      <div className="print-invoice">
        {/* Header */}
        <div className="text-center mb-6">
          <Image
            src="/fbr-logo.png"  // Public folder mein rakhna (download kar ke)
            alt="FBR Digital Invoicing Logo"
            width={140}
            height={140}
            className="mx-auto mb-4 object-contain"
            onError={() => console.log("FBR logo missing - public/fbr-logo.png check karo")}
          />
          <h1 className="text-2xl font-bold">{seller.businessName}</h1>
          <p className="text-sm">{seller.address}</p>
          <p className="text-sm">Contact: {seller.phone}</p>
        </div>

        <h2 className="text-xl font-bold text-center mb-4">SALES TAX INVOICE</h2>

        <p className="text-center mb-4 text-sm">
          Invoice #: {invoiceRefNo} | Date: {invoiceDate} | Time: {new Date().toLocaleTimeString()}
        </p>

        <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
          <div className="border border-black p-4">
            <h3 className="font-bold mb-2">BUYER'S DETAIL</h3>
            <p><strong>Name:</strong> {buyer.businessName}</p>
            <p><strong>CNIC/NTN:</strong> {buyer.ntnCnic || "N/A"}</p>
            <p><strong>Province:</strong> {buyer.province}</p>
            <p><strong>Address:</strong> {buyer.address}</p>
            <p><strong>Phone:</strong> {buyer.phone || "N/A"}</p>
          </div>
          <div className="border border-black p-4">
            <h3 className="font-bold mb-2">SELLER'S DETAIL</h3>
            <p><strong>Name:</strong> {seller.businessName}</p>
            <p><strong>NTN:</strong> {seller.ntnCnic}</p>
            <p><strong>STRN:</strong> {seller.strn || "N/A"}</p>
            <p><strong>Province:</strong> {seller.province}</p>
            <p><strong>Address:</strong> {seller.address}</p>
            <p><strong>Phone:</strong> {seller.phone}</p>
          </div>
        </div>

        <table className="w-full border-collapse border border-black mb-6 text-xs">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">S.No</th>
              <th className="border p-2">HS Code</th>
              <th className="border p-2">Description</th>
              <th className="border p-2">QTY</th>
              <th className="border p-2">UOM</th>
              <th className="border p-2">Sale Rate</th>
              <th className="border p-2">Sales Value Gross</th>
              <th className="border p-2">GST %</th>
              <th className="border p-2">GST Amount</th>
              <th className="border p-2">Further Tax</th>
              <th className="border p-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td className="border p-2 text-center">{i + 1}</td>
                <td className="border p-2">{item.hsCode || "N/A"}</td>
                <td className="border p-2">{item.description}</td>
                <td className="border p-2 text-center">{item.quantity}</td>
                <td className="border p-2">{item.uom}</td>
                <td className="border p-2 text-right">{item.pricePerUnit?.toFixed(2) || '-'}</td>
                <td className="border p-2 text-right">{item.valueExclST.toFixed(2)}</td>
                <td className="border p-2 text-center">{item.taxRate}%</td>
                <td className="border p-2 text-right">{item.taxAmount.toFixed(2)}</td>
                <td className="border p-2 text-right">0.00</td>
                <td className="border p-2 text-right">{(item.valueExclST + item.taxAmount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-6">
            <Image
              src="/fbr-logo.png"
              alt="FBR Digital Invoicing Logo"
              width={100}
              height={100}
              className="object-contain"
            />
            {response?.qrCode ? (
              <img
                src={response.qrCode}
                alt="FBR QR Code"
                className="w-32 h-32 object-contain"
              />
            ) : (
              <div className="w-32 h-32 bg-gray-200 flex items-center justify-center text-xs text-gray-600 border">
                QR Code (Sandbox mein nahi milta)
              </div>
            )}
          </div>

          <div className="text-right text-sm">
            <p>Total (excl. tax): Rs {totalExcl.toFixed(2)}</p>
            <p>Total GST: Rs {totalTax.toFixed(2)}</p>
            <p>Total Further Tax: Rs 0.00</p>
            <p className="font-bold text-lg">Net Total: Rs {grandTotal.toFixed(2)}</p>
          </div>
        </div>

        <p className="text-xs text-center mt-2">
          Shop # 74 Kareem Center SADDAR, KARACHI, PAKISTAN | Contact: {seller.phone}
        </p>
      </div>
    </>
  );
}