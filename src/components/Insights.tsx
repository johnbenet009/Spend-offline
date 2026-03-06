import { useMemo, useRef } from 'react';
import { ExpenseItem } from '../types';
import { downloadNodeAsImage } from '../utils/screenshot';

interface InsightsProps {
  items: ExpenseItem[];
  currencySymbol?: string;
}

export function Insights({ items, currencySymbol = '$' }: InsightsProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const { total, completed, pending, top } = useMemo(() => {
    const total = items.reduce((s, i) => s + i.amount, 0);
    const completed = items.filter(i => i.completed).reduce((s, i) => s + i.amount, 0);
    const pending = total - completed;
    const top = [...items]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
    return { total, completed, pending, top };
  }, [items]);

  const c = 70;
  const circumference = 2 * Math.PI * c;
  const completedPct = total > 0 ? completed / total : 0;
  const completedLen = circumference * completedPct;

  const capture = () => {
    if (rootRef.current) downloadNodeAsImage(rootRef.current, 'spend-insights.png');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 dark:text-white">Insights</h3>
        <button
          onClick={capture}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Screenshot
        </button>
      </div>
      <div ref={rootRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center justify-center">
          <svg width="180" height="180" viewBox="0 0 180 180">
            <circle
              cx="90"
              cy="90"
              r={c}
              fill="none"
              stroke="currentColor"
              className="text-gray-200 dark:text-gray-700"
              strokeWidth="16"
            />
            <circle
              cx="90"
              cy="90"
              r={c}
              fill="none"
              stroke="currentColor"
              className="text-emerald-500"
              strokeWidth="16"
              strokeDasharray={`${completedLen} ${circumference - completedLen}`}
              strokeDashoffset="0"
              strokeLinecap="round"
              transform="rotate(-90 90 90)"
            />
            <text x="90" y="90" textAnchor="middle" dominantBaseline="central" className="fill-gray-900 dark:fill-white font-bold">
              {Math.round(completedPct * 100)}%
            </text>
          </svg>
          <div className="ml-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Completed</div>
            <div className="font-bold text-gray-900 dark:text-white">
              {currencySymbol}{completed.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Pending</div>
            <div className="font-bold text-gray-900 dark:text-white">
              {currencySymbol}{pending.toFixed(2)}
            </div>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Top Items</h4>
          <div className="space-y-2">
            {top.map((i) => {
              const max = top[0]?.amount || 1;
              const width = `${(i.amount / max) * 100}%`;
              return (
                <div key={i.id}>
                  <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                    <span className="truncate">{i.name}</span>
                    <span className="ml-2">{currencySymbol}{i.amount.toFixed(2)}</span>
                  </div>
                  <div className="h-2 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width }} />
                  </div>
                </div>
              );
            })}
            {top.length === 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">Add items to see insights.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
