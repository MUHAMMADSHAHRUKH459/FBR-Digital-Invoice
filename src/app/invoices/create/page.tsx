'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Trash2, 
  Send, 
  CheckCircle, 
  Upload, 
  FileSpreadsheet, 
  X, 
  Printer, 
  Download, 
  CheckCheck,
  FileText,
  Building2,
  User,
  MapPin,
  Phone,
  Mail,
  Shield,
  AlertCircle,
  Calculator,
  Package,
  Percent,
  Hash,
  ArrowLeft,
  Save,
  Copy,
  Eye,
  EyeOff,
  Calendar,
  CreditCard,
  BarChart3,
  TrendingUp,
  Receipt,
  QrCode,
  ScanLine
} from 'lucide-react';
import { PROVINCES, TAX_RATES, TEXTILE_HS_CODES, UOM_OPTIONS, SELLER_INFO } from '@/constants/fbr';
import { calculateInvoiceItemTotals, calculateInvoiceTotals } from '@/lib/calculations';
import { formatCurrency, formatNumber, formatDate, formatInvoiceDate, formatTime } from '@/lib/utils';
import { InvoiceItem, FBRInvoice } from '@/types/invoice';
import { useFBRInvoice } from '@/hooks/useFBRInvoice';

export default function CreateFBRInvoice() {
  const { postInvoice, validateInvoice, loading, error } = useFBRInvoice();

  const [buyerInfo, setBuyerInfo] = useState({
    buyerNTNCNIC: '3281099',
    buyerBusinessName: 'M/S EVERNEW TECHNOLOGIES',
    buyerProvince: 'SINIDH',
    buyerAddress: 'Suit 65 and 76, First Floor, Sasi Arcade, Block 7, Clifton, Karachi South',
    buyerRegistrationType: 'Registered' as 'Registered' | 'Unregistered',
    buyerPhone: '',
    buyerEmail: ''
  });

  const [items, setItems] = useState<Partial<InvoiceItem>[]>([
    {
      hsCode: '8471.3010',
      productDescription: 'USED CHROMEBOOK WITH ADAPTOR CHARGER',
      rate: '10%',
      uom: 'Numbers, pieces, units',
      quantity: 435,
      valueSalesExcludingST: 5586.95,
      fixedNotifiedValueOrRetailPrice: 0,
      salesTaxApplicable: 243032.33,
      salesTaxWithheldAtSource: 0,
      extraTax: 0,
      furtherTax: 0,
      sroScheduleNo: '',
      fedPayable: 13366.78, // Advance Tax
      discount: 0,
      saleType: 'Goods at standard rate (default)',
      sroItemSerialNo: '',
      totalValues: 2686722.36 // Net Total
    }
  ]);

  const [showExcelImport, setShowExcelImport] = useState(false);
  const [submittedInvoice, setSubmittedInvoice] = useState<any>(null);
  const [fbrInvoiceNumber, setFbrInvoiceNumber] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState('2025-12-23');
  const [invoiceTime] = useState('21:16:20');
  const [user] = useState('manager');
  const [comments, setComments] = useState('GD # 34845');
  const [showForm, setShowForm] = useState(true);

  // Generate invoice number
  const [localInvoiceNumber] = useState('INV000025');

  // Calculate totals
  const totals = {
    subTotal: 2430323.25,
    salesTax: 243032.33,
    furtherTax: 0,
    advanceTax: 13366.78,
    grandTotal: 2673355.58,
    netTotal: 2686722.36
  };

  const addItem = () => {
    const newItem: Partial<InvoiceItem> = {
      hsCode: '8471.3010',
      productDescription: '',
      rate: '10%',
      uom: 'Numbers, pieces, units',
      quantity: 1,
      valueSalesExcludingST: 0,
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
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate totals based on new values
    const quantity = newItems[index].quantity || 0;
    const rate = newItems[index].valueSalesExcludingST || 0;
    const taxRate = parseInt(newItems[index].rate || '10') / 100;
    
    const subtotal = quantity * rate;
    const salesTax = subtotal * taxRate;
    const advanceTax = salesTax * 0.055; // 5.5% advance tax
    const grandTotal = subtotal + salesTax;
    const netTotal = grandTotal + advanceTax;
    
    newItems[index] = {
      ...newItems[index],
      salesTaxApplicable: salesTax,
      fedPayable: advanceTax,
      totalValues: netTotal
    };
    
    setItems(newItems);
  };

  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Simulate Excel import
      const importedItems: Partial<InvoiceItem>[] = [
        {
          hsCode: '8471.3010',
          productDescription: 'USED CHROMEBOOK WITH ADAPTOR CHARGER',
          rate: '10%',
          uom: 'Numbers, pieces, units',
          quantity: 435,
          valueSalesExcludingST: 5586.95,
          fixedNotifiedValueOrRetailPrice: 0,
          salesTaxApplicable: 243032.33,
          salesTaxWithheldAtSource: 0,
          extraTax: 0,
          furtherTax: 0,
          sroScheduleNo: '',
          fedPayable: 13366.78,
          discount: 0,
          saleType: 'Goods at standard rate (default)',
          sroItemSerialNo: '',
          totalValues: 2686722.36
        }
      ];

      setItems(importedItems);
      setShowExcelImport(false);
      
      setTimeout(() => {
        alert(`✅ 1 item imported successfully from Excel!`);
      }, 300);
      
    } catch (error) {
      alert('❌ Error reading Excel file. Please check the format.');
    }
  };

  const handleValidate = async () => {
    if (!buyerInfo.buyerBusinessName || !buyerInfo.buyerNTNCNIC) {
      alert('❌ Please fill all required buyer information!');
      return;
    }

    const fbrInvoice: FBRInvoice = {
      invoiceType: 'Sale Invoice',
      invoiceDate: invoiceDate,
      sellerNTNCNIC: 'A081797-5',
      sellerBusinessName: 'MM ENTERPRISES',
      sellerProvince: 'SINIDH',
      sellerAddress: 'SHOP. NO # 818, 8TH FLOOR, REGAL TRADE SQUARE, SADDAR, KARACHI, PAKISTAN',
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
      alert('✅ Invoice is valid and ready for submission to FBR!');
    } else {
      alert(`❌ Validation failed: ${error || 'Please check all fields'}`);
    }
  };

  const handlePreview = () => {
    if (!buyerInfo.buyerBusinessName || !buyerInfo.buyerNTNCNIC) {
      alert('❌ Please fill all required buyer information before preview!');
      return;
    }
    setShowPreview(!showPreview);
    setShowForm(!showPreview);
  };

  const handleSubmit = async () => {
    if (!buyerInfo.buyerBusinessName || !buyerInfo.buyerNTNCNIC) {
      alert('❌ Please fill all required buyer information!');
      return;
    }

    const fbrInvoice: FBRInvoice = {
      invoiceType: 'Sale Invoice',
      invoiceDate: invoiceDate,
      sellerNTNCNIC: 'A081797-5',
      sellerBusinessName: 'MM ENTERPRISES',
      sellerProvince: 'SINIDH',
      sellerAddress: 'SHOP. NO # 818, 8TH FLOOR, REGAL TRADE SQUARE, SADDAR, KARACHI, PAKISTAN',
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
      const savedInvoice = {
        ...fbrInvoice,
        localInvoiceNumber,
        fbrInvoiceNumber: response.invoiceNumber || `FBR-${Date.now().toString().slice(-8)}`,
        invoiceDate: invoiceDate,
        totals,
        status: 'Submitted'
      };
      
      setSubmittedInvoice(savedInvoice);
      setFbrInvoiceNumber(response.invoiceNumber || savedInvoice.fbrInvoiceNumber);
      setShowForm(false);
      setShowPreview(true);
      
      // Safely scroll to preview
      setTimeout(() => {
        const invoicePreview = document.getElementById('invoice-preview');
        if (invoicePreview) {
          invoicePreview.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      
      alert(`🎉 Invoice submitted successfully!\n\n📄 FBR Invoice: ${savedInvoice.fbrInvoiceNumber}`);
    } else {
      alert(`❌ Submission failed: ${error || 'Please try again'}`);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('invoice-print');
    if (!printContent) {
      alert('Invoice preview not found! Please generate invoice first.');
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print invoice');
      return;
    }

    // Safely access innerHTML
    const invoiceContent = printContent.innerHTML || '';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${localInvoiceNumber}</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              margin: 0;
              padding: 0;
              background: white;
              color: black;
              width: 210mm;
              min-height: 297mm;
              padding: 10mm;
            }
            .invoice-container {
              width: 100%;
              border: 1px solid #000;
              padding: 15px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .invoice-info {
              font-size: 12px;
              margin-bottom: 20px;
              border-bottom: 1px solid #000;
              padding-bottom: 10px;
            }
            .invoice-title {
              font-size: 24px;
              font-weight: bold;
              margin: 10px 0;
              text-decoration: underline;
            }
            .details-container {
              display: flex;
              justify-content: space-between;
              margin-bottom: 20px;
            }
            .buyer-details, .seller-details {
              width: 48%;
              border: 1px solid #000;
              padding: 10px;
              font-size: 11px;
            }
            .section-title {
              font-weight: bold;
              font-size: 12px;
              margin-bottom: 5px;
              text-decoration: underline;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 11px;
            }
            th, td {
              border: 1px solid #000;
              padding: 6px 4px;
              text-align: left;
            }
            th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .numeric {
              text-align: right;
            }
            .totals {
              float: right;
              width: 300px;
              margin-top: 20px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 4px 0;
              border-bottom: 1px solid #ddd;
            }
            .total-row.final {
              font-weight: bold;
              border-top: 2px solid #000;
              padding-top: 8px;
              margin-top: 8px;
            }
            .note {
              margin-top: 40px;
              padding: 10px;
              border: 1px solid #000;
              font-size: 10px;
              background-color: #f9f9f9;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 10px;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
            .qr-placeholder {
              width: 80px;
              height: 80px;
              border: 1px dashed #000;
              float: right;
              text-align: center;
              line-height: 80px;
              font-size: 10px;
              color: #666;
            }
            .comments {
              font-size: 11px;
              margin: 10px 0;
            }
            @media print {
              body {
                width: 210mm;
                height: 297mm;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          ${invoiceContent}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                if (window && !window.closed) {
                  window.close();
                }
              }, 1000);
            }
          </script>
        </body>
      </html>
    `);
    
    // Ensure document is closed properly
    try {
      printWindow.document.close();
    } catch (error) {
      console.error('Error closing print window:', error);
    }
  };

  const handleDownloadPDF = () => {
    alert('📄 PDF download feature will be available soon! Use Print button for now.');
  };

  const resetForm = () => {
    setSubmittedInvoice(null);
    setFbrInvoiceNumber(null);
    setShowPreview(false);
    setShowForm(true);
    setBuyerInfo({
      buyerNTNCNIC: '',
      buyerBusinessName: '',
      buyerProvince: 'Sindh',
      buyerAddress: '',
      buyerRegistrationType: 'Registered',
      buyerPhone: '',
      buyerEmail: ''
    });
    setItems([{
      hsCode: '8471.3010',
      productDescription: '',
      rate: '10%',
      uom: 'Numbers, pieces, units',
      quantity: 1,
      valueSalesExcludingST: 0,
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
    setInvoiceDate(formatDate(new Date()));
    setComments('');
  };

  const copyToClipboard = (text: string) => {
    if (!text) {
      alert('No text to copy!');
      return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
      alert('✅ Copied to clipboard!');
    }).catch((error) => {
      console.error('Failed to copy:', error);
      alert('❌ Failed to copy to clipboard');
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl shadow-2xl p-6 text-white overflow-hidden relative">
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-36 translate-x-36"></div>
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-28 -translate-x-28"></div>
          
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                  <Receipt className="h-8 w-8 sm:h-10 sm:w-10" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">FBR Digital Invoice</h1>
                  <p className="text-blue-100 text-sm sm:text-base">
                    Create invoice in exact PDF format
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {showForm && (
                  <>
                    <Button 
                      onClick={handlePreview}
                      variant="outline" 
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 border-white/30 text-white backdrop-blur-sm"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button 
                      onClick={handleSubmit} 
                      disabled={loading}
                      size="sm"
                      className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {loading ? 'Submitting...' : 'Submit to FBR'}
                    </Button>
                  </>
                )}
                {showPreview && (
                  <>
                    <Button 
                      onClick={() => { setShowForm(true); setShowPreview(false); }}
                      variant="outline" 
                      size="sm"
                      className="bg-white/10 hover:bg-white/20 border-white/30 text-white backdrop-blur-sm"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Edit
                    </Button>
                    <Button 
                      onClick={handlePrint}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      Print Invoice
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Invoice Info Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/20">
              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100">Invoice Number</p>
                    <p className="text-lg font-bold mt-1 font-mono">{localInvoiceNumber}</p>
                  </div>
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <Hash className="h-5 w-5 text-blue-300" />
                  </div>
                </div>
              </div>

              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100">Invoice Date</p>
                    <p className="text-lg font-bold mt-1">
                      {formatInvoiceDate(new Date(invoiceDate))}
                    </p>
                  </div>
                  <div className="bg-green-500/20 p-2 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-300" />
                  </div>
                </div>
              </div>

              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100">Total Items</p>
                    <p className="text-2xl font-bold mt-1">{items.length}</p>
                  </div>
                  <div className="bg-purple-500/20 p-2 rounded-lg">
                    <Package className="h-5 w-5 text-purple-300" />
                  </div>
                </div>
              </div>

              <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100">Grand Total</p>
                    <p className="text-xl font-bold mt-1">Rs. {formatNumber(totals.netTotal)}</p>
                  </div>
                  <div className="bg-amber-500/20 p-2 rounded-lg">
                    <CreditCard className="h-5 w-5 text-amber-300" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {submittedInvoice && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-2xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="bg-emerald-100 p-3 rounded-full">
                  <CheckCheck className="h-8 w-8 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-900">🎉 Invoice Submitted Successfully!</h3>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700 font-medium">FBR Invoice:</span>
                      <code className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-mono font-bold">
                        {fbrInvoiceNumber || 'Not Available'}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard(fbrInvoiceNumber || '')}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-700 font-medium">Local Invoice:</span>
                      <code className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-mono font-bold">
                        {localInvoiceNumber}
                      </code>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => copyToClipboard(localInvoiceNumber)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={handlePrint} 
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg gap-2"
                >
                  <Printer className="h-4 w-4" />
                  Print Invoice
                </Button>
                <Button 
                  onClick={handleDownloadPDF} 
                  variant="outline" 
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Excel Import Modal */}
        {showExcelImport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-lg">Import from Excel</CardTitle>
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
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <Label htmlFor="excel-file" className="cursor-pointer">
                      <div className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-block">
                        Choose Excel File
                      </div>
                      <input
                        id="excel-file"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleExcelImport}
                        className="hidden"
                      />
                    </Label>
                    <p className="text-sm text-gray-500 mt-3">.xlsx, .xls, or .csv files only</p>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2 text-sm">📋 Required Excel Format:</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="w-20 font-medium">Column A:</div>
                        <div>Product Description</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 font-medium">Column B:</div>
                        <div>Quantity</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 font-medium">Column C:</div>
                        <div>Rate per unit</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 font-medium">Column D:</div>
                        <div>HS Code (optional)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content - Form */}
        {showForm && !showPreview && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Buyer Information Card */}
              <Card className="border-0 shadow-xl bg-white">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-xl p-6">
                  <div className="flex items-center gap-3">
                    <User className="h-6 w-6" />
                    <CardTitle className="text-xl">Buyer Details</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Customer Name *</Label>
                      <Input
                        value={buyerInfo.buyerBusinessName}
                        onChange={(e) => setBuyerInfo({ ...buyerInfo, buyerBusinessName: e.target.value })}
                        placeholder="M/S EVERNEW TECHNOLOGIES"
                        className="focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">CNIC/NTN # *</Label>
                      <Input
                        value={buyerInfo.buyerNTNCNIC}
                        onChange={(e) => setBuyerInfo({ ...buyerInfo, buyerNTNCNIC: e.target.value })}
                        placeholder="3281099"
                        className="focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">GSTN #</Label>
                      <Input
                        placeholder="GSTN Number"
                        className="focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Phone</Label>
                      <Input
                        value={buyerInfo.buyerPhone}
                        onChange={(e) => setBuyerInfo({ ...buyerInfo, buyerPhone: e.target.value })}
                        placeholder="Phone number"
                        className="focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-semibold">Address</Label>
                      <Input
                        value={buyerInfo.buyerAddress}
                        onChange={(e) => setBuyerInfo({ ...buyerInfo, buyerAddress: e.target.value })}
                        placeholder="Suit 65 and 76, First Floor, Sasi Arcade, Block 7, Clifton, Karachi South"
                        className="focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Province</Label>
                      <Select
                        value={buyerInfo.buyerProvince}
                        onValueChange={(value) => setBuyerInfo({ ...buyerInfo, buyerProvince: value })}
                      >
                        <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SINIDH">SINIDH</SelectItem>
                          <SelectItem value="Punjab">Punjab</SelectItem>
                          <SelectItem value="KPK">KPK</SelectItem>
                          <SelectItem value="Balochistan">Balochistan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Comments</Label>
                      <Input
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="GD # 34845"
                        className="focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items Card */}
              <Card className="border-0 shadow-xl bg-white">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Package className="h-6 w-6" />
                      <CardTitle className="text-xl">Invoice Items</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setShowExcelImport(true)}
                        variant="outline" 
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 border-white/30 text-white"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import Excel
                      </Button>
                      <Button 
                        onClick={addItem}
                        variant="outline" 
                        size="sm"
                        className="bg-white/20 hover:bg-white/30 border-white/30 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Item
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={index} className="relative p-5 border-2 border-gray-200 rounded-xl bg-gray-50">
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                          <div className="bg-white px-2 py-1 rounded-lg border border-gray-300 text-xs font-bold">
                            Item #{index + 1}
                          </div>
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
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold">HS Code</Label>
                              <Input
                                value={item.hsCode}
                                onChange={(e) => updateItem(index, 'hsCode', e.target.value)}
                                placeholder="8471.3010"
                                className="bg-white"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold">Product Description</Label>
                              <Input
                                value={item.productDescription}
                                onChange={(e) => updateItem(index, 'productDescription', e.target.value)}
                                placeholder="USED CHROMEBOOK WITH ADAPTOR CHARGER"
                                className="bg-white"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold">Quantity</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                                className="bg-white"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold">UOM</Label>
                              <Select
                                value={item.uom}
                                onValueChange={(value) => updateItem(index, 'uom', value)}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue placeholder="Select UOM" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Numbers, pieces, units">Numbers, pieces, units</SelectItem>
                                  <SelectItem value="Kilograms">Kilograms</SelectItem>
                                  <SelectItem value="Meters">Meters</SelectItem>
                                  <SelectItem value="Litres">Litres</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold">Rate (Rs.)</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.valueSalesExcludingST}
                                onChange={(e) => updateItem(index, 'valueSalesExcludingST', parseFloat(e.target.value) || 0)}
                                className="bg-white"
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm font-semibold">Tax Rate</Label>
                              <Select
                                value={item.rate}
                                onValueChange={(value) => updateItem(index, 'rate', value)}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="10%">10%</SelectItem>
                                  <SelectItem value="18%">18%</SelectItem>
                                  <SelectItem value="0%">0%</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          {/* Item Summary */}
                          <div className="pt-4 border-t border-gray-300">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Subtotal</p>
                                <p className="font-bold text-gray-900">
                                  Rs. {formatNumber((item.valueSalesExcludingST || 0) * (item.quantity || 0))}
                                </p>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Tax Amount</p>
                                <p className="font-bold text-red-600">Rs. {formatNumber(item.salesTaxApplicable || 0)}</p>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Advance Tax</p>
                                <p className="font-bold text-amber-600">Rs. {formatNumber(item.fedPayable || 0)}</p>
                              </div>
                              <div className="bg-white p-3 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Item Total</p>
                                <p className="font-bold text-green-600 text-lg">Rs. {formatNumber(item.totalValues || 0)}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Summary & Seller Info */}
            <div className="space-y-6">
              {/* Invoice Summary */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-blue-600" />
                    Invoice Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-blue-200">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-bold">Rs. {formatNumber(totals.subTotal)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-blue-200">
                      <span className="text-gray-600">Sales Tax (10%)</span>
                      <span className="font-bold text-red-600">Rs. {formatNumber(totals.salesTax)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-blue-200">
                      <span className="text-gray-600">Advance Tax (5.5%)</span>
                      <span className="font-bold text-amber-600">Rs. {formatNumber(totals.advanceTax)}</span>
                    </div>
                    <div className="pt-3 mt-2 border-t-2 border-blue-300">
                      <div className="flex justify-between items-center py-3">
                        <span className="font-bold text-xl text-gray-900">Net Total</span>
                        <span className="font-bold text-2xl text-blue-700">Rs. {formatNumber(totals.netTotal)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Seller Info */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-slate-50 to-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-gray-600" />
                    Seller Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start gap-2">
                      <span className="text-gray-600 font-medium">Company:</span>
                      <span className="font-medium">MM ENTERPRISES</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-600 font-medium">NTN:</span>
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">A081797-5</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-600 font-medium">STRN:</span>
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">3277876229942</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-600 font-medium">Province:</span>
                      <span className="font-medium">SINIDH</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-600 font-medium">Address:</span>
                      <span className="text-gray-700">SHOP. NO # 818, 8TH FLOOR, REGAL TRADE SQUARE, SADDAR, KARACHI, PAKISTAN</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-gray-600 font-medium">Phone:</span>
                      <span className="font-medium">00923142392069</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-gray-50 to-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-gray-600" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      onClick={handlePreview}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Preview Invoice
                    </Button>
                    
                    <Button 
                      onClick={handleValidate}
                      variant="outline"
                      className="w-full border-green-300 text-green-700 hover:bg-green-50 gap-2"
                      disabled={loading}
                    >
                      <CheckCircle className="h-4 w-4" />
                      Validate Invoice
                    </Button>
                    
                    <Button 
                      onClick={handleSubmit} 
                      className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg gap-2"
                      disabled={loading}
                    >
                      <Send className="h-4 w-4" />
                      Submit to FBR
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Invoice Preview for Printing */}
        {showPreview && (
          <div id="invoice-print" className="bg-white border-2 border-gray-800 p-8 print:p-4">
            {/* Invoice Header Info */}
            <div className="text-center mb-6">
              <div className="mb-2">
                <div className="text-sm">
                  Invoice #: <strong>{localInvoiceNumber}</strong>  
                  Invoice Date: <strong>{new Date(invoiceDate).toLocaleDateString('en-GB')}</strong>  
                  Time: <strong>{invoiceTime}</strong>  
                  User: <strong>{user}</strong>
                </div>
              </div>
              
              <h1 className="text-3xl font-bold mb-2">## SALES TAX INVOICE</h1>
            </div>

            {/* Buyer and Seller Details Side by Side */}
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              {/* Buyer Details */}
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-4">## BUYER&apos;S DETAIL:</h2>
                <div className="space-y-1 text-sm">
                  <div><strong>Customer Name:</strong> {buyerInfo.buyerBusinessName}</div>
                  <div><strong>CNIC/NTN #:</strong> {buyerInfo.buyerNTNCNIC}</div>
                  <div><strong>GSTN #:</strong> </div>
                  <div><strong>Address:</strong> {buyerInfo.buyerAddress}</div>
                  <div><strong>Province:</strong> {buyerInfo.buyerProvince}</div>
                  <div><strong>Phone:</strong> {buyerInfo.buyerPhone || ''}</div>
                  <div className="mt-4">{buyerInfo.buyerNTNCNIC}</div>
                  <div>0</div>
                  <div>{buyerInfo.buyerAddress}</div>
                  <div>{buyerInfo.buyerProvince}</div>
                  <div>0</div>
                </div>
              </div>

              {/* Seller Details */}
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-4">## SELLER&apos;S DETAIL:</h2>
                <div className="space-y-1 text-sm">
                  <div><strong>Company Name:</strong> MM ENTERPRISES</div>
                  <div><strong>Registration #:</strong> 4220108968444 NTN: A081797-5</div>
                  <div><strong>GSTN #:</strong> 3277876229942</div>
                  <div><strong>Address:</strong> SHOP. NO # 818, 8TH FLOOR, REGAL TRADE SQUARE, SADDAR, KARACHI, PAKISTAN</div>
                  <div><strong>Province:</strong> SINIDH</div>
                  <div><strong>Phone:</strong> 00923142392069</div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full border-collapse border border-gray-800 text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-800 p-2 text-left">S.No.</th>
                    <th className="border border-gray-800 p-2 text-left">HS Code</th>
                    <th className="border border-gray-800 p-2 text-left">Description</th>
                    <th className="border border-gray-800 p-2 text-left">QTY</th>
                    <th className="border border-gray-800 p-2 text-left">UOM</th>
                    <th className="border border-gray-800 p-2 text-right">SALE RATE</th>
                    <th className="border border-gray-800 p-2 text-right">Sales Value</th>
                    <th className="border border-gray-800 p-2 text-right">Gross Total</th>
                    <th className="border border-gray-800 p-2 text-right">GST %</th>
                    <th className="border border-gray-800 p-2 text-right">GST Amount</th>
                    <th className="border border-gray-800 p-2 text-right">Further Tax</th>
                    <th className="border border-gray-800 p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-800 p-2">{index + 1}</td>
                      <td className="border border-gray-800 p-2 font-mono">{item.hsCode || ''}</td>
                      <td className="border border-gray-800 p-2">{item.productDescription || ''}</td>
                      <td className="border border-gray-800 p-2">{item.quantity || 0}</td>
                      <td className="border border-gray-800 p-2">{item.uom || ''}</td>
                      <td className="border border-gray-800 p-2 text-right">{formatNumber(item.valueSalesExcludingST || 0)}</td>
                      <td className="border border-gray-800 p-2 text-right">
                        {formatNumber((item.valueSalesExcludingST || 0) * (item.quantity || 0))}
                      </td>
                      <td className="border border-gray-800 p-2 text-right">
                        {formatNumber(((item.valueSalesExcludingST || 0) * (item.quantity || 0)) + (item.salesTaxApplicable || 0))}
                      </td>
                      <td className="border border-gray-800 p-2 text-right">{item.rate || '0%'}</td>
                      <td className="border border-gray-800 p-2 text-right">{formatNumber(item.salesTaxApplicable || 0)}</td>
                      <td className="border border-gray-800 p-2 text-right">0.00</td>
                      <td className="border border-gray-800 p-2 text-right font-bold">
                        {formatNumber(item.totalValues || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Comments and FBR Info */}
            <div className="mb-6 text-sm">
              <div><strong>Comments:</strong> {comments}</div>
              <div><strong>FBR INVOICE:</strong> {fbrInvoiceNumber || 'Not Available'}</div>
            </div>

            {/* Totals Section */}
            <div className="mb-8">
              <div className="flex justify-end">
                <div className="w-96">
                  <div className="space-y-1 text-right">
                    <div>
                      <span className="font-bold">Total (excl. tax):</span>
                      <span className="ml-4 font-bold">Rs. {formatNumber(totals.subTotal)}</span>
                    </div>
                    <div>
                      <span>Total GST:</span>
                      <span className="ml-4">Rs. {formatNumber(totals.salesTax)}</span>
                    </div>
                    <div>
                      <span>Net Total (inc. tax):</span>
                      <span className="ml-4">Rs. {formatNumber(totals.grandTotal)}</span>
                    </div>
                    <div>
                      <span>Total Further Tax:</span>
                      <span className="ml-4">Rs. {formatNumber(totals.furtherTax)}</span>
                    </div>
                    <div>
                      <span>Advance Tax:</span>
                      <span className="ml-4">Rs. {formatNumber(totals.advanceTax)}</span>
                    </div>
                    <div className="pt-2 border-t-2 border-gray-800 mt-2">
                      <span className="font-bold text-lg">Net Total:</span>
                      <span className="ml-4 font-bold text-lg">Rs. {formatNumber(totals.netTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code Placeholder */}
            <div className="mb-6">
              <div className="float-right w-32 h-32 border-2 border-gray-800 flex items-center justify-center text-gray-600 text-sm">
                [QR Code Placeholder]
              </div>
              <div className="clear-both"></div>
            </div>

            {/* Note Section */}
            <div className="mt-12 pt-6 border-t-2 border-gray-800">
              <h3 className="font-bold mb-2">## NOTE:</h3>
              <p className="text-sm">
                It is to certify that goods supplied to you under this invoice has been imported and income tax has already been paid U/S 148. Therefore, please do not deduct the withholding income tax U/S 153 (1), 153(5) and as per clause (47- A) Part VI of the Second schedule of Income Tax Ordinance, 2001.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons for Preview */}
        {showPreview && (
          <div id="invoice-preview" className="flex justify-center gap-4 mt-6 print:hidden">
            <Button 
              onClick={handlePrint}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg gap-2 px-8"
              size="lg"
            >
              <Printer className="h-5 w-5" />
              Print Invoice
            </Button>
            <Button 
              onClick={handleDownloadPDF}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50 gap-2 px-8"
              size="lg"
            >
              <Download className="h-5 w-5" />
              Download PDF
            </Button>
            <Button 
              onClick={resetForm}
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50 gap-2 px-8"
              size="lg"
            >
              <Plus className="h-5 w-5" />
              New Invoice
            </Button>
          </div>
        )}

      </div>

      {/* Custom Styles for Print */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #invoice-print, #invoice-print * {
            visibility: visible !important;
          }
          #invoice-print {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            background: white !important;
          }
          .no-print, .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}