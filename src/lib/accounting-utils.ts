// lib/accounting-utils.ts
import { supabase } from './supabase';

export interface AccountingEntry {
  date: string;
  party_id: string;
  party_name: string;
  particulars: string;
  folio: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  city: string;
  source: 'LEDGER' | 'CASHBOOK';
  is_cashbook_entry?: boolean;
  linked_transaction_id?: string;
  entry_type?: 'LEDGER' | 'CASH';
}

// Function to sync ledger credit entry to cashbook
export async function syncLedgerToCashbook(
  ledgerEntry: AccountingEntry,
  userId: string,
  originalTransactionId: string
): Promise<boolean> {
  try {
    // Only sync if it's a CREDIT entry (money received)
    if (ledgerEntry.type === 'CREDIT' && ledgerEntry.amount > 0) {
      const cashbookEntry = {
        user_id: userId,
        date: ledgerEntry.date,
        party_id: ledgerEntry.party_id,
        party_name: ledgerEntry.party_name,
        particulars: `Cash received from ${ledgerEntry.party_name} - ${ledgerEntry.particulars}`,
        folio: ledgerEntry.folio,
        amount: ledgerEntry.amount,
        type: 'CREDIT',
        city: ledgerEntry.city,
        source: 'CASHBOOK',
        is_cashbook_entry: true,
        linked_transaction_id: originalTransactionId,
        entry_type: 'CASH',
        sync_status: 'SYNCED'
      };

      const { error } = await supabase
        .from('transactions')
        .insert([cashbookEntry]);

      if (error) {
        console.error('Error syncing to cashbook:', error);
        return false;
      }

      // Mark original transaction as synced
      await supabase
        .from('transactions')
        .update({ cashbook_synced: true })
        .eq('id', originalTransactionId);

      return true;
    }
    return false;
  } catch (error) {
    console.error('Error in syncLedgerToCashbook:', error);
    return false;
  }
}

// Function to get complete transaction history for a person
export async function getPersonTransactionHistory(
  userId: string,
  personName: string
) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('party_name', personName)
      .or('source.eq.LEDGER,source.eq.CASHBOOK')
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error fetching person history:', error);
    return [];
  }
}

// Function to calculate person-wise summary
export function calculatePersonSummary(transactions: any[]) {
  const summary: {
    [personName: string]: {
      ledger: { debit: number; credit: number; balance: number };
      cashbook: { receipt: number; payment: number; balance: number };
      totalBalance: number;
    }
  } = {};

  transactions.forEach(transaction => {
    const personName = transaction.party_name;
    if (!personName) return;

    if (!summary[personName]) {
      summary[personName] = {
        ledger: { debit: 0, credit: 0, balance: 0 },
        cashbook: { receipt: 0, payment: 0, balance: 0 },
        totalBalance: 0
      };
    }

    const amount = parseFloat(transaction.amount) || 0;

    if (transaction.source === 'LEDGER') {
      if (transaction.type === 'DEBIT') {
        summary[personName].ledger.debit += amount;
        summary[personName].ledger.balance += amount; // Debit increases balance
      } else if (transaction.type === 'CREDIT') {
        summary[personName].ledger.credit += amount;
        summary[personName].ledger.balance -= amount; // Credit decreases balance
      }
    } else if (transaction.source === 'CASHBOOK') {
      if (transaction.type === 'CREDIT') {
        summary[personName].cashbook.receipt += amount;
        summary[personName].cashbook.balance += amount;
      } else if (transaction.type === 'DEBIT') {
        summary[personName].cashbook.payment += amount;
        summary[personName].cashbook.balance -= amount;
      }
    }

    // Calculate total balance
    summary[personName].totalBalance = 
      summary[personName].ledger.balance + summary[personName].cashbook.balance;
  });

  return summary;
}