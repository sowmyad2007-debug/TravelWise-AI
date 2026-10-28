import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { Trip, Receipt, ReceiptSummary } from '../types';
import {
  Receipt as ReceiptIcon,
  Plus,
  Search,
  Filter,
  Download,
  UploadCloud,
  Camera,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  Tag,
  CreditCard,
  Edit2,
  Trash2,
  ExternalLink,
  Sparkles,
  Link2,
  X,
  Eye,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown,
  Layers,
  MapPin,
  FileCheck
} from 'lucide-react';

interface ReceiptVaultProps {
  trips: Trip[];
  activeTripId?: number | null;
  onNavigateToTrip?: (tripId: number) => void;
}

const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  food: { label: 'Dining & Food', color: 'text-[#B45309] dark:text-[#FDE047]', bg: 'bg-[#FACC15]/15 border-[#FACC15]/30' },
  transport: { label: 'Transit & Rides', color: 'text-[#1D4ED8] dark:text-[#60A5FA]', bg: 'bg-[#3984F5]/15 border-[#3984F5]/30' },
  accommodation: { label: 'Hotel & Stays', color: 'text-[#BE185D] dark:text-[#F9A8D4]', bg: 'bg-[#F472B6]/15 border-[#F472B6]/30' },
  shopping: { label: 'Shopping & Bazaars', color: 'text-[#DB2777] dark:text-[#F472B6]', bg: 'bg-[#F472B6]/15 border-[#F472B6]/30' },
  activities: { label: 'Tours & Sights', color: 'text-[#1D4ED8] dark:text-[#60A5FA]', bg: 'bg-[#3984F5]/15 border-[#3984F5]/30' },
  other: { label: 'General / Misc', color: 'text-[#64748B] dark:text-[#B6C2D6]', bg: 'bg-[#F5F8FF] dark:bg-[#192640] border-[#DCE6F5] dark:border-[#2A3A56]' }
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  credit_card: 'Credit Card',
  debit_card: 'Debit Card',
  upi: 'UPI / Digital',
  net_banking: 'Net Banking',
  other: 'Other'
};

