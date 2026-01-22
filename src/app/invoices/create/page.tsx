'use client';

import * as XLSX from 'xlsx';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Trash2, Send, CheckCircle, Upload, FileSpreadsheet, X, Printer, Download,
  CheckCheck, Building2, User, Calculator, Package, Hash, ArrowLeft, Save, Copy,
  Eye, Calendar, CreditCard, Receipt, AlertCircle, Settings, Zap, Shield
} from 'lucide-react';
import { 
  PROVINCES, TAX_RATES, TEXTILE_HS_CODES, UOM_OPTIONS, SELLER_INFO, 
  INVOICE_TYPES, FBR_SCENARIOS, FBR_ERROR_CODES, REGISTRATION_TYPES
} from '@/constants/fbr';
import { calculateInvoiceItemTotals, calculateInvoiceTotals } from '@/lib/calculations';
import { formatCurrency, formatNumber, formatDate, formatInvoiceDate, formatTime } from '@/lib/utils';
import { InvoiceItem, FBRInvoice, APIMode } from '@/types/invoice';
import { useFBRInvoice } from '@/hooks/useFBRInvoice';
import { FBRApiService } from '@/services/fbr-api';
import QRCode from 'qrcode';

export default function CreateFBRInvoice() {
  const { postInvoice, validateInvoice, loading, error } = useFBRInvoice();

  // API Mode State
  const [apiMode, setApiMode] = useState<APIMode>('sandbox');
  const [isDemoMode, setIsDemoMode] = useState(true);

  // Invoice Settings
  const [invoiceType, setInvoiceType] = useState<'Sale Invoice' | 'Debit Note'>('Sale Invoice');
  const [scenarioId, setScenarioId] = useState('SN001');
  const [invoiceDate, setInvoiceDate] = useState(formatDate(new Date()));
  const [invoiceTime] = useState(formatTime(new Date()));
  const [localInvoiceNumber, setLocalInvoiceNumber] = useState('');

  // Buyer Information
  const [buyerInfo, setBuyerInfo] = useState({
    buyerNTNCNIC: '3281099',
    buyerBusinessName: 'M/S EVERNEW TECHNOLOGIES',
    buyerProvince: 'SINDH',
    buyerAddress: 'Suit 65 and 76, First Floor, Sasi Arcade, Block 7, Clifton, Karachi South',
    buyerRegistrationType: 'Registered' as 'Registered' | 'Unregistered',
    buyerPhone: '',
    buyerEmail: ''
  });

  // Items State
  const [items, setItems] = useState<Partial<InvoiceItem>[]>([
    {
      hsCode: '8471.3010',
      productDescription: 'USED CHROMEBOOK WITH ADAPTOR CHARGER',
      rate: '10%',
      uom: 'Numbers, pieces, units',
      quantity: 435,
      valueSalesExcludingST: 5586.95,
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

  // UI State
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [submittedInvoice, setSubmittedInvoice] = useState<any>(null);
  const [fbrInvoiceNumber, setFbrInvoiceNumber] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [comments, setComments] = useState('GD # 34845');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);

  // Reference Data from FBR API
  const [provinces, setProvinces] = useState(PROVINCES);
  const [uomList, setUomList] = useState(UOM_OPTIONS);
  const [hsCodeList, setHsCodeList] = useState(TEXTILE_HS_CODES);

  // Generate invoice number on client-side only (fixes hydration mismatch)
  useEffect(() => {
    setLocalInvoiceNumber(`INV${Date.now().toString().slice(-6)}`);
  }, []);

  // Check demo mode on mount
  useEffect(() => {
    const checkMode = async () => {
      const demoMode = FBRApiService.isDemoMode();
      const currentMode = FBRApiService.getCurrentMode();
      setIsDemoMode(demoMode);
      setApiMode(currentMode);
    };
    checkMode();
  }, []);

  // Fetch reference data from FBR on mount
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        const [provincesData, uomData] = await Promise.all([
          FBRApiService.getProvinces(),
          FBRApiService.getUOM()
        ]);
        
        if (provincesData && provincesData.length > 0) {
          const formattedProvinces = provincesData.map((p: any) => ({
            code: p.stateProvinceDesc,
            name: p.stateProvinceDesc
          }));
          setProvinces(formattedProvinces);
        }
        
        if (uomData && uomData.length > 0) {
          setUomList(uomData);
        }
      } catch (error) {
        console.error('Error fetching reference data:', error);
      }
    };

    if (!isDemoMode) {
      fetchReferenceData();
    }
  }, [isDemoMode]);

  // Recalculate items when buyer registration type changes
  useEffect(() => {
    const isRegistered = buyerInfo.buyerRegistrationType === 'Registered';
    const recalculatedItems = items.map(item => 
      calculateInvoiceItemTotals(item, isRegistered)
    );
    setItems(recalculatedItems);
  }, [buyerInfo.buyerRegistrationType]);

  // Calculate totals
  const totals = calculateInvoiceTotals(items as InvoiceItem[]);

  // Generate QR Code
 const generateQRCode = async (invoiceNumber: string) => {
  try {
    // Simplified data - only essential info for QR
    const qrData = JSON.stringify({
      inv: invoiceNumber,
      amt: totals.netTotal,
      date: invoiceDate
    });
    
    const qrUrl = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 1,
      errorCorrectionLevel: 'L', // Changed from 'M' to 'L' (more capacity)
      version: 10 // Changed from 2 to 10 (handles more data)
    });
    
    setQrCodeUrl(qrUrl);
  } catch (error) {
    console.error('Error generating QR code:', error);
    setQrCodeUrl(''); // Set empty instead of crashing
  }
};

  // Add new item
  const addItem = () => {
    const newItem: Partial<InvoiceItem> = {
      hsCode: '8471.3010',
      productDescription: '',
      rate: '18%',
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

  // Remove item
  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  // Update item with auto-calculation
  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate this item's totals
    const isRegistered = buyerInfo.buyerRegistrationType === 'Registered';
    newItems[index] = calculateInvoiceItemTotals(newItems[index], isRegistered);
    
    setItems(newItems);
  };

  // Toggle API Mode
  const toggleApiMode = () => {
    const newMode: APIMode = apiMode === 'sandbox' ? 'production' : 'sandbox';
    setApiMode(newMode);
    
    // Show warning for production mode
    if (newMode === 'production') {
      if (!confirm('⚠️ WARNING: You are switching to PRODUCTION mode.\n\nInvoices will be submitted to FBR live system.\n\nAre you sure?')) {
        return;
      }
    }
  };

  // Handle Excel Import
  const handleExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Get first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) {
          alert('❌ Excel file is empty!');
          return;
        }
        
        // Map Excel data to invoice items
        const importedItems = jsonData.map((row: any) => {
          // Handle different possible column names
          const hsCode = row['HS Code'] || row['HSCode'] || row['hs_code'] || '8471.3010';
          const description = row['Description'] || row['Product Description'] || row['description'] || '';
          const quantity = parseFloat(row['Quantity'] || row['quantity'] || row['Qty'] || 1);
          const rate = parseFloat(row['Rate'] || row['Price'] || row['rate'] || 0);
          const taxRate = row['Tax Rate'] || row['Tax'] || row['tax_rate'] || '18%';
          
          // Ensure tax rate has % sign
          const formattedTaxRate = taxRate.toString().includes('%') ? taxRate : `${taxRate}%`;
          
          return {
            hsCode: hsCode.toString(),
            productDescription: description.toString(),
            rate: formattedTaxRate,
            uom: 'Numbers, pieces, units',
            quantity: quantity,
            valueSalesExcludingST: rate,
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
        });
        
        // Calculate totals for all items
        const isRegistered = buyerInfo.buyerRegistrationType === 'Registered';
        const calculatedItems = importedItems.map(item => 
          calculateInvoiceItemTotals(item, isRegistered)
        );
        
        // Set items
        setItems(calculatedItems);
        setShowExcelImport(false);
        
        alert(`✅ Successfully imported ${importedItems.length} items from Excel!`);
        
      } catch (parseError) {
        console.error('Parse error:', parseError);
        alert('❌ Error parsing Excel file. Please check the format.');
      }
    };
    
    reader.onerror = () => {
      alert('❌ Error reading file.');
    };
    
    reader.readAsBinaryString(file);
    
  } catch (error) {
    console.error('Import error:', error);
    alert('❌ Error reading Excel file. Please check the format.');
  }
};

