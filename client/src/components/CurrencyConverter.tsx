import React, { useState } from 'react';
import {
  ArrowRightLeft,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Sparkles,
  Info
} from 'lucide-react';

const RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  INR: 0.012, // 1 INR ~ 0.012 USD (1 USD ~ 83.3 INR)
  EUR: 1.08,  // 1 EUR ~ 1.08 USD
  GBP: 1.28,  // 1 GBP ~ 1.28 USD
  JPY: 0.0066,// 1 JPY ~ 0.0066 USD (1 USD ~ 151 JPY)
  AUD: 0.65,  // 1 AUD ~ 0.65 USD
  CAD: 0.73,  // 1 CAD ~ 0.73 USD
  AED: 0.272, // 1 AED ~ 0.272 USD (1 USD ~ 3.67 AED)
  SGD: 0.74,  // 1 SGD ~ 0.74 USD
  CHF: 1.12,  // 1 CHF ~ 1.12 USD
  THB: 0.027, // 1 THB ~ 0.027 USD
};

const CURRENCY_INFO: Record<string, { name: string; symbol: string; flag: string }> = {
  INR: { name: 'Indian Rupee', symbol: '₹', flag: '🇮🇳' },
  USD: { name: 'US Dollar', symbol: '$', flag: '🇺🇸' },
  EUR: { name: 'Euro', symbol: '€', flag: '🇪🇺' },
  GBP: { name: 'British Pound', symbol: '£', flag: '🇬🇧' },
  JPY: { name: 'Japanese Yen', symbol: '¥', flag: '🇯🇵' },
  AUD: { name: 'Australian Dollar', symbol: 'A$', flag: '🇦🇺' },
  CAD: { name: 'Canadian Dollar', symbol: 'C$', flag: '🇨🇦' },
  AED: { name: 'UAE Dirham', symbol: 'AED', flag: '🇦🇪' },
  SGD: { name: 'Singapore Dollar', symbol: 'S$', flag: '🇸🇬' },
  CHF: { name: 'Swiss Franc', symbol: 'CHF', flag: '🇨🇭' },
  THB: { name: 'Thai Baht', symbol: '฿', flag: '🇹🇭' },
};

