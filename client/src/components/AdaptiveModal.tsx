import React, { useState, useEffect } from 'react';
import { useActiveTrip } from '../context/ActiveTripContext';
import { api } from '../api/client';
import { AdaptationProposal, ProposedChange, ItineraryRevision } from '../types';
import {
  Sparkles,
  AlertTriangle,
  Umbrella,
  Clock,
  DollarSign,
  ArrowRight,
  Check,
  X,
  RefreshCw,
  ShieldCheck,
  ChevronRight,
  History,
  RotateCcw,
  CheckCircle2,
  Sliders,
  Info,
  Calendar
} from 'lucide-react';

interface AdaptiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialScenario?: string;
  onSuccess?: () => void;
}

export const AdaptiveModal: React.FC<AdaptiveModalProps> = ({
  isOpen,
  onClose,
  initialScenario = 'overspent',
  onSuccess
}) => {
  const { activeTrip, refreshTrip } = useActiveTrip();
  const [selectedScenario, setSelectedScenario] = useState<string>(initialScenario);
  const [proposal, setProposal] = useState<AdaptationProposal | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Selected changes checkboxes (allowing user to select which changes to apply)
  const [selectedChangeIndices, setSelectedChangeIndices] = useState<number[]>([]);

  // Revision history & undo state
  const [activeTab, setActiveTab] = useState<'evaluate' | 'history'>('evaluate');
  const [revisions, setRevisions] = useState<ItineraryRevision[]>([]);
  const [isLoadingRevisions, setIsLoadingRevisions] = useState<boolean>(false);
  const [isUndoing, setIsUndoing] = useState<boolean>(false);

  const scenarios = [
    {
      id: 'overspent',
      label: 'Budget Overrun / Low Funds',
      icon: DollarSign,
      desc: 'Replaces costly admissions with free viewpoints and heritage strolls.',
      color: 'text-[#1D4ED8] bg-[#3984F5]/15 border-[#3984F5]/40'
    },
    {
      id: 'rain',
      label: 'Rain / Bad Weather Contingency',
      icon: Umbrella,
      desc: 'Swaps outdoor lakes and treks with sheltered museums and covered markets.',
      color: 'text-[#3984F5] bg-[#3984F5]/15 border-[#3984F5]/40'
    },
    {
      id: 'shortened_time',
      label: 'Schedule Crunch (Fewer Hours)',
      icon: Clock,
      desc: 'Streamlines the daily schedule to remove transit fatigue and free 2-3 hours.',
      color: 'text-[#BE185D] bg-[#F472B6]/15 border-[#F472B6]/40'
    },
    {
      id: 'cheaper_alternatives',
      label: 'Max Savings Mode',
      icon: Sparkles,
      desc: 'Aggressively finds budget-tier activities to maximize pocket savings.',
      color: 'text-[#B45309] bg-[#FACC15]/20 border-[#FACC15]/40'
    }
  ];

  useEffect(() => {
    if (isOpen && activeTrip?.id) {
      setSelectedScenario(initialScenario);
      evaluateScenario(initialScenario);
      loadRevisions();
    }
  }, [isOpen, activeTrip?.id, initialScenario]);

  const loadRevisions = async () => {
    if (!activeTrip?.id) return;
    setIsLoadingRevisions(true);
    try {
      const res = await api.getTripRevisions(activeTrip.id);
      setRevisions(res.revisions || []);
    } catch (err) {
      console.warn('Could not load revisions', err);
    } finally {
      setIsLoadingRevisions(false);
    }
  };

  const evaluateScenario = async (scenarioKey: string) => {
    if (!activeTrip?.id) return;
    setIsEvaluating(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.evaluateAdaptation(activeTrip.id, { scenario: scenarioKey });
      setProposal(res);
      // Select all proposed changes by default
      if (res.proposed_changes) {
        setSelectedChangeIndices(res.proposed_changes.map((_: any, idx: number) => idx));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to evaluate adaptive plan.');
    } finally {
      setIsEvaluating(false);
    }
  };

  const toggleChangeSelection = (index: number) => {
    if (selectedChangeIndices.includes(index)) {
      setSelectedChangeIndices(selectedChangeIndices.filter((i) => i !== index));
    } else {
      setSelectedChangeIndices([...selectedChangeIndices, index]);
    }
  };

  const handleApplyChanges = async () => {
    if (!activeTrip?.id || !proposal || selectedChangeIndices.length === 0) return;
    setIsApplying(true);
    setErrorMsg('');
    try {
      const chosenChanges = selectedChangeIndices.map((idx) => proposal.proposed_changes[idx]);
      const res = await api.applyAdaptation(activeTrip.id, chosenChanges, selectedScenario);
      setSuccessMsg(res.message);
      await refreshTrip();
      await loadRevisions();
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to apply adaptive changes.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleUndoRevision = async (revId: number) => {
    if (!activeTrip?.id) return;
    if (!window.confirm('Restore itinerary to the exact state before this revision was applied?')) return;
    setIsUndoing(true);
    setErrorMsg('');
    try {
      const res = await api.undoRevision(activeTrip.id, revId);
      setSuccessMsg(res.message);
      await refreshTrip();
      await loadRevisions();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to undo revision.');
    } finally {
      setIsUndoing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1224]/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#172554] dark:text-[#F1F5F9]">
        
        {/* Header */}
        <div className="bg-[#121D33] text-white p-5 border-b border-[#2A3A56] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#3984F5]/20 border border-[#3984F5]/40 flex items-center justify-center text-[#60A5FA]">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Adaptive Travel Intelligence 2.0
                <span className="text-[10px] bg-[#3984F5]/20 text-[#60A5FA] border border-[#3984F5]/40 px-2 py-0.5 rounded-full font-mono font-bold">
                  Multi-Constraint Engine
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Constraint-aware optimization with transparent scoring, weather awareness, and full undo capability.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tab Toggle: Evaluate vs Revision History */}
            <div className="bg-white/10 border border-white/15 rounded-xl p-1 flex items-center gap-1 text-xs">
              <button
                onClick={() => setActiveTab('evaluate')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                  activeTab === 'evaluate' ? 'bg-[#3984F5] text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                Plan Alternatives
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
                  activeTab === 'history' ? 'bg-[#3984F5] text-white shadow-sm' : 'text-slate-300 hover:text-white'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Revision History ({revisions.length})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab 1: Evaluate & Alternatives */}
        {activeTab === 'evaluate' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Scenario Selector */}
            <div>
              <label className="block text-xs font-bold text-[#64748B] dark:text-[#B6C2D6] uppercase tracking-wider mb-2.5">
                Select Circumstance or Disruption Event
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scenarios.map((sc) => {
                  const Icon = sc.icon;
                  const isSelected = selectedScenario === sc.id;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => {
                        setSelectedScenario(sc.id);
                        evaluateScenario(sc.id);
                      }}
                      className={`text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                        isSelected
                          ? 'bg-[#3984F5]/10 border-[#3984F5] shadow-md ring-2 ring-[#3984F5]/30'
                          : 'bg-[#F5F8FF] dark:bg-[#192640]/60 border-[#DCE6F5] dark:border-[#2A3A56] hover:border-[#3984F5]'
                      }`}
                    >
                      <div className={`p-2.5 rounded-xl border shrink-0 ${sc.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-1">
                          {sc.label}
                        </h4>
                        <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6] mt-0.5 leading-snug">
                          {sc.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Constraint Audit Card */}
            {proposal?.constraints_audit && (
              <div className="bg-[#F5F8FF] dark:bg-[#192640]/40 border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl p-4 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-[#3984F5] dark:text-[#60A5FA] uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" />
                  Multi-Factor Constraint Audit
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-white dark:bg-[#121D33] p-3 rounded-xl border border-[#DCE6F5] dark:border-[#2A3A56]">
                    <p className="text-[10px] text-[#64748B] dark:text-[#B6C2D6] font-semibold">Budget Constraint</p>
                    <p className="font-bold text-[#172554] dark:text-[#F1F5F9] mt-0.5">
                      {activeTrip?.currency} {proposal.constraints_audit.budget_constraint.remaining_funds} remaining
                    </p>
                    <p className="text-[10px] text-[#64748B] dark:text-[#B6C2D6] capitalize">
                      Status: {proposal.constraints_audit.budget_constraint.status}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-[#121D33] p-3 rounded-xl border border-[#DCE6F5] dark:border-[#2A3A56]">
                    <p className="text-[10px] text-[#64748B] dark:text-[#B6C2D6] font-semibold">Live Weather Constraint</p>
                    <p className="font-bold text-[#3984F5] dark:text-[#60A5FA] mt-0.5">
                      {proposal.constraints_audit.weather_constraint.temperature_c}°C • {proposal.constraints_audit.weather_constraint.current_condition}
                    </p>
                    <p className="text-[10px] text-[#64748B] dark:text-[#B6C2D6] truncate" title={proposal.constraints_audit.weather_constraint.data_source}>
                      {proposal.constraints_audit.weather_constraint.data_source}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-[#121D33] p-3 rounded-xl border border-[#DCE6F5] dark:border-[#2A3A56]">
                    <p className="text-[10px] text-[#64748B] dark:text-[#B6C2D6] font-semibold">Schedule Constraint</p>
                    <p className="font-bold text-[#172554] dark:text-[#F1F5F9] mt-0.5">
                      {proposal.constraints_audit.schedule_constraint.total_days} Scheduled Days
                    </p>
                    <p className="text-[10px] text-[#64748B] dark:text-[#B6C2D6]">
                      {proposal.constraints_audit.schedule_constraint.recommended_daily_hours}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Evaluation Spinner */}
            {isEvaluating && (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <RefreshCw className="w-8 h-8 text-[#3984F5] animate-spin" />
                <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">
                  Calculating trade-off matrix, transit durations, and preference matches...
                </p>
              </div>
            )}

            {/* Proposal Summary */}
            {!isEvaluating && proposal && (
              <div className="bg-[#F5F8FF] dark:bg-[#192640]/50 border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#3984F5] dark:text-[#60A5FA] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Adaptive Evaluation Summary
                  </span>
                  {proposal.total_savings > 0 && (
                    <span className="text-xs font-bold text-[#1D4ED8] dark:text-[#60A5FA] bg-[#3984F5]/10 px-3 py-1 rounded-full border border-[#3984F5]/30">
                      Estimated Savings: {proposal.currency} {proposal.total_savings}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#172554] dark:text-[#F1F5F9] leading-relaxed">
                  {proposal.summary}
                </p>
              </div>
            )}

            {/* Proposed Changes Preview Cards */}
            {!isEvaluating && proposal && proposal.proposed_changes.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <h3 className="font-bold text-[#172554] dark:text-[#F1F5F9] uppercase tracking-wider">
                    Proposed Itinerary Adjustments ({proposal.proposed_changes.length})
                  </h3>
                  <span className="text-[11px] text-[#64748B] dark:text-[#B6C2D6]">
                    Select changes to apply • {selectedChangeIndices.length} selected
                  </span>
                </div>

                <div className="space-y-4">
                  {proposal.proposed_changes.map((change, i) => {
                    const isChecked = selectedChangeIndices.includes(i);
                    return (
                      <div
                        key={i}
                        className={`bg-[#F5F8FF] dark:bg-[#192640]/40 border rounded-2xl p-5 space-y-3.5 transition-all ${
                          isChecked ? 'border-[#3984F5] shadow-md ring-1 ring-[#3984F5]/30' : 'border-[#DCE6F5] dark:border-[#2A3A56] opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleChangeSelection(i)}
                              className="w-4 h-4 rounded text-[#3984F5] bg-white dark:bg-[#121D33] border-[#DCE6F5] dark:border-[#2A3A56] focus:ring-[#3984F5]"
                            />
                            <span className="font-bold text-[#3984F5] dark:text-[#60A5FA]">Day {change.day_number} Plan Adjustment</span>
                          </label>

                          {change.match_score && (
                            <span className="px-2.5 py-0.5 rounded-md bg-[#3984F5]/10 border border-[#3984F5]/30 text-[#3984F5] dark:text-[#60A5FA] font-mono text-[11px] font-bold">
                              {change.match_score}% Match Score
                            </span>
                          )}
                        </div>

                        {/* Side by Side Comparison Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {/* Current Activity */}
                          <div className="bg-white dark:bg-[#121D33] p-4 rounded-xl border border-[#DCE6F5] dark:border-[#2A3A56]">
                            <span className="text-[10px] uppercase font-bold text-[#EF4444]">Current Scheduled Activity</span>
                            <h4 className="font-bold line-through text-[#64748B] mt-1">{change.original_name}</h4>
                            <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6] mt-1">
                              Est. Cost: {proposal.currency} {change.original_cost} • Duration: {change.original_duration || 2}h
                            </p>
                          </div>

                          {/* Proposed Replacement */}
                          <div className="bg-[#3984F5]/10 dark:bg-[#3984F5]/15 p-4 rounded-xl border border-[#3984F5]/30 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-[#3984F5] dark:text-[#60A5FA]">Proposed Replacement</span>
                            <h4 className="font-bold text-[#172554] dark:text-[#F1F5F9]">{change.replacement_name || 'Streamlined Free Time'}</h4>
                            <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6] leading-snug">{change.replacement_description}</p>
                            <p className="text-[11px] text-[#3984F5] dark:text-[#60A5FA] font-bold">
                              New Est. Cost: {proposal.currency} {change.new_cost ?? 0}
                            </p>
                          </div>
                        </div>

                        {/* Pros / Cons / Assumptions */}
                        {(change.pros || change.cons) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            {change.pros && (
                              <div className="bg-white dark:bg-[#121D33] p-3 rounded-lg border border-[#DCE6F5] dark:border-[#2A3A56] text-[#3984F5] dark:text-[#60A5FA] space-y-1">
                                <span className="font-bold text-[#64748B] dark:text-[#B6C2D6] uppercase text-[9px]">Advantages</span>
                                <ul className="list-disc list-inside space-y-0.5">
                                  {change.pros.map((p, pIdx) => <li key={pIdx}>{p}</li>)}
                                </ul>
                              </div>
                            )}
                            {change.cons && (
                              <div className="bg-white dark:bg-[#121D33] p-3 rounded-lg border border-[#DCE6F5] dark:border-[#2A3A56] text-[#EF4444] space-y-1">
                                <span className="font-bold text-[#64748B] dark:text-[#B6C2D6] uppercase text-[9px]">Trade-Offs</span>
                                <ul className="list-disc list-inside space-y-0.5">
                                  {change.cons.map((c, cIdx) => <li key={cIdx}>{c}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Trade-off Rationale & Formula Explanation */}
                        <div className="bg-white dark:bg-[#121D33] p-3 rounded-xl text-[11px] text-[#172554] dark:text-[#F1F5F9] flex items-start gap-2 border border-[#DCE6F5] dark:border-[#2A3A56]">
                          <ChevronRight className="w-3.5 h-3.5 text-[#3984F5] shrink-0 mt-0.5" />
                          <span>{change.tradeoff_explanation}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {!isEvaluating && proposal && proposal.proposed_changes.length === 0 && (
              <div className="text-center py-8 bg-[#F5F8FF] dark:bg-[#192640]/40 rounded-2xl border border-[#DCE6F5] dark:border-[#2A3A56]">
                <Check className="w-8 h-8 text-[#3984F5] mx-auto mb-2" />
                <p className="text-xs font-bold text-[#172554] dark:text-[#F1F5F9]">Your schedule is already optimal for this scenario!</p>
                <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6] mt-1">No mandatory changes are required right now.</p>
              </div>
            )}

            {/* Error & Success Alerts */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-[#F472B6]/15 border border-[#F472B6]/30 text-[#BE185D] dark:text-[#F9A8D4] text-xs">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-xl bg-[#3984F5]/10 border border-[#3984F5]/30 text-[#1D4ED8] dark:text-[#60A5FA] text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                {successMsg}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Revision History & Undo */}
        {activeTab === 'history' && (
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-[#DCE6F5] dark:border-[#2A3A56] pb-2">
              <h3 className="font-bold text-[#172554] dark:text-[#F1F5F9] text-sm">Applied Itinerary Revisions</h3>
              <p className="text-[#64748B] dark:text-[#B6C2D6] text-[11px]">Audit trail with single-click rollback</p>
            </div>

            {isLoadingRevisions ? (
              <div className="py-12 text-center text-[#64748B] dark:text-[#B6C2D6] flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#3984F5]" />
                <span>Loading revision audit log...</span>
              </div>
            ) : revisions.length === 0 ? (
              <div className="p-8 text-center bg-[#F5F8FF] dark:bg-[#192640]/40 rounded-2xl border border-[#DCE6F5] dark:border-[#2A3A56] text-[#64748B] dark:text-[#B6C2D6]">
                <History className="w-8 h-8 mx-auto text-[#64748B] mb-2" />
                <p className="font-bold text-[#172554] dark:text-[#F1F5F9]">No adaptive revisions have been applied yet.</p>
                <p className="text-[11px] mt-1">When you apply changes in the "Plan Alternatives" tab, snapshots will be saved here so you can undo at any time.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {revisions.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-[#F5F8FF] dark:bg-[#192640]/40 border border-[#DCE6F5] dark:border-[#2A3A56] flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#172554] dark:text-[#F1F5F9] text-xs">Revision #{rev.id}</span>
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] font-bold">
                          {rev.scenario}
                        </span>
                        <span className="text-[11px] text-[#64748B] dark:text-[#B6C2D6] font-mono">{rev.applied_at}</span>
                      </div>
                      <p className="text-[#172554] dark:text-[#F1F5F9] text-xs">{rev.summary}</p>
                      <p className="text-[11px] text-[#3984F5] dark:text-[#60A5FA] font-mono font-bold">
                        Savings: {rev.currency} {rev.total_savings}
                      </p>
                    </div>

                    <div>
                      {rev.can_undo === 1 ? (
                        <button
                          onClick={() => handleUndoRevision(rev.id)}
                          disabled={isUndoing}
                          className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#121D33] hover:bg-[#F472B6]/15 text-[#EF4444] font-bold text-xs border border-[#EF4444]/30 flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Undo Revision</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-[#64748B] dark:text-[#B6C2D6] italic">Already Undone</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="bg-[#F5F8FF] dark:bg-[#121D33] p-4 border-t border-[#DCE6F5] dark:border-[#2A3A56] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] dark:text-[#B6C2D6] hover:text-[#172554] dark:hover:text-white transition-colors"
          >
            Close
          </button>

          {activeTab === 'evaluate' && (
            <button
              onClick={handleApplyChanges}
              disabled={isEvaluating || isApplying || !proposal || selectedChangeIndices.length === 0}
              className="px-6 py-2.5 rounded-2xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs shadow-lg shadow-[#3984F5]/30 hover:opacity-95 disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center gap-2"
            >
              {isApplying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Applying Changes...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Confirm & Apply ({selectedChangeIndices.length} Changes)
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
