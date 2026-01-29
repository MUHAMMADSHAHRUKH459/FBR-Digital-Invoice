"use client";

import { useState } from "react";
import ItemsTable from "@/components/ItemsTable";
import { buildInvoicePayload } from "@/lib/buildInvoicePayload";
import { validateInvoice, postInvoice } from "./actions";
import PrintInvoice from "@/components/PrintInvoice";
import { AlertCircle, CheckCircle, Printer, Send, FileText } from "lucide-react";

interface Item {
  hsCode: string;
  description: string;
  uom: string;
  quantity: number;
  pricePerUnit?: number;
  valueExclST: number;
  taxRate: number;
  taxAmount: number;
}

export default function InvoicePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [buyerNTNCNIC, setBuyerNTNCNIC] = useState("");
  const [buyerBusinessName, setBuyerBusinessName] = useState("");
  const [buyerProvince, setBuyerProvince] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [buyerRegistrationType, setBuyerRegistrationType] = useState<"Registered" | "Unregistered">("Registered");
  const [invoiceRefNo, setInvoiceRefNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [response, setResponse] = useState<any>(null);
  const [printData, setPrintData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const seller = {
    ntnCnic: "8985694",
    businessName: "AI Fashion",
    strn: "3277876229942",
    province: "Sindh",
    address: "Shop # 74 Kareem Center SADDAR, KARACHI",
    phone: "00923142392069"
  };

  const validateForm = () => {
    if (!buyerBusinessName.trim()) return "Buyer Business Name is required";
    if (!buyerProvince) return "Please select Buyer Province";
    if (!buyerAddress.trim()) return "Buyer Address is required";
    if (buyerRegistrationType === "Registered" && !buyerNTNCNIC.trim()) return "NTN/CNIC required for Registered buyer";
    if (items.length === 0) return "At least one item is required";
    return null;
  };

  const handleAction = async (action: "validate" | "post") => {
    const formError = validateForm();
    if (formError) return setError(formError);

    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const payload = buildInvoicePayload({
        seller,
        buyer: {
          ntnCnic: buyerNTNCNIC.trim(),
          businessName: buyerBusinessName.trim(),
          province: buyerProvince.trim(),
          address: buyerAddress.trim(),
          registrationType: buyerRegistrationType
        },
        invoiceDate,
        invoiceRefNo: invoiceRefNo.trim(),
        items
      });
      
      const res = action === "validate" ? await validateInvoice(payload) : await postInvoice(payload);
      setResponse(res);
      if (action === "post" && res.success) setPrintData(res.data);
    } catch (err: any) {
      setError(err.message || `${action === "validate" ? "Validation" : "Posting"} failed`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center py-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-md">
          <div className="flex items-center justify-center gap-4 mb-4">
            <FileText className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-blue-900">FBR Digital Invoice</h1>
          </div>
          <p className="text-blue-700 font-medium">Create, Validate, and Submit Invoices to FBR Pakistan</p>
          <div className="mt-4 inline-flex items-center gap-2 px-6 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold shadow-inner">
            Seller: {seller.businessName} • NTN: {seller.ntnCnic}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Seller Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-blue-100">
              <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                  <div className="h-3 w-3 bg-blue-600 rounded-full"></div>
                  Seller Information
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  {Object.entries(seller).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <p className="text-blue-600 font-semibold capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Buyer Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-green-100">
              <div className="px-6 py-4 bg-green-50 border-b border-green-100">
                <h2 className="text-xl font-bold text-green-900 flex items-center gap-2">
                  <div className="h-3 w-3 bg-green-600 rounded-full"></div>
                  Buyer Information
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="buyerBusinessName" className="block text-sm font-medium text-gray-700">
                      Business Name
                    </label>
                    <input
                      id="buyerBusinessName"
                      value={buyerBusinessName}
                      onChange={(e) => setBuyerBusinessName(e.target.value)}
                      placeholder="Enter business name"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow hover:shadow-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="buyerNTNCNIC" className="block text-sm font-medium text-gray-700">
                      CNIC/NTN {buyerRegistrationType === "Registered" && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      id="buyerNTNCNIC"
                      value={buyerNTNCNIC}
                      onChange={(e) => setBuyerNTNCNIC(e.target.value)}
                      placeholder="Enter CNIC or NTN"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow hover:shadow-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="buyerProvince" className="block text-sm font-medium text-gray-700">
                      Province
                    </label>
                    <select
                      id="buyerProvince"
                      value={buyerProvince}
                      onChange={(e) => setBuyerProvince(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white transition-shadow hover:shadow-md"
                    >
                      <option value="">Select province</option>
                      {["Sindh", "Punjab", "KPK", "Balochistan", "Islamabad"].map((prov) => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="buyerRegistrationType" className="block text-sm font-medium text-gray-700">
                      Registration Type
                    </label>
                    <select
                      id="buyerRegistrationType"
                      value={buyerRegistrationType}
                      onChange={(e) => setBuyerRegistrationType(e.target.value as "Registered" | "Unregistered")}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white transition-shadow hover:shadow-md"
                    >
                      <option value="Registered">Registered</option>
                      <option value="Unregistered">Unregistered</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label htmlFor="buyerAddress" className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <input
                      id="buyerAddress"
                      value={buyerAddress}
                      onChange={(e) => setBuyerAddress(e.target.value)}
                      placeholder="Enter complete address"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-shadow hover:shadow-md"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice Details Card */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-purple-100">
              <div className="px-6 py-4 bg-purple-50 border-b border-purple-100">
                <h2 className="text-xl font-bold text-purple-900 flex items-center gap-2">
                  <div className="h-3 w-3 bg-purple-600 rounded-full"></div>
                  Invoice Details
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="invoiceDate" className="block text-sm font-medium text-gray-700">
                      Invoice Date
                    </label>
                    <input
                      id="invoiceDate"
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow hover:shadow-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="invoiceRefNo" className="block text-sm font-medium text-gray-700">
                      Reference No
                    </label>
                    <input
                      id="invoiceRefNo"
                      value={invoiceRefNo}
                      onChange={(e) => setInvoiceRefNo(e.target.value)}
                      placeholder="INV-001 (optional)"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow hover:shadow-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Invoice Type</label>
                    <input 
                      value="Sale Invoice" 
                      disabled 
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <div className="h-3 w-3 bg-gray-600 rounded-full"></div>
                    Items
                  </h2>
                  <div className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium shadow-inner">
                    {items.length} items
                  </div>
                </div>
              </div>
              <div className="p-6">
                <ItemsTable items={items} setItems={setItems} />
              </div>
            </div>
          </div>

          {/* Right Column - Actions & Status */}
          <div className="space-y-8">
            {/* Actions Panel */}
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Actions</h3>
              <div className="space-y-4">
                <button
                  onClick={() => handleAction("validate")}
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-white transition-shadow ${
                    loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
                  }`}
                >
                  <CheckCircle className="h-5 w-5" />
                  {loading ? "Validating..." : "Validate Invoice"}
                </button>

                <button
                  onClick={() => handleAction("post")}
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-white transition-shadow ${
                    loading ? "bg-green-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700 hover:shadow-lg"
                  }`}
                >
                  <Send className="h-5 w-5" />
                  {loading ? "Posting..." : "Post to FBR"}
                </button>

                <button
                  onClick={() => window.print()}
                  disabled={ !printData || loading }
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-shadow ${
                    !printData || loading 
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                      : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg"
                  }`}
                >
                  <Printer className="h-5 w-5" />
                  Print Invoice
                </button>

                <div className="pt-6 border-t border-gray-100">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Total Items</span>
                      <span className="font-bold">{items.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Total Value</span>
                      <span className="font-bold text-green-600">
                        Rs {items.reduce((sum, item) => sum + item.valueExclST, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Total Tax</span>
                      <span className="font-bold text-red-600">
                        Rs {items.reduce((sum, item) => sum + item.taxAmount, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-md">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="text-red-700 text-sm">{error}</div>
                </div>
              </div>
            )}

            {/* Response Display */}
            {response && (
              <div className={`bg-white rounded-2xl border shadow-lg ${
                response.success ? "border-green-200" : "border-red-200"
              } overflow-hidden`}>
                <div className={`px-6 py-4 ${
                  response.success ? "bg-green-50" : "bg-red-50"
                } border-b`}>
                  <h3 className={`text-lg font-bold flex items-center gap-2 ${
                    response.success ? "text-green-900" : "text-red-900"
                  }`}>
                    {response.success ? (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        Success Response
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5" />
                        Error Response
                      </>
                    )}
                  </h3>
                </div>
                <div className="p-6">
                  <pre className="text-xs bg-gray-50 p-4 rounded-xl overflow-auto max-h-60 border border-gray-200 shadow-inner">
                    {JSON.stringify(response, null, 2)}
                  </pre>
                  
                  {response.success && response.data?.qrCode && (
                    <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">FBR QR Code</h4>
                      <img
                        src={response.data.qrCode}
                        alt="FBR QR Code"
                        className="mx-auto max-w-[200px] border-2 border-gray-300 rounded-xl shadow-xl p-2 bg-white"
                      />
                      <p className="mt-4 text-sm text-gray-600">Scan to verify on FBR portal</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden Print Area */}
      {printData && (
        <div className="hidden print:block">
          <PrintInvoice
            seller={seller}
            buyer={{
              businessName: buyerBusinessName,
              ntnCnic: buyerNTNCNIC,
              province: buyerProvince,
              address: buyerAddress,
              phone: "N/A"
            }}
            invoiceDate={invoiceDate}
            invoiceRefNo={invoiceRefNo || `INV-${Date.now()}`}
            items={items}
            response={printData}
          />
        </div>
      )}
    </div>
  );
}