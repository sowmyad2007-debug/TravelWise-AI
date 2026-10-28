import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Compass, Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('demo@travelwise.ai');
    setPassword('Password123!');
    setErrorMsg('');
  };

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center px-4 py-12 overflow-hidden bg-[#F5F8FF] dark:bg-[#0B1224]">
      
      {/* Photographic Ambient Layer */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-10 dark:opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=1800&q=80')`
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#F5F8FF] via-[#F5F8FF]/80 to-transparent dark:from-[#0B1224] dark:via-[#0B1224]/85 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#3984F5]/10 dark:bg-[#3984F5]/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 w-full max-w-md bg-white/95 dark:bg-[#121D33]/95 border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl space-y-6 text-[#172554] dark:text-[#F1F5F9]">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#3984F5]/10 border border-[#3984F5]/30 flex items-center justify-center mx-auto text-[#3984F5] dark:text-[#60A5FA]">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-black text-[#172554] dark:text-[#F1F5F9]">Welcome Back</h2>
          <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">
            Log in to access your adaptive itineraries and budget guardian.
          </p>
        </div>

        {/* Demo Account Helper Pill */}
        <div className="bg-[#F5F8FF] dark:bg-[#192640] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl p-3.5 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-[#3984F5] dark:text-[#60A5FA] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-[#FACC15]" />
              Evaluation Demo Account
            </p>
            <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6] font-mono">demo@travelwise.ai • Password123!</p>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="px-3 py-1.5 bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold rounded-xl text-[10px] transition-opacity hover:opacity-95 shadow-sm"
          >
            Auto Fill
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-[#F472B6]/15 border border-[#F472B6]/30 text-[#BE185D] dark:text-[#F9A8D4] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                required
                className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#172554] dark:text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9]">Password</label>
              <Link to="/forgot-password" className="text-[11px] text-[#3984F5] dark:text-[#60A5FA] hover:underline font-semibold">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl pl-10 pr-10 py-2.5 text-xs text-[#172554] dark:text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-[#64748B] hover:text-[#172554] dark:hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-2xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs shadow-lg shadow-[#3984F5]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? 'Signing In...' : 'Log In to TravelWise'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-[#DCE6F5] dark:border-[#2A3A56] text-xs text-[#64748B] dark:text-[#B6C2D6]">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#3984F5] dark:text-[#60A5FA] font-bold hover:underline">
            Create an Account Free
          </Link>
        </div>
      </div>
    </div>
  );
};
