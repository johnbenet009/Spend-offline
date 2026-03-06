import { useRef, useState } from 'react';
import { ExpenseItem, SortField, SortOrder } from '../types';
import {
  CheckCircle,
  Circle,
  Trash2,
  ArrowUpDown,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { downloadNodeAsImage } from '../utils/screenshot';
import { Modal } from './Modal';
import { useToast } from './Toast';

interface ExpenseListProps {
  items: ExpenseItem[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  currencySymbol?: string;
  onUpdateItem: (id: string, updates: Partial<ExpenseItem>) => void;
}

export function ExpenseList({ items, onToggleComplete, onDelete, currencySymbol = '$', onUpdateItem }: ExpenseListProps) {
  const [sortField, setSortField] = useState<SortField>('dateCreated');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const listRef = useRef<HTMLDivElement>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const toast = useToast();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    let aVal: string | number = '';
    let bVal: string | number = '';

    switch (sortField) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'amount':
        aVal = a.amount;
        bVal = b.amount;
        break;
      case 'dateCreated':
        aVal = new Date(a.dateCreated).getTime();
        bVal = new Date(b.dateCreated).getTime();
        break;
      case 'expectedDate':
        aVal = a.expectedDate ? new Date(a.expectedDate).getTime() : 0;
        bVal = b.expectedDate ? new Date(b.expectedDate).getTime() : 0;
        break;
    }

    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <p className="text-gray-500 dark:text-gray-400">
          No expense plans yet. Add your first one above!
        </p>
      </div>
    );
  }

  const capture = async (mode: 'all' | 'completed' | 'pending') => {
    const root = listRef.current;
    if (!root) return;
    const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-completed]'));
    const toHide: HTMLElement[] = [];
    rows.forEach((row) => {
      const completed = row.getAttribute('data-completed') === 'true';
      if ((mode === 'completed' && !completed) || (mode === 'pending' && completed)) {
        toHide.push(row);
        row.style.display = 'none';
      }
    });
    try {
      await downloadNodeAsImage(root, `spend-plans-${mode}.png`);
    } finally {
      toHide.forEach((el) => (el.style.display = ''));
    }
  };

  const openEdit = (item: ExpenseItem) => {
    setEditId(item.id);
    setEditName(item.name);
    setEditAmount(String(item.amount));
    setEditDate(item.expectedDate || '');
  };

  const saveEdit = () => {
    if (!editId) return;
    const amt = parseFloat(editAmount);
    if (!editName.trim() || Number.isNaN(amt) || amt <= 0) {
      toast.show('Please enter valid values', 'error');
      return;
    }
    onUpdateItem(editId, { name: editName.trim(), amount: amt, expectedDate: editDate || undefined });
    setEditId(null);
    toast.show('Item updated', 'success');
  };

  return (
    <div ref={listRef} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSort('name')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sortField === 'name'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Name <ArrowUpDown className="w-3 h-3 inline ml-1" />
          </button>
          <button
            onClick={() => handleSort('amount')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sortField === 'amount'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Amount <ArrowUpDown className="w-3 h-3 inline ml-1" />
          </button>
          <button
            onClick={() => handleSort('dateCreated')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sortField === 'dateCreated'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Created <ArrowUpDown className="w-3 h-3 inline ml-1" />
          </button>
          <button
            onClick={() => handleSort('expectedDate')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sortField === 'expectedDate'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Expected <ArrowUpDown className="w-3 h-3 inline ml-1" />
          </button>
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400 self-center">
            {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
          </span>
          <div className="w-full md:w-auto md:ml-4 flex gap-2 mt-2 md:mt-0">
            <button
              onClick={() => capture('all')}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
            >
              Screenshot All
            </button>
            <button
              onClick={() => capture('pending')}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
            >
              Screenshot Pending
            </button>
            <button
              onClick={() => capture('completed')}
              className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200"
            >
              Screenshot Completed
            </button>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {sortedItems.map((item) => (
          <div
            key={item.id}
            className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
              item.completed ? 'opacity-60' : ''
            }`}
            data-completed={item.completed ? 'true' : 'false'}
            onClick={() => openEdit(item)}
          >
            <div className="flex items-start gap-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleComplete(item.id);
                }}
                className="mt-1 text-gray-400 hover:text-emerald-500 transition-colors"
              >
                {item.completed ? (
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                ) : (
                  <Circle className="w-6 h-6" />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <h4
                  className={`font-semibold text-gray-900 dark:text-white break-words ${
                    item.completed ? 'line-through' : ''
                  }`}
                >
                  {item.name}
                </h4>
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span className="font-semibold">{currencySymbol}{item.amount.toFixed(2)}</span>
                  </div>
                  {item.expectedDate && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(item.expectedDate)}</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    Added {formatDate(item.dateCreated)}
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmId(item.id);
                }}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <Modal
        open={confirmId !== null}
        title="Delete Item?"
        onClose={() => setConfirmId(null)}
        actions={
          <>
            <button
              onClick={() => setConfirmId(null)}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (confirmId) {
                  onDelete(confirmId);
                  toast.show('Item deleted', 'success');
                }
                setConfirmId(null);
              }}
              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600 dark:text-gray-300">This action cannot be undone.</p>
      </Modal>

      <Modal
        open={!!editId}
        title="Edit Expense"
        onClose={() => setEditId(null)}
        actions={
          <>
            <button
              onClick={() => setEditId(null)}
              className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
            >
              Save
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Date</label>
            <input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
