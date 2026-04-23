import { useState, useEffect } from 'react';
import { ExpenseItem, CurrencySettings } from '../types';
import { Modal } from './Modal';

interface Conflict {
  id: string;
  localItem: ExpenseItem;
  importedItem: ExpenseItem;
}

interface MergeModalProps {
  open: boolean;
  conflicts: Conflict[];
  toAdd: ExpenseItem[];
  localAvailable: number;
  importedAvailable: number;
  localCurrency: CurrencySettings;
  importedCurrency: CurrencySettings;
  onClose: () => void;
  onApply: (result: { keepIds: Record<string, 'local' | 'imported'>; addIds: string[]; chosenAvailable: 'local' | 'imported'; chosenCurrency: 'local' | 'imported' }) => void;
}

export function MergeModal({ open, conflicts, toAdd, localAvailable, importedAvailable, localCurrency, importedCurrency, onClose, onApply }: MergeModalProps) {
  const [choices, setChoices] = useState<Record<string, 'local' | 'imported'>>(() => {
    const obj: Record<string, 'local' | 'imported'> = {};
    for (const c of conflicts) obj[c.id] = 'local';
    return obj;
  });
  const [addIds, setAddIds] = useState<string[]>(() => toAdd.map(t => t.id));

  useEffect(() => {
    const obj: Record<string, 'local' | 'imported'> = {};
    for (const c of conflicts) {
      const localTime = c.localItem.lastModified ?? c.localItem.dateCreated;
      const impTime = c.importedItem.lastModified ?? c.importedItem.dateCreated;
      obj[c.id] = (new Date(impTime).getTime() > new Date(localTime).getTime()) ? 'imported' : 'local';
    }
    setChoices(obj);
  }, [conflicts]);

  useEffect(() => {
    setAddIds(toAdd.map(t => t.id));
  }, [toAdd]);
  const [chosenAvailable, setChosenAvailable] = useState<'local' | 'imported'>('local');
  const [chosenCurrency, setChosenCurrency] = useState<'local' | 'imported'>('local');

  const toggleAdd = (id: string) => {
    setAddIds((s) => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));
  };

  const formatDate = (iso?: string) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  const setChoice = (id: string, v: 'local' | 'imported') => {
    setChoices((s) => ({ ...s, [id]: v }));
  };

  const doApply = () => {
    onApply({ keepIds: choices, addIds, chosenAvailable, chosenCurrency });
  };

  return (
    <Modal open={open} title="Resolve Import Conflicts" onClose={onClose} actions={(
      <>
        <button onClick={onClose} className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700">Cancel</button>
        <button onClick={doApply} className="px-3 py-2 rounded-lg bg-emerald-500 text-white">Merge</button>
      </>
    )}>
      <div className="space-y-4">
        {conflicts.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Conflicting Plans ({conflicts.length})</h4>
            <div className="space-y-3 max-h-64 overflow-auto">
              {conflicts.map(c => (
                <div key={c.id} className="border rounded-lg p-3 bg-white dark:bg-gray-800 transition-shadow hover:shadow-lg">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="text-sm text-gray-500">Local — {formatDate(c.localItem.lastModified ?? c.localItem.dateCreated)}</div>
                      <div className="font-semibold">{c.localItem.name} — {c.localItem.amount}</div>
                      <div className="text-xs text-gray-500">{(c.localItem as any).note || ''}</div>
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-gray-500">Imported — {formatDate(c.importedItem.lastModified ?? c.importedItem.dateCreated)}</div>
                      <div className="font-semibold">{c.importedItem.name} — {c.importedItem.amount}</div>
                      <div className="text-xs text-gray-500">{(c.importedItem as any).note || ''}</div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs">Keep</label>
                      <div className="flex flex-col">
                        <label className={`px-2 py-1 rounded cursor-pointer ${choices[c.id] === 'local' ? 'bg-emerald-100 dark:bg-emerald-900' : ''}`}>
                          <input type="radio" name={`choice-${c.id}`} checked={choices[c.id] === 'local'} onChange={() => setChoice(c.id, 'local')} /> Local
                        </label>
                        <label className={`px-2 py-1 rounded cursor-pointer ${choices[c.id] === 'imported' ? 'bg-emerald-100 dark:bg-emerald-900' : ''}`}>
                          <input type="radio" name={`choice-${c.id}`} checked={choices[c.id] === 'imported'} onChange={() => setChoice(c.id, 'imported')} /> Imported
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {toAdd.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">New Plans to Add ({toAdd.length})</h4>
            <div className="grid gap-2 max-h-48 overflow-auto">
              {toAdd.map(t => (
                <label key={t.id} className="flex items-center gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg border">
                  <input type="checkbox" checked={addIds.includes(t.id)} onChange={() => toggleAdd(t.id)} />
                  <div className="flex-1 text-sm">
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.amount}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="font-semibold mb-2">Available Allocation</h4>
          {localAvailable !== importedAvailable && (
            <div className="p-2 mb-2 rounded bg-yellow-50 dark:bg-yellow-900 text-sm text-yellow-800 dark:text-yellow-200 border border-yellow-100 dark:border-yellow-800">
              Imported budget differs by <strong>{(importedAvailable - localAvailable).toFixed(2)}</strong>. Choose which budget to use.
            </div>
          )}
          <div className="flex gap-2 items-center">
            <label className={`px-3 py-2 rounded cursor-pointer ${chosenAvailable === 'local' ? 'bg-emerald-100 dark:bg-emerald-900' : ''}`}>
              <input type="radio" checked={chosenAvailable === 'local'} onChange={() => setChosenAvailable('local')} /> Keep Local ({localAvailable})
            </label>
            <label className={`px-3 py-2 rounded cursor-pointer ${chosenAvailable === 'imported' ? 'bg-emerald-100 dark:bg-emerald-900' : ''}`}>
              <input type="radio" checked={chosenAvailable === 'imported'} onChange={() => setChosenAvailable('imported')} /> Use Imported ({importedAvailable})
            </label>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Currency</h4>
          { (localCurrency.symbol !== importedCurrency.symbol || localCurrency.label !== importedCurrency.label) && (
            <div className="p-2 mb-2 rounded bg-yellow-50 dark:bg-yellow-900 text-sm text-yellow-800 dark:text-yellow-200 border border-yellow-100 dark:border-yellow-800">
              Imported currency differs ({importedCurrency.symbol} {importedCurrency.label}). Choose which to use.
            </div>
          )}
          <div className="flex gap-2 items-center">
            <label className={`px-3 py-2 rounded ${chosenCurrency === 'local' ? 'bg-emerald-100 dark:bg-emerald-900' : ''}`}>
              <input type="radio" checked={chosenCurrency === 'local'} onChange={() => setChosenCurrency('local')} /> Keep Local ({localCurrency.symbol} {localCurrency.label})
            </label>
            <label className={`px-3 py-2 rounded ${chosenCurrency === 'imported' ? 'bg-emerald-100 dark:bg-emerald-900' : ''}`}>
              <input type="radio" checked={chosenCurrency === 'imported'} onChange={() => setChosenCurrency('imported')} /> Use Imported ({importedCurrency.symbol} {importedCurrency.label})
            </label>
          </div>
        </div>
      </div>
    </Modal>
  );
}
