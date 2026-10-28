import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const urlToken = searchParams.get('token');
    if (urlToken) {
      setToken(urlToken);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorMsg('Password reset token is required.');
      return;
    }
    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      await api.resetPassword({
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid or expired token.');
    } finally {
      setIsLoading(false);
    }
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
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#3984F5]/10 border border-[#3984F5]/30 flex items-center justify-center mx-auto text-[#3984F5] dark:text-[#60A5FA]">
            <KeyRound className="w-6 h-6 animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-black text-[#172554] dark:text-[#F1F5F9]">Create New Password</h2>
          <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">
            Set a secure new password for your TravelWise account.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-[#F472B6]/15 border border-[#F472B6]/30 text-[#BE185D] dark:text-[#F9A8D4] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="p-5 rounded-2xl bg-[#3984F5]/10 border border-[#3984F5]/30 text-[#1D4ED8] dark:text-[#60A5FA] text-xs text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 mx-auto text-[#3984F5] dark:text-[#60A5FA]" />
            <h3 className="text-sm font-bold text-[#172554] dark:text-[#F1F5F9]">Password Updated!</h3>
            <p className="text-[#64748B] dark:text-[#B6C2D6]">
              Your password has been successfully reset. Redirecting you to the login page...
            </p>
            <Link
              to="/login"
              className="inline-block mt-2 px-5 py-2.5 bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold rounded-xl text-xs transition-opacity hover:opacity-95 shadow-md shadow-[#3984F5]/30"
            >
              Log In Now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1.5">Reset Token</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste reset token here"
                required
                className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2.5 text-xs text-[#172554] dark:text-[#F1F5F9] placeholder-[#64748B] font-mono focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
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

            <div>
              <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1.5">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#172554] dark:text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs shadow-lg shadow-[#3984F5]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? 'Updating Password...' : 'Save New Password'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-[#DCE6F5] dark:border-[#2A3A56] text-xs text-[#64748B] dark:text-[#B6C2D6]">
          Remember your password?{' '}
          <Link to="/login" className="text-[#3984F5] dark:text-[#60A5FA] font-bold hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
