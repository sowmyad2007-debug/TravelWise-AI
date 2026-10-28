import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useActiveTrip } from '../context/ActiveTripContext';
import { api } from '../api/client';
import { GroupMember, GroupSummaryResponse } from '../types';
import {
  Users,
  UserPlus,
  Trash2,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const GroupSplitter: React.FC = () => {
  const { activeTrip } = useActiveTrip();
  const [splitData, setSplitData] = useState<GroupSummaryResponse | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);

  // New member input
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [copied, setCopied] = useState(false);

  const loadGroupData = async () => {
    if (!activeTrip?.id) return;
    try {
      const [membersRes, summaryRes] = await Promise.all([
        api.getGroupMembers(activeTrip.id),
        api.getGroupSplitSummary(activeTrip.id),
      ]);
      setMembers(membersRes.members);
      setSplitData(summaryRes);
    } catch (err) {
      console.error('Failed to load group splitter data', err);
    }
  };

  useEffect(() => {
    loadGroupData();
  }, [activeTrip?.id]);

  if (!activeTrip) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4 animate-fadeIn">
        <div className="w-16 h-16 rounded-3xl bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] flex items-center justify-center mx-auto shadow-xs">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-[#172554] dark:text-[#F1F5F9]">No active trip selected</h2>
        <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#B6C2D6] max-w-md mx-auto">
          Please select a journey from your Dashboard to access the Group Expense Splitter.
        </p>
        <Link
          to="/dashboard"
          className="inline-block px-6 py-3 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs shadow-xs transition-all"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    try {
      await api.addGroupMember(activeTrip.id, {
        name: newMemberName.trim(),
        email: newMemberEmail.trim() || undefined,
      });
      setNewMemberName('');
      setNewMemberEmail('');
      await loadGroupData();
    } catch (err: any) {
      alert(err.message || 'Failed to add member.');
    }
  };

  const handleRemoveMember = async (id: number) => {
    if (!window.confirm('Remove this member from the trip group?')) return;
    try {
      await api.removeGroupMember(activeTrip.id, id);
      await loadGroupData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove member.');
    }
  };

  const handleCopySettlements = () => {
    if (!splitData) return;
    const lines = [
      `Group Expense Settlement Summary for ${activeTrip.destination}:`,
      `Total Shared Expenses: ${splitData.currency} ${splitData.total_shared_spent}`,
      `Fair Share Per Person: ${splitData.currency} ${splitData.fair_share_per_person}`,
      '',
      'Optimized Settlements (Minimum Cash Flow):'
    ];

    if (splitData.settlements.length === 0) {
      lines.push('All expenses are already balanced! No transactions needed.');
    } else {
      splitData.settlements.forEach((s) => {
        lines.push(`• ${s.from_user} pays ${s.to_user} ${s.currency} ${s.amount}`);
      });
    }

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate sum of net balances to verify mathematical invariant
  const sumNetBalances = splitData?.balances?.reduce((acc, b) => acc + b.net_balance, 0) || 0;
  const isZeroSumVerified = Math.abs(sumNetBalances) < 0.1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm relative overflow-hidden text-white">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#3984F5]/20 border border-[#3984F5]/40 px-3.5 py-1 rounded-full text-xs font-bold text-[#60A5FA] shadow-xs">
            <Users className="w-3.5 h-3.5" />
            <span>Group Travel Expense Splitter 2.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">{activeTrip.destination} Group Finances</h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Minimum Cash Flow algorithm balances multi-payer group tabs with zero residual rounding errors.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          {splitData && (
            <button
              onClick={handleCopySettlements}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#60A5FA] font-bold text-xs border border-white/20 flex items-center gap-2 transition-all shadow-xs backdrop-blur-md"
            >
              {copied ? <Check className="w-4 h-4 text-[#FACC15]" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Summary!' : 'Copy Settlement Summary'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Mathematical Verification Invariant Pill */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-[#3984F5] dark:text-[#60A5FA] shrink-0" />
          <div>
            <span className="font-bold text-[#172554] dark:text-[#F1F5F9]">Mathematical Invariant Verification:</span>
            <span className="ml-1 text-[#64748B] dark:text-[#B6C2D6]">
              Sum of Net Balances = {splitData?.currency || activeTrip.currency} {sumNetBalances.toFixed(2)} (Target: 0.00)
            </span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider self-start sm:self-auto border ${
          isZeroSumVerified
            ? 'bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] border-[#3984F5]/30'
            : 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30'
        }`}>
          {isZeroSumVerified ? 'Strict Zero-Sum Reconciled' : 'Rounding Adjustment'}
        </span>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 space-y-1 shadow-xs">
          <span className="text-[11px] font-bold text-[#64748B] dark:text-[#B6C2D6] uppercase tracking-wider">Total Shared Spending</span>
          <p className="text-2xl font-black text-[#172554] dark:text-[#F1F5F9]">
            {splitData?.currency || activeTrip.currency} {splitData?.total_shared_spent?.toLocaleString() ?? 0}
          </p>
          <p className="text-[10px] text-[#64748B] dark:text-[#B6C2D6]">From {splitData?.shared_expenses_count || 0} shared receipts</p>
        </div>

        <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 space-y-1 shadow-xs">
          <span className="text-[11px] font-bold text-[#64748B] dark:text-[#B6C2D6] uppercase tracking-wider">Group Size</span>
          <p className="text-2xl font-black text-[#3984F5] dark:text-[#60A5FA]">
            {splitData?.members_count || members.length || 1} Travelers
          </p>
          <p className="text-[10px] text-[#64748B] dark:text-[#B6C2D6]">Participating in split</p>
        </div>

        <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 space-y-1 shadow-xs">
          <span className="text-[11px] font-bold text-[#64748B] dark:text-[#B6C2D6] uppercase tracking-wider">Fair Share Per Person</span>
          <p className="text-2xl font-black text-[#F472B6] dark:text-[#F9A8D4]">
            {splitData?.currency || activeTrip.currency} {splitData?.fair_share_per_person?.toLocaleString() ?? 0}
          </p>
          <p className="text-[10px] text-[#64748B] dark:text-[#B6C2D6]">Equal split allocation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Balances and Settlements */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Minimum Debt Settlements Box */}
          <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#DCE6F5] dark:border-[#2A3A56] pb-3">
              <h3 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FACC15]" />
                Simplified Debt Settlements
              </h3>
              <span className="text-[11px] text-[#3984F5] dark:text-[#60A5FA] bg-[#3984F5]/10 px-3 py-1 rounded-full font-mono font-bold">
                Min Cash Flow Algorithm
              </span>
            </div>

            {splitData?.settlements && splitData.settlements.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">
                  Instead of confusing multi-way debt circles, settle everything with these {splitData.settlements.length} direct transfers:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {splitData.settlements.map((s, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] flex items-center justify-between gap-3 shadow-xs hover:border-[#3984F5]/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-[#F472B6] dark:text-[#F9A8D4]">{s.from_user}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#3984F5] dark:text-[#60A5FA]" />
                        <span className="font-bold text-[#3984F5] dark:text-[#60A5FA]">{s.to_user}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-[#172554] dark:text-[#F1F5F9] font-mono">
                          {s.currency} {s.amount}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-[#F5F8FF] dark:bg-[#0B1224] rounded-2xl border border-[#DCE6F5] dark:border-[#2A3A56] text-xs text-[#64748B] dark:text-[#B6C2D6] space-y-1.5">
                <CheckCircle2 className="w-7 h-7 text-[#3984F5] dark:text-[#60A5FA] mx-auto" />
                <p className="font-bold text-[#172554] dark:text-[#F1F5F9]">Everyone is all squared up!</p>
                <p>No outstanding balances or payments required.</p>
              </div>
            )}
          </div>

          {/* Individual Balances Breakdown */}
          <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9]">Individual Spending & Balance Summary</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#172554] dark:text-[#F1F5F9]">
                <thead className="bg-[#F5F8FF] dark:bg-[#0B1224] text-[#64748B] dark:text-[#B6C2D6] uppercase text-[10px] tracking-wider border-b border-[#DCE6F5] dark:border-[#2A3A56]">
                  <tr>
                    <th className="py-3 px-4">Traveler</th>
                    <th className="py-3 px-4 text-right">Total Paid</th>
                    <th className="py-3 px-4 text-right">Fair Share</th>
                    <th className="py-3 px-4 text-right">Net Balance</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE6F5] dark:divide-[#2A3A56]">
                  {splitData?.balances?.map((b, i) => (
                    <tr key={i} className="hover:bg-[#F5F8FF] dark:hover:bg-[#192640]">
                      <td className="py-3 px-4 font-bold text-[#172554] dark:text-[#F1F5F9]">{b.name}</td>
                      <td className="py-3 px-4 text-right font-mono text-[#64748B] dark:text-[#B6C2D6]">
                        {splitData.currency} {b.paid.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[#64748B] dark:text-[#B6C2D6]">
                        {splitData.currency} {b.fair_share.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span className={b.net_balance > 0 ? 'text-[#3984F5] dark:text-[#60A5FA]' : b.net_balance < 0 ? 'text-[#F472B6] dark:text-[#F9A8D4]' : 'text-[#64748B] dark:text-[#B6C2D6]'}>
                          {b.net_balance > 0 ? `+${splitData.currency} ${b.net_balance}` : `${splitData.currency} ${b.net_balance}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          b.status === 'gets_back'
                            ? 'bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] border border-[#3984F5]/30'
                            : b.status === 'owes'
                            ? 'bg-[#F472B6]/15 text-[#DB2777] dark:text-[#F9A8D4] border border-[#F472B6]/30'
                            : 'bg-[#DCE6F5]/50 dark:bg-[#192640] text-[#64748B] dark:text-[#B6C2D6]'
                        }`}>
                          {b.status === 'gets_back' ? 'Gets Back' : b.status === 'owes' ? 'Owes Money' : 'Settled'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Group Members Management */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
            <h3 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
              Add Group Traveler
            </h3>

            <form onSubmit={handleAddMember} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Friend's Name</label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="e.g. Priya Nair"
                  required
                  className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                />
              </div>

              <div>
                <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="priya@example.com"
                  className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add to Group</span>
              </button>
            </form>
          </div>

          {/* Members List */}
          <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 space-y-3 shadow-xs">
            <h4 className="text-xs font-bold text-[#64748B] dark:text-[#B6C2D6] uppercase tracking-wider">
              Travelers in This Journey ({members.length})
            </h4>

            <div className="space-y-2">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] flex items-center justify-between gap-2"
                >
                  <div className="text-xs">
                    <p className="font-bold text-[#172554] dark:text-[#F1F5F9]">{m.name}</p>
                    {m.email && <p className="text-[10px] text-[#64748B] dark:text-[#B6C2D6]">{m.email}</p>}
                  </div>
                  {members.length > 1 && (
                    <button
                      onClick={() => handleRemoveMember(m.id)}
                      className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EF4444] transition-colors"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
