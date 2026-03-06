import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useToast } from './Toast';

interface AddItemFormProps {
  onAdd: (item: { name: string; amount: number; expectedDate?: string }) => void;
  currencySymbol?: string;
}

export function AddItemForm({ onAdd, currencySymbol = '$' }: AddItemFormProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const toast = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && amount && parseFloat(amount) > 0) {
      onAdd({
        name: name.trim(),
        amount: parseFloat(amount),
        expectedDate: expectedDate || undefined,
      });
      setName('');
      setAmount('');
      setExpectedDate('');
      setIsExpanded(false);
      toast.show('Item added', 'success');
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full max-w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl p-4 font-semibold flex items-center justify-center gap-2 shadow-lg transition-all"
      >
        <Plus className="w-5 h-5" />
        Add New Expense Plan
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700"
    >
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        New Expense Plan
      </h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Item Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., New Laptop"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Amount ({currencySymbol}) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Expected Date (Optional)
          </label>
          <input
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg py-2 font-semibold transition-colors"
          >
            Add Item
          </button>
          <button
            type="button"
            onClick={() => {
              setIsExpanded(false);
              setName('');
              setAmount('');
              setExpectedDate('');
            }}
            className="px-6 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg py-2 font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
