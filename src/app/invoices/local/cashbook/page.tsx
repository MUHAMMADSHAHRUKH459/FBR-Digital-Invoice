'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Printer, ArrowLeft, Save, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';

interface CashEntry {
  id: string;
  date: string;
  type: 'receipt' | 'payment';
  personName: string;
  ledgerFolio: string;
  amount: string;
}

export default function CashBookPage() {
  const [currentDate, setCurrentDate] = useState('');
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [formData, setFormData] = useState({
    date: '',
    type: 'receipt' as 'receipt' | 'payment',
    personName: '',
    ledgerFolio: '',
    amount: ''
  });

  // Load from localStorage on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setCurrentDate(today);
    setFormData(prev => ({ ...prev, date: today }));

    const saved = localStorage.getItem('cashbook-entries');
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load entries');
      }
    }
  }, []);

  // Save to localStorage whenever entries change
  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem('cashbook-entries', JSON.stringify(entries));
    }
  }, [entries]);

  const addEntry = () => {
    if (!formData.personName.trim()) {
      alert('Please enter person name!');
      return;
    }

    const amountVal = parseFloat(formData.amount);
    if (!amountVal || amountVal <= 0) {
      alert('Please enter valid amount!');
      return;
    }

    const newEntry: CashEntry = {
      id: Date.now().toString(),
      date: formData.date,
      type: formData.type,
      personName: formData.personName,
      ledgerFolio: formData.ledgerFolio,
      amount: amountVal.toFixed(2)
    };

    setEntries([...entries, newEntry]);

    setFormData({
      date: currentDate,
      type: 'receipt',
      personName: '',
      ledgerFolio: '',
      amount: ''
    });
  };

  const deleteEntry = (id: string) => {
    const filtered = entries.filter(e => e.id !== id);
    setEntries(filtered);
    
    if (filtered.length === 0) {
      localStorage.removeItem('cashbook-entries');
    }
  };

  const getReceipts = () => entries.filter(e => e.type === 'receipt');
  const getPayments = () => entries.filter(e => e.type === 'payment');

  const getTotals = () => {
    const totalReceipts = getReceipts().reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const totalPayments = getPayments().reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const balance = totalReceipts - totalPayments;

    return {
      totalReceipts: totalReceipts.toFixed(2),
      totalPayments: totalPayments.toFixed(2),
      balance: Math.abs(balance).toFixed(2),
      balanceType: balance >= 0 ? 'Surplus' : 'Deficit'
    };
  };

  const totals = getTotals();

  const getPersonSummary = () => {
    const summary: { [key: string]: { received: number; paid: number } } = {};

    entries.forEach(entry => {
      if (!summary[entry.personName]) {
        summary[entry.personName] = { received: 0, paid: 0 };
      }
      
      const amount = parseFloat(entry.amount);
      if (entry.type === 'receipt') {
        summary[entry.personName].received += amount;
      } else {
        summary[entry.personName].paid += amount;
      }
    });

    return Object.entries(summary).map(([name, data]) => ({
      name,
      received: data.received.toFixed(2),
      paid: data.paid.toFixed(2),
      balance: (data.received - data.paid).toFixed(2),
      balanceType: (data.received - data.paid) >= 0 ? 'To Receive' : 'To Pay'
    }));
  };

  const personSummary = getPersonSummary();

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6 print:shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Link href="/invoices/local" className="print:hidden">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">CASH BOOK</h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">Receipts & Payments - {new Date(currentDate).getFullYear()}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => alert('✅ Cash Book saved!')} size="sm" className="print:hidden bg-purple-600 hover:bg-purple-700">
                <Save className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Save</span>
              </Button>
              <Button onClick={() => window.print()} size="sm" className="print:hidden bg-purple-600 hover:bg-purple-700">
                <Printer className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Print</span>
              </Button>
            </div>
          </div>

          {/* Date Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t print:hidden">
            <div>
              <Label className="text-sm font-semibold">Current Date:</Label>
              <Input
                type="date"
                value={currentDate}
                onChange={(e) => {
                  setCurrentDate(e.target.value);
                  setFormData(prev => ({ ...prev, date: e.target.value }));
                }}
                className="mt-1 w-full"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold">Month:</Label>
              <div className="text-lg sm:text-xl font-bold text-purple-600 mt-1">
                {new Date(currentDate).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* Add Entry Form */}
        <Card className="print:hidden">
          <CardHeader className="bg-purple-600 text-white p-4">
            <CardTitle className="text-lg sm:text-xl">Add New Transaction</CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
              <div>
                <Label className="text-sm">Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Type *</Label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'receipt' | 'payment' })}
                  className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                >
                  <option value="receipt">Receipt (Money In)</option>
                  <option value="payment">Payment (Money Out)</option>
                </select>
              </div>
              <div>
                <Label className="text-sm">Person Name *</Label>
                <Input
                  value={formData.personName}
                  onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                  placeholder="e.g., Ali, Ahmed"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Ledger Folio</Label>
                <Input
                  value={formData.ledgerFolio}
                  onChange={(e) => setFormData({ ...formData, ledgerFolio: e.target.value })}
                  placeholder="F-001"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Amount (Rs.) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="mt-1"
                />
              </div>
            </div>
            <Button onClick={addEntry} className="mt-4 w-full sm:w-auto bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </Button>
          </CardContent>
        </Card>

        {/* Cash Book - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          
          {/* RECEIPTS (Left Side) */}
          <Card className="shadow-lg">
            <CardHeader className="bg-green-600 text-white p-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5" />
                RECEIPTS (Money Received)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-green-100">
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-left text-xs md:text-sm">Date</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-left text-xs md:text-sm">Receipts From</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-center text-xs md:text-sm">Folio</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-right text-xs md:text-sm">Amount<br/>Rs. Ps.</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-center text-xs md:text-sm print:hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getReceipts().length === 0 ? (
                      <tr>
                        <td colSpan={5} className="border border-gray-300 px-4 py-8 text-center text-gray-500 text-sm">
                          No receipts yet
                        </td>
                      </tr>
                    ) : (
                      <>
                        {getReceipts().map((entry, index) => (
                          <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-gray-300 px-2 md:px-4 py-2 text-xs md:text-sm">{entry.date}</td>
                            <td className="border border-gray-300 px-2 md:px-4 py-2 text-xs md:text-sm">{entry.personName}</td>
                            <td className="border border-gray-300 px-2 md:px-4 py-2 text-center text-xs md:text-sm">{entry.ledgerFolio || '-'}</td>
                            <td className="border border-gray-300 px-2 md:px-4 py-2 text-right font-mono text-xs md:text-sm font-semibold text-green-700">{entry.amount}</td>
                            <td className="border border-gray-300 px-2 md:px-4 py-2 text-center print:hidden">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteEntry(entry.id)}
                                className="text-red-600 hover:bg-red-50 p-1"
                              >
                                <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-green-200 font-bold">
                          <td colSpan={3} className="border-2 border-gray-800 px-2 md:px-4 py-3 text-right text-sm md:text-base">TOTAL</td>
                          <td className="border-2 border-gray-800 px-2 md:px-4 py-3 text-right font-mono text-base md:text-lg">{totals.totalReceipts}</td>
                          <td className="border-2 border-gray-800 print:hidden"></td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* PAYMENTS (Right Side) */}
          <Card className="shadow-lg">
            <CardHeader className="bg-red-600 text-white p-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingDown className="h-5 w-5" />
                PAYMENTS (Money Paid)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-red-100">
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-left text-xs md:text-sm">Date</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-left text-xs md:text-sm">Payments To</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-center text-xs md:text-sm">Folio</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-right text-xs md:text-sm">Amount<br/>Rs. Ps.</th>
                      <th className="border border-gray-300 px-2 md:px-4 py-2 text-center text-xs md:text-sm print:hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getPayments().length === 0 ? (
                      <tr>
                        <td colSpan={5} className="border border-gray-300 px-4 py-8 text-center text-gray-500 text-sm">
                          No payments yet
                        </td>
                      </tr>
                    ) : (
                      <>
                        {getPayments().map((entry, index) => (
                          <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-gray-300 px-2 md:px-4 py-2 text-xs md:text-sm">{entry.date}</td>
                            <td className="border border-gray-300 px-2 md:px-4 py-2 text-xs md:text-sm">{entry.personName}</td>
                            <td className="border border-gray-300 px-2 md:px-4 py-2 text-center text-xs md:text-sm">{entry.ledgerFolio || '-'}</td>
                            <td className="border border-gray-300 px-2 md:px-4 py-2 text-right font-mono text-xs md:text-sm font-semibold text-red-700">{entry.amount}</td>
                            <td className="border border-gray-300 px-2 md:px-4 py-2 text-center print:hidden">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteEntry(entry.id)}
                                className="text-red-600 hover:bg-red-50 p-1"
                              >
                                <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-red-200 font-bold">
                          <td colSpan={3} className="border-2 border-gray-800 px-2 md:px-4 py-3 text-right text-sm md:text-base">TOTAL</td>
                          <td className="border-2 border-gray-800 px-2 md:px-4 py-3 text-right font-mono text-base md:text-lg">{totals.totalPayments}</td>
                          <td className="border-2 border-gray-800 print:hidden"></td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards */}
        {entries.length > 0 && (
          <>
            {/* Overall Summary */}
            <Card className="shadow-xl border-2 border-purple-300">
              <CardHeader className="bg-purple-600 text-white p-4">
                <CardTitle className="text-xl">Monthly Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
                    <p className="text-sm text-green-600 mb-1">Total Receipts</p>
                    <p className="text-2xl md:text-3xl font-bold text-green-700">Rs. {totals.totalReceipts}</p>
                  </div>
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-center">
                    <p className="text-sm text-red-600 mb-1">Total Payments</p>
                    <p className="text-2xl md:text-3xl font-bold text-red-700">Rs. {totals.totalPayments}</p>
                  </div>
                  <div className={`border-2 rounded-lg p-4 text-center ${totals.balanceType === 'Surplus' ? 'bg-blue-50 border-blue-300' : 'bg-orange-50 border-orange-300'}`}>
                    <p className={`text-sm mb-1 ${totals.balanceType === 'Surplus' ? 'text-blue-600' : 'text-orange-600'}`}>Net Balance ({totals.balanceType})</p>
                    <p className={`text-2xl md:text-3xl font-bold ${totals.balanceType === 'Surplus' ? 'text-blue-700' : 'text-orange-700'}`}>Rs. {totals.balance}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Person-wise Summary */}
            {personSummary.length > 0 && (
              <Card className="shadow-lg print:break-before-page">
                <CardHeader className="bg-indigo-600 text-white p-4">
                  <CardTitle className="text-xl">Person-wise Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-indigo-100">
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Person Name</th>
                          <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Received From</th>
                          <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Paid To</th>
                          <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Balance</th>
                          <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {personSummary.map((person, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="border border-gray-300 px-4 py-2 font-medium">{person.name}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right font-mono text-green-700">Rs. {person.received}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right font-mono text-red-700">Rs. {person.paid}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right font-mono font-bold">Rs. {person.balance}</td>
                            <td className="border border-gray-300 px-4 py-2 text-center">
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                person.balanceType === 'To Receive' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}>
                                {person.balanceType}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:break-before-page {
            page-break-before: always;
          }
        }
      `}</style>
    </div>
  );
}