// Export: Sample Excel template for users to download
 const downloadExcelTemplate = () => {
  const template = [
    {
      'HS Code': '8471.3010',
      'Description': 'Used Chromebook',
      'Quantity': 10,
      'Rate': 5000,
      'Tax Rate': '18%'
    },
    {
      'HS Code': '6109.1000',
      'Description': 'Cotton T-Shirt',
      'Quantity': 50,
      'Rate': 500,
      'Tax Rate': '10%'
    }
  ];
  
  const worksheet = XLSX.utils.json_to_sheet(template);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoice Items');
  
  XLSX.writeFile(workbook, 'FBR_Invoice_Template.xlsx');
};

  // Validate Invoice
  const handleValidate = async () => {
    if (!buyerInfo.buyerBusinessName || !buyerInfo.buyerNTNCNIC) {
      alert('❌ Please fill all required buyer information!');
      return;
    }

    const fbrInvoice: FBRInvoice = {
      invoiceType: invoiceType,
      invoiceDate: invoiceDate,
      sellerNTNCNIC: SELLER_INFO.ntn,
      sellerBusinessName: SELLER_INFO.businessName,
      sellerProvince: SELLER_INFO.province,
      sellerAddress: SELLER_INFO.address,
      buyerNTNCNIC: buyerInfo.buyerNTNCNIC,
      buyerBusinessName: buyerInfo.buyerBusinessName,
      buyerProvince: buyerInfo.buyerProvince,
      buyerAddress: buyerInfo.buyerAddress,
      buyerRegistrationType: buyerInfo.buyerRegistrationType,
      scenarioId: apiMode === 'sandbox' ? scenarioId : undefined,
      items: items as InvoiceItem[]
    };

    const isValid = await validateInvoice(fbrInvoice);
    
    if (isValid) {
      alert('✅ Invoice is valid and ready for submission to FBR!');
    } else {
      alert(`❌ Validation failed:\n\n${error || 'Please check all fields'}`);
    }
  };

  // Submit Invoice
  const handleSubmit = async () => {
    if (!buyerInfo.buyerBusinessName || !buyerInfo.buyerNTNCNIC) {
      alert('❌ Please fill all required buyer information!');
      return;
    }

    const fbrInvoice: FBRInvoice = {
      invoiceType: invoiceType,
      invoiceDate: invoiceDate,
      sellerNTNCNIC: SELLER_INFO.ntn,
      sellerBusinessName: SELLER_INFO.businessName,
      sellerProvince: SELLER_INFO.province,
      sellerAddress: SELLER_INFO.address,
      buyerNTNCNIC: buyerInfo.buyerNTNCNIC,
      buyerBusinessName: buyerInfo.buyerBusinessName,
      buyerProvince: buyerInfo.buyerProvince,
      buyerAddress: buyerInfo.buyerAddress,
      buyerRegistrationType: buyerInfo.buyerRegistrationType,
      scenarioId: apiMode === 'sandbox' ? scenarioId : undefined,
      items: items as InvoiceItem[]
    };

    const response = await postInvoice(fbrInvoice);
    
    if (response) {
      const fbrNumber = response.invoiceNumber || `FBR-${Date.now().toString().slice(-8)}`;
      
      const savedInvoice = {
        ...fbrInvoice,
        localInvoiceNumber,
        fbrInvoiceNumber: fbrNumber,
        invoiceDate: invoiceDate,
        totals,
        status: 'Submitted'
      };
      
      setSubmittedInvoice(savedInvoice);
      setFbrInvoiceNumber(fbrNumber);
      setShowForm(false);
      setShowPreview(true);
      
      // Generate QR Code
      await generateQRCode(fbrNumber);
      
      // Scroll to preview
      setTimeout(() => {
        const invoicePreview = document.getElementById('invoice-preview');
        if (invoicePreview) {
          invoicePreview.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      
      alert(`🎉 Invoice submitted successfully!\n\n📄 FBR Invoice: ${fbrNumber}`);
    } else {
      alert(`❌ Submission failed:\n\n${error || 'Please try again'}`);
    }
  };

  // Preview Handler
  const handlePreview = () => {
    if (!buyerInfo.buyerBusinessName || !buyerInfo.buyerNTNCNIC) {
      alert('❌ Please fill all required buyer information before preview!');
      return;
    }
    setShowPreview(!showPreview);
    setShowForm(!showPreview);
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Download PDF Handler
  const handleDownloadPDF = () => {
    alert('📄 PDF download feature will be available soon! Use Print button for now.');
  };

  // Reset Form
  const resetForm = () => {
    setSubmittedInvoice(null);
    setFbrInvoiceNumber(null);
    setShowPreview(false);
    setShowForm(true);
    setQrCodeUrl('');
    setBuyerInfo({
      buyerNTNCNIC: '',
      buyerBusinessName: '',
      buyerProvince: 'SINDH',
      buyerAddress: '',
      buyerRegistrationType: 'Registered',
      buyerPhone: '',
      buyerEmail: ''
    });
    setItems([{
      hsCode: '8471.3010',
      productDescription: '',
      rate: '18%',
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
    // Generate new invoice number
    setLocalInvoiceNumber(`INV${Date.now().toString().slice(-6)}`);
  };

  // Copy to Clipboard
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
                  <p className="text-blue-100 text-sm sm:text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    {isDemoMode ? 'Demo Mode - No Real API Calls' : `${apiMode.toUpperCase()} Mode`}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={() => setShowSettings(!showSettings)}
                  variant="outline" 
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 border-white/30 text-white backdrop-blur-sm"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
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

            {/* Settings Panel */}
            {showSettings && (
              <div className="mt-6 p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Invoice Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div key="setting-invoice-type">
                    <Label className="text-white mb-2 block">Invoice Type</Label>
                    <Select value={invoiceType} onValueChange={(value: any) => setInvoiceType(value)}>
                      <SelectTrigger className="bg-white/20 border-white/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INVOICE_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div key="setting-api-mode">
                    <Label className="text-white mb-2 block flex items-center gap-2">
                      API Mode 
                      {!isDemoMode && (
                        <button
                          onClick={toggleApiMode}
                          className="text-xs bg-white/20 px-2 py-1 rounded hover:bg-white/30"
                        >
                          Switch
                        </button>
                      )}
                    </Label>
                    <div className="bg-white/20 border border-white/30 rounded-md px-3 py-2 text-white flex items-center gap-2">
                      <Zap className={`h-4 w-4 ${apiMode === 'production' ? 'text-red-400' : 'text-green-400'}`} />
                      {isDemoMode ? 'DEMO' : apiMode.toUpperCase()}
                    </div>
                  </div>
                  
                  {apiMode === 'sandbox' && !isDemoMode && (
                    <div key="setting-scenario">
                      <Label className="text-white mb-2 block">Scenario ID (Testing)</Label>
                      <Select value={scenarioId} onValueChange={setScenarioId}>
                        <SelectTrigger className="bg-white/20 border-white/30 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {FBR_SCENARIOS.map(scenario => (
                            <SelectItem key={scenario.id} value={scenario.id}>
                              {scenario.id} - {scenario.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                {isDemoMode && (
                  <div className="mt-4 p-3 bg-yellow-500/20 border border-yellow-400/30 rounded-lg">
                    <p className="text-sm text-yellow-100 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <strong>Demo Mode:</strong> No real FBR API calls. Set FBR_API_TOKEN in .env.local to use real APIs.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Invoice Info Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-white/20">
              <div key="info-invoice-number" className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100">Invoice Number</p>
                    <p className="text-lg font-bold mt-1 font-mono">{localInvoiceNumber || 'Loading...'}</p>
                  </div>
                  <div className="bg-blue-500/20 p-2 rounded-lg">
                    <Hash className="h-5 w-5 text-blue-300" />
                  </div>
                </div>
              </div>

              <div key="info-invoice-date" className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
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

              <div key="info-total-items" className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
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

              <div key="info-net-total" className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100">Net Total</p>
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

        {/* Continue with Form in Part 3... */}

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
                      <div key="col-a" className="flex items-center gap-2">
                        <div className="w-24 font-medium">Column A:</div>
                        <div>HS Code</div>
                      </div>
                      <div key="col-b" className="flex items-center gap-2">
                        <div className="w-24 font-medium">Column B:</div>
                        <div>Product Description</div>
                      </div>
                      <div key="col-c" className="flex items-center gap-2">
                        <div className="w-24 font-medium">Column C:</div>
                        <div>Quantity</div>
                      </div>
                      <div key="col-d" className="flex items-center gap-2">
                        <div className="w-24 font-medium">Column D:</div>
                        <div>Rate per unit</div>
                      </div>
                      <div key="col-e" className="flex items-center gap-2">
                        <div className="w-24 font-medium">Column E:</div>
                        <div>Tax Rate (%)</div>
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
            <div key="left-column" className="lg:col-span-2 space-y-6">
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
                    <div key="buyer-name-field" className="space-y-2">
                      <Label className="text-sm font-semibold">Customer Name *</Label>
                      <Input
                        value={buyerInfo.buyerBusinessName}
                        onChange={(e) => setBuyerInfo({ ...buyerInfo, buyerBusinessName: e.target.value })}
                        placeholder="M/S EVERNEW TECHNOLOGIES"
                        className="focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div key="buyer-ntn-field" className="space-y-2">
                      <Label className="text-sm font-semibold">CNIC/NTN # *</Label>
                      <Input
                        value={buyerInfo.buyerNTNCNIC}
                        onChange={(e) => setBuyerInfo({ ...buyerInfo, buyerNTNCNIC: e.target.value })}
                        placeholder="3281099"
                        className="focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div key="buyer-reg-field" className="space-y-2">
                      <Label className="text-sm font-semibold">Registration Type *</Label>
                      <Select
                        value={buyerInfo.buyerRegistrationType}
                        onValueChange={(value: any) => setBuyerInfo({ ...buyerInfo, buyerRegistrationType: value })}
                      >
                        <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {REGISTRATION_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div key="buyer-phone-field" className="space-y-2">
                      <Label className="text-sm font-semibold">Phone</Label>
                      <Input
                        value={buyerInfo.buyerPhone}
                        onChange={(e) => setBuyerInfo({ ...buyerInfo, buyerPhone: e.target.value })}
                        placeholder="03001234567"
                        className="focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div key="buyer-address-field" className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-semibold">Address *</Label>
                      <Input
                        value={buyerInfo.buyerAddress}
                        onChange={(e) => setBuyerInfo({ ...buyerInfo, buyerAddress: e.target.value })}
                        placeholder="Complete address"
                        className="focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div key="buyer-province-field" className="space-y-2">
                      <Label className="text-sm font-semibold">Province *</Label>
                      <Select
                        value={buyerInfo.buyerProvince}
                        onValueChange={(value) => setBuyerInfo({ ...buyerInfo, buyerProvince: value })}
                      >
                        <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                          <SelectValue placeholder="Select province" />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.map(province => (
                            <SelectItem key={province.code} value={province.code}>
                              {province.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div key="buyer-comments-field" className="space-y-2">
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
                            <div key="field-hscode" className="space-y-2">
                              <Label className="text-sm font-semibold">HS Code *</Label>
                              <Select
                                value={item.hsCode}
                                onValueChange={(value) => updateItem(index, 'hsCode', value)}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {hsCodeList.map(hs => (
                                    <SelectItem key={hs.code} value={hs.code}>
                                      {hs.code} - {hs.description}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div key="field-description" className="space-y-2">
                              <Label className="text-sm font-semibold">Product Description *</Label>
                              <Input
                                value={item.productDescription}
                                onChange={(e) => updateItem(index, 'productDescription', e.target.value)}
                                placeholder="Product description"
                                className="bg-white"
                              />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div key="field-quantity" className="space-y-2">
                              <Label className="text-sm font-semibold">Quantity *</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 1)}
                                className="bg-white"
                              />
                            </div>
                            
                            <div key="field-uom" className="space-y-2">
                              <Label className="text-sm font-semibold">UOM *</Label>
                              <Select
                                value={item.uom}
                                onValueChange={(value) => updateItem(index, 'uom', value)}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {uomList.map(uom => (
                                    <SelectItem key={uom.id} value={uom.name}>
                                      {uom.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div key="field-rate" className="space-y-2">
                              <Label className="text-sm font-semibold">Rate (Rs.) *</Label>
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.valueSalesExcludingST}
                                onChange={(e) => updateItem(index, 'valueSalesExcludingST', parseFloat(e.target.value) || 0)}
                                className="bg-white"
                              />
                            </div>
                            
                            <div key="field-taxrate" className="space-y-2">
                              <Label className="text-sm font-semibold">Tax Rate *</Label>
                              <Select
                                value={item.rate}
                                onValueChange={(value) => updateItem(index, 'rate', value)}
                              >
                                <SelectTrigger className="bg-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TAX_RATES.map(rate => (
                                    <SelectItem key={rate.value} value={rate.value}>
                                      {rate.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          {/* Advanced Fields (Optional) */}
                          <details className="group">
                            <summary className="cursor-pointer text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-2">
                              <Plus className="h-4 w-4 group-open:rotate-45 transition-transform" />
                              Advanced Fields (Optional)
                            </summary>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-300">
                              <div key="adv-fixed-price" className="space-y-2">
                                <Label className="text-xs">Fixed/Notified Price</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.fixedNotifiedValueOrRetailPrice}
                                  onChange={(e) => updateItem(index, 'fixedNotifiedValueOrRetailPrice', parseFloat(e.target.value) || 0)}
                                  className="bg-white text-sm"
                                />
                              </div>
                              <div key="adv-withheld" className="space-y-2">
                                <Label className="text-xs">Sales Tax Withheld</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.salesTaxWithheldAtSource}
                                  onChange={(e) => updateItem(index, 'salesTaxWithheldAtSource', parseFloat(e.target.value) || 0)}
                                  className="bg-white text-sm"
                                />
                              </div>
                              <div key="adv-extra-tax" className="space-y-2">
                                <Label className="text-xs">Extra Tax</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.extraTax}
                                  onChange={(e) => updateItem(index, 'extraTax', parseFloat(e.target.value) || 0)}
                                  className="bg-white text-sm"
                                />
                              </div>
                              <div key="adv-discount" className="space-y-2">
                                <Label className="text-xs">Discount</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={item.discount}
                                  onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                                  className="bg-white text-sm"
                                />
                              </div>
                              <div key="adv-sro-schedule" className="space-y-2">
                                <Label className="text-xs">SRO Schedule No</Label>
                                <Input
                                  value={item.sroScheduleNo}
                                  onChange={(e) => updateItem(index, 'sroScheduleNo', e.target.value)}
                                  className="bg-white text-sm"
                                />
                              </div>
                              <div key="adv-sro-serial" className="space-y-2">
                                <Label className="text-xs">SRO Item Serial No</Label>
                                <Input
                                  value={item.sroItemSerialNo}
                                  onChange={(e) => updateItem(index, 'sroItemSerialNo', e.target.value)}
                                  className="bg-white text-sm"
                                />
                              </div>
                            </div>
                          </details>
                          
                          {/* Item Summary */}
                          <div className="pt-4 border-t border-gray-300">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                              <div key="subtotal" className="bg-white p-3 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Subtotal</p>
                                <p className="font-bold text-gray-900 text-sm">
                                  Rs. {formatNumber((item.valueSalesExcludingST || 0) * (item.quantity || 0))}
                                </p>
                              </div>
                              <div key="sales-tax" className="bg-white p-3 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Sales Tax</p>
                                <p className="font-bold text-red-600 text-sm">Rs. {formatNumber(item.salesTaxApplicable || 0)}</p>
                              </div>
                              <div key="further-tax" className="bg-white p-3 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Further Tax</p>
                                <p className="font-bold text-orange-600 text-sm">Rs. {formatNumber(item.furtherTax || 0)}</p>
                              </div>
                              <div key="advance-tax" className="bg-white p-3 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Advance Tax</p>
                                <p className="font-bold text-amber-600 text-sm">Rs. {formatNumber(item.fedPayable || 0)}</p>
                              </div>
                              <div key="item-total" className="bg-white p-3 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-500 mb-1">Item Total</p>
                                <p className="font-bold text-green-600 text-base">Rs. {formatNumber(item.totalValues || 0)}</p>
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

            {/* Right Column - Summary & Actions - Continue in Part 4... */}
            <div key="right-column" className="space-y-6">
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
                    <div key="summary-subtotal" className="flex justify-between items-center py-2 border-b border-blue-200">
                      <span className="text-gray-600 text-sm">Subtotal</span>
                      <span className="font-bold">Rs. {formatNumber(totals.subTotal)}</span>
                    </div>
                    <div key="summary-sales-tax" className="flex justify-between items-center py-2 border-b border-blue-200">
                      <span className="text-gray-600 text-sm">Sales Tax</span>
                      <span className="font-bold text-red-600">Rs. {formatNumber(totals.salesTax)}</span>
                    </div>
                    <div key="summary-further-tax" className="flex justify-between items-center py-2 border-b border-blue-200">
                      <span className="text-gray-600 text-sm">Further Tax</span>
                      <span className="font-bold text-orange-600">Rs. {formatNumber(totals.furtherTax)}</span>
                    </div>
                    <div key="summary-advance-tax" className="flex justify-between items-center py-2 border-b border-blue-200">
                      <span className="text-gray-600 text-sm">Advance Tax (5.5%)</span>
                      <span className="font-bold text-amber-600">Rs. {formatNumber(totals.advanceTax)}</span>
                    </div>
                    {totals.totalDiscount > 0 && (
                      <div key="summary-discount" className="flex justify-between items-center py-2 border-b border-blue-200">
                        <span className="text-gray-600 text-sm">Total Discount</span>
                        <span className="font-bold text-green-600">- Rs. {formatNumber(totals.totalDiscount)}</span>
                      </div>
                    )}
                    <div key="summary-net-total" className="pt-3 mt-2 border-t-2 border-blue-300">
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
                    <div key="seller-company" className="flex items-start gap-2">
                      <span className="text-gray-600 font-medium min-w-20">Company:</span>
                      <span className="font-medium">{SELLER_INFO.businessName}</span>
                    </div>
                    <div key="seller-ntn" className="flex items-start gap-2">
                      <span className="text-gray-600 font-medium min-w-20">NTN:</span>
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">{SELLER_INFO.ntn}</span>
                    </div>
                    <div key="seller-strn" className="flex items-start gap-2">
                      <span className="text-gray-600 font-medium min-w-20">STRN:</span>
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">{SELLER_INFO.strn}</span>
                    </div>
                    <div key="seller-province" className="flex items-start gap-2">
                      <span className="text-gray-600 font-medium min-w-20">Province:</span>
                      <span className="font-medium">{SELLER_INFO.province}</span>
                    </div>
                    <div key="seller-phone" className="flex items-start gap-2">
                      <span className="text-gray-600 font-medium min-w-20">Phone:</span>
                      <span className="font-medium">{SELLER_INFO.phone}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-gray-50 to-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-gray-600" />
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
                      {loading ? 'Validating...' : 'Validate Invoice'}
                    </Button>
                    
                    <Button 
                      onClick={handleSubmit} 
                      className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg gap-2"
                      disabled={loading}
                    >
                      <Send className="h-4 w-4" />
                      {loading ? 'Submitting...' : 'Submit to FBR'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Invoice Preview for Printing */}
        {showPreview && (
          <div id="invoice-print" className="bg-white border-2 border-gray-800 p-8 print:p-4 print:border-0">
            {/* FBR Logo */}
            <div className="flex justify-between items-start mb-6">
              <div className="w-24 h-24 border border-gray-300 flex items-center justify-center text-xs text-gray-500">
                FBR Logo
              </div>
              <div className="text-right text-sm">
                <div className="font-bold">Invoice #: {localInvoiceNumber}</div>
                <div>Date: {new Date(invoiceDate).toLocaleDateString('en-GB')}</div>
                <div>Time: {invoiceTime}</div>
              </div>
            </div>

            {/* Invoice Header */}
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold mb-2">SALES TAX INVOICE</h1>
              <div className="text-sm text-gray-600">
                {invoiceType} - {apiMode.toUpperCase()} Mode
                {scenarioId && apiMode === 'sandbox' && ` (${scenarioId})`}
              </div>
            </div>

            {/* Buyer and Seller Details Side by Side */}
            <div className="grid grid-cols-2 gap-8 mb-8">
              {/* Buyer Details */}
              <div key="preview-buyer-box" className="border-2 border-gray-800 p-4">
                <h2 className="text-xl font-bold mb-3 border-b-2 border-gray-800 pb-2">BUYER'S DETAIL</h2>
                <div className="space-y-1 text-sm">
                  <div key="buyer-name"><strong>Customer Name:</strong> {buyerInfo.buyerBusinessName}</div>
                  <div key="buyer-ntn"><strong>CNIC/NTN #:</strong> {buyerInfo.buyerNTNCNIC}</div>
                  <div key="buyer-reg"><strong>Registration:</strong> {buyerInfo.buyerRegistrationType}</div>
                  <div key="buyer-address"><strong>Address:</strong> {buyerInfo.buyerAddress}</div>
                  <div key="buyer-province"><strong>Province:</strong> {buyerInfo.buyerProvince}</div>
                  {buyerInfo.buyerPhone && <div key="buyer-phone"><strong>Phone:</strong> {buyerInfo.buyerPhone}</div>}
                </div>
              </div>

              {/* Seller Details */}
              <div key="preview-seller-box" className="border-2 border-gray-800 p-4">
                <h2 className="text-xl font-bold mb-3 border-b-2 border-gray-800 pb-2">SELLER'S DETAIL</h2>
                <div className="space-y-1 text-sm">
                  <div key="seller-name"><strong>Company Name:</strong> {SELLER_INFO.businessName}</div>
                  <div key="seller-ntn"><strong>NTN:</strong> {SELLER_INFO.ntn}</div>
                  <div key="seller-strn"><strong>STRN:</strong> {SELLER_INFO.strn}</div>
                  <div key="seller-reg"><strong>Registration #:</strong> {SELLER_INFO.registrationNumber}</div>
                  <div key="seller-address"><strong>Address:</strong> {SELLER_INFO.address}</div>
                  <div key="seller-province"><strong>Province:</strong> {SELLER_INFO.province}</div>
                  <div key="seller-phone"><strong>Phone:</strong> {SELLER_INFO.phone}</div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <table className="w-full border-collapse border-2 border-gray-800 text-xs">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-800 p-2 text-left">S.No</th>
                    <th className="border border-gray-800 p-2 text-left">HS Code</th>
                    <th className="border border-gray-800 p-2 text-left">Description</th>
                    <th className="border border-gray-800 p-2 text-center">QTY</th>
                    <th className="border border-gray-800 p-2 text-center">UOM</th>
                    <th className="border border-gray-800 p-2 text-right">Rate</th>
                    <th className="border border-gray-800 p-2 text-right">Value</th>
                    <th className="border border-gray-800 p-2 text-center">Tax%</th>
                    <th className="border border-gray-800 p-2 text-right">Sales Tax</th>
                    <th className="border border-gray-800 p-2 text-right">Further Tax</th>
                    <th className="border border-gray-800 p-2 text-right">Adv. Tax</th>
                    <th className="border border-gray-800 p-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-800 p-2">{index + 1}</td>
                      <td className="border border-gray-800 p-2 font-mono">{item.hsCode}</td>
                      <td className="border border-gray-800 p-2">{item.productDescription}</td>
                      <td className="border border-gray-800 p-2 text-center">{item.quantity}</td>
                      <td className="border border-gray-800 p-2 text-center text-xs">{item.uom}</td>
                      <td className="border border-gray-800 p-2 text-right">{formatNumber(item.valueSalesExcludingST || 0)}</td>
                      <td className="border border-gray-800 p-2 text-right">
                        {formatNumber((item.valueSalesExcludingST || 0) * (item.quantity || 0))}
                      </td>
                      <td className="border border-gray-800 p-2 text-center">{item.rate}</td>
                      <td className="border border-gray-800 p-2 text-right">{formatNumber(item.salesTaxApplicable || 0)}</td>
                      <td className="border border-gray-800 p-2 text-right">{formatNumber(item.furtherTax || 0)}</td>
                      <td className="border border-gray-800 p-2 text-right">{formatNumber(item.fedPayable || 0)}</td>
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
              {comments && <div className="mb-2"><strong>Comments:</strong> {comments}</div>}
              <div><strong>FBR INVOICE:</strong> {fbrInvoiceNumber || 'Not Available'}</div>
              {apiMode === 'sandbox' && scenarioId && (
                <div><strong>Scenario ID:</strong> {scenarioId}</div>
              )}
            </div>

            {/* Totals Section */}
            <div className="mb-8">
              <div className="flex justify-end">
                <div className="w-96 border-2 border-gray-800 p-4">
                  <div className="space-y-2 text-sm">
                    <div key="preview-subtotal" className="flex justify-between pb-2 border-b border-gray-400">
                      <span className="font-semibold">Total (excl. tax):</span>
                      <span className="font-semibold">Rs. {formatNumber(totals.subTotal)}</span>
                    </div>
                    <div key="preview-sales-tax" className="flex justify-between pb-2 border-b border-gray-400">
                      <span>Total Sales Tax:</span>
                      <span>Rs. {formatNumber(totals.salesTax)}</span>
                    </div>
                    <div key="preview-further-tax" className="flex justify-between pb-2 border-b border-gray-400">
                      <span>Total Further Tax:</span>
                      <span>Rs. {formatNumber(totals.furtherTax)}</span>
                    </div>
                    <div key="preview-advance-tax" className="flex justify-between pb-2 border-b border-gray-400">
                      <span>Total Advance Tax:</span>
                      <span>Rs. {formatNumber(totals.advanceTax)}</span>
                    </div>
                    {totals.totalDiscount > 0 && (
                      <div key="preview-discount" className="flex justify-between pb-2 border-b border-gray-400">
                        <span>Total Discount:</span>
                        <span className="text-green-600">- Rs. {formatNumber(totals.totalDiscount)}</span>
                      </div>
                    )}
                    <div key="preview-net-total" className="flex justify-between pt-3 border-t-2 border-gray-800 mt-2">
                      <span className="font-bold text-lg">NET TOTAL:</span>
                      <span className="font-bold text-lg">Rs. {formatNumber(totals.netTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* QR Code and Signature Section */}
            <div className="flex justify-between items-start mb-8">
              <div className="w-32 h-32 border-2 border-gray-800 flex items-center justify-center">
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="QR Code" className="w-full h-full" />
                ) : (
                  <span className="text-xs text-gray-500 text-center p-2">QR Code</span>
                )}
              </div>
              
              <div className="text-right">
                <div className="mb-16"></div>
                <div className="border-t-2 border-gray-800 pt-2 w-48">
                  <p className="text-sm font-semibold">Authorized Signature</p>
                </div>
              </div>
            </div>

            {/* Note Section */}
            <div className="mt-12 pt-6 border-t-2 border-gray-800">
              <h3 className="font-bold mb-2">NOTE:</h3>
              <p className="text-xs leading-relaxed">
                It is to certify that goods supplied to you under this invoice has been imported and income tax has already been paid U/S 148. 
                Therefore, please do not deduct the withholding income tax U/S 153 (1), 153(5) and as per clause (47-A) Part VI of the Second 
                schedule of Income Tax Ordinance, 2001.
              </p>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-xs text-gray-600 border-t pt-4">
              <p>Generated by FBR Digital Invoicing System | {new Date().toLocaleDateString('en-GB')}</p>
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
            padding: 20mm !important;
            margin: 0 !important;
            border: none !important;
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}