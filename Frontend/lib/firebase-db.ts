import { getDatabase, ref, set, get, push, remove, update } from "firebase/database";
import { getAuth } from "firebase/auth";

const db = getDatabase();

// Types
export interface Budget {
  id?: string;
  amount: number;
  budgetReached: boolean;
  category: string;
  createdAt: number;
  description: string;
  isActive: boolean;
  merchants: string[];
  spent: number;
  upiIds?: string[];
}

export interface Transaction {
  id?: string;
  accountNumber: string;
  amount: number;
  merchantName: string;
  timestamp: number;
  transactionMode: string;
  upiId?: string;
  uploadedAt?: number;
}

// Helper function to get current user's reference
const getUserRef = (path: string = '') => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');
  return ref(db, `users/${user.uid}${path}`);
};

// Initialize new user's data structure
export const initializeUserData = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');

  try {
    // Check if user data already exists
    const userSnapshot = await get(ref(db, `users/${user.uid}`));
    if (userSnapshot.exists()) {
      console.log('User data already exists');
      return; // User data already initialized
    }

    console.log('Initializing user data for:', user.uid);
    // Create initial data structure
    const initialData = {
      budgets: {},
      credit: {},
      debit: {},
      service_status: `initialized_${Date.now()}`,
      transactions: {
        test: "connection_test"
      }
    };

    await set(ref(db, `users/${user.uid}`), initialData);
    console.log('User data initialized successfully');
    return true;
  } catch (error: any) {
    console.error('Failed to initialize user data:', error);
    throw new Error(`Failed to initialize user data: ${error.message}`);
  }
};

// Budget Operations
export const addBudget = async (budget: Omit<Budget, 'id' | 'budgetReached' | 'createdAt' | 'isActive' | 'spent'>) => {
  try {
    const newBudgetRef = push(getUserRef('/budgets'));
    const newBudget = {
      ...budget,
      budgetReached: false,
      createdAt: Date.now(),
      isActive: true,
      spent: 0
    };
    await set(newBudgetRef, newBudget);
    return { id: newBudgetRef.key };
  } catch (error: any) {
    console.error('Failed to add budget:', error);
    throw new Error(`Failed to add budget: ${error.message}`);
  }
};

export const getBudgets = async (): Promise<Budget[]> => {
  try {
    const snapshot = await get(getUserRef('/budgets'));
    if (!snapshot.exists()) return [];
    const budgets = snapshot.val();
    return Object.entries(budgets).map(([key, value]) => ({
      id: key,
      ...(value as Omit<Budget, 'id'>)
    }));
  } catch (error: any) {
    console.error('Failed to fetch budgets:', error);
    throw new Error(`Failed to fetch budgets: ${error.message}`);
  }
};

export const updateBudget = async (budgetId: string, updates: Partial<Budget>) => {
  try {
    await update(getUserRef(`/budgets/${budgetId}`), updates);
  } catch (error: any) {
    console.error('Failed to update budget:', error);
    throw new Error(`Failed to update budget: ${error.message}`);
  }
};

export const deleteBudget = async (budgetId: string) => {
  try {
    await remove(getUserRef(`/budgets/${budgetId}`));
  } catch (error: any) {
    console.error('Failed to delete budget:', error);
    throw new Error(`Failed to delete budget: ${error.message}`);
  }
};

// Transaction Operations
export const addTransaction = async (
  transaction: Omit<Transaction, 'id' | 'timestamp'>, 
  type: 'credit' | 'debit'
) => {
  try {
    const newTransactionRef = push(getUserRef(`/${type}`));
    const newTransaction = {
      ...transaction,
      timestamp: Date.now()
    };
    await set(newTransactionRef, newTransaction);
    return { id: newTransactionRef.key };
  } catch (error: any) {
    console.error('Failed to add transaction:', error);
    throw new Error(`Failed to add transaction: ${error.message}`);
  }
};

export const getTransactions = async (type: 'credit' | 'debit'): Promise<Transaction[]> => {
  try {
    const snapshot = await get(getUserRef(`/${type}`));
    if (!snapshot.exists()) return [];
    const transactions = snapshot.val();
    return Object.entries(transactions).map(([key, value]) => ({
      id: key,
      ...(value as Omit<Transaction, 'id'>)
    }));
  } catch (error: any) {
    console.error('Failed to fetch transactions:', error);
    throw new Error(`Failed to fetch transactions: ${error.message}`);
  }
};

export const updateTransaction = async (
  transactionId: string, 
  type: 'credit' | 'debit',
  updates: Partial<Transaction>
) => {
  try {
    await update(getUserRef(`/${type}/${transactionId}`), updates);
  } catch (error: any) {
    console.error('Failed to update transaction:', error);
    throw new Error(`Failed to update transaction: ${error.message}`);
  }
};

export const deleteTransaction = async (
  transactionId: string,
  type: 'credit' | 'debit'
) => {
  try {
    await remove(getUserRef(`/${type}/${transactionId}`));
  } catch (error: any) {
    console.error('Failed to delete transaction:', error);
    throw new Error(`Failed to delete transaction: ${error.message}`);
  }
};

// Analytics and Summary
export const getUserSummary = async () => {
  try {
    const [credits, debits, budgets] = await Promise.all([
      getTransactions('credit'),
      getTransactions('debit'),
      getBudgets()
    ]) as [Transaction[], Transaction[], Budget[]];

    const totalCredit = credits.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalDebit = debits.reduce((sum, t) => sum + (t.amount || 0), 0);
    const activeBudgets = budgets.filter(b => b.isActive);
    const totalBudget = activeBudgets.reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalSpent = activeBudgets.reduce((sum, b) => sum + (b.spent || 0), 0);

    return {
      totalCredit,
      totalDebit,
      balance: totalCredit - totalDebit,
      totalBudget,
      totalSpent,
      budgetUtilization: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      transactionCount: credits.length + debits.length,
      activeBudgetCount: activeBudgets.length,
      totalBudgetCount: budgets.length
    };
  } catch (error: any) {
    console.error('Failed to fetch user summary:', error);
    throw new Error(`Failed to fetch user summary: ${error.message}`);
  }
}; 