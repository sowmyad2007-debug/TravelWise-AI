import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useActiveTrip } from '../context/ActiveTripContext';
import { api } from '../api/client';
import { Expense, BudgetSummary } from '../types';
import {
  PieChart,
  BarChart2,
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  Receipt,
  X,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  UploadCloud,
  FileCheck,
  Layers,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart as RechartsPie,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';

export const BudgetDashboard: React.FC = () => {
  const { activeTrip, refreshTrip } = useActiveTrip();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);

  // Expense Modal States
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'food',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    payer_name: 'You',
    is_shared: true,
    is_verified_price: true,
  });

  // Receipt Upload Modal State
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);

  const loadData = async () => {
    if (!activeTrip?.id) return;
    try {
      const res = await api.getTripExpenses(activeTrip.id);
      setExpenses(res.expenses);
      setSummary(res.summary);
    } catch (err) {
      console.error('Failed to load expenses', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTrip?.id]);

  if (!activeTrip) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4 animate-fadeIn">
        <div className="w-16 h-16 rounded-3xl bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] flex items-center justify-center mx-auto shadow-xs">
          <PieChart className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-[#172554] dark:text-[#F1F5F9]">No active trip selected</h2>
        <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#B6C2D6] max-w-md mx-auto">
          Please select a journey from your Dashboard to access the Smart Budget Guardian & Expense Detective.
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

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) return;

    try {
      await api.addExpense(activeTrip.id, {
        title: formData.title.trim(),
        category: formData.category,
        amount: parseFloat(formData.amount),
        date: formData.date,
        notes: formData.notes.trim(),
        payer_name: formData.payer_name.trim() || 'You',
        is_shared: formData.is_shared,
        is_verified_price: formData.is_verified_price ? 1 : 0,
      });

      setIsAddOpen(false);
      setFormData({
        title: '',
        category: 'food',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        payer_name: 'You',
        is_shared: true,
        is_verified_price: true,
      });

      await loadData();
      await refreshTrip();
    } catch (err: any) {
      alert(err.message || 'Failed to add expense.');
    }
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    try {
      await api.updateExpense(editingExpense.id, editingExpense);
      setEditingExpense(null);
      await loadData();
      await refreshTrip();
    } catch (err: any) {
      alert(err.message || 'Failed to update expense.');
    }
  };

  const handleDeleteExpense = async (id: number) => {
    if (!window.confirm('Delete this expense? Totals will recalculate immediately.')) return;
    try {
      await api.deleteExpense(id);
      await loadData();
      await refreshTrip();
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense.');
    }
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setReceiptError(null);
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setReceiptError('Invalid format. Allowed formats: PNG, JPG, WEBP, or PDF.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setReceiptError('File exceeds 5MB size limit.');
      return;
    }

    setReceiptFile(file);
  };

  const handleUploadReceiptMock = async () => {
    if (!receiptFile || !activeTrip) return;
    setIsUploadingReceipt(true);
    setReceiptError(null);
    try {
      const res = await api.uploadReceipt(activeTrip.id, {
        filename: receiptFile.name,
        file_size_bytes: receiptFile.size,
        mime_type: receiptFile.type,
      });

      if (res.extracted_data) {
        setFormData({
          title: res.extracted_data.merchant_name || 'Receipt Expense',
          category: res.extracted_data.suggested_category || 'food',
          amount: res.extracted_data.total_amount?.toString() || '0',
          date: res.extracted_data.date || new Date().toISOString().split('T')[0],
          notes: `Verified via receipt upload: ${receiptFile.name}`,
          payer_name: 'You',
          is_shared: true,
          is_verified_price: true,
        });
        setIsReceiptModalOpen(false);
        setReceiptFile(null);
        setIsAddOpen(true);
      }
    } catch (err: any) {
      setReceiptError(err.message || 'Failed to parse receipt.');
    } finally {
      setIsUploadingReceipt(false);
    }
  };

  // Theme Chart Data Preparation
  const categoryKeys = ['transport', 'accommodation', 'food', 'sightseeing', 'miscellaneous'];
  const barChartData = categoryKeys.map((cat) => ({
    name: cat.charAt(0).toUpperCase() + cat.slice(1),
    Planned: summary?.planned_by_category[cat] || 0,
    Actual: summary?.actual_by_category[cat] || 0,
  }));

  const pieColors = ['#3984F5', '#F472B6', '#FACC15', '#60A5FA', '#F9A8D4'];
  const pieChartData = categoryKeys
    .map((cat) => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      value: summary?.actual_by_category[cat] || 0,
    }))
    .filter((d) => d.value > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm relative overflow-hidden text-white">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#3984F5]/20 border border-[#3984F5]/40 px-3.5 py-1 rounded-full text-xs font-bold text-[#60A5FA] shadow-xs">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Smart Budget Guardian & Financial Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">{activeTrip.destination} Spending Health</h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Three-tier predictive modeling, verified actual receipts vs planned targets, and proactive burn-rate forecasting.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0">
          <button
            onClick={() => setIsReceiptModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#60A5FA] font-bold text-xs border border-white/20 shadow-xs flex items-center gap-2 transition-all backdrop-blur-md"
          >
            <Receipt className="w-4 h-4" />
            <span>Upload Receipt</span>
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Warnings Banner if any */}
      {summary?.warnings && summary.warnings.length > 0 && (
        <div className="space-y-2">
          {summary.warnings.map((w, i) => (
            <div key={i} className="p-4 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-[#EF4444] shrink-0" />
                <span className="font-bold">{w}</span>
              </div>
              <Link
                to="/itinerary"
                className="px-3.5 py-1.5 rounded-xl bg-[#EF4444] text-white text-[11px] font-bold shrink-0 shadow-xs hover:bg-[#DC2626] transition-colors"
              >
                Launch Adaptive Recalibration
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* THREE-TIER FINANCIAL FORECAST HERO CARD */}
      {summary && (
        <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE6F5] dark:border-[#2A3A56] pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA]">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#172554] dark:text-[#F1F5F9]">Three-Tier Predictive Financial Model</h3>
                <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">
                  Separates verified actual ledger transactions from planned targets and unvisited commitments.
                </p>
              </div>
            </div>

            {/* Confidence Badge */}
            {summary.forecast_confidence && (
              <div className="flex items-center gap-2">
                <div className="px-3.5 py-1.5 rounded-full bg-[#3984F5]/10 border border-[#3984F5]/30 text-[#3984F5] dark:text-[#60A5FA] text-xs font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#F472B6]" />
                  <span>Forecast Confidence: {summary.forecast_confidence.level}</span>
                </div>
                <button
                  onClick={() => setShowMethodology(!showMethodology)}
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172554] dark:hover:text-white transition-colors"
                  title="View Methodology"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Methodology Info Accordion */}
          {showMethodology && summary.forecast_confidence && (
            <div className="p-4 rounded-2xl bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] text-xs text-[#64748B] dark:text-[#B6C2D6] space-y-2 animate-fadeIn">
              <p className="font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
                Confidence Methodology:
              </p>
              <p className="leading-relaxed">{summary.forecast_confidence.description}</p>
              <p className="text-[11px] font-mono text-[#3984F5] dark:text-[#60A5FA]">
                Formula: Projected Final Spending = Actuals + Remaining Scheduled Stops + Living Buffer
              </p>
            </div>
          )}

          {/* 3 Tier Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tier 1 */}
            <div className="bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#B6C2D6]">
                <span className="font-bold uppercase tracking-wider text-[10px]">Tier 1: Verified Actuals</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] font-bold">Logged</span>
              </div>
              <p className="text-2xl font-black text-[#172554] dark:text-[#F1F5F9]">
                {activeTrip.currency} {summary.total_spent.toLocaleString()}
              </p>
              <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6]">{expenses.length} actual transactions entered</p>
            </div>

            {/* Tier 2 */}
            <div className="bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#B6C2D6]">
                <span className="font-bold uppercase tracking-wider text-[10px]">Tier 2: Target Benchmark</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] bg-[#F472B6]/15 text-[#DB2777] dark:text-[#F9A8D4] font-bold">Cap Target</span>
              </div>
              <p className="text-2xl font-black text-[#172554] dark:text-[#F1F5F9]">
                {activeTrip.currency} {summary.total_budget.toLocaleString()}
              </p>
              <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6]">Total planned cap ceiling</p>
            </div>

            {/* Tier 3 */}
            <div className="bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl p-5 space-y-1">
              <div className="flex items-center justify-between text-xs text-[#64748B] dark:text-[#B6C2D6]">
                <span className="font-bold uppercase tracking-wider text-[10px]">Tier 3: Future Commitments</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] bg-[#FACC15]/20 text-[#B45309] dark:text-[#FDE047] font-bold">Predictive</span>
              </div>
              <p className="text-2xl font-black text-[#172554] dark:text-[#F1F5F9]">
                {activeTrip.currency} {summary.estimated_future_commitments.toLocaleString()}
              </p>
              <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6]">Scheduled itinerary stops + living buffer</p>
            </div>
          </div>

          {/* Final Spending Projection Result Bar */}
          <div className="p-4 rounded-2xl bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-[#172554] dark:text-[#F1F5F9]">
                Projected Final Spending: <span className="text-[#3984F5] dark:text-[#60A5FA] text-sm font-black">{activeTrip.currency} {summary.projected_final_spending.toLocaleString()}</span>
              </p>
              <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6]">
                Calculated dynamically from verified ledger actuals + future itinerary stops.
              </p>
            </div>

            <div className="text-right">
              <span className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border ${
                summary.projected_variance > 0
                  ? 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444]'
                  : 'bg-[#3984F5]/10 border-[#3984F5]/30 text-[#3984F5] dark:text-[#60A5FA]'
              }`}>
                {summary.projected_variance > 0
                  ? `Deficit of ${activeTrip.currency} ${summary.projected_variance.toLocaleString()}`
                  : `Surplus reserve of ${activeTrip.currency} ${Math.abs(summary.projected_variance).toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Planned vs Actual Bar Chart */}
        <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
                Planned vs Actual By Category
              </h3>
              <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6]">Benchmarked against travel style averages</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCE6F5" opacity={0.4} />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#121D33', borderColor: '#2A3A56', borderRadius: '14px', fontSize: '11px', color: '#F1F5F9' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="Planned" fill="#3984F5" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Actual" fill="#F472B6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Breakdown Pie Chart */}
        <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#FACC15]" />
                Actual Expense Distribution
              </h3>
              <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6]">Share of recorded spending</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {pieChartData.length === 0 ? (
              <div className="text-center text-xs text-[#64748B] dark:text-[#B6C2D6]">
                No expenses logged yet. Add your first expense to see the breakdown!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#121D33', borderColor: '#2A3A56', borderRadius: '14px', fontSize: '11px', color: '#F1F5F9' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </RechartsPie>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Expense Detective Section */}
      <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FACC15]/20 text-[#B45309] dark:text-[#FDE047] flex items-center justify-center">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#172554] dark:text-[#F1F5F9]">Expense Detective & Smart Savings</h3>
              <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">Automated pattern recognition & corrective budget recommendations</p>
            </div>
          </div>
        </div>

        {summary?.expense_detective_insights && summary.expense_detective_insights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {summary.expense_detective_insights.map((ins, i) => (
              <div key={i} className="p-4 rounded-2xl bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#EF4444] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
                    {ins.title}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#DCE6F5] dark:bg-[#192640] text-[#172554] dark:text-[#F1F5F9]">
                    {ins.category}
                  </span>
                </div>
                <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">{ins.message}</p>
                <div className="p-2.5 rounded-xl bg-[#3984F5]/10 border border-[#3984F5]/20 text-[11px] text-[#3984F5] dark:text-[#60A5FA]">
                  <strong className="text-[#3984F5] dark:text-[#60A5FA]">Recommendation: </strong>
                  {ins.recommendation}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] text-xs text-[#64748B] dark:text-[#B6C2D6] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA] shrink-0" />
            <span>All expense categories are currently within healthy target ranges. Great job managing your budget!</span>
          </div>
        )}
      </div>

      {/* Logged Expenses Ledger Table */}
      <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-[#172554] dark:text-[#F1F5F9]">Expense Ledger</h3>
            <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">Logged spending items for {activeTrip.destination}</p>
          </div>

          <div className="flex items-center gap-2 self-start">
            <button
              onClick={() => setIsReceiptModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[#F5F8FF] dark:bg-[#0B1224] hover:bg-[#DCE6F5] text-[#172554] dark:text-[#F1F5F9] font-bold text-xs border border-[#DCE6F5] dark:border-[#2A3A56] flex items-center gap-1.5 transition-colors"
            >
              <Receipt className="w-3.5 h-3.5 text-[#3984F5] dark:text-[#60A5FA]" />
              <span>Scan Receipt</span>
            </button>

            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {expenses.length === 0 ? (
          <div className="text-center py-8 text-xs text-[#64748B] dark:text-[#B6C2D6]">
            No expenses recorded yet. Record transport tickets, meals, or hotel stays to track in real-time.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#172554] dark:text-[#F1F5F9]">
              <thead className="bg-[#F5F8FF] dark:bg-[#0B1224] text-[#64748B] dark:text-[#B6C2D6] uppercase text-[10px] tracking-wider border-b border-[#DCE6F5] dark:border-[#2A3A56]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Title / Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Paid By</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE6F5] dark:divide-[#2A3A56]">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#F5F8FF] dark:hover:bg-[#192640] transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-[#64748B] dark:text-[#B6C2D6]">{exp.date}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[#172554] dark:text-[#F1F5F9]">{exp.title}</p>
                        {exp.is_verified_price === 1 && (
                          <span className="text-[9px] bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] px-1.5 py-0.2 rounded font-bold border border-[#3984F5]/30">
                            Verified
                          </span>
                        )}
                      </div>
                      {exp.notes && <p className="text-[10px] text-[#64748B] dark:text-[#B6C2D6]">{exp.notes}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize px-2 py-0.5 rounded-md bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] text-[10px] font-bold border border-[#3984F5]/20">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#172554] dark:text-[#F1F5F9]">
                      <span>{exp.payer_name}</span>
                      {exp.is_shared === 1 && (
                        <span className="ml-1.5 text-[9px] bg-[#F472B6]/15 text-[#DB2777] dark:text-[#F9A8D4] px-1.5 py-0.2 rounded border border-[#F472B6]/30 font-semibold">
                          Shared
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-[#172554] dark:text-[#F1F5F9]">
                      {activeTrip.currency} {exp.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingExpense(exp)}
                          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172554] dark:hover:text-white hover:bg-[#F5F8FF] dark:hover:bg-[#192640] transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DCE6F5] dark:border-[#2A3A56] pb-3">
              <h3 className="text-sm font-bold text-[#172554] dark:text-[#F1F5F9]">Record New Expense</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-[#64748B] hover:text-[#172554] dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Expense Title / Merchant</label>
                <input
                  type="text"
                  placeholder="e.g. Traditional Lunch at Cafe"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  >
                    <option value="food">Food & Dining</option>
                    <option value="transport">Transport</option>
                    <option value="accommodation">Accommodation</option>
                    <option value="sightseeing">Sightseeing</option>
                    <option value="miscellaneous">Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Amount ({activeTrip.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  />
                </div>

                <div>
                  <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Paid By</label>
                  <input
                    type="text"
                    value={formData.payer_name}
                    onChange={(e) => setFormData({ ...formData, payer_name: e.target.value })}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Taxi fare split with 2 others"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[#172554] dark:text-[#F1F5F9] font-medium">
                  <input
                    type="checkbox"
                    checked={formData.is_shared}
                    onChange={(e) => setFormData({ ...formData, is_shared: e.target.checked })}
                    className="rounded text-[#3984F5] focus:ring-[#3984F5]"
                  />
                  <span>Split with Group</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[#172554] dark:text-[#F1F5F9] font-medium">
                  <input
                    type="checkbox"
                    checked={formData.is_verified_price}
                    onChange={(e) => setFormData({ ...formData, is_verified_price: e.target.checked })}
                    className="rounded text-[#3984F5] focus:ring-[#3984F5]"
                  />
                  <span>Verified Price</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE6F5] dark:border-[#2A3A56]">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#DCE6F5]/50 dark:bg-[#192640] text-[#172554] dark:text-[#F1F5F9] hover:bg-[#DCE6F5] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold shadow-xs transition-colors"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DCE6F5] dark:border-[#2A3A56] pb-3">
              <h3 className="text-sm font-bold text-[#172554] dark:text-[#F1F5F9]">Edit Expense</h3>
              <button onClick={() => setEditingExpense(null)} className="text-[#64748B] hover:text-[#172554] dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateExpense} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Expense Title</label>
                <input
                  type="text"
                  value={editingExpense.title}
                  onChange={(e) => setEditingExpense({ ...editingExpense, title: e.target.value })}
                  className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Category</label>
                  <select
                    value={editingExpense.category}
                    onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value })}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  >
                    <option value="food">Food & Dining</option>
                    <option value="transport">Transport</option>
                    <option value="accommodation">Accommodation</option>
                    <option value="sightseeing">Sightseeing</option>
                    <option value="miscellaneous">Miscellaneous</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Amount ({activeTrip.currency})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingExpense.amount}
                    onChange={(e) => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Date</label>
                  <input
                    type="date"
                    value={editingExpense.date}
                    onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  />
                </div>

                <div>
                  <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Paid By</label>
                  <input
                    type="text"
                    value={editingExpense.payer_name}
                    onChange={(e) => setEditingExpense({ ...editingExpense, payer_name: e.target.value })}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Notes</label>
                <input
                  type="text"
                  value={editingExpense.notes || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, notes: e.target.value })}
                  className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE6F5] dark:border-[#2A3A56]">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-4 py-2 rounded-xl bg-[#DCE6F5]/50 dark:bg-[#192640] text-[#172554] dark:text-[#F1F5F9] hover:bg-[#DCE6F5] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold shadow-xs transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Upload Modal */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DCE6F5] dark:border-[#2A3A56] pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#3984F5] dark:text-[#60A5FA]" />
                <h3 className="text-sm font-bold text-[#172554] dark:text-[#F1F5F9]">Upload Receipt / Invoice</h3>
              </div>
              <button onClick={() => setIsReceiptModalOpen(false)} className="text-[#64748B] hover:text-[#172554] dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <p className="text-[#64748B] dark:text-[#B6C2D6]">
                Upload a photo or PDF of your travel receipt (hotel bill, meal receipt, boarding pass). Maximum size: 5MB. Formats: PNG, JPG, WEBP, PDF.
              </p>

              {/* Dropzone container */}
              <div className="border-2 border-dashed border-[#DCE6F5] dark:border-[#2A3A56] hover:border-[#3984F5] dark:hover:border-[#60A5FA] rounded-2xl p-6 text-center space-y-2.5 transition-colors bg-[#F5F8FF] dark:bg-[#0B1224]">
                <UploadCloud className="w-8 h-8 text-[#3984F5] dark:text-[#60A5FA] mx-auto" />
                <input
                  type="file"
                  id="receipt-file-input"
                  accept=".png,.jpg,.jpeg,.webp,.pdf"
                  onChange={handleReceiptFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="receipt-file-input"
                  className="inline-block px-5 py-2.5 rounded-xl bg-white dark:bg-[#121D33] hover:bg-[#F5F8FF] dark:hover:bg-[#192640] text-[#172554] dark:text-[#F1F5F9] font-bold cursor-pointer border border-[#DCE6F5] dark:border-[#2A3A56] transition-colors shadow-xs"
                >
                  {receiptFile ? 'Change File' : 'Browse Local Files'}
                </label>
                {receiptFile && (
                  <div className="flex items-center justify-center gap-1.5 text-[#3984F5] dark:text-[#60A5FA] font-semibold pt-1">
                    <FileCheck className="w-4 h-4" />
                    <span>{receiptFile.name} ({(receiptFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                )}
              </div>

              {receiptError && (
                <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs">
                  {receiptError}
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] text-[11px] text-[#64748B] dark:text-[#B6C2D6]">
                <strong className="text-[#172554] dark:text-[#F1F5F9]">Privacy Guarantee:</strong> Receipts are processed securely and verified without transmitting personal billing credentials to third-party ad networks.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE6F5] dark:border-[#2A3A56]">
                <button
                  type="button"
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#DCE6F5]/50 dark:bg-[#192640] text-[#172554] dark:text-[#F1F5F9] hover:bg-[#DCE6F5] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!receiptFile || isUploadingReceipt}
                  onClick={handleUploadReceiptMock}
                  className="px-5 py-2 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] disabled:opacity-50 text-white font-bold transition-all shadow-xs"
                >
                  {isUploadingReceipt ? 'Processing Receipt...' : 'Parse & Add Expense'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
