import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import {
  User as UserIcon,
  Mail,
  Lock,
  Globe,
  DollarSign,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  Save,
  LogOut,
  Trash2,
  Sparkles,
  Heart
} from 'lucide-react';

export const UserProfile: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();

  // Profile fields
  const [name, setName] = useState('');
  const [preferredCurrency, setPreferredCurrency] = useState('INR');
  const [preferredTravelStyle, setPreferredTravelStyle] = useState('balanced');
  const [interests, setInterests] = useState<string[]>([]);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  // Account deletion modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPreferredCurrency(user.preferred_currency || 'INR');
      setPreferredTravelStyle(user.preferred_travel_style || 'balanced');
      try {
        if (typeof user.preferred_interests === 'string') {
          setInterests(JSON.parse(user.preferred_interests));
        } else if (Array.isArray(user.preferred_interests)) {
          setInterests(user.preferred_interests);
        }
      } catch (e) {
        setInterests(['nature', 'food']);
      }
    }
  }, [user]);

  const interestOptions = ['nature', 'food', 'history', 'photography', 'adventure', 'shopping', 'relaxation'];

  const toggleInterest = (id: string) => {
    if (interests.includes(id)) {
      setInterests(interests.filter((i) => i !== id));
    } else {
      setInterests([...interests, id]);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSavingProfile(true);
    setProfileSuccess('');
    setProfileError('');
    try {
      await updateProfile({
        name: name.trim(),
        preferred_currency: preferredCurrency,
        preferred_travel_style: preferredTravelStyle,
        preferred_interests: JSON.stringify(interests) as any,
      });
      setProfileSuccess('Profile and travel preferences updated successfully!');
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsSavingPassword(true);
    setPasswordSuccess('');
    setPasswordError('');
    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password. Current password may be incorrect.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== 'DELETE') {
      setDeleteError('Please type "DELETE" exactly to confirm.');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');
    try {
      await api.deleteAccount(deleteConfirmationText);
      logout();
      navigate('/');
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn text-[#172554] dark:text-[#F1F5F9]">
      
      {/* Page Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-[#172554] dark:text-[#F1F5F9]">Account Settings & Preferences</h1>
        <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">
          Manage your personal identity, travel personality, password credentials, and data privacy.
        </p>
      </div>

      <div className="space-y-8">
        
        {/* Section 1: Profile & Travel Preferences */}
        <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#DCE6F5] dark:border-[#2A3A56] pb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#3984F5]/10 border border-[#3984F5]/30 flex items-center justify-center text-[#3984F5] dark:text-[#60A5FA]">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9]">Personal Profile & Travel Style</h2>
              <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">These settings customize your AI recommendations and default trip budgets.</p>
            </div>
          </div>

          {profileSuccess && (
            <div className="p-3.5 rounded-xl bg-[#3984F5]/10 border border-[#3984F5]/30 text-[#1D4ED8] dark:text-[#60A5FA] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="p-3.5 rounded-xl bg-[#F472B6]/15 border border-[#F472B6]/30 text-[#BE185D] dark:text-[#F9A8D4] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2.5 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Email Address (Protected)</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-slate-100 dark:bg-[#192640]/50 border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2.5 text-[#64748B] cursor-not-allowed"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Default Travel Currency</label>
                <select
                  value={preferredCurrency}
                  onChange={(e) => setPreferredCurrency(e.target.value)}
                  className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2.5 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
                >
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                </select>
              </div>

              <div>
                <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Travel Style Persona</label>
                <select
                  value={preferredTravelStyle}
                  onChange={(e) => setPreferredTravelStyle(e.target.value)}
                  className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2.5 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
                >
                  <option value="budget">Budget Explorer (Cost-focused)</option>
                  <option value="balanced">Balanced Comfort (Mid-range)</option>
                  <option value="comfort">Premium Comfort (Luxury & convenience)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-2">Preferred Travel Interests</label>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map((opt) => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => toggleInterest(opt)}
                    className={`px-3.5 py-1.5 rounded-xl capitalize font-bold border transition-colors ${
                      interests.includes(opt)
                        ? 'bg-[#3984F5] text-white border-transparent shadow-sm'
                        : 'bg-[#F5F8FF] dark:bg-[#0B1224] border-[#DCE6F5] dark:border-[#2A3A56] text-[#172554] dark:text-[#F1F5F9] hover:border-[#3984F5]'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-2.5 rounded-2xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs shadow-md shadow-[#3984F5]/25 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingProfile ? 'Saving Changes...' : 'Save Preferences'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Section 2: Security & Password Update */}
        <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#DCE6F5] dark:border-[#2A3A56] pb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#F472B6]/15 border border-[#F472B6]/30 flex items-center justify-center text-[#BE185D] dark:text-[#F9A8D4]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9]">Security & Password</h2>
              <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">Update your account credentials using standard scrypt cryptography.</p>
            </div>
          </div>

          {passwordSuccess && (
            <div className="p-3.5 rounded-xl bg-[#3984F5]/10 border border-[#3984F5]/30 text-[#1D4ED8] dark:text-[#60A5FA] text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          {passwordError && (
            <div className="p-3.5 rounded-xl bg-[#F472B6]/15 border border-[#F472B6]/30 text-[#BE185D] dark:text-[#F9A8D4] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2.5 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">New Password (Min 8 chars)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2.5 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
                />
              </div>

              <div>
                <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2.5 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingPassword}
                className="px-6 py-2.5 rounded-2xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs shadow-md shadow-[#3984F5]/25 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{isSavingPassword ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Section 3: Danger Zone & Account Deletion */}
        <div className="bg-white dark:bg-[#121D33] border border-[#EF4444]/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#EF4444]/20 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-center justify-center text-[#EF4444]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9]">Danger Zone</h2>
              <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">Permanently delete your account and all associated travel records.</p>
            </div>
          </div>

          <p className="text-xs text-[#64748B] dark:text-[#B6C2D6] leading-relaxed">
            Deleting your account will erase all your saved itineraries, expense logs, group splitter balances, and chat history. This action cannot be reversed.
          </p>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-[#EF4444]/15 hover:bg-[#EF4444]/25 text-[#EF4444] font-bold text-xs border border-[#EF4444]/30 transition-all flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Request Account Deletion</span>
          </button>
        </div>

      </div>

      {/* Account Deletion Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1224]/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#121D33] border border-[#EF4444]/40 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#EF4444]/15 text-[#EF4444] flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-[#172554] dark:text-[#F1F5F9]">Confirm Account Deletion</h3>
              <p className="text-xs text-[#64748B] dark:text-[#B6C2D6] leading-relaxed">
                To confirm permanent erasure of your account and travel history, please type <strong className="text-[#EF4444] font-mono">DELETE</strong> below.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs text-center">
                {deleteError}
              </div>
            )}

            <input
              type="text"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              placeholder='Type "DELETE"'
              className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3 py-2 text-center font-mono text-[#172554] dark:text-[#F1F5F9] text-xs uppercase focus:outline-none focus:border-[#EF4444]"
            />

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmationText('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#64748B] dark:text-[#B6C2D6] text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmationText !== 'DELETE'}
                className="flex-1 py-2.5 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] disabled:opacity-40 text-white text-xs font-bold transition-colors"
              >
                {isDeleting ? 'Erasing Data...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
