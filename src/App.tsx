import { useState, useEffect, useRef } from 'react';
import { ExpenseItem, CurrencySettings } from './types';
import { storage } from './utils/storage';
import { KPIs } from './components/KPIs';
import { Insights } from './components/Insights';
import { AddItemForm } from './components/AddItemForm';
import { ExpenseList } from './components/ExpenseList';
import { AdviceSection } from './components/AdviceSection';
import { Wallet, Settings as SettingsIcon, Lock } from 'lucide-react';
import { LockScreen } from './components/LockScreen';
import { ToastProvider, useToast } from './components/Toast';

type BeforeInstallPromptEvent = Event & {
  prompt: () => void;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function AppInner() {
  const [items, setItems] = useState<ExpenseItem[]>([]);
  const [availableMoney, setAvailableMoney] = useState(0);
  const [currency, setCurrency] = useState<CurrencySettings>({ label: 'USD', symbol: '$' });
  const [showSettings, setShowSettings] = useState(false);
  const [currencyLabelInput, setCurrencyLabelInput] = useState('USD');
  const [currencySymbolInput, setCurrencySymbolInput] = useState('$');
  const [pinInputs, setPinInputs] = useState({ pin: '', confirm: '' });
  const [pinMessage, setPinMessage] = useState('');
  const [locked, setLocked] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const toast = useToast();
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

  useEffect(() => {
    const savedItems = storage.getItems();
    const savedMoney = storage.getAvailableMoney();
    const savedCurrency = storage.getCurrency();

    setItems(savedItems);
    setAvailableMoney(savedMoney);
    setCurrency(savedCurrency);
    setCurrencyLabelInput(savedCurrency.label);
    setCurrencySymbolInput(savedCurrency.symbol);
  }, []);

  useEffect(() => {
    if (storage.hasPin() && !storage.isSessionUnlocked()) {
      setLocked(true);
    }
  }, []);

  useEffect(() => {
    const beforeInstallHandler = (e: Event) => {
      const ev = e as unknown as BeforeInstallPromptEvent;
      e.preventDefault();
      deferredPromptRef.current = ev;
      setCanInstall(true);
    };
    const installedHandler = () => {
      setCanInstall(false);
      deferredPromptRef.current = null;
    };
    window.addEventListener('beforeinstallprompt', beforeInstallHandler);
    window.addEventListener('appinstalled', installedHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallHandler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const triggerInstall = async () => {
    const dp = deferredPromptRef.current;
    if (!dp) return;
    dp.prompt();
    const choice = await dp.userChoice;
    if (choice.outcome !== 'accepted') {
      // keep button visible for later
    } else {
      setCanInstall(false);
      deferredPromptRef.current = null;
    }
  };

  const handleAddItem = (item: {
    name: string;
    amount: number;
    expectedDate?: string;
  }) => {
    const newItem = storage.addItem(item);
    setItems([...items, newItem]);
    toast.show('Item added', 'success');
  };

  const handleToggleComplete = (id: string) => {
    const prev = items.find((i) => i.id === id);
    storage.toggleComplete(id);
    setItems(storage.getItems());
    if (prev && !prev.completed) {
      import('./utils/confetti').then(m => m.celebrateCompletion());
      toast.show('Marked completed 🎉', 'success');
    } else {
      toast.show('Status updated', 'success');
    }
  };

  const handleDelete = (id: string) => {
    storage.deleteItem(id);
    setItems(storage.getItems());
    toast.show('Item deleted', 'success');
  };

  const handleUpdateMoney = (amount: number) => {
    storage.saveAvailableMoney(amount);
    setAvailableMoney(amount);
    toast.show('Available money updated', 'success');
  };

  const handleUpdateItem = (id: string, updates: Partial<ExpenseItem>) => {
    storage.updateItem(id, updates);
    setItems(storage.getItems());
    toast.show('Item updated', 'success');
  };

  const saveCurrencySettings = () => {
    const next: CurrencySettings = {
      label: currencyLabelInput.trim() || 'USD',
      symbol: currencySymbolInput.trim() || '$',
    };
    storage.saveCurrency(next);
    setCurrency(next);
    setShowSettings(false);
    toast.show('Currency saved', 'success');
  };

  const savePin = async () => {
    setPinMessage('');
    if (pinInputs.pin.length < 4) {
      setPinMessage('PIN should be at least 4 digits.');
      return;
    }
    if (pinInputs.pin !== pinInputs.confirm) {
      setPinMessage('PINs do not match.');
      return;
    }
    await storage.setPin(pinInputs.pin);
    setPinInputs({ pin: '', confirm: '' });
    setPinMessage('PIN set successfully.');
    toast.show('PIN saved', 'success');
  };

  const clearPin = () => {
    storage.clearPin();
    setPinMessage('PIN cleared.');
  };

  const lockNow = () => {
    sessionStorage.removeItem('spend_unlocked_session');
    setLocked(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      {locked && storage.hasPin() && (
        <LockScreen onUnlocked={() => setLocked(false)} />
      )}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-2xl shadow-lg">
                <Wallet className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                  SPEND
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your Offline Expense Planning Tracker
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {canInstall && (
                <button
                  onClick={triggerInstall}
                  className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold max-w-full"
                  title="Install app"
                >
                  Install App
                </button>
              )}
              {!canInstall && isIos && (
                <button
                  onClick={() => toast.show('iOS: Share → Add to Home Screen', 'info')}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  title="Install on iOS"
                >
                  iOS Install Tips
                </button>
              )}
              {storage.hasPin() && (
                <button
                  onClick={lockNow}
                  className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                  aria-label="Lock now"
                  title="Lock now"
                >
                  <Lock className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                </button>
              )}
              <button
              onClick={() => setShowSettings(s => !s)}
              className="p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              aria-label="Open settings"
              title="Settings"
            >
              <SettingsIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            </div>
          </div>
        </header>

        {showSettings && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Settings</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Currency Name</label>
                <input
                  value={currencyLabelInput}
                  onChange={(e) => setCurrencyLabelInput(e.target.value)}
                  placeholder="e.g. USD, NGN, EUR"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Currency Symbol/Icon</label>
                <input
                  value={currencySymbolInput}
                  onChange={(e) => setCurrencySymbolInput(e.target.value)}
                  placeholder="e.g. $, ₦, €, ₹ or emoji"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={saveCurrencySettings}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
              >
                Save
              </button>
              <span className="self-center text-sm text-gray-500 dark:text-gray-400">
                Current: {currency.symbol} ({currency.label})
              </span>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Security</h4>
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Set PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pinInputs.pin}
                    onChange={(e) => setPinInputs((p) => ({ ...p, pin: e.target.value }))}
                    placeholder="Enter PIN"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-700 dark:text-gray-300">Confirm PIN</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pinInputs.confirm}
                    onChange={(e) => setPinInputs((p) => ({ ...p, confirm: e.target.value }))}
                    placeholder="Confirm PIN"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={savePin}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                >
                  Save PIN
                </button>
                <button
                  onClick={clearPin}
                  className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-semibold"
                >
                  Clear PIN
                </button>
                {storage.hasPin() && (
                  <button
                    onClick={lockNow}
                    className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold"
                  >
                    Lock Now
                  </button>
                )}
                {pinMessage && <span className="self-center text-sm text-gray-500 dark:text-gray-400">{pinMessage}</span>}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Backup &amp; Restore</h4>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    const data = storage.exportData();
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `spend-backup-${new Date().toISOString().slice(0,10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    toast.show('Backup exported', 'success');
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
                >
                  Export Data
                </button>
                <button
                  onClick={() => importInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold"
                >
                  Import Data
                </button>
                <input
                  ref={importInputRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const text = await file.text();
                    const res = storage.importData(text);
                    if (res.ok) {
                      setItems(storage.getItems());
                      setAvailableMoney(storage.getAvailableMoney());
                      setCurrency(storage.getCurrency());
                      setCurrencyLabelInput(storage.getCurrency().label);
                      setCurrencySymbolInput(storage.getCurrency().symbol);
                      toast.show('Data imported', 'success');
                    } else {
                      toast.show(res.error || 'Import failed', 'error');
                    }
                    e.currentTarget.value = '';
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">PIN and session are not exported for your security.</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <KPIs items={items} currencySymbol={currency.symbol} />
          <Insights items={items} currencySymbol={currency.symbol} />

          <AddItemForm onAdd={handleAddItem} currencySymbol={currency.symbol} />

          <AdviceSection
            items={items}
            availableMoney={availableMoney}
            onUpdateMoney={handleUpdateMoney}
            currencySymbol={currency.symbol}
          />

          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Your Expense Plans
            </h2>
            <ExpenseList
              items={items}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDelete}
              currencySymbol={currency.symbol}
              onUpdateItem={handleUpdateItem}
            />
          </div>
        </div>

        <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>All data stored locally on your device. Works completely offline.</p>
          <p className="mt-2">
            Designed by{' '}
            <a
              href="https://wa.me/2349014532386"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Positive Developer
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
