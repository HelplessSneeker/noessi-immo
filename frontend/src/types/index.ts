// Enums
export type TransactionType = 'income' | 'expense';

export type TransactionCategory = 
  | 'miete' 
  | 'betriebskosten' 
  | 'reparatur' 
  | 'kreditrate' 
  | 'steuer' 
  | 'sonstiges';

export type DocumentCategory = 
  | 'betriebskosten' 
  | 'mietvertrag' 
  | 'rechnung' 
  | 'steuer' 
  | 'hausverwaltung' 
  | 'sonstiges';

// Models
export interface Property {
  id: string;
  name: string;
  address: string;
  purchase_date: string | null;
  purchase_price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyCreate {
  name: string;
  address: string;
  purchase_date?: string;
  purchase_price?: number;
  notes?: string;
}

export interface Credit {
  id: string;
  property_id: string;
  name: string;
  original_amount: number;
  interest_rate: number;
  monthly_payment: number;
  start_date: string;
  end_date: string | null;
  current_balance: number | null;
  created_at: string;
  updated_at: string;
}

export interface CreditCreate {
  property_id: string;
  name: string;
  original_amount: number;
  interest_rate: number;
  monthly_payment: number;
  start_date: string;
  end_date?: string;
}

export interface Transaction {
  id: string;
  property_id: string;
  credit_id: string | null;
  date: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description: string | null;
  recurring: boolean;
  created_at: string;
  updated_at: string;
}

export interface TransactionCreate {
  property_id: string;
  credit_id?: string;
  date: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  description?: string;
  recurring?: boolean;
}

export interface Document {
  id: string;
  property_id: string;
  transaction_id: string | null;
  filename: string;
  filepath: string;
  upload_date: string;
  document_date: string | null;
  category: DocumentCategory;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropertySummary {
  property: Property;
  total_income: number;
  total_expenses: number;
  balance: number;
  total_credit_balance: number;
  document_count: number;
}

// Category Labels (German)
export const TRANSACTION_CATEGORY_LABELS: Record<TransactionCategory, string> = {
  miete: 'Miete',
  betriebskosten: 'Betriebskosten',
  reparatur: 'Reparatur',
  kreditrate: 'Kreditrate',
  steuer: 'Steuer',
  sonstiges: 'Sonstiges',
};

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  betriebskosten: 'Betriebskosten',
  mietvertrag: 'Mietvertrag',
  rechnung: 'Rechnung',
  steuer: 'Steuer',
  hausverwaltung: 'Hausverwaltung',
  sonstiges: 'Sonstiges',
};
