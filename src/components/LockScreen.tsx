import { useState } from 'react';
import { storage } from '../utils/storage';
import { Lock } from 'lucide-react';

interface LockScreenProps {
  onUnlocked: () => void;
}

export function LockScreen({ onUnlocked }: LockScreenProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    setError('');
    setLoading(true);
    try {
      const ok = await storage.verifyPin(pin);
      if (ok) {
        storage.setUnlockedSession();
        onUnlocked();
      } else {
        setError('Incorrect PIN. Try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl border border-gray-200 dark:border-gray-700 w-80">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Enter PIN to Unlock</h3>
        </div>
        <input
          type="password"
          inputMode="numeric"
          pattern="[0-9]*"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="Enter your PIN"
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          onClick={handleUnlock}
          disabled={loading || pin.length === 0}
          className="mt-4 w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold disabled:opacity-60"
        >
          Unlock
        </button>
      </div>
    </div>
  );
}