export const CurrencyConverter: React.FC = () => {
  const [amount, setAmount] = useState<number>(100);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('INR');

  // Convert via USD bridge
  const fromRate = RATES_TO_USD[fromCurrency] || 1;
  const toRate = RATES_TO_USD[toCurrency] || 1;
  const convertedAmount = (amount * fromRate) / toRate;
  const singleUnitExchange = fromRate / toRate;

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const quickPills = [
    { from: 'USD', to: 'INR', amt: 100 },
    { from: 'EUR', to: 'USD', amt: 150 },
    { from: 'INR', to: 'EUR', amt: 10000 },
    { from: 'USD', to: 'JPY', amt: 250 },
    { from: 'USD', to: 'AED', amt: 500 },
  ];

  return (
    <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-[#172554] dark:text-[#F1F5F9]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DCE6F5] dark:border-[#2A3A56] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#3984F5]/10 border border-[#3984F5]/30 text-[#3984F5] dark:text-[#60A5FA] text-xs font-bold">
            <DollarSign className="w-3.5 h-3.5" />
            <span>Real-Time Travel Exchange</span>
          </div>
          <h2 className="text-xl font-black text-[#172554] dark:text-[#F1F5F9] mt-1">
            Currency Converter
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">
            Calculate accurate international rates before booking flights or dining.
          </p>
        </div>

        <div className="text-xs text-[#3984F5] dark:text-[#60A5FA] flex items-center gap-1.5 font-bold">
          <Sparkles className="w-4 h-4 text-[#FACC15]" />
          <span>Mid-Market Reference Rates</span>
        </div>
      </div>

      {/* Converter Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
        
        {/* Source Currency */}
        <div className="md:col-span-5 bg-[#F5F8FF] dark:bg-[#0B1224] p-5 rounded-2xl border border-[#DCE6F5] dark:border-[#2A3A56] space-y-2">
          <label className="text-[11px] font-bold text-[#64748B] dark:text-[#B6C2D6] uppercase tracking-wider block">
            You Spend
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-transparent text-2xl font-black text-[#172554] dark:text-[#F1F5F9] focus:outline-none"
            />
            <select
              value={fromCurrency}
              onChange={(e) => setFromCurrency(e.target.value)}
              className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] font-bold text-xs text-[#172554] dark:text-[#F1F5F9] py-2 px-3 rounded-xl focus:outline-none focus:border-[#3984F5]"
            >
              {Object.keys(CURRENCY_INFO).map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_INFO[c].flag} {c}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6]">
            {CURRENCY_INFO[fromCurrency]?.name}
          </p>
        </div>

        {/* Swap Button */}
        <div className="md:col-span-1 flex justify-center">
          <button
            onClick={handleSwap}
            className="w-12 h-12 rounded-2xl bg-[#F5F8FF] dark:bg-[#192640] hover:bg-[#3984F5]/15 text-[#3984F5] dark:text-[#60A5FA] flex items-center justify-center transition-all shadow-sm hover:scale-105 active:scale-95 border border-[#DCE6F5] dark:border-[#2A3A56]"
            title="Swap Currencies"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Target Currency */}
        <div className="md:col-span-5 bg-[#3984F5]/10 dark:bg-[#3984F5]/15 p-5 rounded-2xl border border-[#3984F5]/30 space-y-2">
          <label className="text-[11px] font-bold text-[#1D4ED8] dark:text-[#60A5FA] uppercase tracking-wider block">
            You Receive (Estimated)
          </label>
          <div className="flex items-center gap-2">
            <p className="w-full text-2xl font-black text-[#172554] dark:text-[#F1F5F9] truncate">
              {CURRENCY_INFO[toCurrency]?.symbol} {convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <select
              value={toCurrency}
              onChange={(e) => setToCurrency(e.target.value)}
              className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] font-bold text-xs text-[#172554] dark:text-[#F1F5F9] py-2 px-3 rounded-xl focus:outline-none focus:border-[#3984F5]"
            >
              {Object.keys(CURRENCY_INFO).map((c) => (
                <option key={c} value={c}>
                  {CURRENCY_INFO[c].flag} {c}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-[#3984F5] dark:text-[#60A5FA] font-medium">
            {CURRENCY_INFO[toCurrency]?.name}
          </p>
        </div>

      </div>

      {/* Exchange Rate Badge */}
      <div className="p-4 bg-[#F5F8FF] dark:bg-[#0B1224] rounded-2xl border border-[#DCE6F5] dark:border-[#2A3A56] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <span className="font-bold text-[#172554] dark:text-[#F1F5F9]">
          1 {fromCurrency} = {singleUnitExchange.toFixed(4)} {toCurrency}
        </span>
        <span className="text-[#64748B] dark:text-[#B6C2D6] text-[11px]">
          1 {toCurrency} = {(1 / singleUnitExchange).toFixed(4)} {fromCurrency}
        </span>
      </div>

      {/* Quick Conversion Shortcuts */}
      <div className="space-y-2 pt-1">
        <span className="text-[11px] font-bold text-[#64748B] dark:text-[#B6C2D6] uppercase tracking-wider block">
          Frequent Travel Conversions
        </span>
        <div className="flex flex-wrap gap-2">
          {quickPills.map((pill, idx) => (
            <button
              key={idx}
              onClick={() => {
                setFromCurrency(pill.from);
                setToCurrency(pill.to);
                setAmount(pill.amt);
              }}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#192640] border border-[#DCE6F5] dark:border-[#2A3A56] hover:border-[#3984F5] text-xs font-bold text-[#172554] dark:text-[#F1F5F9] hover:text-[#3984F5] dark:hover:text-[#60A5FA] transition-colors shadow-sm"
            >
              {pill.amt} {pill.from} → {pill.to}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
};
