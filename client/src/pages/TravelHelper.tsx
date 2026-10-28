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
  CalendarCheck
} from 'lucide-react';

export const TravelHelper: React.FC = () => {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [tourismLinks, setTourismLinks] = useState<any[]>([]);
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([]);
  const [languagePhrases, setLanguagePhrases] = useState<Record<string, any[]>>({});
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [selectedLangKey, setSelectedLangKey] = useState<string>('');

  // Support Form State
  const [supportName, setSupportName] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [supportCategory, setSupportCategory] = useState('Trip Planning Inquiry');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportPriority, setSupportPriority] = useState('medium');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    try {
      const res = await api.getHelperResources();
      setFaqs(res.faqs || []);
      setTourismLinks(res.tourism_links || []);
      setEmergencyContacts(res.emergency_contacts || []);
      setLanguagePhrases(res.language_phrases || {});
      const keys = Object.keys(res.language_phrases || {});
      if (keys.length > 0) {
        setSelectedLangKey(keys[0]);
      }
    } catch (err) {
      console.error('Failed to load helper resources', err);
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
    return { flag: '🌐', text: region };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm relative overflow-hidden text-white">
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#3984F5]/20 border border-[#3984F5]/40 px-3.5 py-1 rounded-full text-xs font-bold text-[#60A5FA] shadow-xs">
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Travel Assistance & Verified Knowledge Center 2.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">Travel Helper & Safety Hub</h1>
          <p className="text-xs text-slate-300 max-w-xl">
            Jurisdiction-tagged emergency contacts, official government portals, phonetic phrasebooks, and persistent support inquiries.
          </p>
        </div>

        <div className="bg-[#192640]/90 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-xs text-slate-300 space-y-1.5 relative z-10 shadow-xs">
          <div className="flex items-center gap-2 font-bold text-[#3984F5] dark:text-[#60A5FA]">
            <ShieldCheck className="w-4 h-4" />
            <span>Verified Emergency Toll-Free</span>
          </div>
          <p className="text-[11px] text-slate-300 font-mono">
            India 🇮🇳 / EU 🇪🇺: <strong className="text-white">112</strong> • USA 🇺🇸: <strong className="text-white">911</strong> • Tourist Help: <strong className="text-white">1363</strong>
          </p>
        </div>
      </div>

      {/* AI vs Human Assistance Transparency Notice */}
      <div className="p-4 rounded-2xl bg-[#3984F5]/10 border border-[#3984F5]/30 text-xs text-[#172554] dark:text-[#F1F5F9] flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 shrink-0 mt-0.5 text-[#3984F5] dark:text-[#60A5FA]" />
        <div className="space-y-1">
          <p className="font-bold text-[#172554] dark:text-[#F1F5F9]">System Architecture & Assistance Transparency:</p>
          <p className="text-[#64748B] dark:text-[#B6C2D6] leading-relaxed text-[11px]">
            The floating AI Travel Buddy provides algorithmic recommendations grounded in your trip data and budget constraints.
            For official travel advisories, emergency dispatch, or specialized transit permits, always refer to the verified official government hotlines and links below.
          </p>
        </div>
      </div>

      {/* Section 1: Verified Emergency Contacts */}
      <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#DCE6F5] dark:border-[#2A3A56] pb-3">
          <h2 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-2">
            <PhoneCall className="w-4 h-4 text-[#F472B6]" />
            Verified Government Emergency Helplines
          </h2>
          <div className="flex items-center gap-2 text-[11px] text-[#64748B] dark:text-[#B6C2D6]">
            <CalendarCheck className="w-3.5 h-3.5 text-[#3984F5] dark:text-[#60A5FA]" />
            <span>Verified 2026 Directory</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {emergencyContacts.map((contact, i) => {
            const badge = getRegionBadge(contact.region);
            return (
              <div key={i} className="p-4 rounded-2xl bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] flex items-center justify-between gap-3 shadow-xs hover:border-[#3984F5]/40 transition-colors">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-[#172554] dark:text-[#F1F5F9]">{contact.service}</p>
                    <span className="text-[10px] bg-white dark:bg-[#121D33] px-2 py-0.5 rounded-full font-bold text-[#172554] dark:text-[#F1F5F9] border border-[#DCE6F5] dark:border-[#2A3A56]">
                      {badge.flag} {badge.text}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#64748B] dark:text-[#B6C2D6] mt-0.5">{contact.type}</p>
                </div>
                <a
                  href={`tel:${contact.phone.replace(/[^0-9]/g, '')}`}
                  className="px-3.5 py-1.5 rounded-xl bg-[#F472B6]/15 hover:bg-[#F472B6]/25 text-[#DB2777] dark:text-[#F9A8D4] font-mono font-bold text-xs border border-[#F472B6]/30 transition-colors shrink-0"
                >
                  {contact.phone}
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Local Language Phrasebook */}
      <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCE6F5] dark:border-[#2A3A56] pb-3">
          <h2 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-2">
            <Languages className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
            Useful Local Language Phrases
          </h2>

          {/* Language Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {Object.keys(languagePhrases).map((langKey) => (
              <button
                key={langKey}
                onClick={() => setSelectedLangKey(langKey)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {languagePhrases[selectedLangKey].map((item, i) => (
              <div key={i} className="p-4 rounded-2xl bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] space-y-1 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#3984F5] dark:text-[#60A5FA]">{item.phrase}</span>
                  <span className="text-[10px] font-mono text-[#64748B] dark:text-[#B6C2D6]">[{item.pronunciation}]</span>
                </div>
                <p className="text-xs text-[#64748B] dark:text-[#B6C2D6] font-medium">"{item.meaning}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Official Tourism Board Portals */}
      <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <h2 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-2">
          <ExternalLink className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
          Official Government Tourism Portals
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {tourismLinks.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 rounded-2xl bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] hover:border-[#3984F5] transition-all flex items-center justify-between group shadow-xs"
            >
              <div>
                <p className="text-xs font-bold text-[#172554] dark:text-[#F1F5F9] group-hover:text-[#3984F5] dark:group-hover:text-[#60A5FA] transition-colors">{link.name}</p>
                <p className="text-[10px] text-[#64748B] dark:text-[#B6C2D6]">{link.region}</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#64748B] dark:text-[#B6C2D6] group-hover:text-[#3984F5] transition-colors shrink-0" />
            </a>
          ))}
        </div>
      </div>

      {/* Section 4: Travel FAQs Accordion */}
      <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 space-y-4 shadow-xs">
        <h2 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#FACC15]" />
          Frequently Asked Travel & Platform Questions
        </h2>

        <div className="space-y-2.5">
          {faqs.map((faq, i) => {
            const isOpen = openFaqIndex === i;
            return (
              <div key={i} className="border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl overflow-hidden bg-[#F5F8FF] dark:bg-[#0B1224]">
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : i)}
                  className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs font-bold text-[#172554] dark:text-[#F1F5F9] hover:bg-[#DCE6F5]/50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] font-bold">
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

      {/* Section 5: Academic Demo Support Ticket Request */}
      <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-2">
            <Send className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
            Submit a Support or Feature Inquiry
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">
            Have questions regarding application algorithms or recommendations? Submit an inquiry to test persistence in the system database.
          </p>
        </div>

        {ticketResult && (
          <div className="p-4 rounded-2xl bg-[#3984F5]/10 border border-[#3984F5]/30 text-xs text-[#3984F5] dark:text-[#60A5FA] space-y-2">
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
          <div className="p-3 rounded-xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs flex items-center gap-2">
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
                placeholder="Rohan Sharma"
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
                placeholder="rohan@example.com"
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
              placeholder="e.g. Question about Ooty toy train transit timing"
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
              placeholder="Provide relevant details or inquiries..."
              required
              className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-7 py-3 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Saving to Database...' : 'Submit Support Inquiry'}</span>
          </button>
        </form>
      </div>

    </div>
  );
};
