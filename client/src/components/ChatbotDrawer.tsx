import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActiveTrip } from '../context/ActiveTripContext';
import { api } from '../api/client';
import { ChatMessage } from '../types';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ArrowRight,
  RefreshCw,
  Umbrella,
  DollarSign,
  Users,
  Compass,
  AlertTriangle
} from 'lucide-react';

interface ChatbotDrawerProps {
  onOpenAdaptive?: (scenario: string) => void;
}

export const ChatbotDrawer: React.FC<ChatbotDrawerProps> = ({ onOpenAdaptive }) => {
  const { isAuthenticated } = useAuth();
  const { activeTrip } = useActiveTrip();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [badgeText, setBadgeText] = useState('⚡ TravelWise AI Assistant');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && activeTrip?.id && isAuthenticated) {
      loadHistory();
    }
  }, [isOpen, activeTrip?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const loadHistory = async () => {
    if (!activeTrip?.id) return;
    try {
      const res = await api.getChatHistory(activeTrip.id);
      if (res.messages && res.messages.length > 0) {
        setMessages(res.messages);
      } else {
        // Welcome message
        setMessages([
          {
            role: 'assistant',
            message: `Hello! I'm your TravelWise AI+ Buddy for **${activeTrip.destination}**.\n\nI have live context of your ${activeTrip.currency} ${activeTrip.total_budget.toLocaleString()} budget and recorded expenses. How can I help you optimize your trip today?`,
          }
        ]);
      }
    } catch (err) {
      console.warn('Could not load chat history', err);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue.trim();
    if (!text || isLoading) return;

    if (!activeTrip?.id) {
      setMessages((prev) => [
        ...prev,
        { role: 'user', message: text },
        {
          role: 'assistant',
          message: 'Please create or select an active journey from your Dashboard first so I can assist with destination-specific context and budget intelligence!',
        }
      ]);
      setInputValue('');
      return;
    }

    const userMsg: ChatMessage = { role: 'user', message: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await api.askChatbot(activeTrip.id, text);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          message: res.reply,
          action_type: res.action_type,
          action_payload: res.action_payload,
        }
      ]);
      if (res.badge) {
        setBadgeText(res.badge);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          message: 'Sorry, I encountered a temporary connection issue. Please verify your network or try again.',
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (actionType?: string, payload?: any) => {
    if (actionType === 'trigger_adaptive') {
      const scenario = payload?.scenario || 'overspent';
      if (onOpenAdaptive) {
        onOpenAdaptive(scenario);
      } else {
        navigate('/itinerary');
      }
      setIsOpen(false);
    } else if (actionType === 'view_budget' || actionType === 'view_category') {
      navigate('/budget');
      setIsOpen(false);
    } else if (actionType === 'view_group_splitter') {
      navigate('/group-splitter');
      setIsOpen(false);
    } else if (actionType === 'replace_activity') {
      navigate('/itinerary');
      setIsOpen(false);
    }
  };

  // Quick questions chips
  const quickChips = [
    { label: 'Spending on Food?', query: 'How much did I spend on food?' },
    { label: 'Remaining Budget', query: 'What is my budget status and remaining funds?' },
    { label: 'Rain Forecast', query: 'It might rain tomorrow, suggest indoor alternatives' },
    { label: 'Only ₹1,000 Left', query: 'I have only ₹1,000 remaining, adjust my itinerary' },
    { label: 'Split Group Costs', query: 'Split our expenses among friends' },
    { label: 'Nature Spots', query: 'Suggest peaceful nature spots in the area' }
  ];

  if (!isAuthenticated) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 bg-gradient-to-r from-[#3984F5] via-[#F472B6] to-[#FACC15] text-white font-black px-4 py-3 rounded-full shadow-2xl shadow-[#3984F5]/30 hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none border border-white/30"
        >
          <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white animate-spin-slow" />
          </div>
          <span className="text-xs uppercase tracking-wider font-black pr-1">AI Travel Buddy</span>
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3984F5] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#FACC15] border-2 border-white"></span>
          </span>
        </button>
      )}

      {/* Expandable Chat Drawer Modal */}
      {isOpen && (
        <div className="w-[370px] sm:w-[430px] h-[600px] bg-white/95 dark:bg-[#121D33]/95 border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fadeIn backdrop-blur-2xl ring-1 ring-[#3984F5]/30 text-[#172554] dark:text-[#F1F5F9]">
          
          {/* Header */}
          <div className="bg-[#121D33] text-white p-4 border-b border-[#2A3A56] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-[#3984F5]/20 border border-[#3984F5]/40 flex items-center justify-center text-[#60A5FA] shadow-inner">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-white flex items-center gap-2">
                  AI Concierge & Guardian
                  <span className="text-[10px] bg-[#3984F5]/20 text-[#60A5FA] border border-[#3984F5]/40 px-2 py-0.2 rounded-full font-mono font-bold">
                    Live
                  </span>
                </h3>
                <p className="text-[11px] text-slate-300 truncate max-w-[240px]">
                  {activeTrip ? `Active: ${activeTrip.destination} (${activeTrip.currency} ${activeTrip.remaining_budget.toLocaleString()} left)` : 'No active trip selected'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Engine Mode Pill */}
          <div className="bg-[#F5F8FF] dark:bg-[#192640] px-4 py-1.5 text-[10px] text-[#64748B] dark:text-[#B6C2D6] border-b border-[#DCE6F5] dark:border-[#2A3A56] flex items-center justify-between">
            <span className="truncate flex items-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3984F5] animate-pulse"></span>
              {badgeText}
            </span>
            <span className="text-[#3984F5] dark:text-[#60A5FA] text-[10px] font-bold">Gemini + Context Engine</span>
          </div>

          {/* Message Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#F5F8FF]/50 dark:bg-[#0B1224]/80 text-xs">
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div key={idx} className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm ${
                    isUser ? 'bg-[#3984F5] text-white font-bold' : 'bg-white dark:bg-[#121D33] text-[#3984F5] dark:text-[#60A5FA] border border-[#DCE6F5] dark:border-[#2A3A56]'
                  }`}>
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div className={`max-w-[82%] rounded-2xl p-3.5 ${
                    isUser
                      ? 'bg-[#3984F5] text-white font-medium rounded-tr-none shadow-md shadow-[#3984F5]/20'
                      : 'bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] text-[#172554] dark:text-[#F1F5F9] rounded-tl-none shadow-sm'
                  }`}>
                    <div className="whitespace-pre-line leading-relaxed">
                      {m.message}
                    </div>

                    {/* Action Card inside assistant response */}
                    {m.action_type && (
                      <div className="mt-3 pt-2.5 border-t border-[#DCE6F5] dark:border-[#2A3A56] flex flex-col gap-1.5">
                        <button
                          onClick={() => handleActionClick(m.action_type, m.action_payload)}
                          className="w-full py-2 px-3 rounded-xl bg-[#3984F5]/10 hover:bg-[#3984F5]/20 text-[#3984F5] dark:text-[#60A5FA] border border-[#3984F5]/30 font-bold text-[11px] flex items-center justify-center gap-2 transition-all shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#3984F5] dark:text-[#60A5FA]" />
                          {m.action_type === 'trigger_adaptive' && 'Launch Adaptive Itinerary'}
                          {m.action_type === 'view_budget' && 'Open Budget Guardian'}
                          {m.action_type === 'view_category' && 'Inspect Category Breakdown'}
                          {m.action_type === 'view_group_splitter' && 'Calculate Group Splits'}
                          {m.action_type === 'replace_activity' && 'Swap with Budget Spot'}
                          {m.action_type === 'recommendations' && 'Explore Sights in Itinerary'}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2.5 text-[#64748B] dark:text-[#B6C2D6] text-xs py-2">
                <div className="w-7 h-7 rounded-xl bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] flex items-center justify-center animate-spin">
                  <RefreshCw className="w-3.5 h-3.5 text-[#3984F5] dark:text-[#60A5FA]" />
                </div>
                <span>Analyzing travel context & calculating adjustments...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div className="px-3.5 py-2 bg-[#F5F8FF] dark:bg-[#192640] border-t border-[#DCE6F5] dark:border-[#2A3A56] overflow-x-auto whitespace-nowrap flex gap-1.5 no-scrollbar">
            {quickChips.map((chip, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(chip.query)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white dark:bg-[#121D33] hover:bg-[#3984F5]/10 text-[#172554] dark:text-[#F1F5F9] hover:text-[#3984F5] dark:hover:text-[#60A5FA] text-[10px] font-semibold border border-[#DCE6F5] dark:border-[#2A3A56] transition-all shadow-sm"
              >
                <span>{chip.label}</span>
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-white dark:bg-[#121D33] border-t border-[#DCE6F5] dark:border-[#2A3A56] flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={activeTrip ? `Ask about ${activeTrip.destination} plans, budget...` : 'Select a trip to begin...'}
              disabled={isLoading}
              className="flex-1 bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl px-3.5 py-2.5 text-xs text-[#172554] dark:text-[#F1F5F9] placeholder-[#64748B] focus:outline-none focus:border-[#3984F5] dark:focus:border-[#60A5FA] transition-colors"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              className="w-10 h-10 rounded-2xl bg-[#3984F5] hover:bg-[#2563EB] disabled:opacity-40 text-white font-bold flex items-center justify-center transition-all shadow-md shadow-[#3984F5]/30"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
