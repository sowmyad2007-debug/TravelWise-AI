import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ShieldCheck, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-[#121D33] border-t border-[#DCE6F5] dark:border-[#2A3A56] text-[#64748B] dark:text-[#B6C2D6] text-xs py-12 mt-auto transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand Info */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#3984F5] via-[#F472B6] to-[#FACC15] flex items-center justify-center text-white font-black shadow-xs">
                <Compass className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-extrabold text-[#172554] dark:text-[#F1F5F9] text-base tracking-tight">
                TravelWise <span className="text-[#3984F5] dark:text-[#60A5FA]">AI+</span>
              </span>
            </div>
            <p className="text-[#64748B] dark:text-[#B6C2D6] leading-relaxed text-xs">
              Adaptive Travel Intelligence & Budget Guardian. Plan personalized journeys, protect your travel budget, and dynamically adapt when plans change.
            </p>
            <div className="flex items-center gap-1.5 text-[#3984F5] dark:text-[#60A5FA] font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#F472B6]" />
              <span>Full-Stack AI Capstone Project</span>
            </div>
          </div>

          {/* Quick Platform Links */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#172554] dark:text-[#F1F5F9] uppercase tracking-wider text-[11px]">Platform Core</h4>
            <ul className="space-y-1.5">
              <li><Link to="/dashboard" className="hover:text-[#3984F5] dark:hover:text-[#60A5FA] transition-colors">Personal Dashboard</Link></li>
              <li><Link to="/create-trip" className="hover:text-[#3984F5] dark:hover:text-[#60A5FA] transition-colors">Personalized Trip Planner</Link></li>
              <li><Link to="/itinerary" className="hover:text-[#3984F5] dark:hover:text-[#60A5FA] transition-colors">Adaptive Itinerary Engine</Link></li>
              <li><Link to="/budget" className="hover:text-[#3984F5] dark:hover:text-[#60A5FA] transition-colors">Smart Budget Guardian</Link></li>
              <li><Link to="/group-splitter" className="hover:text-[#3984F5] dark:hover:text-[#60A5FA] transition-colors">Group Expense Splitter</Link></li>
            </ul>
          </div>

          {/* Travel Assistance & Safety */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#172554] dark:text-[#F1F5F9] uppercase tracking-wider text-[11px]">Assistance & Safety</h4>
            <ul className="space-y-1.5">
              <li><Link to="/helper" className="hover:text-[#3984F5] dark:hover:text-[#60A5FA] transition-colors">Emergency Helplines (112 / 1363)</Link></li>
              <li><Link to="/helper" className="hover:text-[#3984F5] dark:hover:text-[#60A5FA] transition-colors">Official Tourism Boards</Link></li>
              <li><Link to="/helper" className="hover:text-[#3984F5] dark:hover:text-[#60A5FA] transition-colors">Local Language Phrasebooks</Link></li>
              <li><Link to="/helper" className="hover:text-[#3984F5] dark:hover:text-[#60A5FA] transition-colors">Travel Packing Checklist</Link></li>
            </ul>
          </div>

          {/* Trust, Disclaimers & Ethics */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#172554] dark:text-[#F1F5F9] uppercase tracking-wider text-[11px] flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
              Transparency & Accuracy
            </h4>
            <p className="text-[#64748B] dark:text-[#B6C2D6] text-[11px] leading-relaxed">
              TravelWise AI+ uses verified geographical coordinates, authentic landmark photographs, and predictive heuristics for financial planning.
            </p>
            <div className="bg-[#F5F8FF] dark:bg-[#192640] p-2.5 rounded-xl border border-[#DCE6F5] dark:border-[#2A3A56] text-[11px] text-[#64748B] dark:text-[#B6C2D6] shadow-xs">
              <span className="font-bold text-[#172554] dark:text-[#F1F5F9]">Emergency Hotline: </span>
              <span className="text-[#3984F5] dark:text-[#60A5FA] font-mono font-bold">112 / 100</span> (Police), <span className="text-[#3984F5] dark:text-[#60A5FA] font-mono font-bold">1363</span> (Tourist Helpline).
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#DCE6F5] dark:border-[#2A3A56] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#64748B] dark:text-[#B6C2D6]">
          <p>© {new Date().getFullYear()} TravelWise AI+ — Engineered with React, TypeScript, Tailwind CSS & Python Flask.</p>
          <div className="flex items-center gap-3">
            <span>Verified 3D Travel Platform</span>
            <span>•</span>
            <span className="text-[#3984F5] dark:text-[#60A5FA] font-semibold">Adaptive Intelligence 2.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
