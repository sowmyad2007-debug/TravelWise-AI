import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  HelpCircle,
  PhoneCall,
  ExternalLink,
  Languages,
  Send,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  LifeBuoy,
  Info,
  CalendarCheck,
  Search,
  Copy,
  Check,
  Luggage,
  Sparkles,
  Ticket,
  Clock,
  RotateCcw
} from 'lucide-react';

export const TravelHelper: React.FC = () => {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [tourismLinks, setTourismLinks] = useState<any[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const [languagePhrases, setLanguagePhrases] = useState<Record<string, any[]>>({});
  const [packingChecklist, setPackingChecklist] = useState<any[]>([]);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [selectedLangKey, setSelectedLangKey] = useState<string>('');
  
  // Navigation & Search
  const [activeTab, setActiveTab] = useState<'all' | 'emergency' | 'phrases' | 'tourism' | 'faqs' | 'checklist' | 'tickets'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Packing Checklist persistent checked items
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('travelwise_packing_checked');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Support Form State
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportCategory, setSupportCategory] = useState('Trip Planning Inquiry');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportPriority, setSupportPriority] = useState('medium');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState<any>(null);
  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadResources();
    loadTickets();
  }, []);

  const loadResources = async () => {
    try {
      const res = await api.getHelperResources();
      setFaqs(res.faqs || []);
      setTourismLinks(res.tourism_links || []);
      setEmergencyContacts(res.emergency_contacts || []);
      setLanguagePhrases(res.language_phrases || {});
      setPackingChecklist(res.packing_checklist || []);
      const keys = Object.keys(res.language_phrases || {});
      if (keys.length > 0) {
        setSelectedLangKey(keys[0]);
      }
    } catch (err) {
      console.error('Failed to load helper resources', err);
    }
  };

  const loadTickets = async () => {
    try {
      const res = await api.getMyTickets();
      setMyTickets(res.tickets || []);
    } catch (err) {
      console.warn('Could not load user tickets', err);
    }
  };

  const toggleChecklistItem = (itemText: string) => {
    setCheckedItems(prev => {
      const next = { ...prev, [itemText]: !prev[itemText] };
      try {
        localStorage.setItem('travelwise_packing_checked', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const resetChecklist = () => {
    setCheckedItems({});
    try {
      localStorage.removeItem('travelwise_packing_checked');
    } catch {}
  };

  const copyToClipboard = (text: string, key: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportName || !supportEmail || !supportSubject || !supportMessage) {
      setErrorMsg('Please complete all support form fields.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.submitSupportTicket({
        name: supportName,
        email: supportEmail,
        category: supportCategory,
        subject: supportSubject,
        message: supportMessage,
        priority: supportPriority,
      });
      setTicketResult(res);
      setSupportSubject('');
      setSupportMessage('');
      await loadTickets();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit support request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRegionBadge = (region: string) => {
    const r = region.toLowerCase();
    if (r.includes('india')) return { flag: '🇮🇳', text: 'India' };
    if (r.includes('europe') || r.includes('eu')) return { flag: '🇪🇺', text: 'EU' };
    if (r.includes('usa') || r.includes('us')) return { flag: '🇺🇸', text: 'USA' };
    if (r.includes('uk') || r.includes('britain')) return { flag: '🇬🇧', text: 'UK' };
    if (r.includes('australia')) return { flag: '🇦🇺', text: 'Australia' };
    if (r.includes('japan')) return { flag: '🇯🇵', text: 'Japan' };
    return { flag: '🌐', text: region };
  };

  // Filtered emergency contacts
  const filteredEmergency = emergencyContacts.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.service.toLowerCase().includes(q) || c.phone.includes(q) || c.region.toLowerCase().includes(q) || c.type.toLowerCase().includes(q);
  });

  // Filtered tourism links
  const filteredTourism = tourismLinks.filter(l => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return l.name.toLowerCase().includes(q) || l.region.toLowerCase().includes(q);
  });

  // Filtered FAQs
  const filteredFaqs = faqs.filter(f => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
  });

  // Total checklist items calculation
  const totalItemsCount = packingChecklist.reduce((acc, cat) => acc + (cat.items?.length || 0), 0);
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPct = totalItemsCount > 0 ? Math.round((checkedCount / totalItemsCount) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn text-[#172554] dark:text-[#F1F5F9]">
      
      {/* 1. TOP HERO BANNER */}
      <div className="bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm relative overflow-hidden text-white">
        {/* Glow ambient decorations */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 rounded-full bg-[#3984F5]/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 rounded-full bg-[#F472B6]/15 blur-2xl pointer-events-none" />

        <div className="space-y-2.5 relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#3984F5]/20 border border-[#3984F5]/40 px-3.5 py-1 rounded-full text-xs font-bold text-[#60A5FA] shadow-xs">
            <LifeBuoy className="w-3.5 h-3.5 text-[#FACC15]" />
            <span>Travel Assistance, Multilingual & Safety Hub 2.0</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Travel Helper & Safety Concierge
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Instant 24x7 verified government emergency dispatch lines, local language phonetics, official tourism board permits, packing checklists, and priority support tickets.
          </p>
        </div>

        {/* Toll-Free Emergency Quick Badge */}
        <div className="bg-[#192640]/90 backdrop-blur-md p-5 rounded-2xl border border-white/15 text-xs text-slate-300 space-y-2 relative z-10 shadow-md shrink-0">
          <div className="flex items-center gap-2 font-bold text-[#60A5FA]">
            <ShieldCheck className="w-4 h-4 text-[#FACC15]" />
            <span>Verified 24x7 Emergency Helplines</span>
          </div>
          <div className="space-y-1 text-[11px] font-mono text-slate-200">
            <div>🇮🇳 India / 🇪🇺 EU: <strong className="text-white text-xs bg-white/10 px-1.5 py-0.5 rounded">112</strong></div>
            <div>🇮🇳 Tourist Helpline: <strong className="text-white text-xs bg-white/10 px-1.5 py-0.5 rounded">1363</strong></div>
            <div>🇺🇸 USA / 🇨🇦 Canada: <strong className="text-white text-xs bg-white/10 px-1.5 py-0.5 rounded">911</strong></div>
          </div>
        </div>
      </div>

      {/* 2. SEARCH BAR & CATEGORY TABS */}
      <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Live Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#64748B] dark:text-[#B6C2D6] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search emergency numbers, local phrases, tourism boards, FAQs..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#64748B] hover:text-[#172554] dark:hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#64748B] dark:text-[#B6C2D6]">
            <CalendarCheck className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
            <span>Updated Directory 2026</span>
          </div>
        </div>

        {/* Section Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Resources', icon: LifeBuoy },
            { id: 'emergency', label: 'Emergency Helplines', icon: PhoneCall },
            { id: 'phrases', label: 'Language Phrasebook', icon: Languages },
            { id: 'checklist', label: 'Packing Checklist', icon: Luggage },
            { id: 'tourism', label: 'Official Tourism Boards', icon: ExternalLink },
            { id: 'faqs', label: 'Help & FAQs', icon: HelpCircle },
            { id: 'tickets', label: 'Support Inquiries', icon: Ticket }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                  isSelected
                    ? 'bg-[#3984F5] text-white dark:bg-[#60A5FA] dark:text-[#0B1224] shadow-xs'
                    : 'bg-[#F5F8FF] dark:bg-[#192640] border border-[#DCE6F5] dark:border-[#2A3A56] text-[#64748B] dark:text-[#B6C2D6] hover:bg-[#DCE6F5] dark:hover:bg-[#121D33]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. SECTION: EMERGENCY HELPLINES */}
      {(activeTab === 'all' || activeTab === 'emergency') && (
        <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#DCE6F5] dark:border-[#2A3A56] pb-3">
            <h2 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-[#F472B6]" />
              Verified Government Emergency Numbers
            </h2>
            <span className="text-[11px] font-bold text-[#64748B] dark:text-[#B6C2D6]">
              {filteredEmergency.length} Contact{filteredEmergency.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredEmergency.map((contact, i) => {
              const badge = getRegionBadge(contact.region);
              const isCopied = copiedKey === `phone_${i}`;
              return (
                <div
                  key={i}
                  className="p-4 rounded-2xl bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] flex items-center justify-between gap-3 shadow-xs hover:border-[#3984F5]/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-bold text-[#172554] dark:text-[#F1F5F9] truncate">{contact.service}</p>
                      <span className="text-[10px] bg-white dark:bg-[#121D33] px-2 py-0.5 rounded-full font-bold text-[#172554] dark:text-[#F1F5F9] border border-[#DCE6F5] dark:border-[#2A3A56]">
                        {badge.flag} {badge.text}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#64748B] dark:text-[#B6C2D6] mt-0.5 truncate">{contact.type}</p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => copyToClipboard(contact.phone, `phone_${i}`)}
                      title="Copy phone number"
                      className="p-2 rounded-xl bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] text-[#64748B] dark:text-[#B6C2D6] hover:text-[#3984F5] transition-colors"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <a
                      href={`tel:${contact.phone.replace(/[^0-9]/g, '')}`}
                      className="px-3 py-1.5 rounded-xl bg-[#F472B6]/15 hover:bg-[#F472B6]/25 text-[#DB2777] dark:text-[#F9A8D4] font-mono font-bold text-xs border border-[#F472B6]/30 transition-colors"
                    >
                      {contact.phone}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. SECTION: LOCAL LANGUAGE PHRASEBOOK */}
      {(activeTab === 'all' || activeTab === 'phrases') && (
        <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCE6F5] dark:border-[#2A3A56] pb-3">
            <h2 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-2">
              <Languages className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
              Essential Travel Phrasebook & Phonetics
            </h2>

            {/* Language Selector Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {Object.keys(languagePhrases).map((langKey) => (
                <button
                  key={langKey}
                  onClick={() => setSelectedLangKey(langKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    selectedLangKey === langKey
                      ? 'bg-[#3984F5] text-white shadow-xs'
                      : 'bg-[#F5F8FF] dark:bg-[#0B1224] text-[#64748B] dark:text-[#B6C2D6] hover:bg-[#DCE6F5] border border-[#DCE6F5] dark:border-[#2A3A56]'
                  }`}
                >
                  {langKey.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {selectedLangKey && languagePhrases[selectedLangKey] && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {languagePhrases[selectedLangKey].map((item, i) => {
                const isCopied = copiedKey === `phrase_${selectedLangKey}_${i}`;
                return (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] space-y-2 shadow-xs group hover:border-[#3984F5]/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#3984F5] dark:text-[#60A5FA]">{item.phrase}</span>
                      <button
                        onClick={() => copyToClipboard(item.phrase, `phrase_${selectedLangKey}_${i}`)}
                        title="Copy phrase"
                        className="p-1.5 rounded-lg bg-white dark:bg-[#121D33] text-[#64748B] dark:text-[#B6C2D6] hover:text-[#3984F5] transition-colors"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-xs text-[#172554] dark:text-[#F1F5F9] font-medium">"{item.meaning}"</p>
                    <div className="text-[11px] font-mono text-[#64748B] dark:text-[#B6C2D6] bg-white dark:bg-[#121D33] px-2.5 py-1 rounded-lg border border-[#DCE6F5] dark:border-[#2A3A56] inline-block">
                      Pronunciation: {item.pronunciation}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. SECTION: INTERACTIVE PACKING CHECKLIST */}
      {(activeTab === 'all' || activeTab === 'checklist') && (
        <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCE6F5] dark:border-[#2A3A56] pb-3">
            <div>
              <h2 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-2">
                <Luggage className="w-4 h-4 text-[#FACC15]" />
                Interactive Travel & Climate Packing Checklist
              </h2>
              <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6] mt-0.5">
                Check off items as you prepare. Progress is automatically saved in your browser.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-bold text-[#3984F5] dark:text-[#60A5FA]">
                {checkedCount} / {totalItemsCount} Packed ({progressPct}%)
              </span>
              <button
                onClick={resetChecklist}
                className="p-1.5 rounded-lg border border-[#DCE6F5] dark:border-[#2A3A56] text-[#64748B] hover:text-[#EF4444] text-xs flex items-center gap-1"
                title="Reset checklist"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[10px]">Reset</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] rounded-full h-2.5 overflow-hidden border border-[#DCE6F5] dark:border-[#2A3A56]">
            <div
              className="bg-gradient-to-r from-[#3984F5] via-[#F472B6] to-[#FACC15] h-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {packingChecklist.map((cat, ci) => (
              <div key={ci} className="space-y-3 p-5 rounded-2xl bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#3984F5] dark:text-[#60A5FA] flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#F472B6]" />
                  {cat.category}
                </h3>
                <div className="space-y-2">
                  {cat.items?.map((item: string, ii: number) => {
                    const isChecked = Boolean(checkedItems[item]);
                    return (
                      <label
                        key={ii}
                        className={`flex items-start gap-2.5 p-2 rounded-xl cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-white/60 dark:bg-[#121D33]/60 opacity-60 line-through'
                            : 'hover:bg-white dark:hover:bg-[#121D33]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleChecklistItem(item)}
                          className="mt-0.5 rounded text-[#3984F5] focus:ring-[#3984F5] accent-[#3984F5]"
                        />
                        <span className="text-xs text-[#172554] dark:text-[#F1F5F9] font-medium leading-relaxed">
                          {item}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. SECTION: OFFICIAL TOURISM BOARDS */}
      {(activeTab === 'all' || activeTab === 'tourism') && (
        <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 space-y-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#DCE6F5] dark:border-[#2A3A56] pb-3">
            <h2 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
              Official Government Tourism Portals & E-Visas
            </h2>
            <span className="text-[11px] font-bold text-[#64748B] dark:text-[#B6C2D6]">
              {filteredTourism.length} Portal{filteredTourism.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {filteredTourism.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] hover:border-[#3984F5] transition-all flex items-center justify-between group shadow-xs"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-xs font-bold text-[#172554] dark:text-[#F1F5F9] group-hover:text-[#3984F5] dark:group-hover:text-[#60A5FA] transition-colors truncate">
                    {link.name}
                  </p>
                  <p className="text-[10px] text-[#64748B] dark:text-[#B6C2D6] mt-0.5">{link.region}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-[#64748B] dark:text-[#B6C2D6] group-hover:text-[#3984F5] transition-colors shrink-0" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 7. SECTION: FAQS */}
      {(activeTab === 'all' || activeTab === 'faqs') && (
        <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-[#DCE6F5] dark:border-[#2A3A56] pb-3">
            <h2 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-[#FACC15]" />
              Frequently Asked Platform & Travel Questions
            </h2>
            <span className="text-[11px] font-bold text-[#64748B] dark:text-[#B6C2D6]">
              {filteredFaqs.length} FAQ{filteredFaqs.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-2.5">
            {filteredFaqs.map((faq, i) => {
              const isOpen = openFaqIndex === i;
              return (
                <div key={i} className="border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl overflow-hidden bg-[#F5F8FF] dark:bg-[#0B1224]">
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                    className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs font-bold text-[#172554] dark:text-[#F1F5F9] hover:bg-[#DCE6F5]/50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] font-bold shrink-0">
                        {faq.category}
                      </span>
                      <span>{faq.question}</span>
                    </span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-[#3984F5] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#64748B] shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="p-4 pt-1 text-xs text-[#64748B] dark:text-[#B6C2D6] border-t border-[#DCE6F5] dark:border-[#2A3A56] leading-relaxed bg-white dark:bg-[#121D33]">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 8. SECTION: SUPPORT INQUIRIES & MY TICKETS */}
      {(activeTab === 'all' || activeTab === 'tickets') && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Submit Support Form */}
          <div className="lg:col-span-7 bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-2">
                <Send className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
                Submit a Support or Feature Inquiry
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">
                Have questions regarding travel recommendations, receipt OCR, or budget calculations? Submit an inquiry to persist in the system database.
              </p>
            </div>

            {ticketResult && (
              <div className="p-4 rounded-2xl bg-[#3984F5]/10 border border-[#3984F5]/30 text-xs text-[#3984F5] dark:text-[#60A5FA] space-y-2 animate-fadeIn">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>Inquiry Registered Successfully!</span>
                </div>
                <p className="text-[#172554] dark:text-[#F1F5F9]">
                  Ticket Reference: <strong className="font-mono text-[#172554] dark:text-white">{ticketResult.ticket_id}</strong>
                </p>
                <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6]">
                  {ticketResult.demo_mode_notice}
                </p>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSupportSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Your Name</label>
                  <input
                    type="text"
                    value={supportName}
                    onChange={(e) => setSupportName(e.target.value)}
                    placeholder="Samba"
                    required
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  />
                </div>

                <div>
                  <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Email Address</label>
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    placeholder="samba@example.com"
                    required
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Category</label>
                  <select
                    value={supportCategory}
                    onChange={(e) => setSupportCategory(e.target.value)}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  >
                    <option value="Trip Planning Inquiry">Trip Planning Inquiry</option>
                    <option value="Receipts & Expense Tracker">Receipts & Expense Tracker</option>
                    <option value="Budget Calculation Feedback">Budget Calculation Feedback</option>
                    <option value="Adaptive Engine Suggestion">Adaptive Engine Suggestion</option>
                    <option value="General Technical Question">General Technical Question</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Priority</label>
                  <select
                    value={supportPriority}
                    onChange={(e) => setSupportPriority(e.target.value)}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  >
                    <option value="low">Low (General Feedback)</option>
                    <option value="medium">Medium (Planning Assistance)</option>
                    <option value="high">High (Urgent Feedback)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Subject</label>
                <input
                  type="text"
                  value={supportSubject}
                  onChange={(e) => setSupportSubject(e.target.value)}
                  placeholder="e.g. Inquiring about Munnar tea estate hours & weather"
                  required
                  className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                />
              </div>

              <div>
                <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Message Description</label>
                <textarea
                  rows={3}
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Provide any relevant questions or feedback..."
                  required
                  className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Saving to Database...' : 'Submit Support Inquiry'}</span>
              </button>
            </form>
          </div>

          {/* My Submitted Inquiries & Ticket Records */}
          <div className="lg:col-span-5 bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#DCE6F5] dark:border-[#2A3A56] pb-3 mb-4">
                <h3 className="text-sm font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-[#F472B6]" />
                  Your Active Support Tickets
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA]">
                  {myTickets.length} Saved
                </span>
              </div>

              {myTickets.length > 0 ? (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {myTickets.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] space-y-1.5 text-xs shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#3984F5] dark:text-[#60A5FA] text-[11px]">
                          TW-SUP-{String(t.id).padStart(4, '0')}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 uppercase">
                          {t.status || 'open'}
                        </span>
                      </div>
                      <p className="font-bold text-[#172554] dark:text-[#F1F5F9] line-clamp-1">{t.subject}</p>
                      <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6] line-clamp-2">{t.message}</p>
                      <div className="flex items-center justify-between text-[10px] text-[#64748B] dark:text-[#B6C2D6] pt-1 border-t border-[#DCE6F5]/60 dark:border-[#2A3A56]/60">
                        <span>{t.category}</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-[#FACC15]" />
                          {t.created_at ? t.created_at.split('T')[0] : 'Today'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center space-y-2 bg-[#F5F8FF] dark:bg-[#0B1224] rounded-2xl border border-dashed border-[#DCE6F5] dark:border-[#2A3A56]">
                  <Ticket className="w-8 h-8 text-[#64748B] dark:text-[#B6C2D6] mx-auto opacity-50" />
                  <p className="text-xs font-semibold text-[#172554] dark:text-[#F1F5F9]">No Support Inquiries Yet</p>
                  <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6]">
                    Any inquiry or algorithmic feedback you submit will be tracked and displayed here.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#DCE6F5] dark:border-[#2A3A56] text-[11px] text-[#64748B] dark:text-[#B6C2D6] flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-[#3984F5] shrink-0" />
              <span>Inquiries are securely preserved across database sessions for audit and evaluation.</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
