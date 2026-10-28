import React, { useState } from 'react';
import {
  Target,
  Plus,
  CheckCircle2,
  Calendar,
  Sparkles,
  Plane,
  TrendingUp,
  Award
} from 'lucide-react';

interface TravelGoal {
  id: string;
  destination: string;
  targetAmount: number;
  currentSaved: number;
  currency: string;
  targetDate: string;
  category: string;
  icon: string;
}

const INITIAL_GOALS: TravelGoal[] = [
  {
    id: '1',
    destination: 'Swiss Alps Winter Retreat',
    targetAmount: 180000,
    currentSaved: 125000,
    currency: 'INR',
    targetDate: '2026-12-15',
    category: 'Adventure',
    icon: '🏔️',
  },
  {
    id: '2',
    destination: 'Kyoto Cherry Blossom Tour',
    targetAmount: 220000,
    currentSaved: 175000,
    currency: 'INR',
    targetDate: '2027-03-25',
    category: 'Culture & Nature',
    icon: '🌸',
  },
  {
    id: '3',
    destination: 'Goa Coastal Weekend Break',
    targetAmount: 25000,
    currentSaved: 25000,
    currency: 'INR',
    targetDate: '2026-11-10',
    category: 'Relaxation',
    icon: '🏖️',
  },
];

export const TravelGoals: React.FC = () => {
  const [goals, setGoals] = useState<TravelGoal[]>(INITIAL_GOALS);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [dest, setDest] = useState('');
  const [target, setTarget] = useState('');
  const [saved, setSaved] = useState('');
  const [date, setDate] = useState('');

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dest.trim() || !target) return;

    const newGoal: TravelGoal = {
      id: Date.now().toString(),
      destination: dest.trim(),
      targetAmount: parseFloat(target),
      currentSaved: parseFloat(saved) || 0,
      currency: 'INR',
      targetDate: date || '2027-01-01',
      category: 'Vacation',
      icon: '✈️',
    };

    setGoals([newGoal, ...goals]);
    setDest('');
    setTarget('');
    setSaved('');
    setDate('');
    setIsAddOpen(false);
  };

  const handleAddFunds = (id: string, boost: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === id) {
          const newCurrent = Math.min(g.targetAmount, g.currentSaved + boost);
          return { ...g, currentSaved: newCurrent };
        }
        return g;
      })
    );
  };

  const totalTargetAll = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const totalSavedAll = goals.reduce((acc, g) => acc + g.currentSaved, 0);
  const overallPct = totalTargetAll > 0 ? Math.round((totalSavedAll / totalTargetAll) * 100) : 0;

  return (
    <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 text-[#172554] dark:text-[#F1F5F9]">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE6F5] dark:border-[#2A3A56] pb-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F472B6]/15 border border-[#F472B6]/30 text-[#BE185D] dark:text-[#F9A8D4] text-xs font-bold">
            <Target className="w-3.5 h-3.5" />
            <span>Savings Fund Guardian</span>
          </div>
          <h2 className="text-xl font-black text-[#172554] dark:text-[#F1F5F9] mt-1">
            Travel Savings Goals
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">
            Set targets for upcoming flights, hotels, and dream destinations.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(!isAddOpen)}
          className="px-5 py-2.5 rounded-2xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs shadow-md shadow-[#3984F5]/25 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Travel Goal</span>
        </button>
      </div>

      {/* Aggregate Savings Progress Bar */}
      <div className="bg-[#F5F8FF] dark:bg-[#0B1224] p-5 rounded-2xl border border-[#DCE6F5] dark:border-[#2A3A56] space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
            Cumulative Goal Progress ({overallPct}%)
          </span>
          <span className="font-mono text-[#64748B] dark:text-[#B6C2D6] font-bold">
            ₹{totalSavedAll.toLocaleString()} of ₹{totalTargetAll.toLocaleString()}
          </span>
        </div>
        <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#3984F5] via-[#F472B6] to-[#FACC15] rounded-full transition-all duration-700"
            style={{ width: `${Math.min(100, overallPct)}%` }}
          />
        </div>
      </div>

      {/* New Goal Form Accordion */}
      {isAddOpen && (
        <form onSubmit={handleAddGoal} className="bg-[#F5F8FF] dark:bg-[#192640]/70 p-5 rounded-2xl border border-[#3984F5]/40 space-y-4 animate-fadeIn">
          <h3 className="text-xs font-bold text-[#3984F5] dark:text-[#60A5FA] uppercase tracking-wider">
            Define New Destination Goal
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Destination Name</label>
              <input
                type="text"
                placeholder="e.g. Bali Beach Getaway"
                value={dest}
                onChange={(e) => setDest(e.target.value)}
                required
                className="w-full bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
              />
            </div>
            <div>
              <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Target Amount (INR)</label>
              <input
                type="number"
                placeholder="e.g. 75000"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                required
                className="w-full bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
              />
            </div>
            <div>
              <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Already Saved</label>
              <input
                type="number"
                placeholder="e.g. 20000"
                value={saved}
                onChange={(e) => setSaved(e.target.value)}
                className="w-full bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
              />
            </div>
            <div>
              <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Target Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-xl bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] text-xs font-semibold text-[#64748B] dark:text-[#B6C2D6]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white text-xs font-bold shadow-md shadow-[#3984F5]/30 hover:opacity-95"
            >
              Save Goal
            </button>
          </div>
        </form>
      )}

      {/* Goals Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {goals.map((g) => {
          const pct = Math.round((g.currentSaved / g.targetAmount) * 100);
          const isFinished = pct >= 100;
          return (
            <div
              key={g.id}
              className={`p-5 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-4 ${
                isFinished
                  ? 'bg-[#3984F5]/10 dark:bg-[#3984F5]/15 border-[#3984F5]/40 shadow-sm'
                  : 'bg-[#F5F8FF] dark:bg-[#0B1224] border-[#DCE6F5] dark:border-[#2A3A56] hover:shadow-md hover:border-[#3984F5]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-xl">{g.icon}</span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    isFinished ? 'bg-[#3984F5]/20 text-[#1D4ED8] dark:text-[#60A5FA]' : 'bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA]'
                  }`}>
                    {isFinished ? 'Goal Achieved! 🎉' : `${pct}% Funded`}
                  </span>
                </div>
                <h3 className="text-sm font-black text-[#172554] dark:text-[#F1F5F9] mt-2">
                  {g.destination}
                </h3>
                <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6] flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  Target: {g.targetDate}
                </p>
              </div>

              {/* Progress and Amount */}
              <div className="space-y-2 pt-2 border-t border-[#DCE6F5] dark:border-[#2A3A56]">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#64748B] dark:text-[#B6C2D6] font-medium">Saved:</span>
                  <span className="font-bold text-[#172554] dark:text-[#F1F5F9] font-mono">
                    ₹{g.currentSaved.toLocaleString()} / ₹{g.targetAmount.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFinished ? 'bg-[#3984F5]' : 'bg-gradient-to-r from-[#3984F5] to-[#F472B6]'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>

                {!isFinished && (
                  <div className="flex gap-1.5 pt-1">
                    <button
                      onClick={() => handleAddFunds(g.id, 5000)}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] hover:border-[#3984F5] text-[10px] font-bold text-[#3984F5] dark:text-[#60A5FA] transition-colors shadow-sm"
                    >
                      +₹5,000 Boost
                    </button>
                    <button
                      onClick={() => handleAddFunds(g.id, 10000)}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] hover:border-[#F472B6] text-[10px] font-bold text-[#BE185D] dark:text-[#F9A8D4] transition-colors shadow-sm"
                    >
                      +₹10,000 Boost
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
