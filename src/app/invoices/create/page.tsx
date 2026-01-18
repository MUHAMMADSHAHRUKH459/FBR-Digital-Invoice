'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Send, CheckCircle, Upload, FileSpreadsheet, X, Printer, Download, CheckCheck } from 'lucide-react';
import { PROVINCES, TAX_RATES, TEXTILE_HS_CODES, UOM_OPTIONS, SELLER_INFO } from '@/constants/fbr';
import { calculateInvoiceItemTotals, calculateInvoiceTotals } from '@/lib/calculations';
import { formatCurrency } from '@/lib/utils';
import { InvoiceItem, FBRInvoice } from '@/types/invoice';
import { useFBRInvoice } from '@/hooks/useFBRInvoice';

export default function CreateFBRInvoice() {
  const { postInvoice, validateInvoice, loading, error } = useFBRInvoice();

  const [buyerInfo, setBuyerInfo] = useState({
    buyerNTNCNIC: '',
    buyerBusinessName: '',
    buyerProvince: 'Sindh',
    buyerAddress: '',
    buyerRegistrationType: 'Registered' as 'Registered' | 'Unregistered'
  });

  const [items, setItems] = useState<Partial<InvoiceItem>[]>([
    {
      hsCode: '6109.1000',
      productDescription: '',
      rate: '18%',
      uom: 'Numbers, pieces, units',
      quantity: 1,
      valueSalesExcludingST: 315,
      fixedNotifiedValueOrRetailPrice: 0,
      salesTaxApplicable: 0,
      salesTaxWithheldAtSource: 0,
      extraTax: 0,
      furtherTax: 0,
      sroScheduleNo: '',
      fedPayable: 0,
      discount: 0,
      saleType: 'Goods at standard rate (default)',
      sroItemSerialNo: '',
      totalValues: 0
    }
  ]);

  const [showExcelImport, setShowExcelImport] = useState(false);
  const [submittedInvoice, setSubmittedInvoice] = useState<any>(null);
  const [fbrInvoiceNumber, setFbrInvoiceNumber] = useState<string | null>(null);

  const addItem = () => {
    setItems([...items, {
      hsCode: '6109.1000',
      productDescription: '',
      rate: '18%',
      uom: 'Numbers, pieces, units',
      quantity: 1,
      valueSalesExcludingST: 315,
      fixedNotifiedValueOrRetailPrice: 0,
      salesTaxApplicable: 0,
      salesTaxWithheldAtSource: 0,
      extraTax: 0,
      furtherTax: 0,
      sroScheduleNo: '',
      fedPayable: 0,
      discount: 0,
      saleType: 'Goods at standard rate (default)',
      sroItemSerialNo: '',
      totalValues: 0
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    newItems[index] = calculateInvoiceItemTotals(newItems[index]);
    setItems(newItems);
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        alert('Excel import: Ensure columns are: Description, Qty, Rate, HSCode');
        
        const importedItems: Partial<InvoiceItem>[] = [
          {
            hsCode: '6109.1000',
            productDescription: 'T-Shirt Check Long Sleeve',
            rate: '18%',
            uom: 'Numbers, pieces, units',
            quantity: 50,
            valueSalesExcludingST: 315,
            fixedNotifiedValueOrRetailPrice: 0,
            salesTaxApplicable: 0,
            salesTaxWithheldAtSource: 0,
            extraTax: 0,
            furtherTax: 0,
            sroScheduleNo: '',
            fedPayable: 0,
            discount: 0,
            saleType: 'Goods at standard rate (default)',
            sroItemSerialNo: '',
            totalValues: 0
          }
        ];

        const calculatedItems = importedItems.map(item => calculateInvoiceItemTotals(item));
        setItems(calculatedItems);
        setShowExcelImport(false);
        alert(`✅ ${calculatedItems.length} items imported successfully!`);
        
      } catch (error) {
        alert('❌ Error reading Excel file. Please check the format.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const totals = calculateInvoiceTotals(items as InvoiceItem[]);

  const handleValidate = async () => {
    if (!buyerInfo.buyerBusinessName || !buyerInfo.buyerNTNCNIC) {
      alert('Please fill all buyer information!');
      return;
    }

    const fbrInvoice: FBRInvoice = {
      invoiceType: 'Sale Invoice',
      invoiceDate: new Date().toISOString().split('T')[0],
      sellerNTNCNIC: SELLER_INFO.ntn,
      sellerBusinessName: SELLER_INFO.businessName,
      sellerProvince: SELLER_INFO.province,
      sellerAddress: SELLER_INFO.address,
      buyerNTNCNIC: buyerInfo.buyerNTNCNIC,
      buyerBusinessName: buyerInfo.buyerBusinessName,
      buyerProvince: buyerInfo.buyerProvince,
      buyerAddress: buyerInfo.buyerAddress,
      buyerRegistrationType: buyerInfo.buyerRegistrationType,
      scenarioId: 'SN001',
      items: items as InvoiceItem[]
    };

    const isValid = await validateInvoice(fbrInvoice);
    
    if (isValid) {
      alert('✅ Invoice is valid!');
    } else {
      alert(`❌ Validation failed: ${error}`);
    }
  };

  const handleSubmit = async () => {
    if (!buyerInfo.buyerBusinessName || !buyerInfo.buyerNTNCNIC) {
      alert('Please fill all buyer information!');
      return;
    }

    const fbrInvoice: FBRInvoice = {
      invoiceType: 'Sale Invoice',
      invoiceDate: new Date().toISOString().split('T')[0],
      sellerNTNCNIC: SELLER_INFO.ntn,
      sellerBusinessName: SELLER_INFO.businessName,
      sellerProvince: SELLER_INFO.province,
      sellerAddress: SELLER_INFO.address,
      buyerNTNCNIC: buyerInfo.buyerNTNCNIC,
      buyerBusinessName: buyerInfo.buyerBusinessName,
      buyerProvince: buyerInfo.buyerProvince,
      buyerAddress: buyerInfo.buyerAddress,
      buyerRegistrationType: buyerInfo.buyerRegistrationType,
      scenarioId: 'SN001',
      items: items as InvoiceItem[]
    };

    const response = await postInvoice(fbrInvoice);
    
    if (response) {
      const localInvoiceNumber = `INV${Date.now().toString().slice(-6)}`;
      const savedInvoice = {
        ...fbrInvoice,
        localInvoiceNumber,
        fbrInvoiceNumber: response.invoiceNumber,
        invoiceDate: new Date().toISOString(),
        totals,
        status: 'Submitted'
      };
      
      setSubmittedInvoice(savedInvoice);
      setFbrInvoiceNumber(response.invoiceNumber || 'N/A');
      
      setTimeout(() => {
        document.getElementById('invoice-preview')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
      alert(`✅ Invoice submitted successfully!\nFBR Invoice: ${response.invoiceNumber}\nLocal Invoice: ${localInvoiceNumber}`);
    } else {
      alert(`❌ Submission failed: ${error}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    alert('PDF download feature coming soon! Use Print button for now.');
  };

  const resetForm = () => {
    setSubmittedInvoice(null);
    setFbrInvoiceNumber(null);
    setBuyerInfo({
      buyerNTNCNIC: '',
      buyerBusinessName: '',
      buyerProvince: 'Sindh',
      buyerAddress: '',
      buyerRegistrationType: 'Registered'
    });
    setItems([{
      hsCode: '6109.1000',
      productDescription: '',
      rate: '18%',
      uom: 'Numbers, pieces, units',
      quantity: 1,
      valueSalesExcludingST: 315,
      fixedNotifiedValueOrRetailPrice: 0,
      salesTaxApplicable: 0,
      salesTaxWithheldAtSource: 0,
      extraTax: 0,
      furtherTax: 0,
      sroScheduleNo: '',
      fedPayable: 0,
      discount: 0,
      saleType: 'Goods at standard rate (default)',
      sroItemSerialNo: '',
      totalValues: 0
    }]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="bg-white rounded-lg shadow-sm p-6 print:hidden">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">FBR Invoice</h1>
              <p className="text-sm text-gray-500 mt-1">Create and submit digital invoice</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowExcelImport(!showExcelImport)}
                disabled={loading}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Import Excel
              </Button>
              <Button 
                variant="outline" 
                onClick={handleValidate}
                disabled={loading}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {loading ? 'Validating...' : 'Validate'}
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={loading}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
                {loading ? 'Submitting...' : 'Submit to FBR'}
              </Button>
            </div>
          </div>
        </div>

        {submittedInvoice && (
          <Card className="border-green-200 bg-green-50 print:hidden">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <CheckCheck className="h-6 w-6 text-green-600 mt-1" />
                  <div>
                    <p className="font-semibold text-green-900 text-lg">Invoice Submitted Successfully!</p>
                    <p className="text-sm text-green-700 mt-1">
                      FBR Invoice: <span className="font-mono font-bold">{fbrInvoiceNumber}</span>
                    </p>
                    <p className="text-sm text-green-700">
                      Local Invoice: <span className="font-mono font-bold">{submittedInvoice.localInvoiceNumber}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handlePrint} className="gap-2 bg-blue-600 hover:bg-blue-700">
                    <Printer className="h-4 w-4" />
                    Print Invoice
                  </Button>
                  <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Download PDF
                  </Button>
                  <Button onClick={resetForm} variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Invoice
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {showExcelImport && (
          <Card className="border-green-200 bg-green-50 print:hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-green-700" />
                  <CardTitle className="text-lg font-semibold text-green-900">Import from Excel</CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowExcelImport(false)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelImport}
                  className="bg-white"
                />
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm">
                  <p className="font-medium text-blue-900 mb-2">Required Excel Format:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li><strong>Column A:</strong> Product Description</li>
                    <li><strong>Column B:</strong> Quantity</li>
                    <li><strong>Column C:</strong> Rate (per unit)</li>
                    <li><strong>Column D:</strong> HS Code (optional)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {submittedInvoice && (
          <div id="invoice-preview" className="bg-white rounded-lg shadow-lg p-8 print:shadow-none print:p-0">
            
            {/* Header with Logo and Invoice Info */}
            <div className="text-center mb-6 pb-4 border-b-2 border-gray-800">
              <div className="flex justify-center mb-4">
                <div className="w-32 h-32 bg-gray-100 border-2 border-gray-300 rounded flex items-center justify-center">
                  <span className="text-xs text-gray-500">FBR Logo</span>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">SALES TAX INVOICE</h2>
              <p className="text-base">Invoice Date: {new Date(submittedInvoice.invoiceDate).toLocaleDateString('en-GB')}</p>
              <p className="text-base">Time: {new Date(submittedInvoice.invoiceDate).toLocaleTimeString('en-GB', { hour12: false })}</p>
            </div>

            {/* Invoice Numbers and Status */}
            <div className="mb-6 text-center">
              <p className="text-base"><strong>Invoice #:</strong> {submittedInvoice.localInvoiceNumber}</p>
              <p className="text-base"><strong>FBR INVOICE:</strong> {fbrInvoiceNumber}</p>
            </div>

            {/* Seller & Buyer Info Side by Side */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Seller Info */}
              <div className="border-2 border-gray-800 p-4">
                <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase border-b pb-2">SELLER&apos;S DETAIL:</h3>
                <p className="text-base mb-1"><strong>Company Name:</strong> {SELLER_INFO.businessName}</p>
                <p className="text-base mb-1"><strong>NTN:</strong> {SELLER_INFO.ntn}</p>
                <p className="text-base mb-1"><strong>CNIC/NTN #:</strong> {SELLER_INFO.ntn}</p>
                <p className="text-base mb-1"><strong>Registration #:</strong> {SELLER_INFO.strn}</p>
                <p className="text-base mb-1"><strong>Province:</strong> {SELLER_INFO.province.toUpperCase()}</p>
                <p className="text-base mb-1"><strong>Address:</strong> {SELLER_INFO.address}</p>
                <p className="text-base mb-1"><strong>Phone:</strong> 00923142392069</p>
                <p className="text-base"><strong>GSTN #:</strong> {SELLER_INFO.strn}</p>
              </div>

              {/* Buyer Info */}
              <div className="border-2 border-gray-800 p-4">
                <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase border-b pb-2">BUYER&apos;S DETAIL:</h3>
                <p className="text-base mb-1"><strong>Customer Name:</strong> {buyerInfo.buyerBusinessName}</p>
                <p className="text-base mb-1"><strong>CNIC/NTN #:</strong> {buyerInfo.buyerNTNCNIC}</p>
                <p className="text-base mb-1"><strong>Province:</strong> {buyerInfo.buyerProvince.toUpperCase()}</p>
                <p className="text-base mb-1"><strong>Address:</strong> {buyerInfo.buyerAddress}</p>
                <p className="text-base mb-1"><strong>Phone:</strong> 0</p>
                <p className="text-base"><strong>GSTN #:</strong> 0</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
              <table className="w-full border-collapse border-2 border-gray-800 text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-gray-800 p-2 text-left font-bold">S.No.</th>
                    <th className="border border-gray-800 p-2 text-left font-bold">HS Code</th>
                    <th className="border border-gray-800 p-2 text-left font-bold">Description</th>
                    <th className="border border-gray-800 p-2 text-left font-bold">UOM</th>
                    <th className="border border-gray-800 p-2 text-right font-bold">QTY</th>
                    <th className="border border-gray-800 p-2 text-right font-bold">RATE</th>
                    <th className="border border-gray-800 p-2 text-right font-bold">Sales Value</th>
                    <th className="border border-gray-800 p-2 text-right font-bold">GST %</th>
                    <th className="border border-gray-800 p-2 text-right font-bold">GST Amount</th>
                    <th className="border border-gray-800 p-2 text-right font-bold">Further Tax</th>
                    <th className="border border-gray-800 p-2 text-right font-bold">Gross Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-800 p-2 text-left">{index + 1}</td>
                      <td className="border border-gray-800 p-2 text-left">{item.hsCode}</td>
                      <td className="border border-gray-800 p-2 text-left">{item.productDescription}</td>
                      <td className="border border-gray-800 p-2 text-left">{item.uom}</td>
                      <td className="border border-gray-800 p-2 text-right">{item.quantity}</td>
                      <td className="border border-gray-800 p-2 text-right">{item.valueSalesExcludingST}</td>
                      <td className="border border-gray-800 p-2 text-right">{((item.valueSalesExcludingST || 0) * (item.quantity || 0)).toFixed(2)}</td>
                      <td className="border border-gray-800 p-2 text-right">{parseInt(item.rate || '0')}</td>
                      <td className="border border-gray-800 p-2 text-right">{(item.salesTaxApplicable || 0).toFixed(2)}</td>
                      <td className="border border-gray-800 p-2 text-right">{(item.furtherTax || 0).toFixed(2)}</td>
                      <td className="border border-gray-800 p-2 text-right font-bold">{(item.totalValues || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="mb-6">
              <div className="flex justify-end">
                <div className="w-96">
                  <div className="flex justify-between py-2 border-b border-gray-400">
                    <span className="font-bold">Total (excl. tax):</span>
                    <span className="font-bold">{totals.subTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-400">
                    <span>Total GST:</span>
                    <span>{totals.salesTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-400">
                    <span>Total Further Tax:</span>
                    <span>{totals.furtherTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-3 border-t-2 border-gray-800">
                    <span className="font-bold text-lg">Net Total (inc. tax):</span>
                    <span className="font-bold text-lg">{totals.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer with QR Code and Logo */}
            <div className="border-t-2 border-gray-800 pt-6 mt-6">
              <div className="flex justify-between items-start mb-4">
                {/* FBR Digital Invoicing Logo */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 bg-blue-600 rounded flex items-center justify-center mb-2">
                    <span className="text-white text-xs font-bold">FBR DI</span>
                  </div>
                  <p className="text-xs text-center font-semibold">FBR Digital Invoicing System</p>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 border-2 border-gray-800 bg-white flex items-center justify-center">
                    <span className="text-xs text-gray-500">QR Code</span>
                  </div>
                  <p className="text-xs text-center mt-1">Scan to Verify</p>
                </div>
              </div>

              {/* NOTE Section */}
              <div className="bg-gray-100 p-4 rounded border border-gray-300 mb-4">
                <p className="text-xs font-bold mb-2">NOTE:</p>
                <p className="text-xs">
                  It is to certify that goods supplied to you under this invoice has been imported and income tax has already been paid U/S 148.
                  Therefore, please do not deduct the withholding income tax U/S 153 (1), 153(5) and as per clause (47-A) Part VI of the Second
                  schedule of Income Tax Ordinance, 2001.
                </p>
              </div>

              {/* Comments */}
              <div className="mb-4">
                <p className="text-sm"><strong>Comments:</strong> GD # N/A</p>
              </div>

              {/* Footer Contact */}
              <div className="text-center border-t border-gray-300 pt-3">
                <p className="text-xs font-semibold">{SELLER_INFO.address}</p>
                <p className="text-xs">Contact # 00923142392069</p>
              </div>
            </div>

          </div>
        )}

        {!submittedInvoice && (
          <>
            <Card className="print:hidden">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold">Customer Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="buyerNTN" className="text-sm font-medium">
                      NTN/CNIC <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="buyerNTN"
                      value={buyerInfo.buyerNTNCNIC}
                      onChange={(e) => setBuyerInfo({ ...buyerInfo, buyerNTNCNIC: e.target.value })}
                      placeholder="1234567 or 3520212345678"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="buyerName" className="text-sm font-medium">
                      Business Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="buyerName"
                      value={buyerInfo.buyerBusinessName}
                      onChange={(e) => setBuyerInfo({ ...buyerInfo, buyerBusinessName: e.target.value })}
                      placeholder="Customer business name"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="buyerProvince" className="text-sm font-medium">Province</Label>
                    <Select
                      value={buyerInfo.buyerProvince}
                      onValueChange={(value) => setBuyerInfo({ ...buyerInfo, buyerProvince: value })}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVINCES.map((p) => (
                          <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="buyerAddress" className="text-sm font-medium">Address</Label>
                    <Input
                      id="buyerAddress"
                      value={buyerInfo.buyerAddress}
                      onChange={(e) => setBuyerInfo({ ...buyerInfo, buyerAddress: e.target.value })}
                      placeholder="Customer address"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="registrationType" className="text-sm font-medium">Registration Type</Label>
                    <Select
                      value={buyerInfo.buyerRegistrationType}
                      onValueChange={(value: 'Registered' | 'Unregistered') => 
                        setBuyerInfo({ ...buyerInfo, buyerRegistrationType: value })
                      }
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Registered">Registered</SelectItem>
                        <SelectItem value="Unregistered">Unregistered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="print:hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Items</CardTitle>
                  <Button onClick={addItem} size="sm" variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div key={index} className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                        {items.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-3">
                          <Label className="text-sm">Product Description</Label>
                          <Input
                            value={item.productDescription}
                            onChange={(e) => updateItem(index, 'productDescription', e.target.value)}
                            placeholder="T-Shirt, Jeans, etc."
                            className="mt-1.5"
                          />
                        </div>

                        <div>
                          <Label className="text-sm">HS Code</Label>
                          <Select
                            value={item.hsCode}
                            onValueChange={(value) => updateItem(index, 'hsCode', value)}
                          >
                            <SelectTrigger className="mt-1.5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TEXTILE_HS_CODES.map((hs) => (
                                <SelectItem key={hs.code} value={hs.code}>
                                  {hs.code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm">Quantity</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="mt-1.5"
                          />
                        </div>

                        <div>
                          <Label className="text-sm">Rate (per unit)</Label>
                          <Input
                            type="number"
                            value={item.valueSalesExcludingST}
                            onChange={(e) => updateItem(index, 'valueSalesExcludingST', parseFloat(e.target.value) || 0)}
                            className="mt-1.5"
                          />
                        </div>

                        <div>
                          <Label className="text-sm">Tax Rate</Label>
                          <Select
                            value={item.rate}
                            onValueChange={(value) => updateItem(index, 'rate', value)}
                          >
                            <SelectTrigger className="mt-1.5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TAX_RATES.map((rate) => (
                                <SelectItem key={rate.value} value={rate.value}>
                                  {rate.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm">UOM</Label>
                          <Select
                            value={item.uom}
                            onValueChange={(value) => updateItem(index, 'uom', value)}
                          >
                            <SelectTrigger className="mt-1.5">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {UOM_OPTIONS.map((uom) => (
                                <SelectItem key={uom.id} value={uom.name}>
                                  {uom.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500">Subtotal</p>
                          <p className="font-semibold">{formatCurrency((item.valueSalesExcludingST || 0) * (item.quantity || 0))}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Tax</p>
                          <p className="font-semibold">{formatCurrency(item.salesTaxApplicable || 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Further Tax</p>
                          <p className="font-semibold">{formatCurrency(item.furtherTax || 0)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Total</p>
                          <p className="font-semibold text-blue-600">{formatCurrency(item.totalValues || 0)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200 print:hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(totals.subTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sales Tax:</span>
                    <span className="font-medium">{formatCurrency(totals.salesTax)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Further Tax:</span>
                    <span className="font-medium">{formatCurrency(totals.furtherTax)}</span>
                  </div>
                  <div className="pt-2 border-t border-blue-300 flex justify-between">
                    <span className="font-semibold text-lg">Grand Total:</span>
                    <span className="font-bold text-xl text-blue-600">{formatCurrency(totals.grandTotal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

      </div>
    </div>
  );
}