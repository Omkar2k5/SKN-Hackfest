// Transaction Interface
export interface Transaction {
  accountNumber?: string;
  amount: number;
  merchantName: string;
  timestamp: number;
  transactionMode: string;
  upiId?: string;
}

// Bank Statement Interface
export interface BankStatement {
  accountNumber: string;
  customerName: string;
  period: {
    from: Date;
    to: Date;
  };
  openingBalance: number;
  closingBalance: number;
  totalWithdrawal: number;
  totalDeposit: number;
  withdrawalCount: number;
  depositCount: number;
  transactions: Transaction[];
}

// Statement Parsing Result
export interface StatementParsingResult {
  success: boolean;
  message: string;
  statement?: BankStatement;
  transactions?: Transaction[];
  error?: string;
} 