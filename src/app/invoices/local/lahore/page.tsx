'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Printer, ArrowLeft, Save, Calendar, HelpCircle, Download, Eye, EyeOff, FileText, Calculator, Building2 } from 'lucide-react';
import Link from 'next/link';

interface LedgerEntry {
  id: string;
  date: string;
  particulars: string;
  folio: string;
  debit: string;
  credit: string;
  balance: string;
  type: string;
}

export default function LahoreLedgerPage() {
  const [currentDate, setCurrentDate] = useState('');
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [formData, setFormData] = useState({
    date: '',
    particulars: '',
    folio: '',
    debit: '',
    credit: ''
  });
  const [showHelp, setShowHelp] = useState(false);
  const [balanceView, setBalanceView] = useState<'all' | 'debit' | 'credit'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setCurrentDate(today);
    setFormData(prev => ({ ...prev, date: today }));

    const saved = localStorage.getItem('lahore-ledger');
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load entries');
      }
    }
    setIsLoading(false);
  }, []);

  // Save to localStorage whenever entries change
  useEffect(() => {
    if (entries.length > 0) {
      localStorage.setItem('lahore-ledger', JSON.stringify(entries));
    }
  }, [entries]);

  const calculateBalance = (allEntries: LedgerEntry[]): LedgerEntry[] => {
    let runningBalance = 0;
    
    return allEntries.map((entry) => {
      const debit = parseFloat(entry.debit) || 0;
      const credit = parseFloat(entry.credit) || 0;
      
      runningBalance += debit - credit;
      
      return {
        ...entry,
        balance: Math.abs(runningBalance).toFixed(2),
        type: runningBalance >= 0 ? 'Dr' : 'Cr'
      };
    });
  };

  const addEntry = () => {
    if (!formData.particulars.trim()) {
      alert('❌ Please enter description in "Particulars" field!');
      return;
    }

    const debitVal = parseFloat(formData.debit) || 0;
    const creditVal = parseFloat(formData.credit) || 0;

    if (debitVal === 0 && creditVal === 0) {
      alert('❌ Please enter either Debit or Credit amount!');
      return;
    }

    if (debitVal > 0 && creditVal > 0) {
      alert('❌ Please enter only one amount (either Debit OR Credit)');
      return;
    }

    const newEntry: LedgerEntry = {
      id: Date.now().toString(),
      date: formData.date,
      particulars: formData.particulars,
      folio: formData.folio || `LH-${entries.length + 1}`,
      debit: debitVal.toFixed(2),
      credit: creditVal.toFixed(2),
      balance: '0.00',
      type: 'Dr'
    };

    const updatedEntries = calculateBalance([...entries, newEntry]);
    setEntries(updatedEntries);

    setFormData({
      date: currentDate,
      particulars: '',
      folio: '',
      debit: '',
      credit: ''
    });
  };

  const deleteEntry = (id: string) => {
    if (window.confirm('⚠️ Are you sure you want to delete this entry? This action cannot be undone.')) {
      const filtered = entries.filter(e => e.id !== id);
      const recalculated = calculateBalance(filtered);
      setEntries(recalculated);
      
      if (filtered.length === 0) {
        localStorage.removeItem('lahore-ledger');
      }
    }
  };

  const getTotals = () => {
    const totalDebit = entries.reduce((sum, e) => sum + (parseFloat(e.debit) || 0), 0);
    const totalCredit = entries.reduce((sum, e) => sum + (parseFloat(e.credit) || 0), 0);
    const finalBalance = totalDebit - totalCredit;
    
    return {
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
      finalBalance: Math.abs(finalBalance).toFixed(2),
      finalType: finalBalance >= 0 ? 'Dr' : 'Cr'
    };
  };

  const totals = getTotals();

  const handleSave = () => {
    if (entries.length === 0) {
      alert('⚠️ No entries to save! Please add some transactions first.');
      return;
    }
    
    const dataStr = JSON.stringify(entries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lahore-ledger-${currentDate}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('✅ Lahore Ledger saved and downloaded successfully!');
  };

  const filteredEntries = entries.filter(entry => {
    if (balanceView === 'debit') return parseFloat(entry.debit) > 0;
    if (balanceView === 'credit') return parseFloat(entry.credit) > 0;
    return true;
  });

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addEntry();
    }
  };

  const clearAllEntries = () => {
    if (window.confirm('⚠️ Are you sure you want to delete ALL entries from Lahore Ledger? This cannot be undone!')) {
      setEntries([]);
      localStorage.removeItem('lahore-ledger');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        
        {/* Header Section - Lahore Theme */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl shadow-xl p-4 md:p-6 text-white print:rounded-none print:shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Link href="/invoices/local" className="print:hidden">
                <Button variant="outline" size="sm" className="bg-white/20 hover:bg-white/30 border-white/40 text-white backdrop-blur-sm">
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Invoices</span>
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                    <Building2 className="h-7 w-7" />
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg">
                      LAHORE ACCOUNT LEDGER
                    </h1>
                    <p className="text-emerald-100 text-sm mt-1 font-medium">
                      Professional Lahore Branch Accounting • {new Date(currentDate).getFullYear()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => setShowHelp(!showHelp)} 
                size="sm" 
                variant="outline"
                className="print:hidden bg-white/10 hover:bg-white/20 border-white/30 text-white backdrop-blur-sm"
              >
                <HelpCircle className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Help Guide</span>
              </Button>
              <Button 
                onClick={handleSave} 
                size="sm" 
                className="print:hidden bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg"
                disabled={entries.length === 0}
              >
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Save Backup</span>
              </Button>
              <Button 
                onClick={() => window.print()} 
                size="sm" 
                className="print:hidden bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg"
                disabled={entries.length === 0}
              >
                <Printer className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Print Ledger</span>
              </Button>
            </div>
          </div>

          {/* Help Panel */}
          {showHelp && (
            <div className="mt-4 p-5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-white">📚 Lahore Ledger Guide</h3>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setShowHelp(false)}
                  className="text-white hover:bg-white/20"
                >
                  Close
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                    <div className="bg-amber-500 p-1 rounded">1</div>
                    💡 Quick Tips
                  </h4>
                  <ul className="space-y-2 text-gray-200">
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                      <span>Enter only <strong className="text-white">one amount</strong> per entry</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                      <span>Use <kbd className="bg-white/20 px-2 py-0.5 rounded text-xs">Tab</kbd> to navigate</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                      <span>Press <kbd className="bg-white/20 px-2 py-0.5 rounded text-xs">Enter</kbd> to save</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                    <div className="bg-green-500 p-1 rounded">2</div>
                    📝 Basic Rules
                  </h4>
                  <ul className="space-y-2 text-gray-200">
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                      <span><strong className="text-red-300">Debit:</strong> Money Received</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                      <span><strong className="text-green-300">Credit:</strong> Money Paid</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                      <span>Balance calculates automatically</span>
                    </li>
                  </ul>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-bold text-white mb-2 flex items-center gap-2">
                    <div className="bg-teal-500 p-1 rounded">3</div>
                    🛠️ Features
                  </h4>
                  <ul className="space-y-2 text-gray-200">
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                      <span>Auto-saves to browser</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                      <span>Filter by Debit/Credit</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1 h-1 bg-white rounded-full mt-2"></div>
                      <span>Print-friendly format</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Date and Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20 print:hidden">
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
              <Label className="text-white/90 text-sm font-semibold">📅 Current Date</Label>
              <Input
                type="date"
                value={currentDate}
                onChange={(e) => {
                  setCurrentDate(e.target.value);
                  setFormData(prev => ({ ...prev, date: e.target.value }));
                }}
                className="mt-3 bg-white/20 border-white/30 text-white font-medium placeholder:text-white/50 focus:ring-2 focus:ring-white/50 focus:border-transparent"
              />
            </div>
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
              <Label className="text-white/90 text-sm font-semibold">🗓️ Current Month</Label>
              <div className="text-2xl font-bold text-white mt-3">
                {new Date(currentDate).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </div>
            </div>
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
              <Label className="text-white/90 text-sm font-semibold">📊 Total Entries</Label>
              <div className="text-2xl font-bold text-white mt-3">{entries.length} Records</div>
              {entries.length > 0 && (
                <Button 
                  onClick={clearAllEntries}
                  variant="ghost" 
                  size="sm" 
                  className="mt-3 text-red-200 hover:text-red-300 hover:bg-white/10 text-xs"
                >
                  Clear All Entries
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Add Entry Form */}
        <Card className="print:hidden border-0 shadow-xl bg-white">
          <CardHeader className="bg-gradient-to-r from-amber-600 to-orange-700 text-white p-5 rounded-t-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add New Lahore Transaction
              </CardTitle>
              <div className="text-sm bg-white/20 px-3 py-1.5 rounded-full font-medium">
                Press <kbd className="bg-white/30 px-2 py-0.5 rounded mx-1 font-bold">Enter</kbd> to Save Quickly
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4" onKeyDown={handleKeyPress}>
              <div className="lg:col-span-1">
                <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-gray-500" />
                  Date
                </Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-2 focus:ring-2 focus:ring-amber-500 border-gray-300"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-2">
                <Label className="text-sm font-semibold text-gray-700">
                  📝 Particulars <span className="text-red-500 font-bold">*</span>
                </Label>
                <Input
                  value={formData.particulars}
                  onChange={(e) => setFormData({ ...formData, particulars: e.target.value })}
                  placeholder="Example: Lahore Branch - Cash received from customer"
                  className="mt-2 focus:ring-2 focus:ring-amber-500 border-gray-300"
                  autoFocus
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-gray-700">🔢 Folio No.</Label>
                <Input
                  value={formData.folio}
                  onChange={(e) => setFormData({ ...formData, folio: e.target.value })}
                  placeholder="Auto-generates as LH-001"
                  className="mt-2 focus:ring-2 focus:ring-blue-500 border-gray-300"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-red-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  Debit (Rs.)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.debit}
                  onChange={(e) => setFormData({ ...formData, debit: e.target.value, credit: e.target.value ? '' : formData.credit })}
                  placeholder="0.00"
                  className="mt-2 focus:ring-2 focus:ring-red-500 border-red-300 bg-red-50"
                />
                <p className="text-xs text-gray-500 mt-1">💰 Lahore Branch Money In</p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-green-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Credit (Rs.)
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.credit}
                  onChange={(e) => setFormData({ ...formData, credit: e.target.value, debit: e.target.value ? '' : formData.debit })}
                  placeholder="0.00"
                  className="mt-2 focus:ring-2 focus:ring-green-500 border-green-300 bg-green-50"
                />
                <p className="text-xs text-gray-500 mt-1">💸 Lahore Branch Money Out</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-3">
                <Button 
                  onClick={addEntry}
                  className="bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800 text-white shadow-lg px-6 py-2"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Lahore Entry
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFormData({
                      date: currentDate,
                      particulars: '',
                      folio: '',
                      debit: '',
                      credit: ''
                    });
                  }}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Clear Form
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="text-sm font-medium text-gray-700">Filter View:</div>
                <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-300">
                  <Button
                    size="sm"
                    variant={balanceView === 'all' ? 'default' : 'ghost'}
                    onClick={() => setBalanceView('all')}
                    className={`px-3 ${balanceView === 'all' ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200'}`}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={balanceView === 'debit' ? 'default' : 'ghost'}
                    onClick={() => setBalanceView('debit')}
                    className={`px-3 ${balanceView === 'debit' ? 'bg-red-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200'}`}
                  >
                    Debit Only
                  </Button>
                  <Button
                    size="sm"
                    variant={balanceView === 'credit' ? 'default' : 'ghost'}
                    onClick={() => setBalanceView('credit')}
                    className={`px-3 ${balanceView === 'credit' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-200'}`}
                  >
                    Credit Only
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ledger Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-300">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Lahore Transaction Ledger
                </h2>
                <p className="text-gray-300 text-sm mt-1 font-medium">
                  Showing {filteredEntries.length} of {entries.length} entries • Last updated: {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>
              {entries.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20">
                    <span className="text-gray-300 text-sm">Lahore Net Balance:</span>
                    <span className={`ml-2 font-bold text-lg ${
                      totals.finalType === 'Dr' ? 'text-red-300' : 'text-green-300'
                    }`}>
                      Rs. {totals.finalBalance} {totals.finalType}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[950px]">
              <thead>
                <tr className="bg-gradient-to-r from-gray-100 to-gray-150 border-b-2 border-gray-300">
                  <th className="px-5 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    📅 Date
                  </th>
                  <th className="px-5 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    📝 Particulars
                  </th>
                  <th className="px-5 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                    # Folio
                  </th>
                  <th className="px-5 py-4 text-right text-sm font-bold text-red-600 uppercase tracking-wider">
                    💰 Debit (Rs.)
                  </th>
                  <th className="px-5 py-4 text-right text-sm font-bold text-green-600 uppercase tracking-wider">
                    💸 Credit (Rs.)
                  </th>
                  <th className="px-5 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider">
                    ⚖️ Dr/Cr
                  </th>
                  <th className="px-5 py-4 text-right text-sm font-bold text-blue-600 uppercase tracking-wider">
                    📈 Balance (Rs.)
                  </th>
                  <th className="px-5 py-4 text-center text-sm font-bold text-gray-700 uppercase tracking-wider print:hidden">
                    🛠️ Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mb-4"></div>
                        <p className="text-gray-600 font-medium">Loading Lahore ledger data...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <div className="bg-gray-100 p-6 rounded-full mb-4">
                          <Building2 className="h-12 w-12 text-gray-400" />
                        </div>
                        <p className="text-xl font-semibold text-gray-700 mb-2">No Lahore transactions found</p>
                        <p className="text-gray-600 max-w-md">
                          {entries.length === 0 
                            ? "Start by adding your first Lahore transaction using the form above."
                            : "No entries match your current filter. Try changing the filter view."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {filteredEntries.map((entry, index) => (
                      <tr 
                        key={entry.id} 
                        className={`hover:bg-amber-50/30 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                      >
                        <td className="px-5 py-4 text-sm border-b border-gray-200">
                          <div className="font-medium text-gray-900">{entry.date}</div>
                        </td>
                        <td className="px-5 py-4 text-sm border-b border-gray-200 max-w-xs">
                          <div className="font-medium text-gray-900 truncate" title={entry.particulars}>
                            {entry.particulars}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center text-sm border-b border-gray-200">
                          <span className="font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                            {entry.folio}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right border-b border-gray-200">
                          {parseFloat(entry.debit) > 0 ? (
                            <span className="font-mono font-bold text-red-700 text-sm bg-red-50 px-3 py-1.5 rounded-lg inline-block">
                              Rs. {entry.debit}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right border-b border-gray-200">
                          {parseFloat(entry.credit) > 0 ? (
                            <span className="font-mono font-bold text-green-700 text-sm bg-green-50 px-3 py-1.5 rounded-lg inline-block">
                              Rs. {entry.credit}
                            </span>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-center border-b border-gray-200">
                          <span className={`inline-flex items-center justify-center w-12 h-7 rounded-lg text-sm font-bold ${
                            entry.type === 'Dr' 
                              ? 'bg-red-100 text-red-800 border border-red-200' 
                              : 'bg-green-100 text-green-800 border border-green-200'
                          }`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right border-b border-gray-200">
                          <span className="font-mono font-bold text-blue-800 text-sm bg-blue-50 px-3 py-1.5 rounded-lg inline-block">
                            Rs. {entry.balance}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center border-b border-gray-200 print:hidden">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteEntry(entry.id);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200"
                          >
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                    
                    {/* Total Row */}
                    <tr className="bg-gradient-to-r from-amber-100 to-amber-50 border-t-4 border-amber-400">
                      <td colSpan={3} className="px-5 py-5 text-right">
                        <div className="font-bold text-gray-900 text-lg flex items-center justify-end gap-2">
                          <div className="bg-amber-500 p-2 rounded-lg">
                            <Calculator className="h-5 w-5 text-white" />
                          </div>
                          LAHORE TOTAL
                        </div>
                      </td>
                      <td className="px-5 py-5 text-right">
                        <div className="font-mono font-bold text-red-800 text-lg bg-red-100 px-4 py-2.5 rounded-lg inline-block">
                          Rs. {totals.totalDebit}
                        </div>
                      </td>
                      <td className="px-5 py-5 text-right">
                        <div className="font-mono font-bold text-green-800 text-lg bg-green-100 px-4 py-2.5 rounded-lg inline-block">
                          Rs. {totals.totalCredit}
                        </div>
                      </td>
                      <td className="px-5 py-5 text-center">
                        <div className={`inline-flex items-center justify-center w-16 h-9 rounded-xl font-bold text-lg ${
                          totals.finalType === 'Dr' 
                            ? 'bg-red-200 text-red-900 border-2 border-red-300' 
                            : 'bg-green-200 text-green-900 border-2 border-green-300'
                        }`}>
                          {totals.finalType}
                        </div>
                      </td>
                      <td className="px-5 py-5 text-right">
                        <div className="font-mono font-bold text-blue-900 text-xl bg-blue-100 px-4 py-2.5 rounded-lg inline-block border-2 border-blue-300">
                          Rs. {totals.finalBalance}
                        </div>
                      </td>
                      <td className="print:hidden"></td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Scroll Hint */}
          {filteredEntries.length > 0 && (
            <div className="md:hidden bg-gray-900 px-4 py-3 text-center border-t border-gray-700">
              <div className="flex items-center justify-center gap-3 text-white text-sm font-medium">
                <span className="animate-pulse">←</span>
                Swipe left/right to view all columns
                <span className="animate-pulse">→</span>
              </div>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        {entries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 print:grid-cols-3 print:gap-3">
            <div className="bg-gradient-to-br from-red-50 to-white border-2 border-red-300 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg">Total Debit</h3>
                <div className="bg-red-100 p-3 rounded-xl">
                  <div className="text-red-600 text-xl">💰</div>
                </div>
              </div>
              <p className="text-4xl md:text-5xl font-bold text-red-700 mb-2">Rs. {totals.totalDebit}</p>
              <p className="text-sm text-gray-600 font-medium">Total money received in Lahore</p>
              <div className="mt-4 text-xs text-gray-500">
                {entries.filter(e => parseFloat(e.debit) > 0).length} debit entries
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-300 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg">Total Credit</h3>
                <div className="bg-green-100 p-3 rounded-xl">
                  <div className="text-green-600 text-xl">💸</div>
                </div>
              </div>
              <p className="text-4xl md:text-5xl font-bold text-green-700 mb-2">Rs. {totals.totalCredit}</p>
              <p className="text-sm text-gray-600 font-medium">Total money paid from Lahore</p>
              <div className="mt-4 text-xs text-gray-500">
                {entries.filter(e => parseFloat(e.credit) > 0).length} credit entries
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-teal-50 to-white border-2 border-teal-300 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg">Lahore Balance</h3>
                <div className={`p-3 rounded-xl ${
                  totals.finalType === 'Dr' ? 'bg-red-100' : 'bg-green-100'
                }`}>
                  <div className={`text-xl ${totals.finalType === 'Dr' ? 'text-red-600' : 'text-green-600'}`}>
                    ⚖️
                  </div>
                </div>
              </div>
              <p className="text-4xl md:text-5xl font-bold text-teal-800 mb-2">Rs. {totals.finalBalance}</p>
              <div className="flex items-center gap-3 mt-3">
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                  totals.finalType === 'Dr' 
                    ? 'bg-red-100 text-red-800 border border-red-300' 
                    : 'bg-green-100 text-green-800 border border-green-300'
                }`}>
                  {totals.finalType} Balance
                </span>
                <span className="text-sm text-gray-600 font-medium">
                  {totals.finalType === 'Dr' ? 'Lahore is owed money' : 'Lahore owes money'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="text-center text-sm text-gray-600 py-5 print:hidden border-t border-gray-200 mt-6">
          <p className="font-medium mb-2">💡 <strong>Note:</strong> Lahore Ledger automatically saves to your browser's local storage.</p>
          <p className="text-xs">Use the "Save Backup" button to download a permanent copy. Data is stored separately from Karachi Ledger.</p>
        </div>

      </div>

      {/* Global Styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
            background: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .bg-gradient-to-r, .bg-gradient-to-br {
            background: #f8fafc !important;
          }
          .text-white, .text-emerald-100, .text-gray-300 {
            color: #1f2937 !important;
          }
          .border-white\\/20, .border-white\\/30 {
            border-color: #d1d5db !important;
          }
          .bg-white\\/10, .bg-white\\/20 {
            background: #f3f4f6 !important;
          }
          .shadow-lg, .shadow-xl {
            box-shadow: none !important;
          }
          .rounded-2xl, .rounded-lg, .rounded-xl {
            border-radius: 0 !important;
          }
          table {
            break-inside: avoid;
          }
          th, td {
            color: #1f2937 !important;
            border-color: #d1d5db !important;
          }
        }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        ::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 5px;
        }
        ::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 5px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}</style>
    </div>
  );
}