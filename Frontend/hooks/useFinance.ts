import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import {
  Budget,
  Transaction,
  addBudget,
  getBudgets,
  updateBudget,
  deleteBudget,
  addTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getUserSummary,
  initializeUserData
} from '@/lib/firebase-db';

interface FinanceSummary {
  totalCredit: number;
  totalDebit: number;
  balance: number;
  totalBudget: number;
  totalSpent: number;
  budgetUtilization: number;
  transactionCount: number;
  activeBudgetCount: number;
  totalBudgetCount: number;
}

export const useFinance = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [credits, setCredits] = useState<Transaction[]>([]);
  const [debits, setDebits] = useState<Transaction[]>([]);

  // Initialize user data if needed
  const initializeUser = async () => {
    if (!user) return;
    try {
      await initializeUserData();
    } catch (err: any) {
      console.error('Error initializing user data:', err);
      setError(err.message);
    }
  };

  // Load all data
  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // First ensure user data is initialized
      await initializeUser();
      
      const [budgetsData, creditsData, debitsData, summaryData] = await Promise.all([
        getBudgets(),
        getTransactions('credit'),
        getTransactions('debit'),
        getUserSummary()
      ]);

      setBudgets(budgetsData);
      setCredits(creditsData);
      setDebits(debitsData);
      setSummary(summaryData);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initialize user data and load data when user changes
  useEffect(() => {
    const handleUserData = async () => {
      if (user) {
        await loadData();
      } else {
        // Clear data when user logs out
        setBudgets([]);
        setCredits([]);
        setDebits([]);
        setSummary(null);
        setLoading(false);
      }
    };

    handleUserData();
  }, [user]);

  // Budget operations
  const createBudget = async (budget: Omit<Budget, 'id' | 'budgetReached' | 'createdAt' | 'isActive' | 'spent'>) => {
    if (!user) throw new Error('No user logged in');
    try {
      await addBudget(budget);
      await loadData();
    } catch (err: any) {
      console.error('Error creating budget:', err);
      setError(err.message);
      throw err;
    }
  };

  const modifyBudget = async (budgetId: string, updates: Partial<Budget>) => {
    if (!user) throw new Error('No user logged in');
    try {
      await updateBudget(budgetId, updates);
      await loadData();
    } catch (err: any) {
      console.error('Error modifying budget:', err);
      setError(err.message);
      throw err;
    }
  };

  const removeBudget = async (budgetId: string) => {
    if (!user) throw new Error('No user logged in');
    try {
      await deleteBudget(budgetId);
      await loadData();
    } catch (err: any) {
      console.error('Error removing budget:', err);
      setError(err.message);
      throw err;
    }
  };

  // Transaction operations
  const createTransaction = async (
    transaction: Omit<Transaction, 'id' | 'timestamp'>,
    type: 'credit' | 'debit'
  ) => {
    if (!user) throw new Error('No user logged in');
    try {
      await addTransaction(transaction, type);
      await loadData();
    } catch (err: any) {
      console.error('Error creating transaction:', err);
      setError(err.message);
      throw err;
    }
  };

  const modifyTransaction = async (
    transactionId: string,
    type: 'credit' | 'debit',
    updates: Partial<Transaction>
  ) => {
    if (!user) throw new Error('No user logged in');
    try {
      await updateTransaction(transactionId, type, updates);
      await loadData();
    } catch (err: any) {
      console.error('Error modifying transaction:', err);
      setError(err.message);
      throw err;
    }
  };

  const removeTransaction = async (transactionId: string, type: 'credit' | 'debit') => {
    if (!user) throw new Error('No user logged in');
    try {
      await deleteTransaction(transactionId, type);
      await loadData();
    } catch (err: any) {
      console.error('Error removing transaction:', err);
      setError(err.message);
      throw err;
    }
  };

  return {
    loading,
    error,
    summary,
    budgets,
    credits,
    debits,
    createBudget,
    modifyBudget,
    removeBudget,
    createTransaction,
    modifyTransaction,
    removeTransaction,
    refresh: loadData
  };
}; 