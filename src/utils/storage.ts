import { ExpenseItem, CurrencySettings } from '../types';

const STORAGE_KEY = 'spend_expense_items';
const AVAILABLE_MONEY_KEY = 'spend_available_money';
const THEME_KEY = 'spend_theme';
const CURRENCY_KEY = 'spend_currency';
const PIN_HASH_KEY = 'spend_pin_hash';
const PIN_SALT_KEY = 'spend_pin_salt';
const UNLOCK_SESSION_KEY = 'spend_unlocked_session';

export const storage = {
  getItems(): ExpenseItem[] {
    try {
      const items = localStorage.getItem(STORAGE_KEY);
      return items ? JSON.parse(items) : [];
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return [];
    }
  },

  saveItems(items: ExpenseItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  addItem(item: Omit<ExpenseItem, 'id' | 'dateCreated' | 'completed'>): ExpenseItem {
    const items = this.getItems();
    const newItem: ExpenseItem = {
      ...item,
      id: crypto.randomUUID(),
      dateCreated: new Date().toISOString(),
      completed: false,
    };
    items.push(newItem);
    this.saveItems(items);
    return newItem;
  },

  updateItem(id: string, updates: Partial<ExpenseItem>): void {
    const items = this.getItems();
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = { ...items[index], ...updates };
      this.saveItems(items);
    }
  },

  deleteItem(id: string): void {
    const items = this.getItems();
    const filtered = items.filter(item => item.id !== id);
    this.saveItems(filtered);
  },

  toggleComplete(id: string): void {
    const items = this.getItems();
    const item = items.find(item => item.id === id);
    if (item) {
      item.completed = !item.completed;
      this.saveItems(items);
    }
  },

  getAvailableMoney(): number {
    try {
      const money = localStorage.getItem(AVAILABLE_MONEY_KEY);
      return money ? parseFloat(money) : 0;
    } catch (error) {
      console.error('Error reading available money:', error);
      return 0;
    }
  },

  saveAvailableMoney(amount: number): void {
    try {
      localStorage.setItem(AVAILABLE_MONEY_KEY, amount.toString());
    } catch (error) {
      console.error('Error saving available money:', error);
    }
  },

  getTheme(): 'light' | 'dark' {
    try {
      const theme = localStorage.getItem(THEME_KEY);
      return (theme as 'light' | 'dark') || 'light';
    } catch {
      return 'light';
    }
  },

  saveTheme(theme: 'light' | 'dark'): void {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  },

  getCurrency(): CurrencySettings {
    try {
      const raw = localStorage.getItem(CURRENCY_KEY);
      if (raw) return JSON.parse(raw);
      return { label: 'USD', symbol: '$' };
    } catch {
      return { label: 'USD', symbol: '$' };
    }
  },

  saveCurrency(currency: CurrencySettings): void {
    try {
      localStorage.setItem(CURRENCY_KEY, JSON.stringify(currency));
    } catch (error) {
      console.error('Error saving currency:', error);
    }
  },

  async setPin(pin: string): Promise<void> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltStr = Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join('');
    const hash = await this.hashPin(pin, saltStr);
    localStorage.setItem(PIN_HASH_KEY, hash);
    localStorage.setItem(PIN_SALT_KEY, saltStr);
  },

  async verifyPin(pin: string): Promise<boolean> {
    const salt = localStorage.getItem(PIN_SALT_KEY);
    const storedHash = localStorage.getItem(PIN_HASH_KEY);
    if (!salt || !storedHash) return false;
    const hash = await this.hashPin(pin, salt);
    return hash === storedHash;
  },

  async hashPin(pin: string, salt: string): Promise<string> {
    const data = new TextEncoder().encode(`${salt}:${pin}`);
    const digest = await crypto.subtle.digest('SHA-256', data);
    const bytes = Array.from(new Uint8Array(digest));
    return bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
  },

  hasPin(): boolean {
    return !!localStorage.getItem(PIN_HASH_KEY);
  },

  clearPin(): void {
    localStorage.removeItem(PIN_HASH_KEY);
    localStorage.removeItem(PIN_SALT_KEY);
  },

  setUnlockedSession(): void {
    sessionStorage.setItem(UNLOCK_SESSION_KEY, '1');
  },

  isSessionUnlocked(): boolean {
    return sessionStorage.getItem(UNLOCK_SESSION_KEY) === '1';
  },

  exportData(): string {
    const items = this.getItems();
    const availableMoney = this.getAvailableMoney();
    const currency = this.getCurrency();
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: { items, availableMoney, currency },
    };
    return JSON.stringify(payload, null, 2);
  },

  importData(json: string): { ok: boolean; error?: string } {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.data) {
        return { ok: false, error: 'Invalid file format' };
      }
      const { items, availableMoney, currency } = parsed.data;
      if (!Array.isArray(items)) return { ok: false, error: 'Missing items' };
      if (typeof availableMoney !== 'number') return { ok: false, error: 'Missing available money' };
      if (!currency || typeof currency.symbol !== 'string') return { ok: false, error: 'Missing currency' };
      this.saveItems(items as ExpenseItem[]);
      this.saveAvailableMoney(availableMoney);
      this.saveCurrency(currency as CurrencySettings);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Could not parse file' };
    }
  },

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AVAILABLE_MONEY_KEY);
    localStorage.removeItem(CURRENCY_KEY);
  },
};
