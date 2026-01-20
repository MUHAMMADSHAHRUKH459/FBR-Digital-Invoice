'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Printer, ArrowLeft, Save, Edit2, Search, X, CheckCircle2, AlertCircle, Calendar, HelpCircle, Download, Eye, Calculator, Building2 } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface LedgerEntry {
  id: string;
  date: string;
  particulars: string;
  folio: string;
  debit: string;
  credit: string;
  balance: string;
  type: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export default function LahoreLedgerPage() {
  const [currentDate, setCurrentDate] = useState('');
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<LedgerEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [balanceView, setBalanceView] = useState<'all' | 'debit' | 'credit'>('all');
  
  const [formData, setFormData] = useState({
    date: '',
    particulars: '',
    folio: '',
    debit: '',
    credit: ''
  });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setCurrentDate(today);
    setFormData(prev => ({ ...prev, date: today }));
    
    fetchEntries();
  }, []);

  // Search filter with autocomplete
  useEffect(() => {
    let filtered = entries;

    // Apply balance view filter
    if (balanceView === 'debit') {
      filtered = filtered.filter(e => parseFloat(e.debit) > 0);
    } else if (balanceView === 'credit') {
      filtered = filtered.filter(e => parseFloat(e.credit) > 0);
    }

    // Apply search filter
    if (searchQuery.trim() === '') {
      setFilteredEntries(filtered);
      setSuggestions([]);
      setShowSuggestions(false);
    } else {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.particulars.toLowerCase().includes(query) ||
        entry.folio.toLowerCase().includes(query)
      );
      setFilteredEntries(filtered);

      // Generate suggestions
      const uniqueParticulars = [...new Set(
        entries
          .map(e => e.particulars)
          .filter(p => p.toLowerCase().includes(query))
      )].slice(0, 5);
      
      setSuggestions(uniqueParticulars);
      setShowSuggestions(uniqueParticulars.length > 0);
    }
  }, [searchQuery, entries, balanceView]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        showNotification('Please login first!', 'error');
        return;
      }

      const { data, error } = await supabase
        .from('lahore_ledger')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedData = data?.map(item => ({
        id: item.id,
        date: item.date,
        particulars: item.particulars,
        folio: item.folio || '',
        debit: item.debit.toString(),
        credit: item.credit.toString(),
        balance: item.balance.toString(),
        type: item.type,
        user_id: item.user_id,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) || [];

      setEntries(formattedData);
      setFilteredEntries(formattedData);
    } catch (error: any) {
      console.error('Error fetching entries:', error);
      showNotification('Failed to load entries: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

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

  const showNotification = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      alert(message);
    }
  };

  const addEntry = async () => {
    if (!formData.particulars.trim()) {
      showNotification('Please enter particulars!', 'error');
      return;
    }

    const debitVal = parseFloat(formData.debit) || 0;
    const creditVal = parseFloat(formData.credit) || 0;

    if (debitVal === 0 && creditVal === 0) {
      showNotification('Please enter either debit or credit amount!', 'error');
      return;
    }

    if (debitVal > 0 && creditVal > 0) {
      showNotification('Please enter only one amount (either Debit OR Credit)', 'error');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('lahore_ledger')
        .insert([{
          user_id: user.id,
          date: formData.date,
          particulars: formData.particulars,
          folio: formData.folio || `LH-${entries.length + 1}`,
          debit: debitVal,
          credit: creditVal,
          balance: 0,
          type: 'Dr'
        }]);

      if (error) throw error;

      await fetchEntries();

      setFormData({
        date: currentDate,
        particulars: '',
        folio: '',
        debit: '',
        credit: ''
      });

      showNotification('Entry added successfully!', 'success');
    } catch (error: any) {
      console.error('Error adding entry:', error);
      showNotification('Failed to add entry: ' + error.message, 'error');
    }
  };

  const updateEntry = async () => {
    if (!editingId) return;

    if (!formData.particulars.trim()) {
      showNotification('Please enter particulars!', 'error');
      return;
    }

    const debitVal = parseFloat(formData.debit) || 0;
    const creditVal = parseFloat(formData.credit) || 0;

    try {
      const { error } = await supabase
        .from('lahore_ledger')
        .update({
          date: formData.date,
          particulars: formData.particulars,
          folio: formData.folio,
          debit: debitVal,
          credit: creditVal,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);

      if (error) throw error;

      await fetchEntries();
      
      setEditingId(null);
      setFormData({
        date: currentDate,
        particulars: '',
        folio: '',
        debit: '',
        credit: ''
      });

      showNotification('Entry updated successfully!', 'success');
    } catch (error: any) {
      console.error('Error updating entry:', error);
      showNotification('Failed to update entry: ' + error.message, 'error');
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const { error } = await supabase
        .from('lahore_ledger')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchEntries();
      showNotification('Entry deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Error deleting entry:', error);
      showNotification('Failed to delete entry: ' + error.message, 'error');
    }
  };

  const startEdit = (entry: LedgerEntry) => {
    setEditingId(entry.id);
    setFormData({
      date: entry.date,
      particulars: entry.particulars,
      folio: entry.folio,
      debit: entry.debit,
      credit: entry.credit
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      date: currentDate,
      particulars: '',
      folio: '',
      debit: '',
      credit: ''
    });
  };

  const getTotals = () => {
    const totalDebit = filteredEntries.reduce((sum, e) => sum + (parseFloat(e.debit) || 0), 0);
    const totalCredit = filteredEntries.reduce((sum, e) => sum + (parseFloat(e.credit) || 0), 0);
    const finalBalance = totalDebit - totalCredit;
    
    return {
      totalDebit: totalDebit.toFixed(2),
      totalCredit: totalCredit.toFixed(2),
      finalBalance: Math.abs(finalBalance).toFixed(2),
      finalType: finalBalance >= 0 ? 'Dr' : 'Cr'
    };
  };

  const totals = getTotals();

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (editingId) {
        updateEntry();
      } else {
        addEntry();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50 p-3 sm:p-4 md:p-6">
      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6" />
            <div>
              <p className="font-semibold">Success!</p>
              <p className="text-sm">Lahore entry saved successfully</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl shadow-xl p-4 md:p-6 text-white print:rounded-none">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <Link href="/invoices/local" className="print:hidden">
                <Button variant="outline" size="sm" className="bg-white/20 hover:bg-white/30 border-white/40 text-white">
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                  <Building2 className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">AI Fashion LAHORE LEDGER</h1>
                  <p className="text-emerald-100 text-sm mt-1">{new Date(currentDate).getFullYear()}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={() => setShowHelp(!showHelp)} 
                size="sm" 
                variant="outline"
                className="print:hidden bg-white/10 hover:bg-white/20 border-white/30 text-white"
              >
                <HelpCircle className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Help</span>
              </Button>
              <Button 
                onClick={() => window.print()} 
                size="sm" 
                className="print:hidden bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              >
                <Printer className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Print</span>
              </Button>
            </div>
          </div>

          {/* Help Panel */}
          {showHelp && (
            <div className="mt-4 p-5 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold">📚 Quick Guide</h3>
                <Button size="sm" variant="ghost" onClick={() => setShowHelp(false)} className="text-white hover:bg-white/20">
                  Close
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-bold mb-2">💡 Quick Tips</h4>
                  <ul className="space-y-2 text-gray-200">
                    <li>• Enter only one amount per entry</li>
                    <li>• Press Enter to save quickly</li>
                    <li>• Data syncs to cloud automatically</li>
                  </ul>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-bold mb-2">📝 Accounting Rules</h4>
                  <ul className="space-y-2 text-gray-200">
                    <li>• <span className="text-red-300">Debit:</span> Money received</li>
                    <li>• <span className="text-green-300">Credit:</span> Money paid</li>
                    <li>• Balance calculates automatically</li>
                  </ul>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <h4 className="font-bold mb-2">🛠️ Features</h4>
                  <ul className="space-y-2 text-gray-200">
                    <li>• Search with autocomplete</li>
                    <li>• Filter by Debit/Credit</li>
                    <li>• Edit and delete entries</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Date and Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20 print:hidden">
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
              <Label className="text-white/90 text-sm font-semibold">Current Date:</Label>
              <Input
                type="date"
                value={currentDate}
                onChange={(e) => {
                  setCurrentDate(e.target.value);
                  setFormData(prev => ({ ...prev, date: e.target.value }));
                }}
                className="mt-2 bg-white/20 border-white/30 text-white"
              />
            </div>
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
              <Label className="text-white/90 text-sm font-semibold">Current Month:</Label>
              <div className="text-2xl font-bold mt-2">
                {new Date(currentDate).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </div>
            </div>
            <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
              <Label className="text-white/90 text-sm font-semibold">Total Entries:</Label>
              <div className="text-2xl font-bold mt-2">{entries.length} Records</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="print:hidden">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
              <Input
                type="text"
                placeholder="Search by name or folio number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowSuggestions(true)}
                className="pl-10 pr-10 h-12 border-2 border-gray-300 focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setShowSuggestions(false);
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                >
                  <X className="h-5 w-5" />
                </button>
              )}

              {/* Autocomplete Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(suggestion);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-gray-200 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700">{suggestion}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {searchQuery && (
              <div className="flex items-center gap-2 mt-3">
                <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-medium">
                  {filteredEntries.length} result(s) found
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Entry Form */}
        <Card className="print:hidden">
          <CardHeader className={`${editingId ? 'bg-green-600' : 'bg-gradient-to-r from-amber-600 to-orange-700'} text-white p-5`}>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl flex items-center gap-2">
                {editingId ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                {editingId ? 'Edit Lahore Entry' : 'Add New Lahore Transaction'}
              </CardTitle>
              <div className="text-sm bg-white/20 px-3 py-1.5 rounded-full">
                Press <kbd className="bg-white/30 px-2 py-0.5 rounded font-bold">Enter</kbd> to Save
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 md:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4" onKeyDown={handleKeyPress}>
              <div className="lg:col-span-1">
                <Label className="text-sm font-semibold flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Date
                </Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-2"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-2">
                <Label className="text-sm font-semibold">Particulars *</Label>
                <Input
                  value={formData.particulars}
                  onChange={(e) => setFormData({ ...formData, particulars: e.target.value })}
                  placeholder="Enter description"
                  className="mt-2"
                  autoFocus
                />
              </div>
              <div>
                <Label className="text-sm font-semibold">Folio</Label>
                <Input
                  value={formData.folio}
                  onChange={(e) => setFormData({ ...formData, folio: e.target.value })}
                  placeholder="LH-001"
                  className="mt-2"
                />
              </div>
              <div>
                <Label className="text-sm font-semibold text-red-600">Debit (Rs.)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.debit}
                  onChange={(e) => setFormData({ ...formData, debit: e.target.value, credit: e.target.value ? '' : formData.credit })}
                  placeholder="0.00"
                  className="mt-2 border-red-300 bg-red-50"
                />
                <p className="text-xs text-gray-500 mt-1">Money In</p>
              </div>
              <div>
                <Label className="text-sm font-semibold text-green-600">Credit (Rs.)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.credit}
                  onChange={(e) => setFormData({ ...formData, credit: e.target.value, debit: e.target.value ? '' : formData.debit })}
                  placeholder="0.00"
                  className="mt-2 border-green-300 bg-green-50"
                />
                <p className="text-xs text-gray-500 mt-1">Money Out</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pt-6 border-t">
              <div className="flex gap-3">
                {editingId ? (
                  <>
                    <Button onClick={updateEntry} className="bg-green-600 hover:bg-green-700">
                      <Save className="h-4 w-4 mr-2" />
                      Update Entry
                    </Button>
                    <Button onClick={cancelEdit} variant="outline">
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button onClick={addEntry} className="bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-700 hover:to-orange-800">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Entry
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Filter:</span>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <Button
                    size="sm"
                    variant={balanceView === 'all' ? 'default' : 'ghost'}
                    onClick={() => setBalanceView('all')}
                    className={balanceView === 'all' ? 'bg-teal-600' : ''}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                    All
                  </Button>
                  <Button
                    size="sm"
                    variant={balanceView === 'debit' ? 'default' : 'ghost'}
                    onClick={() => setBalanceView('debit')}
                    className={balanceView === 'debit' ? 'bg-red-600' : ''}
                  >
                    Debit
                  </Button>
                  <Button
                    size="sm"
                    variant={balanceView === 'credit' ? 'default' : 'ghost'}
                    onClick={() => setBalanceView('credit')}
                    className={balanceView === 'credit' ? 'bg-green-600' : ''}
                  >
                    Credit
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ledger Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Lahore Transaction Ledger
                </h2>
                <p className="text-gray-300 text-sm mt-1">
                  Showing {filteredEntries.length} of {entries.length} entries
                </p>
              </div>
              {entries.length > 0 && (
                <div className="bg-white/10 px-4 py-2 rounded-lg">
                  <span className="text-gray-300 text-sm">Net Balance:</span>
                  <span className={`ml-2 font-bold text-lg ${totals.finalType === 'Dr' ? 'text-red-300' : 'text-green-300'}`}>
                    Rs. {totals.finalBalance} {totals.finalType}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading entries...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-800 text-white">
                    <th className="border border-gray-600 px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold">Date</th>
                    <th className="border border-gray-600 px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold">Particulars</th>
                    <th className="border border-gray-600 px-2 md:px-4 py-3 text-center text-xs md:text-sm font-semibold">Folio</th>
                    <th className="border border-gray-600 px-2 md:px-4 py-3 text-right text-xs md:text-sm font-semibold">
                      Debit<br/>
                      <span className="text-xs font-normal">Rs. Ps.</span>
                    </th>
                    <th className="border border-gray-600 px-2 md:px-4 py-3 text-right text-xs md:text-sm font-semibold">
                      Credit<br/>
                      <span className="text-xs font-normal">Rs. Ps.</span>
                    </th>
                    <th className="border border-gray-600 px-2 md:px-4 py-3 text-center text-xs md:text-sm font-semibold">Dr/Cr</th>
                    <th className="border border-gray-600 px-2 md:px-4 py-3 text-right text-xs md:text-sm font-semibold">
                      Balance<br/>
                      <span className="text-xs font-normal">Rs. Ps.</span>
                    </th>
                    <th className="border border-gray-600 px-2 md:px-4 py-3 text-center text-xs md:text-sm font-semibold print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="border border-gray-300 px-4 py-8 md:py-12 text-center text-gray-500 text-sm">
                        {searchQuery || balanceView !== 'all' ? (
                          <div className="flex flex-col items-center gap-3">
                            <AlertCircle className="h-12 w-12 text-gray-400" />
                            <p className="text-lg font-medium">No entries found</p>
                            <p className="text-sm">Try adjusting your filters or search criteria</p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-3">
                            <Building2 className="h-12 w-12 text-gray-400" />
                            <p className="text-lg font-medium">No Lahore transactions yet</p>
                            <p className="text-sm">Add your first transaction using the form above</p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : (
                    <>
                      {calculateBalance(filteredEntries).map((entry, index) => (
                        <tr key={entry.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-amber-50 transition-colors`}>
                          <td className="border border-gray-300 px-2 md:px-4 py-2 text-xs md:text-sm">{entry.date}</td>
                          <td className="border border-gray-300 px-2 md:px-4 py-2 text-xs md:text-sm">{entry.particulars}</td>
                          <td className="border border-gray-300 px-2 md:px-4 py-2 text-center text-xs md:text-sm">
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">{entry.folio || '-'}</span>
                          </td>
                          <td className="border border-gray-300 px-2 md:px-4 py-2 text-right font-mono text-xs md:text-sm">
                            {parseFloat(entry.debit) > 0 ? (
                              <span className="bg-red-50 px-3 py-1 rounded-lg text-red-700 font-bold">{entry.debit}</span>
                            ) : '-'}
                          </td>
                          <td className="border border-gray-300 px-2 md:px-4 py-2 text-right font-mono text-xs md:text-sm">
                            {parseFloat(entry.credit) > 0 ? (
                              <span className="bg-green-50 px-3 py-1 rounded-lg text-green-700 font-bold">{entry.credit}</span>
                            ) : '-'}
                          </td>
                          <td className="border border-gray-300 px-2 md:px-4 py-2 text-center font-semibold text-xs md:text-sm">
                            <span className={`px-2 py-1 rounded ${entry.type === 'Dr' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              {entry.type}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-2 md:px-4 py-2 text-right font-mono font-semibold text-xs md:text-sm">
                            {entry.balance}
                          </td>
                          <td className="border border-gray-300 px-2 md:px-4 py-2 text-center print:hidden">
                            <div className="flex gap-1 justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEdit(entry)}
                                className="text-blue-600 hover:bg-blue-50 p-1"
                              >
                                <Edit2 className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteEntry(entry.id)}
                                className="text-red-600 hover:bg-red-50 p-1"
                              >
                                <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      
                      {/* Total Row */}
                      <tr className="bg-gradient-to-r from-amber-100 to-amber-50 font-bold">
                        <td colSpan={3} className="border-2 border-gray-800 px-2 md:px-4 py-3 text-right text-sm md:text-lg">
                          LAHORE TOTAL
                        </td>
                        <td className="border-2 border-gray-800 px-2 md:px-4 py-3 text-right font-mono text-sm md:text-lg">
                          <span className="bg-red-100 px-4 py-2 rounded-lg text-red-800">{totals.totalDebit}</span>
                        </td>
                        <td className="border-2 border-gray-800 px-2 md:px-4 py-3 text-right font-mono text-sm md:text-lg">
                          <span className="bg-green-100 px-4 py-2 rounded-lg text-green-800">{totals.totalCredit}</span>
                        </td>
                        <td className="border-2 border-gray-800 px-2 md:px-4 py-3 text-center text-sm md:text-lg">
                          <span className={`px-3 py-1 rounded-xl ${totals.finalType === 'Dr' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
                            {totals.finalType}
                          </span>
                        </td>
                        <td className="border-2 border-gray-800 px-2 md:px-4 py-3 text-right font-mono text-base md:text-xl">
                          {totals.finalBalance}
                        </td>
                        <td className="border-2 border-gray-800 print:hidden"></td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {filteredEntries.length > 0 && (
            <div className="md:hidden bg-gray-100 px-4 py-2 text-xs text-gray-600 text-center">
              ← Scroll horizontally to view all columns →
            </div>
          )}
        </div>

        {/* Summary Cards */}
        {entries.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-gradient-to-br from-red-50 to-white border-2 border-red-300 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg">Total Debit</h3>
                <div className="bg-red-100 p-3 rounded-xl">
                  <div className="text-red-600 text-xl">💰</div>
                </div>
              </div>
              <p className="text-4xl md:text-5xl font-bold text-red-700 mb-2">Rs. {totals.totalDebit}</p>
              <p className="text-sm text-gray-600 font-medium">Money received in Lahore</p>
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
              <p className="text-sm text-gray-600 font-medium">Money paid from Lahore</p>
              <div className="mt-4 text-xs text-gray-500">
                {entries.filter(e => parseFloat(e.credit) > 0).length} credit entries
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-teal-50 to-white border-2 border-teal-300 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 text-lg">Lahore Balance</h3>
                <div className={`p-3 rounded-xl ${totals.finalType === 'Dr' ? 'bg-red-100' : 'bg-green-100'}`}>
                  <div className={`text-xl ${totals.finalType === 'Dr' ? 'text-red-600' : 'text-green-600'}`}>⚖️</div>
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
              </div>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div className="text-center text-sm text-gray-600 py-5 print:hidden border-t mt-6">
          <p className="font-medium mb-2">💡 <strong>Note:</strong> Lahore Ledger data is securely stored in Supabase cloud.</p>
          <p className="text-xs">All changes sync automatically. Your data is safe and accessible from any device.</p>
        </div>

      </div>

      {/* Styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
        
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}