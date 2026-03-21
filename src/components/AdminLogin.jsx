import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Lock, LogOut, X } from 'lucide-react';

export default function AdminLogin() {
  const { isAuthenticated, login, logout } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(password);
      setShowDialog(false);
      setPassword('');
    } catch {
      setError('סיסמה שגויה');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <button
        onClick={logout}
        className="fixed bottom-8 right-8 bg-gray-700 hover:bg-gray-800 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center z-50"
        title="התנתק מניהול"
      >
        <LogOut size={20} />
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="fixed bottom-8 right-8 bg-gray-400 hover:bg-gray-500 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center z-50 opacity-50 hover:opacity-100 transition-opacity"
        title="כניסת מנהל"
      >
        <Lock size={20} />
      </button>

      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]" onClick={() => setShowDialog(false)}>
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl" dir="rtl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-[#4A90E2]">כניסת מנהל</h3>
              <button onClick={() => setShowDialog(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleLogin}>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="סיסמת מנהל"
                className="w-full border rounded-md px-3 py-2 mb-3 text-right"
                autoFocus
              />
              {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
              <button
                type="submit"
                disabled={isLoading || !password}
                className="w-full bg-[#4A90E2] text-white rounded-md py-2 hover:bg-[#3A7AC2] disabled:opacity-50"
              >
                {isLoading ? 'מתחבר...' : 'התחבר'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
