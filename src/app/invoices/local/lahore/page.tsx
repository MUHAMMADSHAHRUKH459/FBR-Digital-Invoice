'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Plus, Trash2, Printer, ArrowLeft, Save, Edit2, Search, X, CheckCircle2, AlertCircle,
  Building2, Users, FileText, TrendingUp, TrendingDown, Calendar, Eye, Wallet, History,
  IndianRupee, CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface LedgerEntry {
  id: string;
  date: string;
  party_id: string;
  party_name: string;
  particulars: string;
  folio: string;
  debit: string;
  credit: string;
  balance: string;
  type: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
  source?: string;
  cashbook_synced?: boolean;
  linked_transaction_id?: string;
}

interface PartyData {
  party_id: string;
  party_name: string;
  total_debit: number;
  total_credit: number;
  balance: number;
  type: string;
  transaction_count: number;
  transactions?: LedgerEntry[];
  cashbook_entries?: any[];
  complete_history?: any[];
}

export default function KarachiLedgerPage() {
  const [currentDate, setCurrentDate] = useState('');
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<LedgerEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalEditingId, setModalEditingId] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [partySuggestions, setPartySuggestions] = useState<PartyData[]>([]);
  const [showPartySuggestions, setShowPartySuggestions] = useState(false);
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [selectedPartyData, setSelectedPartyData] = useState<PartyData | null>(null);
  const [showCompleteHistory, setShowCompleteHistory] = useState(false);

  const [showAddEntryInModal, setShowAddEntryInModal] = useState(false);
  const [modalAddFormData, setModalAddFormData] = useState({
    date: '',
    particulars: '',
    folio: '',
    debit: '',
    credit: ''
  });

  const [formData, setFormData] = useState({
    date: '',
    party_id: '',
    party_name: '',
    particulars: '',
    folio: '',
    debit: '',
    credit: ''
  });

  const [modalFormData, setModalFormData] = useState<{[key: string]: {
    date: string;
    particulars: string;
    folio: string;
    debit: string;
    credit: string;
  }}>({});

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setCurrentDate(today);
    setFormData(prev => ({ ...prev, date: today }));
    setModalAddFormData(prev => ({ ...prev, date: today }));
    fetchEntries();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      if (selectedParty) {
        const partyEntries = entries.filter(e => e.party_id === selectedParty);
        setFilteredEntries(partyEntries);
      } else {
        setFilteredEntries(entries);
      }
      setSuggestions([]);
      setShowSuggestions(false);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = entries.filter(entry =>
        entry.party_id.toLowerCase().includes(query) ||
        entry.party_name.toLowerCase().includes(query) ||
        entry.particulars.toLowerCase().includes(query) ||
        entry.folio.toLowerCase().includes(query)
      );
      setFilteredEntries(filtered);

      const uniqueSuggestions = [...new Set([
        ...entries.filter(e => e.party_id.toLowerCase().includes(query)).map(e => `${e.party_id} - ${e.party_name}`),
        ...entries.filter(e => e.party_name.toLowerCase().includes(query)).map(e => `${e.party_id} - ${e.party_name}`),
        ...entries.filter(e => e.particulars.toLowerCase().includes(query)).map(e => e.particulars)
      ])].slice(0, 8);

      setSuggestions(uniqueSuggestions);
      setShowSuggestions(uniqueSuggestions.length > 0);
    }
  }, [searchQuery, entries, selectedParty]);

  useEffect(() => {
    if (formData.party_name.trim() === '') {
      setPartySuggestions([]);
      setShowPartySuggestions(false);
      return;
    }

    const query = formData.party_name.toLowerCase();
    const partyMap = new Map<string, PartyData>();

    entries.forEach(entry => {
      if (entry.party_name.toLowerCase().includes(query)) {
        const key = entry.party_id;
        if (!partyMap.has(key)) {
          const partyEntries = entries.filter(e => e.party_id === key);
          const totalDebit = partyEntries.reduce((sum, e) => sum + parseFloat(e.debit), 0);
          const totalCredit = partyEntries.reduce((sum, e) => sum + parseFloat(e.credit), 0);
          const balance = totalDebit - totalCredit;

          partyMap.set(key, {
            party_id: entry.party_id,
            party_name: entry.party_name,
            total_debit: totalDebit,
            total_credit: totalCredit,
            balance: Math.abs(balance),
            type: balance >= 0 ? 'Dr' : 'Cr',
            transaction_count: partyEntries.length
          });
        }
      }
    });

    setPartySuggestions(Array.from(partyMap.values()).slice(0, 5));
    setShowPartySuggestions(partyMap.size > 0);
  }, [formData.party_name, entries]);

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
        .eq('city', 'Karachi')
        .eq('source', 'LEDGER')
        .order('date', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;

      const formattedData = data?.map(item => ({
        id: item.id,
        date: item.date,
        party_id: item.party_id || '',
        party_name: item.party_name || '',
        particulars: item.particulars,
        folio: item.folio || '',
        debit: item.type === 'DEBIT' ? item.amount.toString() : '0',
        credit: item.type === 'CREDIT' ? item.amount.toString() : '0',
        balance: item.balance?.toString() || '0',
        type: item.type === 'DEBIT' ? 'Dr' : 'Cr',
        user_id: item.user_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        source: item.source,
        cashbook_synced: item.cashbook_synced || false,
        linked_transaction_id: item.linked_transaction_id
      })) || [];

      const calculatedEntries = calculateBalance(formattedData);
      setEntries(calculatedEntries);
      setFilteredEntries(calculatedEntries);
    } catch (error: any) {
      console.error('Error fetching entries:', error);
      showNotification('Failed to load entries: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const generateNextPartyId = (): string => {
    if (entries.length === 0) return '001';

    const partyIds = entries
      .map(e => e.party_id)
      .filter(id => id && /^\d{3}$/.test(id))
      .map(id => parseInt(id));

    if (partyIds.length === 0) return '001';

    const maxId = Math.max(...partyIds);
    const nextId = maxId + 1;
    return nextId.toString().padStart(3, '0');
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

  const calculatePartyBalance = (partyId: string): LedgerEntry[] => {
    const partyEntries = entries.filter(e => e.party_id === partyId);
    let runningBalance = 0;

    return partyEntries.map((entry) => {
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PK', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
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

  // **UPDATED: Debit Entry ko Cashbook mein sync karein**
  const syncToCashbook = async (transactionId: string, entry: LedgerEntry) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const debitVal = parseFloat(entry.debit);
      if (debitVal > 0) {
        // Create cashbook entry as PAYMENT
        const { data: cashbookEntry, error } = await supabase
          .from('transactions')
          .insert([{
            user_id: user.id,
            date: entry.date,
            party_id: entry.party_id,
            party_name: entry.party_name,
            particulars: `Cash paid to ${entry.party_name} - ${entry.particulars}`,
            folio: entry.folio,
            amount: debitVal,
            type: 'DEBIT', // DEBIT = Payment in cashbook
            city: 'Karachi',
            source: 'CASHBOOK',
            is_cashbook_entry: true,
            linked_transaction_id: transactionId,
            entry_type: 'CASH'
          }])
          .select()
          .single();

        if (error) throw error;

        // Mark ledger entry as synced
        await supabase
          .from('transactions')
          .update({ cashbook_synced: true })
          .eq('id', transactionId);

        showNotification('Debit entry synced to Cash Book (Payments) successfully!', 'success');
        fetchEntries();
      }
    } catch (error: any) {
      console.error('Error syncing to cashbook:', error);
      showNotification('Failed to sync to Cash Book: ' + error.message, 'error');
    }
  };

  // Fetch complete history for party
  const fetchPartyCompleteHistory = async (partyId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .or(`party_id.eq.${partyId},party_name.eq.${selectedPartyData?.party_name}`)
        .or('source.eq.LEDGER,source.eq.CASHBOOK')
        .order('date', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching complete history:', error);
      return [];
    }
  };

  const addEntryFromModal = async () => {
    if (!selectedPartyData) return;

    if (!modalAddFormData.particulars.trim()) {
      showNotification('Please enter particulars!', 'error');
      return;
    }

    const debitVal = parseFloat(modalAddFormData.debit) || 0;
    const creditVal = parseFloat(modalAddFormData.credit) || 0;

    if (debitVal === 0 && creditVal === 0) {
      showNotification('Please enter either debit or credit amount!', 'error');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Insert ledger entry
      const { data: newTransaction, error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          date: modalAddFormData.date,
          party_id: selectedPartyData.party_id,
          party_name: selectedPartyData.party_name,
          particulars: modalAddFormData.particulars,
          folio: modalAddFormData.folio,
          amount: debitVal > 0 ? debitVal : creditVal,
          type: debitVal > 0 ? 'DEBIT' : 'CREDIT',
          city: 'Karachi',
          source: 'LEDGER',
          cashbook_synced: false
        }])
        .select()
        .single();

      if (error) throw error;

      // **UPDATED: DEBIT ko auto-sync karein**
      if (debitVal > 0) {
        await syncToCashbook(newTransaction.id, {
          ...newTransaction,
          debit: debitVal.toString(),
          credit: creditVal.toString(),
          balance: '0',
          type: 'Dr'
        });
      }

      await fetchEntries();

      const today = new Date().toISOString().split('T')[0];
      setModalAddFormData({
        date: today,
        particulars: '',
        folio: '',
        debit: '',
        credit: ''
      });

      setShowAddEntryInModal(false);
      setTimeout(() => openPartyModal(selectedPartyData.party_id), 100);

      showNotification('Entry added successfully!', 'success');
    } catch (error: any) {
      console.error('Error adding entry:', error);
      showNotification('Failed to add entry: ' + error.message, 'error');
    }
  };

  // **UPDATED: Debit aur Credit dono aik sath save honge**
  const addEntry = async () => {
    if (!formData.party_name.trim()) {
      showNotification('Please enter party name!', 'error');
      return;
    }

    if (!formData.particulars.trim()) {
      showNotification('Please enter particulars!', 'error');
      return;
    }

    const debitVal = parseFloat(formData.debit) || 0;
    const creditVal = parseFloat(formData.credit) || 0;

    // **CHANGED: Ab debit aur credit dono zero ho sakte hain (wo alag entries mein save honge)**
    // **But dono values zero nahi honi chahiye**
    if (debitVal === 0 && creditVal === 0) {
      showNotification('Please enter either debit or credit amount!', 'error');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      let partyId = formData.party_id;
      if (!partyId) {
        const existingParty = entries.find(e =>
          e.party_name.toLowerCase() === formData.party_name.toLowerCase()
        );

        if (existingParty) {
          partyId = existingParty.party_id;
        } else {
          partyId = generateNextPartyId();
        }
      }

      // **NEW: Multiple entries create karein agar dono debit aur credit ho**
      const transactionsToInsert = [];
      
      // Debit entry (agar hai)
      if (debitVal > 0) {
        transactionsToInsert.push({
          user_id: user.id,
          date: formData.date,
          party_id: partyId,
          party_name: formData.party_name,
          particulars: formData.particulars,
          folio: formData.folio,
          amount: debitVal,
          type: 'DEBIT',
          city: 'Karachi',
          source: 'LEDGER',
          cashbook_synced: false
        });
      }

      // Credit entry (agar hai)
      if (creditVal > 0) {
        transactionsToInsert.push({
          user_id: user.id,
          date: formData.date,
          party_id: partyId,
          party_name: formData.party_name,
          particulars: formData.particulars,
          folio: formData.folio,
          amount: creditVal,
          type: 'CREDIT',
          city: 'Karachi',
          source: 'LEDGER',
          cashbook_synced: false
        });
      }

      if (transactionsToInsert.length === 0) {
        showNotification('Please enter at least one amount!', 'error');
        return;
      }

      // Insert all transactions
      const { data: newTransactions, error } = await supabase
        .from('transactions')
        .insert(transactionsToInsert)
        .select();

      if (error) throw error;

      // **UPDATED: Sirf debit entries ko auto-sync karein**
      if (newTransactions) {
        for (const transaction of newTransactions) {
          if (transaction.type === 'DEBIT') {
            await syncToCashbook(transaction.id, {
              ...transaction,
              debit: transaction.amount.toString(),
              credit: '0',
              balance: '0',
              type: 'Dr'
            });
          }
        }
      }

      await fetchEntries();

      setFormData({
        date: currentDate,
        party_id: '',
        party_name: '',
        particulars: '',
        folio: '',
        debit: '',
        credit: ''
      });

      showNotification(`${transactionsToInsert.length} entry(s) added successfully!`, 'success');
    } catch (error: any) {
      console.error('Error adding entry:', error);
      showNotification('Failed to add entry: ' + error.message, 'error');
    }
  };

  const updateEntry = async () => {
    if (!editingId) return;

    if (!formData.party_name.trim()) {
      showNotification('Please enter party name!', 'error');
      return;
    }

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

    // **CHANGED: Ab dono zero nahi hone chahiye, lekin dono positive ho sakte hain (separate entries)**
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          date: formData.date,
          party_id: formData.party_id,
          party_name: formData.party_name,
          particulars: formData.particulars,
          folio: formData.folio,
          amount: debitVal > 0 ? debitVal : creditVal,
          type: debitVal > 0 ? 'DEBIT' : 'CREDIT',
          updated_at: new Date().toISOString()
        })
        .eq('id', editingId);

      if (error) throw error;

      await fetchEntries();

      setEditingId(null);
      setFormData({
        date: currentDate,
        party_id: '',
        party_name: '',
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

  const updateModalEntry = async (entryId: string) => {
    const formDataForEntry = modalFormData[entryId];
    if (!formDataForEntry) return;

    if (!formDataForEntry.particulars.trim()) {
      showNotification('Please enter particulars!', 'error');
      return;
    }

    const debitVal = parseFloat(formDataForEntry.debit) || 0;
    const creditVal = parseFloat(formDataForEntry.credit) || 0;

    if (debitVal === 0 && creditVal === 0) {
      showNotification('Please enter either debit or credit amount!', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          date: formDataForEntry.date,
          particulars: formDataForEntry.particulars,
          folio: formDataForEntry.folio,
          amount: debitVal > 0 ? debitVal : creditVal,
          type: debitVal > 0 ? 'DEBIT' : 'CREDIT',
          updated_at: new Date().toISOString()
        })
        .eq('id', entryId);

      if (error) throw error;

      await fetchEntries();

      if (selectedPartyData) {
        const partyId = selectedPartyData.party_id;
        setTimeout(() => openPartyModal(partyId), 100);
      }

      setModalEditingId(null);
      setModalFormData(prev => {
        const newData = { ...prev };
        delete newData[entryId];
        return newData;
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
      // First check if this entry has cashbook sync
      const entryToDelete = entries.find(e => e.id === id);
      
      // Delete linked cashbook entry if exists
      if (entryToDelete?.cashbook_synced) {
        await supabase
          .from('transactions')
          .delete()
          .eq('linked_transaction_id', id)
          .eq('source', 'CASHBOOK');
      }

      // Delete the ledger entry
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchEntries();

      if (showPartyModal && selectedPartyData) {
        const partyId = selectedPartyData.party_id;
        const remainingEntries = entries.filter(e => e.party_id === partyId && e.id !== id);
        if (remainingEntries.length > 0) {
          setTimeout(() => openPartyModal(partyId), 100);
        } else {
          setShowPartyModal(false);
        }
      }

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
      party_id: entry.party_id,
      party_name: entry.party_name,
      particulars: entry.particulars,
      folio: entry.folio,
      debit: entry.debit,
      credit: entry.credit
    });

    if (showPartyModal) {
      setShowPartyModal(false);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const startModalEdit = (entry: LedgerEntry) => {
    setModalEditingId(entry.id);
    setModalFormData(prev => ({
      ...prev,
      [entry.id]: {
        date: entry.date,
        particulars: entry.particulars,
        folio: entry.folio,
        debit: entry.debit,
        credit: entry.credit
      }
    }));
  };

  const cancelModalEdit = (entryId: string) => {
    setModalEditingId(null);
    setModalFormData(prev => {
      const newData = { ...prev };
      delete newData[entryId];
      return newData;
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      date: currentDate,
      party_id: '',
      party_name: '',
      particulars: '',
      folio: '',
      debit: '',
      credit: ''
    });
  };

  const selectPartyFromSuggestion = (party: PartyData) => {
    setFormData({
      ...formData,
      party_id: party.party_id,
      party_name: party.party_name
    });
    setShowPartySuggestions(false);
  };

  const openPartyModal = async (partyId: string) => {
    try {
      const partyEntries = entries.filter(e => e.party_id === partyId);
      const totalDebit = partyEntries.reduce((sum, e) => sum + parseFloat(e.debit), 0);
      const totalCredit = partyEntries.reduce((sum, e) => sum + parseFloat(e.credit), 0);
      const balance = totalDebit - totalCredit;

      // Fetch cashbook entries for this party
      const { data: { user } } = await supabase.auth.getUser();
      let cashbookEntries: any[] = [];

      if (user) {
        const { data } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('source', 'CASHBOOK')
          .eq('party_name', partyEntries[0]?.party_name || '')
          .order('date', { ascending: true });

        cashbookEntries = data || [];
      }

      const partyData: PartyData = {
        party_id: partyId,
        party_name: partyEntries[0]?.party_name || '',
        total_debit: totalDebit,
        total_credit: totalCredit,
        balance: Math.abs(balance),
        type: balance >= 0 ? 'Dr' : 'Cr',
        transaction_count: partyEntries.length,
        transactions: calculatePartyBalance(partyId),
        cashbook_entries: cashbookEntries
      };

      setSelectedPartyData(partyData);
      setShowPartyModal(true);
      setModalEditingId(null);
      setModalFormData({});
      setShowAddEntryInModal(false);
      setShowCompleteHistory(false);

      const today = new Date().toISOString().split('T')[0];
      setModalAddFormData({
        date: today,
        particulars: '',
        folio: '',
        debit: '',
        credit: ''
      });
    } catch (error) {
      console.error('Error opening party modal:', error);
      showNotification('Failed to load party data', 'error');
    }
  };

  const clearPartyFilter = () => {
    setSelectedParty(null);
    setFilteredEntries(entries);
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

  const getPartyList = (): PartyData[] => {
    const partyMap = new Map<string, PartyData>();

    entries.forEach(entry => {
      const key = entry.party_id;
      if (!partyMap.has(key) && key) {
        const partyEntries = entries.filter(e => e.party_id === key);
        const totalDebit = partyEntries.reduce((sum, e) => sum + parseFloat(e.debit), 0);
        const totalCredit = partyEntries.reduce((sum, e) => sum + parseFloat(e.credit), 0);
        const balance = totalDebit - totalCredit;

        partyMap.set(key, {
          party_id: entry.party_id,
          party_name: entry.party_name,
          total_debit: totalDebit,
          total_credit: totalCredit,
          balance: Math.abs(balance),
          type: balance >= 0 ? 'Dr' : 'Cr',
          transaction_count: partyEntries.length
        });
      }
    });

    return Array.from(partyMap.values()).sort((a, b) =>
      parseInt(a.party_id) - parseInt(b.party_id)
    );
  };

  const totals = getTotals();
  const partyList = getPartyList();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6">
      {/* Success Notification */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-4 rounded-lg shadow-2xl flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6" />
            <div>
              <p className="font-semibold">Success!</p>
              <p className="text-sm">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {showPartyModal && selectedPartyData && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-0 sm:p-4 overflow-y-auto">
    <div className="bg-white w-full min-h-screen sm:min-h-[90vh] sm:max-w-6xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      
      {/* Modal Header - Mobile Optimized */}
      <div className="bg-gradient-to-r from-teal-600 to-emerald-700 text-white p-4 sm:p-6 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="text-lg sm:text-2xl font-bold truncate">{selectedPartyData.party_name}</h2>
          </div>
          <button
            onClick={() => {
              setShowPartyModal(false);
              setModalEditingId(null);
              setModalFormData({});
              setShowAddEntryInModal(false);
              setShowCompleteHistory(false);
            }}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
        
        {/* Party Info Row - Mobile Responsive */}
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold">
            ID: {selectedPartyData.party_id}
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
            selectedPartyData.type === 'Dr' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'
          }`}>
            {selectedPartyData.type}
          </span>
          <div className="text-xs opacity-90">
            {selectedPartyData.transaction_count} Ledger • {selectedPartyData.cashbook_entries?.length || 0} Cash
          </div>
        </div>
      </div>

      {/* Summary Cards - Mobile Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 p-3 sm:p-6 bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Total Debit Card */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-200 rounded-lg sm:rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="h-4 w-4 text-red-600" />
            <p className="text-xs font-semibold text-red-600">Debit</p>
          </div>
          <p className="text-base sm:text-xl font-bold text-red-700 truncate">
            Rs. {selectedPartyData.total_debit.toFixed(2)}
          </p>
        </div>

        {/* Total Credit Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-lg sm:rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-1 mb-1">
            <TrendingDown className="h-4 w-4 text-green-600" />
            <p className="text-xs font-semibold text-green-600">Credit</p>
          </div>
          <p className="text-base sm:text-xl font-bold text-green-700 truncate">
            Rs. {selectedPartyData.total_credit.toFixed(2)}
          </p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg sm:rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-1 mb-1">
            <Calendar className="h-4 w-4 text-blue-600" />
            <p className="text-xs font-semibold text-blue-600 truncate">Bal ({selectedPartyData.type})</p>
          </div>
          <p className="text-base sm:text-xl font-bold text-blue-700 truncate">
            Rs. {selectedPartyData.balance.toFixed(2)}
          </p>
        </div>

        {/* Cash Entries Card */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg sm:rounded-xl p-3 shadow-sm">
          <div className="flex items-center gap-1 mb-1">
            <Wallet className="h-4 w-4 text-purple-600" />
            <p className="text-xs font-semibold text-purple-600 truncate">Cash</p>
          </div>
          <p className="text-base sm:text-xl font-bold text-purple-700">
            {selectedPartyData.cashbook_entries?.length || 0}
          </p>
        </div>
      </div>

      {/* History View Toggle - Mobile Friendly */}
      <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
        <button
          onClick={() => setShowCompleteHistory(false)}
          className={`flex-1 py-3 text-center text-sm font-medium ${!showCompleteHistory ? 'bg-gradient-to-r from-teal-600 to-emerald-700 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          Ledger
        </button>
        <button
          onClick={async () => {
            setShowCompleteHistory(true);
            const completeHistory = await fetchPartyCompleteHistory(selectedPartyData.party_id);
            setSelectedPartyData({
              ...selectedPartyData,
              complete_history: completeHistory
            });
          }}
          className={`flex-1 py-3 text-center text-sm font-medium ${showCompleteHistory ? 'bg-gradient-to-r from-teal-600 to-emerald-700 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
        >
          <div className="flex items-center justify-center gap-1">
            <History className="h-4 w-4" />
            <span className="hidden xs:inline">History</span>
          </div>
        </button>
      </div>

      {/* Add Entry Button Section - Mobile Optimized */}
<div className="px-3 sm:px-6 pt-3 pb-3 bg-gray-50 border-b border-gray-200">
  {!showAddEntryInModal ? (
    <Button
      onClick={() => {
        setShowAddEntryInModal(true);
        // Jab Add Entry click karein, to form ko pre-fill karein
        if (selectedPartyData) {
          // Last entry se particulars aur folio lein (agar maujood ho)
          const lastEntry = selectedPartyData.transactions?.[selectedPartyData.transactions.length - 1];
          setModalAddFormData({
            date: new Date().toISOString().split('T')[0],
            particulars: lastEntry?.particulars || `Transaction for ${selectedPartyData.party_name}`,
            folio: lastEntry?.folio || '',
            debit: '',
            credit: ''
          });
        }
      }}
      className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-lg text-sm py-2"
    >
      <Plus className="h-4 w-4 mr-2" />
      Add Entry
    </Button>
  ) : (
    <div className="bg-white border-2 border-teal-300 rounded-lg sm:rounded-xl p-3 space-y-3 shadow-lg">
      <div className="flex items-center justify-between mb-1">
        <h4 className="font-bold text-teal-700 text-sm">Add New Transaction for {selectedPartyData?.party_name}</h4>
        <button
          onClick={() => {
            setShowAddEntryInModal(false);
            const today = new Date().toISOString().split('T')[0];
            setModalAddFormData({
              date: today,
              particulars: '',
              folio: '',
              debit: '',
              credit: ''
            });
          }}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Pre-filled Info */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 mb-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-teal-600 font-semibold">Party:</span>
            <span className="ml-2 font-bold">{selectedPartyData?.party_name}</span>
          </div>
          <div>
            <span className="text-teal-600 font-semibold">Party ID:</span>
            <span className="ml-2 font-bold">{selectedPartyData?.party_id}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <Label className="text-xs font-semibold">Date</Label>
          <Input
            type="date"
            value={modalAddFormData.date}
            onChange={(e) => setModalAddFormData(prev => ({ ...prev, date: e.target.value }))}
            className="mt-1 text-sm h-9"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold">Folio</Label>
          <Input
            value={modalAddFormData.folio}
            onChange={(e) => setModalAddFormData(prev => ({ ...prev, folio: e.target.value }))}
            placeholder="Leave empty if same as before"
            className="mt-1 text-sm h-9"
          />
        </div>
      </div>

      <div>
        <Label className="text-xs font-semibold">Particulars</Label>
        <Input
          value={modalAddFormData.particulars}
          onChange={(e) => setModalAddFormData(prev => ({ ...prev, particulars: e.target.value }))}
          placeholder="Enter transaction description"
          className="mt-1 text-sm h-9"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <Label className="text-xs font-semibold flex items-center gap-1">
            <IndianRupee className="h-3 w-3" />
            Debit (Auto-sync to Cashbook)
          </Label>
          <Input
            type="number"
            step="0.01"
            value={modalAddFormData.debit}
            onChange={(e) => {
              setModalAddFormData(prev => ({ 
                ...prev, 
                debit: e.target.value,
                credit: e.target.value ? '0' : prev.credit // Agar debit fill karein to credit auto 0
              }));
            }}
            placeholder="0.00"
            className="mt-1 text-sm h-9 border-2 border-red-300"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold flex items-center gap-1">
            <CreditCard className="h-3 w-3" />
            Credit (No Auto-sync)
          </Label>
          <Input
            type="number"
            step="0.01"
            value={modalAddFormData.credit}
            onChange={(e) => {
              setModalAddFormData(prev => ({ 
                ...prev, 
                credit: e.target.value,
                debit: e.target.value ? '0' : prev.debit // Agar credit fill karein to debit auto 0
              }));
            }}
            placeholder="0.00"
            className="mt-1 text-sm h-9 border-2 border-green-300"
          />
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-600">
        <p className="font-semibold mb-1">💡 Quick Tips:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>Party Name & ID automatically filled</li>
          <li>Folio aur Particulars pehle wale se copy ho gaye hain</li>
          <li>Debit entries auto-sync to Cash Book</li>
          <li>Credit entries don't sync automatically</li>
        </ul>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={addEntryFromModal}
          className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-sm py-2"
        >
          <Save className="h-3 w-3 mr-1" />
          Save Entry
        </Button>
        <Button
          onClick={() => {
            setShowAddEntryInModal(false);
            const today = new Date().toISOString().split('T')[0];
            setModalAddFormData({
              date: today,
              particulars: '',
              folio: '',
              debit: '',
              credit: ''
            });
          }}
          variant="outline"
          className="text-sm py-2 border-gray-300"
        >
          <X className="h-3 w-3 mr-1" />
          Cancel
        </Button>
      </div>
    </div>
  )}
</div>

      {/* Transaction History - Mobile Scrollable */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6">
        {showCompleteHistory ? (
          <>
            <h3 className="text-sm sm:text-lg font-bold mb-3 flex items-center gap-2">
              <History className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
              Complete History
            </h3>
            <div className="space-y-2">
              {selectedPartyData.complete_history?.map((entry: any) => (
                <div
                  key={entry.id}
                  className={`bg-white border-2 rounded-lg p-3 ${
                    entry.source === 'CASHBOOK' ? 'border-green-200 bg-green-50' : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-1">
                      <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-bold">
                        {formatDate(entry.date)}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-bold ${
                        entry.source === 'CASHBOOK' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {entry.source === 'CASHBOOK' ? 'CASH' : 'LEDGER'}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-bold ${
                        entry.type === 'DEBIT' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {entry.type === 'DEBIT' ? 'Dr' : 'Cr'}
                      </div>
                    </div>

                    <p className="text-sm font-medium text-gray-800">{entry.particulars}</p>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <div className="bg-gray-50 px-2 py-1 rounded">
                        <span className="text-gray-600">Amount: </span>
                        <span className="font-semibold text-purple-600">
                          Rs. {parseFloat(entry.amount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <h3 className="text-sm sm:text-lg font-bold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
              Ledger Transactions
            </h3>
            <div className="space-y-2">
              {selectedPartyData.transactions?.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white border-2 border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
                >
                  {modalEditingId === entry.id ? (
                    <div className="space-y-3">
                      {/* Edit Form - Mobile Optimized */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs font-semibold">Date</Label>
                          <Input
                            type="date"
                            value={modalFormData[entry.id]?.date || entry.date}
                            onChange={(e) => setModalFormData(prev => ({
                              ...prev,
                              [entry.id]: { ...(prev[entry.id] || { particulars: '', folio: '', debit: '', credit: '' }), date: e.target.value }
                            }))}
                            className="mt-1 text-sm h-8"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold">Folio</Label>
                          <Input
                            value={modalFormData[entry.id]?.folio || entry.folio}
                            onChange={(e) => setModalFormData(prev => ({
                              ...prev,
                              [entry.id]: { ...(prev[entry.id] || { date: '', particulars: '', debit: '', credit: '' }), folio: e.target.value }
                            }))}
                            className="mt-1 text-sm h-8"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs font-semibold">Particulars</Label>
                        <Input
                          value={modalFormData[entry.id]?.particulars || entry.particulars}
                          onChange={(e) => setModalFormData(prev => ({
                            ...prev,
                            [entry.id]: { ...(prev[entry.id] || { date: '', folio: '', debit: '', credit: '' }), particulars: e.target.value }
                          }))}
                          className="mt-1 text-sm h-8"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs font-semibold">Debit</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={modalFormData[entry.id]?.debit || entry.debit}
                            onChange={(e) => setModalFormData(prev => ({
                              ...prev,
                              [entry.id]: { ...(prev[entry.id] || { date: '', particulars: '', folio: '', credit: '' }), debit: e.target.value }
                            }))}
                            className="mt-1 text-sm h-8 border-2 border-red-300"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-semibold">Credit</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={modalFormData[entry.id]?.credit || entry.credit}
                            onChange={(e) => setModalFormData(prev => ({
                              ...prev,
                              [entry.id]: { ...(prev[entry.id] || { date: '', particulars: '', folio: '', debit: '' }), credit: e.target.value }
                            }))}
                            className="mt-1 text-sm h-8 border-2 border-green-300"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => updateModalEntry(entry.id)}
                          className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-xs py-1 h-8"
                          size="sm"
                        >
                          <Save className="h-3 w-3 mr-1" />
                          Save
                        </Button>
                        <Button
                          onClick={() => cancelModalEdit(entry.id)}
                          variant="outline"
                          size="sm"
                          className="text-xs py-1 h-8 border-gray-300"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Entry Display - Mobile Optimized */}
                      <div className="flex flex-wrap items-center gap-1">
                        <div className="bg-teal-100 text-teal-700 px-2 py-1 rounded text-xs font-bold">
                          {formatDate(entry.date)}
                        </div>
                        {entry.folio && (
                          <div className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            F: {entry.folio}
                          </div>
                        )}
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          entry.type === 'Dr' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {entry.type}
                        </span>
                        {entry.cashbook_synced && (
                          <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                            <Wallet className="h-3 w-3" />
                            Cash
                          </div>
                        )}
                      </div>

                      <p className="text-sm font-medium text-gray-800">{entry.particulars}</p>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-red-50 p-2 rounded">
                          <span className="text-gray-600">Debit:</span>
                          <span className="ml-1 font-semibold text-red-600">
                            {parseFloat(entry.debit) > 0 ? `Rs. ${entry.debit}` : '-'}
                          </span>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <span className="text-gray-600">Credit:</span>
                          <span className="ml-1 font-semibold text-green-600">
                            {parseFloat(entry.credit) > 0 ? `Rs. ${entry.credit}` : '-'}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                        <div className="text-xs">
                          <span className="text-gray-600">Balance: </span>
                          <span className="font-semibold text-blue-600">Rs. {entry.balance}</span>
                        </div>
                        
                        {/* Action Buttons - Mobile Optimized */}
                        <div className="flex gap-1">
                          {!entry.cashbook_synced && parseFloat(entry.debit) > 0 && (
                            <button
                              onClick={() => syncToCashbook(entry.id, entry)}
                              className="bg-green-50 hover:bg-green-100 text-green-600 p-1 rounded border border-green-200"
                              title="Sync to Cash"
                            >
                              <Wallet className="h-3 w-3" />
                            </button>
                          )}
                          <button
                            onClick={() => startModalEdit(entry)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-1 rounded border border-blue-200"
                            title="Edit"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => deleteEntry(entry.id)}
                            className="bg-red-50 hover:bg-red-100 text-red-600 p-1 rounded border border-red-200"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal Footer - Mobile Optimized */}
      <div className="border-t border-gray-200 p-3 bg-gradient-to-r from-gray-50 to-gray-100">
        <Button
          onClick={() => {
            setShowPartyModal(false);
            setModalEditingId(null);
            setModalFormData({});
            setShowAddEntryInModal(false);
            setShowCompleteHistory(false);
          }}
          className="w-full bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 shadow-lg text-sm py-2"
        >
          Close
        </Button>
      </div>
    </div>
  </div>
)}

      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header - Color Changed to Teal/Emerald */}
        <div className="bg-gradient-to-r from-teal-800 to-emerald-900 rounded-2xl shadow-2xl p-4 md:p-6 text-white print:rounded-none">
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
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">AI FASHION LAHORE LEDGER</h1>
                  <p className="text-emerald-100 text-sm mt-1">
                    {selectedParty ? `Party: ${entries.find(e => e.party_id === selectedParty)?.party_name} (${selectedParty})` : `Karachi - ${new Date(currentDate).getFullYear()}`}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => window.print()}
                size="sm"
                className="print:hidden bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700"
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
              <Label className="text-sm font-semibold text-white/80">Total Parties:</Label>
              <div className="text-lg sm:text-xl font-bold text-emerald-200 mt-1">
                {partyList.length} Parties Registered
              </div>
            </div>
          </div>
        </div>

        {/* Party Quick Stats */}
        {!selectedParty && partyList.length > 0 && (
          <Card className="print:hidden shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
              <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Users className="h-5 w-5" />
                Party Overview ({partyList.length} Parties)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {partyList.map(party => (
                  <div
                    key={party.party_id}
                    onClick={() => openPartyModal(party.party_id)}
                    className="bg-gradient-to-br from-teal-50 to-emerald-50 border-2 border-emerald-200 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer group relative hover:border-emerald-300"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="text-xs text-emerald-600 font-semibold">ID: {party.party_id}</p>
                        <p className="font-bold text-gray-800 text-sm">{party.party_name}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        party.type === 'Dr' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {party.type}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Transactions:</span>
                        <span className="font-semibold">{party.transaction_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-red-600">Debit:</span>
                        <span className="font-semibold">Rs. {party.total_debit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-600">Credit:</span>
                        <span className="font-semibold">Rs. {party.total_credit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-emerald-200">
                        <span className="text-gray-800 font-semibold">Balance:</span>
                        <span className="font-bold text-emerald-700">Rs. {party.balance.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Hover Icon */}
                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-2 rounded-lg shadow-lg">
                        <Eye className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selected Party Banner */}
        {selectedParty && (
          <Card className="print:hidden bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6" />
                  <div>
                    <p className="text-sm opacity-90">Viewing Party Ledger</p>
                    <p className="text-xl font-bold">
                      {entries.find(e => e.party_id === selectedParty)?.party_name} (ID: {selectedParty})
                    </p>
                  </div>
                </div>
                <Button
                  onClick={clearPartyFilter}
                  variant="outline"
                  className="bg-white/20 hover:bg-white/30 border-white/40 text-white mt-2 sm:mt-0"
                >
                  <X className="h-4 w-4 mr-2" />
                  Show All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Bar */}
        <Card className="print:hidden shadow-lg">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
              <Input
                type="text"
                placeholder="Search by Party ID, Party Name, or Description..."
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
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-xl z-20 max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(suggestion);
                        setShowSuggestions(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-gray-200 last:border-b-0 transition-colors"
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
                {filteredEntries.length > 0 && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-sm text-emerald-600 hover:text-emerald-800 underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Entry Form - RESPONSIVE FIXED */}
        <Card className="print:hidden shadow-xl">
          <CardHeader className={`${editingId ? 'bg-gradient-to-r from-green-600 to-emerald-700' : 'bg-gradient-to-r from-teal-600 to-emerald-700'} text-white p-4`}>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              {editingId ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              {editingId ? 'Edit Entry' : 'Add New Entry'}
              <span className="text-sm font-normal ml-2 opacity-90">
                (Debit + Credit both can be saved together)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6">
            {/* Responsive Grid Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 md:gap-4">
              
              {/* Date - 2 columns on large screens */}
              <div className="lg:col-span-2">
                <Label className="text-sm font-semibold mb-1 block">Date</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full border-gray-300 focus:border-emerald-500"
                />
              </div>

              {/* Party ID - 2 columns on large screens */}
              <div className="lg:col-span-2">
                <Label className="text-sm font-semibold mb-1 block">Party ID</Label>
                <Input
                  value={formData.party_id}
                  onChange={(e) => setFormData({ ...formData, party_id: e.target.value })}
                  placeholder="Auto"
                  className="w-full border-gray-300 focus:border-emerald-500"
                  maxLength={3}
                  readOnly={!editingId}
                />
              </div>

              {/* Party Name - 3 columns on large screens with suggestions */}
              <div className="lg:col-span-3 relative">
                <Label className="text-sm font-semibold mb-1 block">Party Name *</Label>
                <Input
                  value={formData.party_name}
                  onChange={(e) => setFormData({ ...formData, party_name: e.target.value })}
                  onFocus={() => formData.party_name && setShowPartySuggestions(true)}
                  placeholder="Customer name"
                  className="w-full border-gray-300 focus:border-emerald-500"
                />

                {/* Party Suggestions Dropdown */}
                {showPartySuggestions && partySuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-emerald-300 rounded-lg shadow-xl z-30 max-h-48 overflow-y-auto">
                    {partySuggestions.map((party) => (
                      <button
                        key={party.party_id}
                        onClick={() => selectPartyFromSuggestion(party)}
                        className="w-full text-left px-3 py-2 hover:bg-emerald-50 border-b border-gray-200 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">{party.party_name}</p>
                            <p className="text-xs text-gray-500">ID: {party.party_id} • {party.transaction_count} transactions</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            party.type === 'Dr' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {party.type} {party.balance.toFixed(0)}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Particulars - 3 columns on large screens */}
              <div className="lg:col-span-3">
                <Label className="text-sm font-semibold mb-1 block">Particulars *</Label>
                <Input
                  value={formData.particulars}
                  onChange={(e) => setFormData({ ...formData, particulars: e.target.value })}
                  placeholder="Description"
                  className="w-full border-gray-300 focus:border-emerald-500"
                />
              </div>

              {/* Folio - 2 columns on large screens */}
              <div className="lg:col-span-2">
                <Label className="text-sm font-semibold mb-1 block">Folio</Label>
                <Input
                  value={formData.folio}
                  onChange={(e) => setFormData({ ...formData, folio: e.target.value })}
                  placeholder="F-001"
                  className="w-full border-gray-300 focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Second Row for Debit & Credit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 md:gap-4 mt-4">
              
              {/* Debit - 3 columns on large screens */}
              <div className="lg:col-span-3">
                <Label className="text-sm font-semibold mb-1 block flex items-center gap-1">
                  <IndianRupee className="h-4 w-4" />
                  Debit (Rs.) *Auto-sync to Cashbook*
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.debit}
                  onChange={(e) => setFormData({ ...formData, debit: e.target.value })}
                  placeholder="0.00"
                  className="w-full border-2 border-red-300 focus:border-red-500"
                />
              </div>

              {/* Credit - 3 columns on large screens */}
              <div className="lg:col-span-3">
                <Label className="text-sm font-semibold mb-1 block flex items-center gap-1">
                  <CreditCard className="h-4 w-4" />
                  Credit (Rs.) *No Auto-sync*
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.credit}
                  onChange={(e) => setFormData({ ...formData, credit: e.target.value })}
                  placeholder="0.00"
                  className="w-full border-2 border-green-300 focus:border-green-500"
                />
              </div>

              {/* Info Note - 6 columns on large screens */}
              <div className="lg:col-span-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 h-full">
                  <div className="flex items-start gap-2">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-blue-800 mb-1">Important Notes:</p>
                      <ul className="text-xs text-blue-600 space-y-1">
                        <li className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span>Debit entries auto-sync to Cash Book</span>
                        </li>
                        <li className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Credit entries do NOT auto-sync</span>
                        </li>
                        <li className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>Both Debit & Credit can be saved together</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 mt-6">
              {editingId ? (
                <>
                  <Button onClick={updateEntry} className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 shadow-md">
                    <Save className="h-4 w-4 mr-2" />
                    Update Entry
                  </Button>
                  <Button onClick={cancelEdit} variant="outline" className="border-gray-300">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={addEntry} className="bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 shadow-lg w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ledger Table */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading entries...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                    <th className="border border-gray-700 px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold">Date</th>
                    <th className="border border-gray-700 px-2 md:px-4 py-3 text-center text-xs md:text-sm font-semibold">Party ID</th>
                    <th className="border border-gray-700 px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold">Party Name</th>
                    <th className="border border-gray-700 px-2 md:px-4 py-3 text-left text-xs md:text-sm font-semibold">Particulars</th>
                    <th className="border border-gray-700 px-2 md:px-4 py-3 text-center text-xs md:text-sm font-semibold">Folio</th>
                    <th className="border border-gray-700 px-2 md:px-4 py-3 text-right text-xs md:text-sm font-semibold">
                      Debit<br/>
                      <span className="text-xs font-normal">Rs. Ps.</span>
                    </th>
                    <th className="border border-gray-700 px-2 md:px-4 py-3 text-right text-xs md:text-sm font-semibold">
                      Credit<br/>
                      <span className="text-xs font-normal">Rs. Ps.</span>
                    </th>
                    <th className="border border-gray-700 px-2 md:px-4 py-3 text-center text-xs md:text-sm font-semibold">Dr/Cr</th>
                    <th className="border border-gray-700 px-2 md:px-4 py-3 text-right text-xs md:text-sm font-semibold">
                      Balance<br/>
                      <span className="text-xs font-normal">Rs. Ps.</span>
                    </th>
                    <th className="border border-gray-700 px-2 md:px-4 py-3 text-center text-xs md:text-sm font-semibold print:hidden">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="border border-gray-300 px-4 py-12 text-center text-gray-500">
                        <div className="flex flex-col items-center gap-4">
                          <AlertCircle className="h-16 w-16 text-gray-300" />
                          <div>
                            <p className="text-lg font-medium text-gray-600">No entries found</p>
                            <p className="text-sm text-gray-500 mt-1">
                              {searchQuery || selectedParty ? 'Try adjusting your search criteria' : 'Add your first transaction above'}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {(selectedParty ? calculatePartyBalance(selectedParty) : calculateBalance(filteredEntries)).map((entry, index) => (
                        <tr key={entry.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-emerald-50 transition-colors`}>
                          <td className="border border-gray-300 px-2 md:px-4 py-3 text-xs md:text-sm">
                            <div className="font-medium text-gray-700">{formatDate(entry.date)}</div>
                          </td>
                          <td className="border border-gray-300 px-2 md:px-4 py-3 text-center text-xs md:text-sm">
                            <span className="bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 px-3 py-1 rounded-full font-semibold text-xs">
                              {entry.party_id}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-2 md:px-4 py-3 text-xs md:text-sm font-semibold text-gray-700">
                            {entry.party_name}
                          </td>
                          <td className="border border-gray-300 px-2 md:px-4 py-3 text-xs md:text-sm">{entry.particulars}</td>
                          <td className="border border-gray-300 px-2 md:px-4 py-3 text-center text-xs md:text-sm">{entry.folio || '-'}</td>
                          <td className="border border-gray-300 px-2 md:px-4 py-3 text-right font-mono text-xs md:text-sm">
                            {parseFloat(entry.debit) > 0 ? (
                              <span className="text-red-600 font-semibold">{entry.debit}</span>
                            ) : '-'}
                          </td>
                          <td className="border border-gray-300 px-2 md:px-4 py-3 text-right font-mono text-xs md:text-sm">
                            {parseFloat(entry.credit) > 0 ? (
                              <span className="text-green-600 font-semibold">{entry.credit}</span>
                            ) : '-'}
                          </td>
                          <td className="border border-gray-300 px-2 md:px-4 py-3 text-center font-semibold text-xs md:text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs ${entry.type === 'Dr' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                              {entry.type}
                            </span>
                          </td>
                          <td className="border border-gray-300 px-2 md:px-4 py-3 text-right font-mono font-semibold text-xs md:text-sm">
                            <span className="text-blue-600">{entry.balance}</span>
                          </td>
                          <td className="border border-gray-300 px-2 md:px-4 py-3 text-center print:hidden">
                            <div className="flex gap-1 justify-center">
                              {!entry.cashbook_synced && parseFloat(entry.debit) > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => syncToCashbook(entry.id, entry)}
                                  className="text-green-600 hover:bg-green-50 p-1 border border-green-200"
                                  title="Sync Debit to Cash Book"
                                >
                                  <Wallet className="h-3 w-3 md:h-4 md:w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEdit(entry)}
                                className="text-blue-600 hover:bg-blue-50 p-1 border border-blue-200"
                              >
                                <Edit2 className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteEntry(entry.id)}
                                className="text-red-600 hover:bg-red-50 p-1 border border-red-200"
                              >
                                <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {/* Total Row */}
                      <tr className="bg-gradient-to-r from-amber-400 to-yellow-500 font-bold">
                        <td colSpan={5} className="border-2 border-gray-800 px-2 md:px-4 py-3 text-right text-sm md:text-lg">
                          {selectedParty ? `TOTAL (${entries.find(e => e.party_id === selectedParty)?.party_name})` : 'TOTAL'}
                        </td>
                        <td className="border-2 border-gray-800 px-2 md:px-4 py-3 text-right font-mono text-sm md:text-lg">
                          {totals.totalDebit}
                        </td>
                        <td className="border-2 border-gray-800 px-2 md:px-4 py-3 text-right font-mono text-sm md:text-lg">
                          {totals.totalCredit}
                        </td>
                        <td className="border-2 border-gray-800 px-2 md:px-4 py-3 text-center text-sm md:text-lg">
                          <span className={`px-4 py-2 rounded-full ${totals.finalType === 'Dr' ? 'bg-red-200 text-red-800' : 'bg-green-200 text-green-800'}`}>
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
            <div className="md:hidden bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-2 text-xs text-gray-600 text-center border-t border-gray-300">
              ← Scroll horizontally to view all columns →
            </div>
          )}
        </div>

        {/* Summary Section */}
        {filteredEntries.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 print:break-before-page border border-gray-200">
            <h2 className="text-lg md:text-xl font-bold mb-4 text-gray-800">
              {selectedParty ? `Party Summary - ${entries.find(e => e.party_id === selectedParty)?.party_name}` : 'Monthly Summary'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300 rounded-xl p-4 md:p-6 text-center shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <TrendingUp className="h-6 w-6 text-red-600" />
                  <p className="text-sm md:text-base text-red-600 font-semibold">Total Debit</p>
                </div>
                <p className="text-2xl md:text-4xl font-bold text-red-700">Rs. {totals.totalDebit}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300 rounded-xl p-4 md:p-6 text-center shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <TrendingDown className="h-6 w-6 text-green-600" />
                  <p className="text-sm md:text-base text-green-600 font-semibold">Total Credit</p>
                </div>
                <p className="text-2xl md:text-4xl font-bold text-green-700">Rs. {totals.totalCredit}</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300 rounded-xl p-4 md:p-6 text-center shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Calendar className="h-6 w-6 text-blue-600" />
                  <p className="text-sm md:text-base text-blue-600 font-semibold">Final Balance ({totals.finalType})</p>
                </div>
                <p className="text-2xl md:text-4xl font-bold text-blue-700">Rs. {totals.finalBalance}</p>
              </div>
            </div>
          </div>
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