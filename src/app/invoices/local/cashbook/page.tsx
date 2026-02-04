'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus, Trash2, Printer, ArrowLeft, Save, TrendingUp, TrendingDown, Edit2, Search, X, CheckCircle2, AlertCircle, ShoppingBag, Sparkles, Wallet, History, Receipt
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
  cityReference: string;
  particulars: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  source?: string;
  linked_transaction_id?: string;
  is_cashbook_entry?: boolean;
}

interface PersonHistory {
  date: string;
  particulars: string;
  amount: number;
  type: 'receipt' | 'payment' | 'ledger_debit' | 'ledger_credit';
  source: 'CASHBOOK' | 'LEDGER';
  folio?: string;
  city?: string;
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
  const [showPersonHistory, setShowPersonHistory] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
  const [personHistory, setPersonHistory] = useState<PersonHistory[]>([]);
  const [personSummary, setPersonSummary] = useState<{
    totalReceipts: number;
    totalPayments: number;
    ledgerDebit: number;
    ledgerCredit: number;
    netBalance: number;
  }>({ totalReceipts: 0, totalPayments: 0, ledgerDebit: 0, ledgerCredit: 0, netBalance: 0 });

  const [formData, setFormData] = useState({
    date: '',
    type: 'receipt' as 'receipt' | 'payment',
    personName: '',
    ledgerFolio: '',
    amount: '',
    cityReference: 'Karachi'
  });

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setCurrentDate(today);
    setFormData(prev => ({ ...prev, date: today }));
    fetchEntries();
  }, []);

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
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('source', 'CASHBOOK')
        .order('date', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedData = data?.map(item => ({
        id: item.id,
        date: item.date,
        // FIXED: Swap ledger debit/credit for cashbook display
        // Ledger DEBIT = Cashbook PAYMENT (Money Out)
        // Ledger CREDIT = Cashbook RECEIPT (Money In)
        type: (item.type === 'DEBIT' ? 'payment' : 'receipt') as 'receipt' | 'payment',
        personName: item.party_name,
        ledgerFolio: item.folio || '',
        amount: parseFloat(item.amount).toFixed(2),
        cityReference: item.city,
        particulars: item.particulars,
        user_id: item.user_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        source: item.source,
        linked_transaction_id: item.linked_transaction_id,
        is_cashbook_entry: item.is_cashbook_entry
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

  // Fetch person complete history
  const fetchPersonCompleteHistory = async (personName: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Fetch both cashbook and ledger entries for this person
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('party_name', personName)
        .or('source.eq.CASHBOOK,source.eq.LEDGER')
        .order('date', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;

      const history: PersonHistory[] = (data || []).map(item => {
        let type: 'receipt' | 'payment' | 'ledger_debit' | 'ledger_credit';
        
        if (item.source === 'CASHBOOK') {
          // FIXED: For cashbook display, swap the types
          type = item.type === 'DEBIT' ? 'payment' : 'receipt'; // Changed this line
        } else {
          type = item.type === 'DEBIT' ? 'ledger_debit' : 'ledger_credit';
        }

        return {
          date: item.date,
          particulars: item.particulars,
          amount: parseFloat(item.amount),
          type: type,
          source: item.source,
          folio: item.folio,
          city: item.city
        };
      });

      // Calculate summary
      const summary = {
        totalReceipts: history.filter(h => h.type === 'receipt').reduce((sum, h) => sum + h.amount, 0),
        totalPayments: history.filter(h => h.type === 'payment').reduce((sum, h) => sum + h.amount, 0),
        ledgerDebit: history.filter(h => h.type === 'ledger_debit').reduce((sum, h) => sum + h.amount, 0),
        ledgerCredit: history.filter(h => h.type === 'ledger_credit').reduce((sum, h) => sum + h.amount, 0),
        netBalance: 0
      };

      // Calculate net balance: (Receipts + Ledger Credit) - (Payments + Ledger Debit)
      summary.netBalance = (summary.totalReceipts + summary.ledgerCredit) - (summary.totalPayments + summary.ledgerDebit);

      setPersonHistory(history);
      setPersonSummary(summary);
      setSelectedPerson(personName);
      setShowPersonHistory(true);

      return history;
    } catch (error) {
      console.error('Error fetching person history:', error);
      showNotification('Failed to load person history', 'error');
      return [];
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

      // **IMPORTANT: Database mein correct mapping rakho**
      // Cashbook:
      // - Receipt = CREDIT (Money in)
      // - Payment = DEBIT (Money out)
      // But display ke liye hum swapped karte hain:
      // - Ledger Debit = Cashbook Payment
      // - Ledger Credit = Cashbook Receipt

      const dbType = formData.type === 'receipt' ? 'CREDIT' : 'DEBIT';
      const particulars = formData.type === 'receipt' 
        ? `Cash received from ${formData.personName}` 
        : `Cash paid to ${formData.personName}`;

      // Insert into transactions as CASHBOOK source
      const { data: newTransaction, error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          date: formData.date,
          party_id: '',
          party_name: formData.personName,
          particulars: particulars,
          folio: formData.ledgerFolio,
          amount: amountVal,
          type: dbType, // Database mein CREDIT/DEBIT
          city: formData.cityReference,
          source: 'CASHBOOK',
          is_cashbook_entry: true,
          entry_type: 'CASH'
        }])
        .select()
        .single();

      if (error) throw error;

      await fetchEntries();

      setFormData({
        date: currentDate,
        type: 'receipt',
        personName: '',
        ledgerFolio: '',
        amount: '',
        cityReference: 'Karachi'
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
      // Get the original entry to check if it's linked
      const { data: originalEntry, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', editingId)
        .single();

      if (fetchError) throw fetchError;

      // **IMPORTANT: Database mein correct mapping**
      const dbType = formData.type === 'receipt' ? 'CREDIT' : 'DEBIT';
      const particulars = formData.type === 'receipt' 
        ? `Cash received from ${formData.personName}` 
        : `Cash paid to ${formData.personName}`;

      // Update the cashbook entry
      const { error } = await supabase
        .from('transactions')
        .update({
          date: formData.date,
          party_name: formData.personName,
          particulars: particulars,
          folio: formData.ledgerFolio,
          amount: amountVal,
          type: dbType, // Database mein CREDIT/DEBIT
          city: formData.cityReference,
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
        amount: '',
        cityReference: 'Karachi'
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
      const { data: entryToDelete, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Delete the cashbook entry
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchEntries();
      
      // Close person history modal if open and showing this person
      if (showPersonHistory && selectedPerson === entryToDelete.party_name) {
        setShowPersonHistory(false);
      }

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
      amount: entry.amount,
      cityReference: entry.cityReference
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
      amount: '',
      cityReference: 'Karachi'
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

  const getPersonSummaryList = () => {
    const summary: { [personName: string]: { received: number; paid: number } } = {};

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

  const totals = getTotals();
  const personSummaryList = getPersonSummaryList();

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

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

      {/* Person History Modal */}
      {showPersonHistory && selectedPerson && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-700 text-white p-6 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <Receipt className="h-6 w-6" />
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                    Complete History
                  </span>
                </div>
                <h2 className="text-2xl font-bold">{selectedPerson}</h2>
                <p className="text-pink-100 text-sm mt-1">
                  {personHistory.length} Total Transactions (Cash + Ledger)
                </p>
              </div>
              <button
                onClick={() => {
                  setShowPersonHistory(false);
                  setSelectedPerson(null);
                  setPersonHistory([]);
                }}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-6 bg-gray-50">
              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <p className="text-xs text-green-600 font-semibold">Cash Receipts</p>
                </div>
                <p className="text-2xl font-bold text-green-700">Rs. {personSummary.totalReceipts.toFixed(2)}</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <p className="text-xs text-red-600 font-semibold">Cash Payments</p>
                </div>
                <p className="text-2xl font-bold text-red-700">Rs. {personSummary.totalPayments.toFixed(2)}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4 text-blue-600" />
                  <p className="text-xs text-blue-600 font-semibold">Net Balance</p>
                </div>
                <p className={`text-2xl font-bold ${personSummary.netBalance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
                  Rs. {Math.abs(personSummary.netBalance).toFixed(2)} {personSummary.netBalance >= 0 ? '(To Receive)' : '(To Pay)'}
                </p>
              </div>
            </div>

            {/* Ledger Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-white border-t border-b border-gray-200">
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-2 border-indigo-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <History className="h-4 w-4 text-indigo-600" />
                  <p className="text-xs text-indigo-600 font-semibold">Ledger Debit</p>
                </div>
                <p className="text-xl font-bold text-indigo-700">Rs. {personSummary.ledgerDebit.toFixed(2)}</p>
                <p className="text-xs text-indigo-500 mt-1">Goods given on credit</p>
              </div>
              <div className="bg-gradient-to-br from-teal-50 to-teal-100 border-2 border-teal-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <History className="h-4 w-4 text-teal-600" />
                  <p className="text-xs text-teal-600 font-semibold">Ledger Credit</p>
                </div>
                <p className="text-xl font-bold text-teal-700">Rs. {personSummary.ledgerCredit.toFixed(2)}</p>
                <p className="text-xs text-teal-500 mt-1">Cash received in ledger</p>
              </div>
            </div>

            {/* Transaction History */}
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <History className="h-5 w-5 text-purple-600" />
                Transaction History
              </h3>
              <div className="space-y-3">
                {personHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="h-12 w-12 mx-auto text-gray-400" />
                    <p className="mt-4">No transactions found</p>
                  </div>
                ) : (
                  personHistory.map((entry, index) => (
                    <div
                      key={index}
                      className={`border-2 rounded-lg p-4 hover:shadow-md transition-shadow ${
                        entry.source === 'CASHBOOK' 
                          ? entry.type === 'receipt' 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-red-200 bg-red-50'
                          : entry.type === 'ledger_debit'
                            ? 'border-orange-200 bg-orange-50'
                            : 'border-teal-200 bg-teal-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">
                              {formatDate(entry.date)}
                            </div>
                            <div className={`px-2 py-1 rounded text-xs font-bold ${
                              entry.source === 'CASHBOOK'
                                ? entry.type === 'receipt'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                                : entry.type === 'ledger_debit'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-teal-100 text-teal-700'
                            }`}>
                              {entry.source === 'CASHBOOK' 
                                ? entry.type.toUpperCase()
                                : entry.type === 'ledger_debit' ? 'LEDGER DEBIT' : 'LEDGER CREDIT'
                              }
                            </div>
                            {entry.folio && (
                              <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                F: {entry.folio}
                              </div>
                            )}
                            {entry.city && (
                              <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                {entry.city}
                              </div>
                            )}
                          </div>

                          <p className="text-gray-800 font-medium mb-2">{entry.particulars}</p>

                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-gray-500 text-sm">Amount:</span>
                              <span className={`ml-2 font-bold text-lg ${
                                entry.type === 'receipt' || entry.type === 'ledger_credit'
                                  ? 'text-green-700'
                                  : 'text-red-700'
                              }`}>
                                Rs. {entry.amount.toFixed(2)}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              {entry.source} • {entry.type.includes('ledger') ? 'Auto-synced' : 'Manual'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <Button
                onClick={() => {
                  setShowPersonHistory(false);
                  setSelectedPerson(null);
                  setPersonHistory([]);
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800"
              >
                Close
              </Button>
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
                <Label className="text-sm">City Reference</Label>
                <select
                  value={formData.cityReference}
                  onChange={(e) => setFormData({ ...formData, cityReference: e.target.value })}
                  className="mt-1 w-full h-10 px-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Karachi">Karachi</option>
                  <option value="Lahore">Lahore</option>
                </select>
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
                            <tr 
                              key={entry.id} 
                              className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-green-50 transition-colors cursor-pointer`}
                              onClick={() => fetchPersonCompleteHistory(entry.personName)}
                            >
                              <td className="border border-gray-300 px-2 md:px-4 py-2 text-xs md:text-sm">{entry.date}</td>
                              <td className="border border-gray-300 px-2 md:px-4 py-2 text-xs md:text-sm font-medium">
                                <div className="flex items-center gap-2">
                                  {entry.personName}
                                  <History className="h-3 w-3 text-gray-400" />
                                </div>
                              </td>
                              <td className="border border-gray-300 px-2 md:px-4 py-2 text-center text-xs md:text-sm">{entry.ledgerFolio || '-'}</td>
                              <td className="border border-gray-300 px-2 md:px-4 py-2 text-right font-mono text-xs md:text-sm font-semibold text-green-700">{entry.amount}</td>
                              <td className="border border-gray-300 px-2 md:px-4 py-2 text-center print:hidden">
                                <div className="flex gap-1 justify-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEdit(entry);
                                    }}
                                    className="text-blue-600 hover:bg-blue-50 p-1"
                                  >
                                    <Edit2 className="h-3 w-3 md:h-4 md:w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteEntry(entry.id);
                                    }}
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
                            <tr 
                              key={entry.id} 
                              className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-red-50 transition-colors cursor-pointer`}
                              onClick={() => fetchPersonCompleteHistory(entry.personName)}
                            >
                              <td className="border border-gray-300 px-2 md:px-4 py-2 text-xs md:text-sm">{entry.date}</td>
                              <td className="border border-gray-300 px-2 md:px-4 py-2 text-xs md:text-sm font-medium">
                                <div className="flex items-center gap-2">
                                  {entry.personName}
                                  <History className="h-3 w-3 text-gray-400" />
                                </div>
                              </td>
                              <td className="border border-gray-300 px-2 md:px-4 py-2 text-center text-xs md:text-sm">{entry.ledgerFolio || '-'}</td>
                              <td className="border border-gray-300 px-2 md:px-4 py-2 text-right font-mono text-xs md:text-sm font-semibold text-red-700">{entry.amount}</td>
                              <td className="border border-gray-300 px-2 md:px-4 py-2 text-center print:hidden">
                                <div className="flex gap-1 justify-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEdit(entry);
                                    }}
                                    className="text-blue-600 hover:bg-blue-50 p-1"
                                  >
                                    <Edit2 className="h-3 w-3 md:h-4 md:w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteEntry(entry.id);
                                    }}
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
            {personSummaryList.length > 0 && (
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
                          <th className="border border-gray-300 px-4 py-3 text-center font-semibold print:hidden">View History</th>
                        </tr>
                      </thead>
                      <tbody>
                        {personSummaryList.map((person, index) => (
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
                            <td className="border border-gray-300 px-4 py-2 text-center print:hidden">
                              <Button
                                onClick={() => fetchPersonCompleteHistory(person.name)}
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-1"
                              >
                                <History className="h-3 w-3" />
                                History
                              </Button>
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