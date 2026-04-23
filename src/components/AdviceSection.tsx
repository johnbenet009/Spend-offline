import { useState, useEffect, useRef } from 'react';
import { ExpenseItem } from '../types';
import {
  Lightbulb,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { downloadNodeAsImage } from '../utils/screenshot';
import { useToast } from './Toast';

interface AdviceSectionProps {
  items: ExpenseItem[];
  availableMoney: number;
  onUpdateMoney: (amount: number) => void;
  currencySymbol?: string;
}

interface Allocation {
  item: ExpenseItem;
  canAfford: boolean;
}

export function AdviceSection({
  items,
  availableMoney,
  onUpdateMoney,
  currencySymbol = '$',
}: AdviceSectionProps) {
  const [inputMoney, setInputMoney] = useState(availableMoney.toString());
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [nextItem, setNextItem] = useState<ExpenseItem | null>(null);
  const [additionalNeeded, setAdditionalNeeded] = useState(0);
  const [suggested, setSuggested] = useState<ExpenseItem[]>([]);
  const [strategy, setStrategy] = useState<'balanced' | 'maximize_count' | 'efficiency'>('balanced');
  const rootRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    calculateAllocations();
    calculateSuggestion();
  }, [items, availableMoney]);

  const calculateAllocations = () => {
    const pendingItems = items
      .filter((item) => !item.completed)
      .sort((a, b) => a.amount - b.amount);

    let remaining = availableMoney;
    const allocs: Allocation[] = [];

    for (const item of pendingItems) {
      if (remaining >= item.amount) {
        allocs.push({ item, canAfford: true });
        remaining -= item.amount;
      } else {
        allocs.push({ item, canAfford: false });
      }
    }

    setAllocations(allocs);
    setRemainingBalance(remaining);

    const firstUnaffordable = allocs.find((a) => !a.canAfford);
    if (firstUnaffordable) {
      setNextItem(firstUnaffordable.item);
      setAdditionalNeeded(firstUnaffordable.item.amount - remaining);
    } else {
      setNextItem(null);
      setAdditionalNeeded(0);
    }
  };

  const calculateSuggestion = () => {
    const pending = items.filter(i => !i.completed);
    const today = new Date();

    const scored = pending.map((item) => {
      const amountEfficiency = item.amount > 0 ? 1 / item.amount : 0;
      let urgencyScore = 0;
      if (item.expectedDate) {
        const d = new Date(item.expectedDate);
        const days = Math.max(0, Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
        urgencyScore = 1 / (days + 1);
      }

      let score = 0;
      if (strategy === 'balanced') score = urgencyScore * 0.7 + amountEfficiency * 0.3;
      if (strategy === 'maximize_count') score = amountEfficiency; // prefer small items
      if (strategy === 'efficiency') score = (item.amount > 0 ? (1 / item.amount) : 0) + urgencyScore * 0.2;

      return { item, score };
    }).sort((a, b) => b.score - a.score);

    const chosen: ExpenseItem[] = [];
    let left = availableMoney;
    for (const s of scored) {
      if (s.item.amount <= left) {
        chosen.push(s.item);
        left -= s.item.amount;
      }
    }

    setSuggested(chosen);
  };

  const handleUpdateMoney = () => {
    const amount = parseFloat(inputMoney);
    if (!isNaN(amount) && amount >= 0) {
      onUpdateMoney(amount);
      toast.show('Budget updated', 'success');
    }
  };

  const affordableItems = allocations.filter((a) => a.canAfford);
  const totalAffordable = affordableItems.reduce(
    (sum, a) => sum + a.item.amount,
    0
  );

  const suggestedTotal = suggested.reduce((s, i) => s + i.amount, 0);

  return (
    <div ref={rootRef} className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 shadow-lg border border-emerald-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Smart Spending Advice</h3>
        <button
          onClick={() => rootRef.current && downloadNodeAsImage(rootRef.current, 'spend-advice.png')}
          className="ml-auto text-sm px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          Screenshot
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Available Money ({currencySymbol})
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            value={inputMoney}
            onChange={(e) => setInputMoney(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={handleUpdateMoney}
            className="px-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-colors"
          >
            Update
          </button>
        </div>
      </div>

      {availableMoney > 0 && allocations.length > 0 ? (
        <div className="space-y-4">
          {affordableItems.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  You Can Afford
                </h4>
              </div>
              <div className="space-y-2">
                {affordableItems.map(({ item }) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-gray-700 dark:text-gray-300">
                      {item.name}
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {currencySymbol}{item.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {currencySymbol}{totalAffordable.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <p className="text-gray-700 dark:text-gray-300">
                  Your current budget cannot cover any pending items.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Remaining Balance
              </h4>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {currencySymbol}{remainingBalance.toFixed(2)}
            </p>
          </div>

          {nextItem && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Next Goal
                </h4>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                To afford <strong>{nextItem.name}</strong>, you need an additional:
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {currencySymbol}{additionalNeeded.toFixed(2)}
              </p>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Smart Suggestion</h4>
              <div className="ml-auto text-sm text-gray-500">Strategy:</div>
              <div className="flex gap-1">
                <button onClick={() => setStrategy('balanced')} className={`px-2 py-1 rounded ${strategy === 'balanced' ? 'bg-indigo-50 dark:bg-indigo-900' : ''}`}>Balanced</button>
                <button onClick={() => setStrategy('maximize_count')} className={`px-2 py-1 rounded ${strategy === 'maximize_count' ? 'bg-indigo-50 dark:bg-indigo-900' : ''}`}>Max Count</button>
                <button onClick={() => setStrategy('efficiency')} className={`px-2 py-1 rounded ${strategy === 'efficiency' ? 'bg-indigo-50 dark:bg-indigo-900' : ''}`}>Efficiency</button>
              </div>
            </div>

            {suggested.length > 0 ? (
              <div className="space-y-2">
                <div className="max-h-40 overflow-auto">
                  {suggested.map((it) => (
                    <div key={it.id} className="flex justify-between items-center text-sm p-2 rounded transition transform hover:scale-101 bg-white dark:bg-gray-800 border mb-1">
                      <div>
                        <div className="font-medium">{it.name}</div>
                        <div className="text-xs text-gray-500">{it.expectedDate ? `Due ${new Date(it.expectedDate).toLocaleDateString()}` : 'No date'}</div>
                      </div>
                      <div className="font-semibold">{currencySymbol}{it.amount.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">Suggested total</div>
                  <div className="font-bold text-indigo-600 dark:text-indigo-400">{currencySymbol}{suggestedTotal.toFixed(2)}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { if (suggestedTotal > 0) { onUpdateMoney(Math.max(0, availableMoney - suggestedTotal)); toast.show('Budget reserved for suggested items', 'success'); } }} className="px-4 py-2 rounded-lg bg-indigo-600 text-white">Reserve</button>
                  <button onClick={() => { navigator.clipboard?.writeText(JSON.stringify(suggested)); toast.show('Suggestion copied', 'success'); }} className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700">Copy</button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-400">No suggestions fit your current budget with this strategy.</div>
            )}
          </div>
        </div>
      ) : availableMoney === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Enter your available money above to see spending recommendations.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Add some expense plans to get personalized advice.
          </p>
        </div>
      )}
    </div>
  );
}
