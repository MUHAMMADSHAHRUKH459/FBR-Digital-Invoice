'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus, Trash2, Printer, ArrowLeft, Save, TrendingUp, TrendingDown, Edit2, Search, X, CheckCircle2, AlertCircle, ShoppingBag, Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface CashEntry {
  id: string;
  date: string;
  type: 'receipt' | 'payment';
  personName: string;
  ledgerFolio: string;
  amount: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export default function CashBookPage() {
  const [currentDate, setCurrentDate] = useState('');
  const [entries, setEntries] = useState<CashEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<CashEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [formData, setFormData] = useState({
    date: '',
    type: 'receipt' as 'receipt' | 'payment',
    personName: '',
    ledgerFolio: '',
    amount: ''
  });

  // Load entries on mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setCurrentDate(today);
    setFormData(prev => ({ ...prev, date: today }));

    fetchEntries();
  }, []);

  // Search filter with autocomplete
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEntries(entries);
      setSuggestions([]);
      setShowSuggestions(false);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = entries.filter(entry =>
        entry.personName.toLowerCase().includes(query) ||
        entry.ledgerFolio.toLowerCase().includes(query)
      );
      setFilteredEntries(filtered);

      // Generate suggestions from unique person names
      const uniqueNames = [...new Set(
        entries
          .map(e => e.personName)
          .filter(p => p.toLowerCase().includes(query))
      )].slice(0, 5);

      setSuggestions(uniqueNames);
      setShowSuggestions(uniqueNames.length > 0);
    }
  }, [searchQuery, entries]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        showNotification('Please login first!', 'error');
        return;
      }

      const { data, error } = await supabase
        .from('cashbook')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedData = data?.map(item => ({
        id: item.id,
        date: item.date,
        type: item.type,
        personName: item.person_name,
        ledgerFolio: item.ledger_folio || '',
        amount: parseFloat(item.amount).toFixed(2),
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

  const showNotification = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccessMessage(message);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      alert(message);
    }
  };

  const addEntry = async () => {
    if (!formData.personName.trim()) {
      showNotification('Please enter person name!', 'error');
      return;
    }

    const amountVal = parseFloat(formData.amount);
    if (!amountVal || amountVal <= 0) {
      showNotification('Please enter valid amount!', 'error');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('cashbook')
        .insert([{
          user_id: user.id,
          date: formData.date,
          type: formData.type,
          person_name: formData.personName,
          ledger_folio: formData.ledgerFolio,
          amount: amountVal
        }]);

      if (error) throw error;

      await fetchEntries();

      // Reset form
      setFormData({
        date: currentDate,
        type: 'receipt',
        personName: '',
        ledgerFolio: '',
        amount: ''
      });

      showNotification('Entry added successfully!', 'success');
    } catch (error: any) {
      console.error('Error adding entry:', error);
      showNotification('Failed to add entry: ' + error.message, 'error');
    }
  };

  const updateEntry = async () => {
    if (!editingId) return;

    if (!formData.personName.trim()) {
      showNotification('Please enter person name!', 'error');
      return;
    }

    const amountVal = parseFloat(formData.amount);
    if (!amountVal || amountVal <= 0) {
      showNotification('Please enter valid amount!', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('cashbook')
        .update({
          date: formData.date,
          type: formData.type,
          person_name: formData.personName,
          ledger_folio: formData.ledgerFolio,
          amount: amountVal,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);

      if (error) throw error;

      await fetchEntries();

      setEditingId(null);
      setFormData({
        date: currentDate,
        type: 'receipt',
        personName: '',
        ledgerFolio: '',
        amount: ''
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
        .from('cashbook')
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

  const startEdit = (entry: CashEntry) => {
    setEditingId(entry.id);
    setFormData({
      date: entry.date,
      type: entry.type,
      personName: entry.personName,
      ledgerFolio: entry.ledgerFolio,
      amount: entry.amount
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      date: currentDate,
      type: 'receipt',
      personName: '',
      ledgerFolio: '',
      amount: ''
    });
  };

  const getReceipts = () => filteredEntries.filter(e => e.type === 'receipt');
  const getPayments = () => filteredEntries.filter(e => e.type === 'payment');

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

    filteredEntries.forEach(entry => {
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
      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6" />
            <div>
              <p className="font-semibold">Success!</p>
              <p className="text-sm">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* AI Fashion Header */}
        <div className="bg-gradient-to-r from-purple-800 to-pink-700 rounded-2xl shadow-xl p-4 md:p-6 text-white print:rounded-none">
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
                  <ShoppingBag className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-2">
                    AI FASHION CashBook <Sparkles className="h-6 w-6 text-yellow-300" />
                  </h1>
                  <p className="text-pink-100 text-sm mt-1">Cash Book - {new Date(currentDate).getFullYear()}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => window.print()}
                size="sm"
                className="print:hidden bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
              >
                <Printer className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Print</span>
              </Button>
            </div>
          </div>

          {/* Date Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-white/30 print:hidden">
            <div>
              <Label className="text-sm font-semibold text-white/80">Current Date:</Label>
              <Input
                type="date"
                value={currentDate}
                onChange={(e) => {
                  setCurrentDate(e.target.value);
                  setFormData(prev => ({ ...prev, date: e.target.value }));
                }}
                className="mt-1 w-full bg-white/10 border-white/30 text-white placeholder-white/70"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold text-white/80">Month:</Label>
              <div className="text-lg sm:text-xl font-bold text-pink-200 mt-1">
                {new Date(currentDate).toLocaleString('default', { month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar with Autocomplete */}
        <Card className="print:hidden">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
              <Input
                type="text"
                placeholder="Search by person name or folio number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowSuggestions(true)}
                className="pl-10 pr-10 h-12 border-2 border-gray-300 focus:border-purple-500"
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
                      className="w-full text-left px-4 py-3 hover:bg-purple-50 border-b border-gray-200 last:border-b-0 transition-colors"
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
                <div className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                  {filteredEntries.length} result(s) found
                </div>
                {filteredEntries.length > 0 && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-sm text-purple-600 hover:text-purple-800 underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Entry Form */}
        <Card className="print:hidden">
          <CardHeader className={`${editingId ? 'bg-green-600' : 'bg-gradient-to-r from-purple-600 to-pink-600'} text-white p-4`}>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              {editingId ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingId ? 'Edit Transaction' : 'Add New Transaction'}
            </CardTitle>
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
                  disabled={!!editingId}
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
            <div className="flex gap-2 mt-4">
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
                <Button onClick={addEntry} className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cash Book - Two Column Layout */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Loading entries...</p>
          </div>
        ) : (
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
                        <th className="border border-gray-300 px-2 md:px-4 py-2 text-center text-xs md:text-sm print:hidden">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getReceipts().length === 0 ? (
                        <tr>
                          <td colSpan={5} className="border border-gray-300 px-4 py-8 text-center text-gray-500 text-sm">
                            {searchQuery ? (
                              <div className="flex flex-col items-center gap-3">
                                <AlertCircle className="h-12 w-12 text-gray-400" />
                                <p className="text-lg font-medium">No receipts found</p>
                                <p className="text-sm">Try adjusting your search</p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-3">
                                <TrendingUp className="h-12 w-12 text-gray-400" />
                                <p className="text-lg font-medium">No receipts yet</p>
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : (
                        <>
                          {getReceipts().map((entry, index) => (
                            <tr key={entry.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50 transition-colors`}>
                              <td className="border border-gray-300 px-2 md:px-4 py-2 text-xs md:text-sm">{entry.date}</td>
                              <td className="border border-gray-300 px-2 md:px-4 py-2 text-xs md:text-sm">{entry.personName}</td>
                              <td className="border border-gray-300 px-2 md:px-4 py-2 text-center text-xs md:text-sm">{entry.ledgerFolio || '-'}</td>
                              <td className="border border-gray-300 px-2 md:px-4 py-2 text-right font-mono text-xs md:text-sm font-semibold text-green-700">{entry.amount}</td>
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
                        <th className="border border-gray-300 px-2 md:px-4 py-2 text-center text-xs md:text-sm print:hidden">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getPayments().length === 0 ? (
                        <tr>
                          <td colSpan={5} className="border border-gray-300 px-4 py-8 text-center text-gray-500 text-sm">
                            {searchQuery ? (
                              <div className="flex flex-col items-center gap-3">
                                <AlertCircle className="h-12 w-12 text-gray-400" />
                                <p className="text-lg font-medium">No payments found</p>
                                <p className="text-sm">Try adjusting your search</p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-3">
                                <TrendingDown className="h-12 w-12 text-gray-400" />
                                <p className="text-lg font-medium">No payments yet</p>
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : (
                        <>
                          {getPayments().map((entry, index) => (
                            <tr key={entry.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-red-50 transition-colors`}>
                              <td className="border border-gray-300 px-2 md:px-4 py-2 text-xs md:text-sm">{entry.date}</td>
                              <td className="border border-gray-300 px-2 md:px-4 py-2 text-xs md:text-sm">{entry.personName}</td>
                              <td className="border border-gray-300 px-2 md:px-4 py-2 text-center text-xs md:text-sm">{entry.ledgerFolio || '-'}</td>
                              <td className="border border-gray-300 px-2 md:px-4 py-2 text-right font-mono text-xs md:text-sm font-semibold text-red-700">{entry.amount}</td>
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
        )}

        {/* Summary Cards */}
        {filteredEntries.length > 0 && (
          <>
            {/* Overall Summary */}
            <Card className="shadow-xl border-2 border-purple-300">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
                <CardTitle className="text-xl">Monthly Summary</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center shadow-md hover:shadow-lg transition-shadow">
                    <p className="text-sm text-green-600 mb-1 font-medium">Total Receipts</p>
                    <p className="text-2xl md:text-3xl font-bold text-green-700">Rs. {totals.totalReceipts}</p>
                  </div>
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-center shadow-md hover:shadow-lg transition-shadow">
                    <p className="text-sm text-red-600 mb-1 font-medium">Total Payments</p>
                    <p className="text-2xl md:text-3xl font-bold text-red-700">Rs. {totals.totalPayments}</p>
                  </div>
                  <div className={`border-2 rounded-lg p-4 text-center shadow-md hover:shadow-lg transition-shadow ${totals.balanceType === 'Surplus' ? 'bg-blue-50 border-blue-300' : 'bg-orange-50 border-orange-300'}`}>
                    <p className={`text-sm mb-1 font-medium ${totals.balanceType === 'Surplus' ? 'text-blue-600' : 'text-orange-600'}`}>Net Balance ({totals.balanceType})</p>
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
                          <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-indigo-50 transition-colors`}>
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
