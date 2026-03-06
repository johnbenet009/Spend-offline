export interface ExpenseItem {
  id: string;
  name: string;
  amount: number;
  expectedDate?: string;
  dateCreated: string;
  completed: boolean;
}

export type SortField = 'name' | 'amount' | 'dateCreated' | 'expectedDate';
export type SortOrder = 'asc' | 'desc';

export interface CurrencySettings {
  label: string;
  symbol: string;
}
