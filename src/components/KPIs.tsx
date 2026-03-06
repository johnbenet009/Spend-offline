import { ExpenseItem } from '../types';
import { DollarSign, ShoppingBag, CheckCircle, Clock } from 'lucide-react';
import { useRef } from 'react';
import { downloadNodeAsImage } from '../utils/screenshot';

interface KPIsProps {
  items: ExpenseItem[];
  currencySymbol?: string;
}

export function KPIs({ items, currencySymbol = '$' }: KPIsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const totalPlanned = items.reduce((sum, item) => sum + item.amount, 0);
  const totalPending = items
    .filter(item => !item.completed)
    .reduce((sum, item) => sum + item.amount, 0);
  const completedCount = items.filter(item => item.completed).length;

  const kpis = [
    {
      label: 'Total Planned',
      value: `${currencySymbol}${totalPlanned.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: 'Pending Amount',
      value: `${currencySymbol}${totalPending.toFixed(2)}`,
      icon: Clock,
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
    },
    {
      label: 'Total Items',
      value: items.length.toString(),
      icon: ShoppingBag,
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: 'Completed',
      value: `${completedCount}/${items.length}`,
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
  ];

  const capture = () => {
    if (!rootRef.current) return;
    downloadNodeAsImage(rootRef.current, 'spend-overview.png');
  };

  return (
    <div>
      <div className="flex justify-end mb-2">
        <button
          onClick={capture}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Screenshot Overview
        </button>
      </div>
      <div ref={rootRef} className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className={`${kpi.bg} rounded-xl p-4 border border-gray-200 dark:border-gray-700`}
        >
          <div className="flex items-center gap-3">
            <div className={`${kpi.color}`}>
              <kpi.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{kpi.label}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {kpi.value}
              </p>
            </div>
          </div>
        </div>
      ))}
      </div>
    </div>
  );
}
