import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Compass, Mail, ArrowRight, CheckCircle2, AlertCircle, KeyRound, Sparkles } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successInfo, setSuccessInfo] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await api.forgotPassword({ email });
      setSuccessInfo(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process request.');
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
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#3984F5]/10 border border-[#3984F5]/30 flex items-center justify-center mx-auto text-[#3984F5] dark:text-[#60A5FA]">
            <KeyRound className="w-6 h-6 animate-spin-slow" />
          </div>
          <h2 className="text-2xl font-black text-[#172554] dark:text-[#F1F5F9]">Reset Password</h2>
          <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">
            Enter your registered email to receive secure password recovery instructions.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-[#F472B6]/15 border border-[#F472B6]/30 text-[#BE185D] dark:text-[#F9A8D4] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successInfo ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#3984F5]/10 border border-[#3984F5]/30 text-[#1D4ED8] dark:text-[#60A5FA] text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Request Processed</span>
              </div>
              <p className="text-[#172554] dark:text-[#F1F5F9] leading-relaxed">
                {successInfo.message}
              </p>
            </div>

            {/* Dev Mode Helper */}
            {successInfo.dev_reset_token && (
              <div className="p-4 rounded-2xl bg-[#F5F8FF] dark:bg-[#192640] border border-[#DCE6F5] dark:border-[#2A3A56] text-xs space-y-3">
                <div className="flex items-center gap-1.5 text-[#3984F5] dark:text-[#60A5FA] font-bold">
                  <Sparkles className="w-4 h-4 text-[#FACC15]" />
                  <span>Local Development Reset Helper</span>
                </div>
                <p className="text-[#64748B] dark:text-[#B6C2D6] text-[11px]">
                  Since an SMTP mail server is not configured in this student environment, your secure single-use token was safely generated:
                </p>
                <div className="p-2.5 bg-white dark:bg-[#0B1224] rounded-xl font-mono text-[11px] text-[#3984F5] dark:text-[#60A5FA] border border-[#DCE6F5] dark:border-[#2A3A56] break-all select-all">
                  {successInfo.dev_reset_token}
                </div>
                <Link
                  to={`/reset-password?token=${encodeURIComponent(successInfo.dev_reset_token)}`}
                  className="block text-center w-full py-2.5 bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold rounded-xl text-xs transition-opacity hover:opacity-95 shadow-md shadow-[#3984F5]/30"
                >
                  Proceed to Reset Password Now →
                </Link>
              </div>
            )}

            <div className="text-center pt-2">
              <Link to="/login" className="text-xs text-[#3984F5] dark:text-[#60A5FA] hover:underline font-bold">
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1.5">Registered Email</label>
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs shadow-lg shadow-[#3984F5]/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? 'Generating Link...' : 'Send Recovery Instructions'}
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