export const ReceiptVault: React.FC<ReceiptVaultProps> = ({ trips, activeTripId, onNavigateToTrip }) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [summary, setSummary] = useState<ReceiptSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTripFilter, setSelectedTripFilter] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [endDateFilter, setEndDateFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Active / Selected Receipt
  const [activeReceipt, setActiveReceipt] = useState<Receipt | null>(null);
  const [deleteLinkedExpense, setDeleteLinkedExpense] = useState(false);

  // Form states for Add / Edit
  const [formFile, setFormFile] = useState<File | null>(null);
  const [formFileToken, setFormFileToken] = useState<string>('');
  const [formFileName, setFormFileName] = useState<string>('');
  const [formMimeType, setFormMimeType] = useState<string>('');
  const [formPreviewUrl, setFormPreviewUrl] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanNotice, setScanNotice] = useState<string>('');
  const [isOcrDetected, setIsOcrDetected] = useState(false);

  const [formTitle, setFormTitle] = useState('');
  const [formMerchant, setFormMerchant] = useState('');
  const [formAmount, setFormAmount] = useState<number | ''>('');
  const [formCurrency, setFormCurrency] = useState('INR');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCategory, setFormCategory] = useState('food');
  const [formPaymentMethod, setFormPaymentMethod] = useState('credit_card');
  const [formTripId, setFormTripId] = useState<string>(activeTripId ? String(activeTripId) : '');
  const [formNotes, setFormNotes] = useState('');
  const [formCreateExpense, setFormCreateExpense] = useState(false);
  const [formSyncExpense, setFormSyncExpense] = useState(true);

  // Preview Blob URL for detail modal
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string>('');
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Fetch receipts list
  const loadReceipts = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await api.getReceipts({
        trip_id: selectedTripFilter !== 'all' ? Number(selectedTripFilter) : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        start_date: startDateFilter || undefined,
        end_date: endDateFilter || undefined,
        search: searchTerm || undefined
      });
      setReceipts(res.receipts || []);
      setSummary(res.summary || null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load receipts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, [selectedCategory, selectedTripFilter, startDateFilter, endDateFilter, searchTerm]);

  // Handle file selection and instant upload-scan
  const handleFileSelected = async (file: File) => {
    setFormFile(file);
    setFormFileName(file.name);
    setFormMimeType(file.type);
    setScanNotice('');
    setIsOcrDetected(false);

    // Create local preview for image
    if (file.type.startsWith('image/')) {
      const localUrl = URL.createObjectURL(file);
      setFormPreviewUrl(localUrl);
    } else {
      setFormPreviewUrl('');
    }

    // Auto-fill default title from filename if empty
    if (!formTitle) {
      const cleanName = file.name.split('.')[0].replace(/[_-]/g, ' ');
      setFormTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    // Trigger Upload & AI OCR scanning
    setIsScanning(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.uploadReceiptScan(formData);
      
      setFormFileToken(res.file_token);
      setScanNotice(res.notice || '');

      if (res.ocr_applied && res.extracted_data) {
        setIsOcrDetected(true);
        const ext = res.extracted_data;
        if (ext.merchant_name) setFormMerchant(ext.merchant_name);
        if (ext.merchant_name && !formTitle) setFormTitle(ext.merchant_name);
        if (ext.amount !== undefined && ext.amount !== null) setFormAmount(ext.amount);
        if (ext.currency) setFormCurrency(ext.currency);
        if (ext.date) setFormDate(ext.date);
        if (ext.category) setFormCategory(ext.category);
        if (ext.notes) setFormNotes(ext.notes);
      }
    } catch (err: any) {
      console.warn('OCR scan preview notice', err);
      setScanNotice('Document queued. You can enter or confirm the details manually.');
    } finally {
      setIsScanning(false);
    }
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormFile(null);
    setFormFileToken('');
    setFormFileName('');
    setFormMimeType('');
    setFormPreviewUrl('');
    setIsScanning(false);
    setIsOcrDetected(false);
    setScanNotice('');
    setFormTitle('');
    setFormMerchant('');
    setFormAmount('');
    setFormCurrency('INR');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormCategory('food');
    setFormPaymentMethod('credit_card');
    setFormTripId(activeTripId ? String(activeTripId) : '');
    setFormNotes('');
    setFormCreateExpense(false);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (rec: Receipt) => {
    setActiveReceipt(rec);
    setFormTitle(rec.title);
    setFormMerchant(rec.merchant_name || '');
    setFormAmount(rec.amount);
    setFormCurrency(rec.currency || 'INR');
    setFormDate(rec.date);
    setFormCategory(rec.category || 'food');
    setFormPaymentMethod(rec.payment_method || 'credit_card');
    setFormTripId(rec.trip_id ? String(rec.trip_id) : '');
    setFormNotes(rec.notes || '');
    setFormSyncExpense(true);
    setIsEditModalOpen(true);
  };

  // Open Preview Modal
  const openPreviewModal = async (rec: Receipt) => {
    setActiveReceipt(rec);
    setIsPreviewModalOpen(true);
    setIsLoadingPreview(true);
    setPreviewBlobUrl('');
    try {
      const url = await api.getReceiptFileBlobUrl(rec.id);
      setPreviewBlobUrl(url);
    } catch (err) {
      console.warn('Could not load blob url for preview, will fall back to direct file url', err);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Save new receipt
  const handleSaveReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFile && !formFileToken) {
      setErrorMsg('Please select or capture a receipt file to upload.');
      return;
    }
    if (formAmount === '' || Number(formAmount) < 0) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      const formData = new FormData();
      if (formFile) {
        formData.append('file', formFile);
      }
      if (formFileToken) {
        formData.append('file_token', formFileToken);
      }
      formData.append('title', formTitle.trim());
      formData.append('merchant_name', formMerchant.trim());
      formData.append('amount', String(formAmount));
      formData.append('currency', formCurrency);
      formData.append('date', formDate);
      formData.append('category', formCategory);
      formData.append('payment_method', formPaymentMethod);
      if (formTripId) {
        formData.append('trip_id', formTripId);
      }
      formData.append('notes', formNotes.trim());
      formData.append('create_linked_expense', String(formCreateExpense));

      await api.createReceipt(formData);

      setIsAddModalOpen(false);
      setSuccessMsg('Receipt securely saved to vault!');
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadReceipts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save receipt.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update existing receipt
  const handleUpdateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReceipt) return;
    if (formAmount === '' || Number(formAmount) < 0) {
      setErrorMsg('Please enter a valid amount.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    try {
      await api.updateReceipt(activeReceipt.id, {
        title: formTitle.trim(),
        merchant_name: formMerchant.trim(),
        amount: Number(formAmount),
        currency: formCurrency,
        date: formDate,
        category: formCategory,
        payment_method: formPaymentMethod,
        trip_id: formTripId ? Number(formTripId) : null,
        notes: formNotes.trim(),
        sync_linked_expense: formSyncExpense
      });

      setIsEditModalOpen(false);
      setSuccessMsg('Receipt updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadReceipts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update receipt.');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete Receipt
  const handleDeleteReceipt = async () => {
    if (!activeReceipt) return;
    setIsLoading(true);
    try {
      await api.deleteReceipt(activeReceipt.id, deleteLinkedExpense);
      setIsDeleteModalOpen(false);
      setActiveReceipt(null);
      setSuccessMsg('Receipt removed from vault.');
      setTimeout(() => setSuccessMsg(''), 4000);
      await loadReceipts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete receipt.');
    } finally {
      setIsLoading(false);
    }
  };

  // Convert Receipt to Expense
  const handleConvertToExpense = async (rec: Receipt, targetTripId?: number) => {
    const tripToUse = targetTripId || rec.trip_id || (trips[0] ? trips[0].id : null);
    if (!tripToUse) {
      setErrorMsg('Please select or associate a trip to create an expense.');
      return;
    }

    setIsLoading(true);
    try {
      await api.convertReceiptToExpense(rec.id, {
        trip_id: tripToUse,
        title: rec.title,
        amount: rec.amount,
        category: rec.category
      });
      setSuccessMsg(`Receipt converted to linked expense in trip!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      if (isPreviewModalOpen) {
        setIsPreviewModalOpen(false);
      }
      await loadReceipts();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to convert to expense.');
    } finally {
      setIsLoading(false);
    }
  };

  // Export to CSV
  const handleExportCsv = async () => {
    try {
      await api.exportReceiptsCsv({
        trip_id: selectedTripFilter !== 'all' ? selectedTripFilter : undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        start_date: startDateFilter || undefined,
        end_date: endDateFilter || undefined
      });
      setSuccessMsg('Receipts CSV exported successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'CSV Export failed.');
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn text-[#172554] dark:text-[#F1F5F9]">
      {/* 1. HEADER & QUICK ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#3984F5]/10 border border-[#3984F5]/30 px-3 py-1 rounded-full text-xs font-bold text-[#3984F5] dark:text-[#60A5FA]">
            <ReceiptIcon className="w-3.5 h-3.5" />
            <span>Receipt Vault & Expense Document Audit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#172554] dark:text-[#F1F5F9] tracking-tight">
            Receipt Management
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#B6C2D6] max-w-xl">
            Store, audit, and organize your bills, flight tickets, restaurant checks, and booking vouchers with optional AI scanning and one-click expense sync.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-2xl bg-white dark:bg-[#192640] border border-[#DCE6F5] dark:border-[#2A3A56] hover:border-[#3984F5] dark:hover:border-[#60A5FA] text-xs font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-2 shadow-xs transition-all hover:scale-[1.02]"
            title="Download CSV breakdown of all receipts"
          >
            <Download className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-2xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-[#3984F5]/25 transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Receipt</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-[#3984F5]/10 border border-[#3984F5]/30 text-[#1D4ED8] dark:text-[#60A5FA] text-xs font-semibold flex items-center gap-2.5 shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-[#F472B6]/15 border border-[#F472B6]/40 text-[#BE185D] dark:text-[#F9A8D4] text-xs font-semibold flex items-center gap-2.5 shadow-sm animate-fadeIn">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. SUMMARY METRICS RIBBON */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Value */}
          <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#64748B] dark:text-[#B6C2D6] text-xs font-semibold">
              <span>Total Documented</span>
              <span className="p-2 rounded-xl bg-[#3984F5]/15 text-[#3984F5] dark:text-[#60A5FA]">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-[#172554] dark:text-[#F1F5F9]">
                ₹{summary.total_amount.toLocaleString()}
              </span>
              <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6] mt-0.5">Across {summary.total_count} saved receipts</p>
            </div>
          </div>

          {/* Card 2: Linked to Trips */}
          <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#64748B] dark:text-[#B6C2D6] text-xs font-semibold">
              <span>Expense Tracking Sync</span>
              <span className="p-2 rounded-xl bg-[#F472B6]/15 text-[#BE185D] dark:text-[#F9A8D4]">
                <Link2 className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-[#3984F5] dark:text-[#60A5FA]">
                {summary.linked_count} <span className="text-sm font-semibold text-[#64748B] dark:text-[#B6C2D6]">Linked</span>
              </span>
              <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6] mt-0.5">
                {summary.unlinked_count} standalone / unlinked
              </p>
            </div>
          </div>

          {/* Card 3: Top Category */}
          <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#64748B] dark:text-[#B6C2D6] text-xs font-semibold">
              <span>Active Categories</span>
              <span className="p-2 rounded-xl bg-[#FACC15]/20 text-[#B45309] dark:text-[#FDE047]">
                <Tag className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(summary.by_category)
                .filter(([_, amt]) => amt > 0)
                .slice(0, 3)
                .map(([cat, amt]) => (
                  <span
                    key={cat}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#F5F8FF] dark:bg-[#192640] text-[#172554] dark:text-[#F1F5F9] border border-[#DCE6F5] dark:border-[#2A3A56]"
                  >
                    {CATEGORY_META[cat]?.label.split(' ')[0]}: ₹{amt.toLocaleString()}
                  </span>
                ))}
              {Object.values(summary.by_category).every((v) => v === 0) && (
                <span className="text-xs text-[#64748B] dark:text-[#B6C2D6] italic">No categorized spend yet</span>
              )}
            </div>
          </div>

          {/* Card 4: Quick Scan Callout */}
          <div className="bg-gradient-to-br from-[#3984F5]/10 via-[#F472B6]/10 to-[#FACC15]/10 border border-[#3984F5]/30 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#3984F5] dark:text-[#60A5FA]">
              <Sparkles className="w-4 h-4" />
              <span>Smart Document Auditor</span>
            </div>
            <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6] leading-snug mt-1">
              Upload invoice photos or tickets to keep tax receipts and group expense documentation organized in one secure place.
            </p>
            <div className="pt-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#3984F5] dark:text-[#60A5FA]">
                ✓ Safe Server Encryption
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3. SEARCH & FILTER CONTROLS */}
      <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-5 space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by merchant, title, or notes..."
              className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl pl-10 pr-4 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
            />
          </div>

          {/* Trip Selector Dropdown */}
          <div className="shrink-0 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
            <select
              value={selectedTripFilter}
              onChange={(e) => setSelectedTripFilter(e.target.value)}
              className="bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl px-3 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] font-semibold focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
            >
              <option value="all">All Trips</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.destination})
                </option>
              ))}
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-[#F5F8FF] dark:bg-[#0B1224] p-1 rounded-2xl shrink-0 self-end md:self-auto border border-[#DCE6F5] dark:border-[#2A3A56]">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#3984F5] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#172554] dark:hover:text-[#F1F5F9]'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-[#3984F5] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#172554] dark:hover:text-[#F1F5F9]'
              }`}
            >
              Table
            </button>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full font-bold transition-all shrink-0 ${
              selectedCategory === 'all'
                ? 'bg-[#3984F5] text-white shadow-xs'
                : 'bg-[#F5F8FF] dark:bg-[#192640] text-[#64748B] dark:text-[#B6C2D6] border border-[#DCE6F5] dark:border-[#2A3A56] hover:border-[#3984F5]'
            }`}
          >
            All Categories
          </button>
          {Object.entries(CATEGORY_META).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-3 py-1 rounded-full font-semibold transition-all shrink-0 border ${
                selectedCategory === key
                  ? `${meta.bg} ${meta.color} font-bold shadow-xs`
                  : 'bg-white dark:bg-[#121D33] border-[#DCE6F5] dark:border-[#2A3A56] text-[#64748B] dark:text-[#B6C2D6] hover:border-[#3984F5]'
              }`}
            >
              {meta.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. RECEIPTS LIST / GRID */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#3984F5] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-[#64748B] dark:text-[#B6C2D6]">Accessing secure receipt vault...</span>
        </div>
      ) : receipts.length === 0 ? (
        /* Empty State */
        <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-12 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-[#3984F5]/10 flex items-center justify-center text-[#3984F5] dark:text-[#60A5FA]">
            <ReceiptIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-[#172554] dark:text-[#F1F5F9]">No Receipts Found</h3>
            <p className="text-xs text-[#64748B] dark:text-[#B6C2D6] leading-relaxed">
              {searchTerm || selectedCategory !== 'all' || selectedTripFilter !== 'all'
                ? 'No receipts matched your active search or filter criteria. Try clearing filters to view all documents.'
                : 'Your receipt vault is empty. Upload your first hotel voucher, transport receipt, or dining bill to keep your expenses organized.'}
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="px-5 py-2.5 rounded-2xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Your First Receipt</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {receipts.map((rec) => {
            const isPdf = rec.mime_type === 'application/pdf' || rec.file_name.toLowerCase().endsWith('.pdf');
            const catMeta = CATEGORY_META[rec.category] || CATEGORY_META.other;

            return (
              <div
                key={rec.id}
                className="group bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] hover:border-[#3984F5] dark:hover:border-[#60A5FA] rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between"
              >
                {/* Top Image Preview Banner */}
                <div
                  onClick={() => openPreviewModal(rec)}
                  className="relative h-36 bg-[#F5F8FF] dark:bg-[#0B1224] cursor-pointer overflow-hidden flex items-center justify-center"
                >
                  {isPdf ? (
                    <div className="flex flex-col items-center gap-2 text-[#64748B] dark:text-[#B6C2D6]">
                      <FileText className="w-10 h-10 text-[#F472B6]" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">PDF Document</span>
                    </div>
                  ) : (
                    <img
                      src={`/api/receipts/${rec.id}/file`}
                      alt={rec.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-[#121D33]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-[11px] font-bold text-white flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5 text-[#3984F5]" /> Click to Inspect Full Document
                    </span>
                  </div>

                  {/* Badges on Top */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md shadow-xs ${catMeta.bg} ${catMeta.color}`}>
                      {catMeta.label}
                    </span>

                    {rec.ocr_applied ? (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#3984F5] text-white flex items-center gap-1 shadow-xs">
                        <Sparkles className="w-2.5 h-2.5" /> AI Audited
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-sm text-[#172554] dark:text-[#F1F5F9] line-clamp-1" title={rec.title}>
                        {rec.title}
                      </h4>
                      <span className="text-sm font-black text-[#3984F5] dark:text-[#60A5FA] shrink-0">
                        {rec.currency} {rec.amount.toLocaleString()}
                      </span>
                    </div>

                    {rec.merchant_name && (
                      <p className="text-[11px] font-semibold text-[#64748B] dark:text-[#B6C2D6] line-clamp-1">
                        Merchant: <span className="text-[#172554] dark:text-[#F1F5F9]">{rec.merchant_name}</span>
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-[11px] text-[#64748B] dark:text-[#B6C2D6] pt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {rec.date}
                      </span>
                      {rec.payment_method && (
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3" />
                          {PAYMENT_METHOD_LABELS[rec.payment_method] || rec.payment_method}
                        </span>
                      )}
                    </div>

                    {/* Trip association */}
                    {rec.trip_title && (
                      <div className="pt-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#3984F5] dark:text-[#60A5FA] bg-[#3984F5]/10 px-2 py-0.5 rounded-md">
                          <MapPin className="w-2.5 h-2.5" />
                          {rec.trip_title}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Linked Expense Status */}
                  <div className="pt-2 border-t border-[#DCE6F5] dark:border-[#2A3A56] flex items-center justify-between">
                    {rec.is_expense_created || rec.expense_id ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3984F5] dark:text-[#60A5FA] bg-[#3984F5]/10 px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Linked (#{rec.expense_id})
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConvertToExpense(rec)}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-[#3984F5] dark:text-[#60A5FA] hover:underline"
                        title="Create an expense entry for this receipt"
                      >
                        <Plus className="w-3 h-3" />
                        Convert to Expense
                      </button>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openPreviewModal(rec)}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#3984F5] hover:bg-[#3984F5]/10 transition-colors"
                        title="View Receipt Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => api.downloadReceiptFile(rec.id, rec.file_name)}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#3984F5] hover:bg-[#3984F5]/10 transition-colors"
                        title="Download Original File"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => openEditModal(rec)}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#F472B6] hover:bg-[#F472B6]/10 transition-colors"
                        title="Edit Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          setActiveReceipt(rec);
                          setDeleteLinkedExpense(false);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                        title="Delete Receipt"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F8FF] dark:bg-[#192640] text-[#64748B] dark:text-[#B6C2D6] uppercase font-bold text-[10px] tracking-wider border-b border-[#DCE6F5] dark:border-[#2A3A56]">
                <tr>
                  <th className="py-3.5 px-4">Receipt</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Trip</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Expense Sync</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DCE6F5] dark:divide-[#2A3A56] text-[#172554] dark:text-[#F1F5F9]">
                {receipts.map((rec) => {
                  const catMeta = CATEGORY_META[rec.category] || CATEGORY_META.other;
                  return (
                    <tr key={rec.id} className="hover:bg-[#F5F8FF]/60 dark:hover:bg-[#192640]/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => openPreviewModal(rec)}
                            className="w-8 h-8 rounded-xl bg-[#F5F8FF] dark:bg-[#0B1224] flex items-center justify-center shrink-0 text-[#64748B] hover:text-[#3984F5]"
                          >
                            {rec.mime_type === 'application/pdf' ? (
                              <FileText className="w-4 h-4 text-[#F472B6]" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-[#3984F5]" />
                            )}
                          </button>
                          <div>
                            <span className="font-bold text-[#172554] dark:text-[#F1F5F9] block">{rec.title}</span>
                            {rec.merchant_name && <span className="text-[10px] text-[#64748B] dark:text-[#B6C2D6]">{rec.merchant_name}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium">{rec.date}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${catMeta.bg} ${catMeta.color}`}>
                          {catMeta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B] dark:text-[#B6C2D6]">{rec.trip_title || '—'}</td>
                      <td className="py-3.5 px-4 font-black text-[#3984F5] dark:text-[#60A5FA]">
                        {rec.currency} {rec.amount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        {rec.is_expense_created || rec.expense_id ? (
                          <span className="text-[10px] font-bold text-[#3984F5] dark:text-[#60A5FA] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Linked (#{rec.expense_id})
                          </span>
                        ) : (
                          <button
                            onClick={() => handleConvertToExpense(rec)}
                            className="text-[10px] font-bold text-[#3984F5] dark:text-[#60A5FA] hover:underline"
                          >
                            + Convert
                          </button>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openPreviewModal(rec)}
                            className="p-1 text-[#64748B] hover:text-[#3984F5]"
                            title="Inspect"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => api.downloadReceiptFile(rec.id, rec.file_name)}
                            className="p-1 text-[#64748B] hover:text-[#3984F5]"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(rec)}
                            className="p-1 text-[#64748B] hover:text-[#F472B6]"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setActiveReceipt(rec);
                              setDeleteLinkedExpense(false);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-1 text-[#64748B] hover:text-[#EF4444]"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. ADD RECEIPT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1224]/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE6F5] dark:border-[#2A3A56]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#3984F5]/15 text-[#3984F5] dark:text-[#60A5FA] flex items-center justify-center font-bold">
                  <ReceiptIcon className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9]">Upload New Receipt</h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-full text-[#64748B] hover:text-[#172554] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReceipt} className="space-y-5">
              {/* File Dropzone */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9]">
                  Receipt Document (JPG, JPEG, PNG, PDF up to 10MB)
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                    formFile
                      ? 'border-[#3984F5] bg-[#3984F5]/5'
                      : 'border-[#DCE6F5] dark:border-[#2A3A56] hover:border-[#3984F5] hover:bg-[#3984F5]/5'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelected(e.target.files[0]);
                      }
                    }}
                  />

                  {/* Hidden camera input for mobile photo snap */}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelected(e.target.files[0]);
                      }
                    }}
                  />

                  {formFile ? (
                    <div className="space-y-2">
                      {formPreviewUrl ? (
                        <img
                          src={formPreviewUrl}
                          alt="Receipt Preview"
                          className="h-28 mx-auto rounded-xl object-contain border border-[#DCE6F5] dark:border-[#2A3A56] shadow-xs"
                        />
                      ) : (
                        <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F472B6]/15 text-[#F472B6] flex items-center justify-center">
                          <FileText className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-[#172554] dark:text-[#F1F5F9]">{formFileName}</p>
                        <p className="text-[10px] text-[#64748B] dark:text-[#B6C2D6]">
                          {roundBytesToMb(formFile.size)} • Click to replace file
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-10 h-10 mx-auto rounded-2xl bg-[#3984F5]/15 text-[#3984F5] dark:text-[#60A5FA] flex items-center justify-center">
                        <UploadCloud className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#172554] dark:text-[#F1F5F9]">
                          Click to upload receipt or drag & drop
                        </p>
                        <p className="text-[10px] text-[#64748B] dark:text-[#B6C2D6]">Supports JPG, PNG, and PDF receipts</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Camera Option */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cameraInputRef.current?.click();
                    }}
                    className="text-[11px] font-semibold text-[#3984F5] dark:text-[#60A5FA] hover:underline flex items-center gap-1"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Take photo with camera</span>
                  </button>
                </div>

                {/* AI OCR Scanner Status Banner */}
                {isScanning && (
                  <div className="p-3 rounded-2xl bg-[#3984F5]/10 border border-[#3984F5]/30 text-xs text-[#3984F5] dark:text-[#60A5FA] flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditing document & extracting metadata...</span>
                  </div>
                )}

                {isOcrDetected && (
                  <div className="p-3 rounded-2xl bg-[#3984F5]/10 border border-[#3984F5]/30 text-xs text-[#1D4ED8] dark:text-[#60A5FA] flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Details auto-extracted via Gemini AI. Please verify the fields below.</span>
                  </div>
                )}

                {scanNotice && !isOcrDetected && !isScanning && (
                  <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6] italic">{scanNotice}</p>
                )}
              </div>

              {/* Form Input Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1">
                    Receipt Title / Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Fisherman's Wharf Dinner, Uber Ride"
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1">
                    Merchant / Store Name
                  </label>
                  <input
                    type="text"
                    value={formMerchant}
                    onChange={(e) => setFormMerchant(e.target.value)}
                    placeholder="e.g. Taj Resort, IndiGo, Star Cafe"
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1">
                    Purchase Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1">
                    Amount Paid *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formCurrency}
                      onChange={(e) => setFormCurrency(e.target.value)}
                      className="w-24 bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-2 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] font-bold focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="AUD">AUD (A$)</option>
                    </select>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                      placeholder="0.00"
                      className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] font-bold focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1">
                    Expense Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] font-semibold focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
                  >
                    <option value="food">Dining & Food</option>
                    <option value="transport">Transit & Rides</option>
                    <option value="accommodation">Hotel & Stays</option>
                    <option value="shopping">Shopping & Bazaars</option>
                    <option value="activities">Tours & Activities</option>
                    <option value="other">General / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="upi">UPI / Online</option>
                    <option value="cash">Cash</option>
                    <option value="net_banking">Net Banking</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1">
                    Related Trip (Optional)
                  </label>
                  <select
                    value={formTripId}
                    onChange={(e) => setFormTripId(e.target.value)}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] font-semibold focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
                  >
                    <option value="">No Trip (Personal / Standalone)</option>
                    {trips.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.destination})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1">
                    Notes & Line Items
                  </label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Add details, table number, ticket confirmation, or split notes..."
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
                  />
                </div>

                {/* Create Expense Checkbox */}
                {formTripId && (
                  <div className="sm:col-span-2 p-3 bg-[#F5F8FF] dark:bg-[#192640] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="create_exp_check"
                      checked={formCreateExpense}
                      onChange={(e) => setFormCreateExpense(e.target.checked)}
                      className="w-4 h-4 rounded text-[#3984F5] focus:ring-[#3984F5]"
                    />
                    <label htmlFor="create_exp_check" className="text-xs text-[#172554] dark:text-[#F1F5F9] cursor-pointer">
                      <strong>Auto-create linked expense:</strong> Automatically record this in the trip's Budget Guardian tracker.
                    </label>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DCE6F5] dark:border-[#2A3A56]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:text-[#172554] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs shadow-md shadow-[#3984F5]/20 hover:scale-[1.02] transition-transform"
                >
                  {isLoading ? 'Saving Document...' : 'Save to Vault'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. EDIT RECEIPT MODAL */}
      {isEditModalOpen && activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1224]/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE6F5] dark:border-[#2A3A56]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F472B6]/20 text-[#BE185D] dark:text-[#F9A8D4] flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9]">Edit Receipt Details</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-full text-[#64748B] hover:text-[#172554] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateReceipt} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1">
                    Receipt Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1">
                    Merchant Name
                  </label>
                  <input
                    type="text"
                    value={formMerchant}
                    onChange={(e) => setFormMerchant(e.target.value)}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1">
                    Date of Purchase *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] font-bold focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] font-semibold focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
                  >
                    <option value="food">Dining & Food</option>
                    <option value="transport">Transit & Rides</option>
                    <option value="accommodation">Hotel & Stays</option>
                    <option value="shopping">Shopping & Bazaars</option>
                    <option value="activities">Tours & Activities</option>
                    <option value="other">General / Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1">
                    Related Trip
                  </label>
                  <select
                    value={formTripId}
                    onChange={(e) => setFormTripId(e.target.value)}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] font-semibold focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
                  >
                    <option value="">No Trip</option>
                    {trips.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title} ({t.destination})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
                  >
                    <option value="credit_card">Credit Card</option>
                    <option value="debit_card">Debit Card</option>
                    <option value="upi">UPI / Online</option>
                    <option value="cash">Cash</option>
                    <option value="net_banking">Net Banking</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA]"
                  />
                </div>

                {activeReceipt.expense_id && (
                  <div className="sm:col-span-2 p-3 bg-[#F5F8FF] dark:bg-[#192640] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="sync_exp_check"
                      checked={formSyncExpense}
                      onChange={(e) => setFormSyncExpense(e.target.checked)}
                      className="w-4 h-4 rounded text-[#3984F5] focus:ring-[#3984F5]"
                    />
                    <label htmlFor="sync_exp_check" className="text-xs text-[#172554] dark:text-[#F1F5F9] cursor-pointer">
                      Synchronize changes to linked Expense #{activeReceipt.expense_id}
                    </label>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#DCE6F5] dark:border-[#2A3A56]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:text-[#172554] dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs shadow-md shadow-[#3984F5]/20 hover:scale-[1.02] transition-transform"
                >
                  {isLoading ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. PREVIEW & INSPECT MODAL */}
      {isPreviewModalOpen && activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1224]/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[92vh] overflow-y-auto space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#DCE6F5] dark:border-[#2A3A56]">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-2">
                  <span>{activeReceipt.title}</span>
                  <span className="text-sm font-black text-[#3984F5] dark:text-[#60A5FA]">
                    ({activeReceipt.currency} {activeReceipt.amount.toLocaleString()})
                  </span>
                </h3>
                <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6]">
                  {activeReceipt.file_name} • {roundBytesToMb(activeReceipt.file_size)}
                </p>
              </div>
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="p-1.5 rounded-full text-[#64748B] hover:text-[#172554] dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Document Viewer Frame */}
            <div className="bg-[#F5F8FF] dark:bg-[#0B1224] rounded-2xl p-2 min-h-64 flex items-center justify-center overflow-hidden border border-[#DCE6F5] dark:border-[#2A3A56]">
              {isLoadingPreview ? (
                <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B] dark:text-[#B6C2D6]">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#3984F5] dark:text-[#60A5FA]" />
                  <span>Loading document...</span>
                </div>
              ) : activeReceipt.mime_type === 'application/pdf' ? (
                <iframe
                  src={previewBlobUrl || `/api/receipts/${activeReceipt.id}/file`}
                  title={activeReceipt.title}
                  className="w-full h-80 rounded-xl"
                />
              ) : (
                <img
                  src={previewBlobUrl || `/api/receipts/${activeReceipt.id}/file`}
                  alt={activeReceipt.title}
                  className="max-h-96 rounded-xl object-contain shadow-sm"
                />
              )}
            </div>

            {/* Document Details Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#F5F8FF] dark:bg-[#192640] p-4 rounded-2xl border border-[#DCE6F5] dark:border-[#2A3A56]">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] dark:text-[#B6C2D6] block">Merchant</span>
                <span className="font-semibold text-[#172554] dark:text-[#F1F5F9]">
                  {activeReceipt.merchant_name || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] dark:text-[#B6C2D6] block">Date</span>
                <span className="font-semibold text-[#172554] dark:text-[#F1F5F9]">{activeReceipt.date}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] dark:text-[#B6C2D6] block">Category</span>
                <span className="font-semibold text-[#172554] dark:text-[#F1F5F9] capitalize">
                  {CATEGORY_META[activeReceipt.category]?.label || activeReceipt.category}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#64748B] dark:text-[#B6C2D6] block">Payment</span>
                <span className="font-semibold text-[#172554] dark:text-[#F1F5F9] capitalize">
                  {PAYMENT_METHOD_LABELS[activeReceipt.payment_method || ''] || activeReceipt.payment_method}
                </span>
              </div>
            </div>

            {/* Notes if present */}
            {activeReceipt.notes && (
              <div className="text-xs p-3 bg-[#F5F8FF] dark:bg-[#192640] rounded-xl text-[#64748B] dark:text-[#B6C2D6] border border-[#DCE6F5] dark:border-[#2A3A56]">
                <span className="font-bold text-[#172554] dark:text-[#F1F5F9] block mb-0.5">Notes & Line Items:</span>
                <p>{activeReceipt.notes}</p>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#DCE6F5] dark:border-[#2A3A56]">
              <div className="flex items-center gap-2">
                {!activeReceipt.is_expense_created && !activeReceipt.expense_id && (
                  <button
                    onClick={() => handleConvertToExpense(activeReceipt)}
                    className="px-3.5 py-1.5 rounded-xl bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] border border-[#3984F5]/30 hover:bg-[#3984F5]/20 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Convert to Expense</span>
                  </button>
                )}
                {activeReceipt.expense_id && (
                  <span className="text-xs font-bold text-[#3984F5] dark:text-[#60A5FA] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Linked to Expense #{activeReceipt.expense_id}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => api.downloadReceiptFile(activeReceipt.id, activeReceipt.file_name)}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-[#192640] border border-[#DCE6F5] dark:border-[#2A3A56] hover:border-[#3984F5] text-xs font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-[#3984F5] dark:text-[#60A5FA]" />
                  <span>Download File</span>
                </button>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#F5F8FF] dark:bg-[#192640] border border-[#DCE6F5] dark:border-[#2A3A56] text-xs font-bold text-[#64748B] dark:text-[#B6C2D6]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. DELETE CONFIRMATION DIALOG */}
      {isDeleteModalOpen && activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1224]/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-[#EF4444]/15 text-[#EF4444] flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9]">Delete Receipt Document?</h3>
              <p className="text-xs text-[#64748B] dark:text-[#B6C2D6] leading-relaxed">
                Are you sure you want to delete <strong className="text-[#172554] dark:text-[#F1F5F9]">"{activeReceipt.title}"</strong>? The uploaded file will be permanently removed from server storage.
              </p>
            </div>

            {/* If linked to an expense */}
            {activeReceipt.expense_id && (
              <div className="p-3 bg-[#FACC15]/15 dark:bg-[#192640] border border-[#FACC15]/40 rounded-2xl text-xs space-y-2">
                <span className="font-bold text-[#B45309] dark:text-[#FDE047] block">
                  Linked Expense Detected (Expense #{activeReceipt.expense_id})
                </span>
                <label className="flex items-center gap-2 cursor-pointer text-[#172554] dark:text-[#F1F5F9]">
                  <input
                    type="checkbox"
                    checked={deleteLinkedExpense}
                    onChange={(e) => setDeleteLinkedExpense(e.target.checked)}
                    className="w-4 h-4 rounded text-[#EF4444] focus:ring-[#EF4444]"
                  />
                  <span>Also delete the expense entry from your trip budget</span>
                </label>
                <p className="text-[10px] text-[#64748B] dark:text-[#B6C2D6]">
                  {deleteLinkedExpense
                    ? 'The expense will be deleted from your trip budget calculations.'
                    : 'Unchecked: The expense remains in your budget; only the receipt attachment is removed.'}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] dark:text-[#B6C2D6] hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteReceipt}
                disabled={isLoading}
                className="px-5 py-2 rounded-xl bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-xs shadow-md shadow-[#EF4444]/25"
              >
                {isLoading ? 'Deleting...' : 'Delete Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function roundBytesToMb(bytes: number): string {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
