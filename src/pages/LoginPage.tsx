import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { ShieldAlert, Lock, User, ArrowLeft, KeyRound, Factory } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect directly to /edit
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/edit');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!usernameOrEmail.trim() || !password.trim()) {
      setErrorMsg('Please enter both username/email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(usernameOrEmail, password);
    setIsSubmitting(false);

    if (result.success) {
      navigate('/edit');
    } else {
      setErrorMsg(result.error || 'Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#0d3046] to-slate-950 flex flex-col items-center justify-center p-4">
      {/* Back to Dashboard Button */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Live Dashboard</span>
        </button>
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          Floor Security Portal
        </span>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-700/40 overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#0a2538] to-[#134665] p-6 text-white text-center border-b-2 border-amber-500">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 text-amber-400 border border-white/20 mb-3 shadow-inner">
            <Factory className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black tracking-tight uppercase">Production Dashboard</h2>
          <p className="text-xs font-medium text-cyan-200/90 mt-1 uppercase tracking-wider">
            Supervisor / Admin Login
          </p>
        </div>

        {/* Login Form */}
        <div className="p-7">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs font-semibold">
              <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  id="login-username"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="e.g. supervisor or supervisor@factory.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm uppercase tracking-wider rounded-lg shadow-md hover:shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-slate-950" />
              <span>{isSubmitting ? 'Verifying...' : 'Login to Edit Panel'}</span>
            </button>
          </form>

          {/* Helper info for supervisor */}
          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <div className="inline-block p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-left w-full">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                {isSupabaseConfigured ? 'Supabase Authentication Mode' : 'Interactive Demo Mode Access'}
              </span>
              <p className="text-xs text-slate-500">
                {isSupabaseConfigured ? (
                  'Login with your Supabase auth credentials.'
                ) : (
                  <>
                    Demo credentials: Username: <strong className="text-slate-800">supervisor</strong> | Password: <strong className="text-slate-800">admin123</strong>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
