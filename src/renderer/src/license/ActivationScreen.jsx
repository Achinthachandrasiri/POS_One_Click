import { useState } from 'react';
import useLicense from '../hooks/useLicense';

const ERROR_MESSAGES = {
  TAMPERED: 'This license key is invalid.',
  MALFORMED: 'This license key is invalid.',
  EXPIRED: 'This license key has expired.',
  MACHINE_MISMATCH: 'This license is already active on another device.',
  CLOCK_TAMPERED: 'System clock issue detected. Please check your device date/time.',
  NOT_ACTIVATED: null
};

function ActivationScreen({ onActivated }) {
  const { activateLicense } = useLicense();
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    if (!key.trim()) return;
    setLoading(true);
    setError('');

    const result = await activateLicense(key.trim());

    setLoading(false);
    if (result.success) {
      onActivated();
    } else {
      setError(ERROR_MESSAGES[result.error] || 'Activation failed. Please check your key.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleActivate();
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#0a1420] text-white overflow-hidden">
      {/* Ambient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 22% 30%, rgba(38,153,170,0.16), transparent 45%), radial-gradient(circle at 78% 70%, rgba(26,107,122,0.14), transparent 50%)'
        }}
      />
      <svg
        className="absolute inset-0 w-full h-full opacity-40"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <path
            key={i}
            d={`M -100 ${120 + i * 34} C 300 ${20 + i * 20}, 900 ${260 + i * 10}, 1600 ${40 + i * 30}`}
            stroke="#2699aa"
            strokeOpacity={0.12 + i * 0.03}
            strokeWidth="1.5"
            fill="none"
          />
        ))}
      </svg>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-6">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 justify-center">
            <span className="h-2 w-2 rounded-full bg-[#2699aa]" />
            <span className="text-xs tracking-[0.2em] uppercase text-slate-400">
              ALPA DEVS POS
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl p-8">
            <h2 className="text-2xl font-semibold tracking-tight mb-1">
              Activate your software
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Paste the license key you received to unlock this device.
            </p>

            <textarea
              className="w-full p-3 rounded-lg bg-[#0f1b2d] border border-white/10 focus:border-[#2699aa] focus:outline-none focus:ring-2 focus:ring-[#2699aa]/30 text-sm placeholder:text-slate-500 resize-none transition-colors"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Paste your license key here"
              rows={5}
              autoFocus
            />

            {error && (
              <p className="text-red-400 text-sm mt-3 flex items-start gap-1.5">
                <span className="mt-0.5">⚠</span>
                <span>{error}</span>
              </p>
            )}

            <button
              onClick={handleActivate}
              disabled={loading || !key.trim()}
              className="mt-5 w-full py-2.5 rounded-lg bg-[#1a6b7a] hover:bg-[#2699aa] disabled:opacity-40 disabled:hover:bg-[#1a6b7a] font-medium transition-colors"
            >
              {loading ? 'Activating…' : 'Activate'}
            </button>
          </div>

          <p className="text-center text-xs text-slate-500 mt-6">
            Need a key? Contact your ALPA DEVS account manager.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ActivationScreen;
