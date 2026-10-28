import React, { useState } from 'react';
import { api } from '../api/client';
import { Trip } from '../types';
import {
  Plane,
  Building,
  Utensils,
  Car,
  ShoppingBag,
  Sparkles,
  HelpCircle,
  Upload,
  Calendar,
  CreditCard,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';

interface AddExpenseFormProps {
  trips: Trip[];
  activeTripId?: number | null;
  onExpenseAdded: () => void;
  onCancel?: () => void;
}

export const CATEGORIES = [
  { id: 'flights', label: 'Flights', icon: Plane, bg: 'bg-[#3984F5]/10', text: 'text-[#3984F5] dark:text-[#60A5FA]', border: 'border-[#3984F5]/30' },
  { id: 'accommodation', label: 'Accommodation', icon: Building, bg: 'bg-[#F472B6]/15', text: 'text-[#BE185D] dark:text-[#F9A8D4]', border: 'border-[#F472B6]/30' },
  { id: 'food', label: 'Food & Dining', icon: Utensils, bg: 'bg-[#FACC15]/20', text: 'text-[#B45309] dark:text-[#FDE047]', border: 'border-[#FACC15]/40' },
  { id: 'transportation', label: 'Transportation', icon: Car, bg: 'bg-[#3984F5]/10', text: 'text-[#3984F5] dark:text-[#60A5FA]', border: 'border-[#3984F5]/30' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, bg: 'bg-[#F472B6]/15', text: 'text-[#BE185D] dark:text-[#F9A8D4]', border: 'border-[#F472B6]/30' },
  { id: 'activities', label: 'Activities & Tours', icon: Sparkles, bg: 'bg-[#3984F5]/10', text: 'text-[#3984F5] dark:text-[#60A5FA]', border: 'border-[#3984F5]/30' },
  { id: 'miscellaneous', label: 'Miscellaneous', icon: HelpCircle, bg: 'bg-[#F5F8FF] dark:bg-[#192640]', text: 'text-[#64748B] dark:text-[#B6C2D6]', border: 'border-[#DCE6F5] dark:border-[#2A3A56]' },
];

export const PAYMENT_METHODS = [
  'Credit Card',
  'Debit Card',
  'Cash',
  'UPI / Digital Wallet',
  'Bank Transfer'
];

export const AddExpenseForm: React.FC<AddExpenseFormProps> = ({
  trips,
  activeTripId,
  onExpenseAdded,
  onCancel
}) => {
  const [selectedTripId, setSelectedTripId] = useState<number>(activeTripId || trips[0]?.id || 0);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [category, setCategory] = useState('food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [notes, setNotes] = useState('');
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const currentTrip = trips.find((t) => t.id === selectedTripId);

  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Receipt file exceeds 5MB limit.');
        return;
      }
      setReceiptFileName(file.name);
      setErrorMsg('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTripId) {
      setErrorMsg('Please select a destination trip.');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Please provide an expense title.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Please enter a valid positive expense amount.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const fullNotes = [
        paymentMethod ? `[Payment: ${paymentMethod}]` : '',
        receiptFileName ? `[Receipt: ${receiptFileName}]` : '',
        notes.trim()
      ].filter(Boolean).join(' ');

      await api.addExpense(selectedTripId, {
        title: title.trim(),
        category,
        amount: parsedAmount,
        date,
        notes: fullNotes,
        payer_name: 'You',
        is_shared: true,
        is_verified_price: true
      });

      setSuccessMsg(`Expense "${title}" saved successfully!`);
      setTitle('');
      setAmount('');
      setNotes('');
      setReceiptFileName(null);
      setTimeout(() => {
        onExpenseAdded();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save expense. Please verify input.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-[#172554] dark:text-[#F1F5F9]">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#DCE6F5] dark:border-[#2A3A56] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3984F5]/10 border border-[#3984F5]/30 text-[#3984F5] dark:text-[#60A5FA] text-xs font-bold">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Fast Expense Logger</span>
          </div>
          <h2 className="text-xl font-black text-[#172554] dark:text-[#F1F5F9] mt-1">
            Add New Travel Expense
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">
            Record flights, stays, dining, and transit to keep your budget balanced.
          </p>
        </div>

        {currentTrip && (
          <div className="hidden sm:block text-right">
            <span className="text-[10px] uppercase font-bold text-[#64748B] dark:text-[#B6C2D6]">Target Trip</span>
            <p className="text-xs font-bold text-[#172554] dark:text-[#F1F5F9]">{currentTrip.destination}</p>
            <p className="text-[11px] text-[#3984F5] dark:text-[#60A5FA] font-semibold">{currentTrip.currency} {currentTrip.remaining_budget.toLocaleString()} remaining</p>
          </div>
        )}
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-[#F472B6]/15 border border-[#F472B6]/30 text-[#BE185D] dark:text-[#F9A8D4] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-2xl bg-[#3984F5]/10 border border-[#3984F5]/30 text-[#1D4ED8] dark:text-[#60A5FA] text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Category Picker Chips */}
        <div>
          <label className="block text-xs font-bold text-[#172554] dark:text-[#F1F5F9] mb-2.5">
            Select Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    isSelected
                      ? `${cat.bg} dark:bg-[#192640] ${cat.border} ring-2 ring-[#3984F5]/40 shadow-sm scale-102`
                      : 'bg-[#F5F8FF] dark:bg-[#192640]/40 border-[#DCE6F5] dark:border-[#2A3A56] hover:border-[#3984F5]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl ${cat.bg} flex items-center justify-center ${cat.text}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className={`text-[11px] font-bold truncate max-w-full ${
                    isSelected ? 'text-[#172554] dark:text-[#F1F5F9]' : 'text-[#64748B] dark:text-[#B6C2D6]'
                  }`}>
                    {cat.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title & Amount Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-7">
            <label className="block text-xs font-bold text-[#172554] dark:text-[#F1F5F9] mb-1.5">
              Expense Title / Merchant
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Flight Ticket, Mountain Cafe, Train Pass"
              required
              className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl px-4 py-3 text-xs text-[#172554] dark:text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA] focus:ring-2 focus:ring-[#3984F5]/20 transition-all font-medium"
            />
          </div>

          <div className="sm:col-span-5">
            <label className="block text-xs font-bold text-[#172554] dark:text-[#F1F5F9] mb-1.5">
              Amount & Currency
            </label>
            <div className="flex gap-2">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl px-3 py-3 text-xs text-[#172554] dark:text-[#F1F5F9] font-bold focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="AUD">AUD (A$)</option>
              </select>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
                className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl px-4 py-3 text-xs text-[#172554] dark:text-[#F1F5F9] font-black placeholder-[#64748B] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA] focus:ring-2 focus:ring-[#3984F5]/20 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Date, Payment Method, Destination Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#172554] dark:text-[#F1F5F9] mb-1.5">
              Associated Journey
            </label>
            <select
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(Number(e.target.value))}
              className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl px-3.5 py-3 text-xs text-[#172554] dark:text-[#F1F5F9] font-semibold focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
            >
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.destination} ({trip.start_date})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172554] dark:text-[#F1F5F9] mb-1.5">
              Date Incurred
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl pl-10 pr-3.5 py-3 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172554] dark:text-[#F1F5F9] mb-1.5">
              Payment Method
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3.5" />
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl pl-10 pr-3.5 py-3 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Optional Notes & Receipt Upload */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#172554] dark:text-[#F1F5F9] mb-1.5">
              Notes & Tags
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Split with Priya and Alex, tips included"
              className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl px-4 py-3 text-xs text-[#172554] dark:text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#172554] dark:text-[#F1F5F9] mb-1.5">
              Attach Receipt / Bill (Optional)
            </label>
            <div className="relative">
              <input
                type="file"
                id="receipt-file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleReceiptUpload}
                className="hidden"
              />
              <label
                htmlFor="receipt-file"
                className="w-full flex items-center justify-between bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl px-4 py-2.5 text-xs text-[#64748B] dark:text-[#B6C2D6] hover:border-[#3984F5] dark:hover:border-[#60A5FA] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2 truncate">
                  <Upload className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA] shrink-0" />
                  <span className="truncate">{receiptFileName || 'Upload Receipt Image or PDF'}</span>
                </div>
                <span className="text-[10px] font-bold text-[#3984F5] dark:text-[#60A5FA] uppercase shrink-0">Browse</span>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Footer */}
        <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#DCE6F5] dark:border-[#2A3A56]">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-3 rounded-2xl bg-[#F5F8FF] dark:bg-[#192640] hover:bg-[#DCE6F5] dark:hover:bg-[#2A3A56] text-[#172554] dark:text-[#F1F5F9] font-bold text-xs transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="px-7 py-3 rounded-2xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs shadow-md shadow-[#3984F5]/25 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save & Log Expense'}
          </button>
        </div>
      </form>
    </div>
  );
};
