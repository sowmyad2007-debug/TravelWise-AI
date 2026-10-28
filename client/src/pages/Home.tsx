import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Hero3DScene } from '../components/Hero3DScene';
import { Globe3D } from '../components/Globe3D';
import {
  Compass,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  PieChart,
  Bot,
  Users,
  MapPin,
  Calendar,
  DollarSign,
  Umbrella,
  CheckCircle2,
  Sliders,
  TrendingDown,
  CloudRain,
  ChevronRight,
  Globe,
  Layers,
  RotateCcw,
  Zap,
  TrendingUp,
  Award
} from 'lucide-react';

export const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Interactive Adaptive Planning Simulator State
  const [simBudget, setSimBudget] = useState(8000);
  const [simRain, setSimRain] = useState(false);

  // Compute live simulated itinerary based on slider & rain toggle
  const getSimulatedItinerary = () => {
    if (simRain) {
      return {
        morning: { name: 'Nilgiri Heritage Museum & Toda Art', cost: '₹30', icon: '🏛️', tag: 'Sheltered Indoor Gallery' },
        afternoon: { name: 'Highfield Orthodox Tea Factory & Tasting', cost: '₹250', icon: '🍵', tag: 'Covered Tea Production' },
        evening: { name: 'Charing Cross Covered Chocolate Arcade', cost: 'FREE', icon: '🍫', tag: 'Covered Street Arcade' },
        savings: 'Weather-Proofed: 100% sheltered stops, zero rain cancellation risk'
      };
    } else if (simBudget <= 5000) {
      return {
        morning: { name: 'Doddabetta Pine Forest Walking Trail', cost: 'FREE', icon: '🌲', tag: 'Scenic Viewpoint' },
        afternoon: { name: 'Ooty Botanical Terraced Gardens', cost: '₹50', icon: '🌺', tag: 'Heritage Garden' },
        evening: { name: 'Tibetan Market Walk & Local Street Snacks', cost: 'FREE', icon: '🥟', tag: 'Budget Culture Walk' },
        savings: 'Budget Cut: Saves ₹650/day vs premium admissions'
      };
    } else {
      return {
        morning: { name: 'Nilgiri Mountain Railway Toy Train Ride', cost: '₹250', icon: '🚂', tag: 'UNESCO World Heritage' },
        afternoon: { name: 'Ooty Lake Boating & Lakeside Park', cost: '₹150', icon: '🛶', tag: 'Outdoor Boating' },
        evening: { name: 'Old Town Heritage Cafe & Dinner', cost: '₹300', icon: '☕', tag: 'Balanced Dining' },
        savings: 'Balanced Standard Plan: Optimal sights & relaxation'
      };
    }
  };

  const simPlan = getSimulatedItinerary();

  return (
    <div className="space-y-20 sm:space-y-28 pb-20 overflow-x-hidden text-[#172554] dark:text-[#F1F5F9]">
      
      {/* 1. 3D ANIMATED TRAVEL HERO (Interactive Earth, Flight Path & Expense Badges) */}
      <section className="w-full">
        <Hero3DScene />
      </section>

      {/* 2. REALISTIC 3D PLANETARY NAVIGATOR & DESTINATION EXPLORER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#3984F5]/10 border border-[#3984F5]/30 px-3.5 py-1 rounded-full text-xs font-bold text-[#3984F5] dark:text-[#60A5FA]">
            <Globe className="w-3.5 h-3.5" />
            <span>Interactive 3D Planetary Discovery</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-[#172554] dark:text-[#F1F5F9] tracking-tight">
            Spin the Globe. Discover Your Next Horizon.
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#B6C2D6] max-w-xl mx-auto">
            Interact with our Three.js digital globe to explore hand-curated mountain escapes, coastal havens, and cultural capitals with transparent budget estimates.
          </p>
        </div>

        <Globe3D />
      </section>

      {/* 3. INTERACTIVE ADAPTIVE PLANNING SIMULATOR SANDBOX */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-10 shadow-xl backdrop-blur-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCE6F5] dark:border-[#2A3A56] pb-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold text-[#3984F5] dark:text-[#60A5FA] uppercase tracking-wider">
                <Sliders className="w-4 h-4" />
                <span>Live Adaptive Simulator Sandbox</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-[#172554] dark:text-[#F1F5F9] mt-1">
                Experience Dynamic Schedule Re-optimization
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">
                Drag the budget slider or simulate mountain precipitation to watch how our multi-factor engine automatically recalibrates.
              </p>
            </div>

            <button
              onClick={() => setSimRain(!simRain)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shrink-0 ${
                simRain
                  ? 'bg-[#3984F5] text-white shadow-md shadow-[#3984F5]/25'
                  : 'bg-[#F5F8FF] dark:bg-[#192640] text-[#172554] dark:text-[#F1F5F9] hover:bg-[#DCE6F5] dark:hover:bg-[#2A3A56] border border-[#DCE6F5] dark:border-[#2A3A56]'
              }`}
            >
              <CloudRain className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
              <span>{simRain ? 'Rain Simulation Active' : 'Simulate Rain Forecast'}</span>
            </button>
          </div>

          {/* Slider for Budget */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#64748B] dark:text-[#B6C2D6] font-semibold">Simulated Budget Constraint:</span>
              <span className="font-bold text-[#3984F5] dark:text-[#60A5FA] font-mono text-sm">₹{simBudget.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min="3000"
              max="15000"
              step="1000"
              value={simBudget}
              onChange={(e) => setSimBudget(parseInt(e.target.value, 10))}
              className="w-full accent-[#3984F5] cursor-pointer h-2 bg-slate-200 dark:bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] text-[#64748B] dark:text-[#B6C2D6]">
              <span>₹3,000 (Tight Budget)</span>
              <span>₹8,000 (Balanced Baseline)</span>
              <span>₹15,000 (Comfort Tier)</span>
            </div>
          </div>

          {/* Live Adaptive Schedule Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            <div className="bg-[#F5F8FF]/80 dark:bg-[#192640]/60 p-5 rounded-2xl border border-[#DCE6F5] dark:border-[#2A3A56] space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#B6C2D6]">
                <span className="font-semibold">Morning (09:30 AM)</span>
                <span className="font-mono text-[#3984F5] dark:text-[#60A5FA] font-bold">{simPlan.morning.cost}</span>
              </div>
              <p className="text-xs font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-1.5 truncate">
                <span>{simPlan.morning.icon}</span>
                <span className="truncate">{simPlan.morning.name}</span>
              </p>
              <span className="text-[10px] text-[#3984F5] dark:text-[#60A5FA] font-bold bg-[#3984F5]/10 px-2 py-0.5 rounded-full inline-block">
                {simPlan.morning.tag}
              </span>
            </div>

            <div className="bg-[#F5F8FF]/80 dark:bg-[#192640]/60 p-5 rounded-2xl border border-[#DCE6F5] dark:border-[#2A3A56] space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#B6C2D6]">
                <span className="font-semibold">Afternoon (02:00 PM)</span>
                <span className="font-mono text-[#3984F5] dark:text-[#60A5FA] font-bold">{simPlan.afternoon.cost}</span>
              </div>
              <p className="text-xs font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-1.5 truncate">
                <span>{simPlan.afternoon.icon}</span>
                <span className="truncate">{simPlan.afternoon.name}</span>
              </p>
              <span className="text-[10px] text-[#F472B6] dark:text-[#F9A8D4] font-bold bg-[#F472B6]/10 px-2 py-0.5 rounded-full inline-block">
                {simPlan.afternoon.tag}
              </span>
            </div>

            <div className="bg-[#F5F8FF]/80 dark:bg-[#192640]/60 p-5 rounded-2xl border border-[#DCE6F5] dark:border-[#2A3A56] space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#B6C2D6]">
                <span className="font-semibold">Evening (06:00 PM)</span>
                <span className="font-mono text-[#3984F5] dark:text-[#60A5FA] font-bold">{simPlan.evening.cost}</span>
              </div>
              <p className="text-xs font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-1.5 truncate">
                <span>{simPlan.evening.icon}</span>
                <span className="truncate">{simPlan.evening.name}</span>
              </p>
              <span className="text-[10px] text-[#B45309] dark:text-[#FDE047] font-bold bg-[#FACC15]/20 px-2 py-0.5 rounded-full inline-block">
                {simPlan.evening.tag}
              </span>
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-[#3984F5]/10 via-[#F472B6]/10 to-[#FACC15]/10 border border-[#3984F5]/30 rounded-2xl text-xs text-[#172554] dark:text-[#F1F5F9] font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
              <span>{simPlan.savings}</span>
            </span>
            <Link
              to="/create-trip"
              className="text-xs font-bold text-[#3984F5] dark:text-[#60A5FA] hover:underline flex items-center gap-1"
            >
              <span>Build Real Trip</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 4. THE 4 PILLARS OF TRAVELWISE AI+ 2.0 */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#F472B6]/15 border border-[#F472B6]/30 px-3.5 py-1 rounded-full text-xs font-bold text-[#BE185D] dark:text-[#F9A8D4]">
            <Award className="w-3.5 h-3.5" />
            <span>Architecture & Core Pillars</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-[#172554] dark:text-[#F1F5F9] tracking-tight">
            Engineered for Real-World Travel Dynamics
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#B6C2D6] max-w-xl mx-auto">
            Unlike static PDF planners, TravelWise AI+ treats travel as a dynamic multi-variable optimization problem.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Pillar 1 */}
          <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-xl hover:border-[#3984F5] dark:hover:border-[#60A5FA] transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-[#3984F5]/10 border border-[#3984F5]/30 flex items-center justify-center text-[#3984F5] dark:text-[#60A5FA]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9]">Adaptive Travel Intelligence</h3>
            <p className="text-xs text-[#64748B] dark:text-[#B6C2D6] leading-relaxed">
              Real-time multi-constraint evaluation matrix weighing interest match, remaining cash reserves, live Open-Meteo weather, and transit hours.
            </p>
            <div className="pt-2 text-[11px] font-bold text-[#3984F5] dark:text-[#60A5FA]">
              • 4-Factor Transparent Scoring
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-xl hover:border-[#F472B6] dark:hover:border-[#F9A8D4] transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-[#F472B6]/15 border border-[#F472B6]/30 flex items-center justify-center text-[#BE185D] dark:text-[#F9A8D4]">
              <PieChart className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9]">Three-Tier Budget Guard</h3>
            <p className="text-xs text-[#64748B] dark:text-[#B6C2D6] leading-relaxed">
              Separates verified actual ledger transactions from planned targets and unvisited commitments. Proactively projects final spend and burn rates.
            </p>
            <div className="pt-2 text-[11px] font-bold text-[#BE185D] dark:text-[#F9A8D4]">
              • Zero-Deficit Projections
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-xl hover:border-[#FACC15] dark:hover:border-[#FDE047] transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-[#FACC15]/20 border border-[#FACC15]/40 flex items-center justify-center text-[#B45309] dark:text-[#FDE047]">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9]">Group Debt Optimizer</h3>
            <p className="text-xs text-[#64748B] dark:text-[#B6C2D6] leading-relaxed">
              Solves multi-party expense webs using the Minimum Cash Flow algorithm with mathematical zero-sum verification (Σ balances = 0.00).
            </p>
            <div className="pt-2 text-[11px] font-bold text-[#B45309] dark:text-[#FDE047]">
              • Invariant Reconciled
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-xl hover:border-[#3984F5] dark:hover:border-[#60A5FA] transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-[#3984F5]/10 border border-[#3984F5]/30 flex items-center justify-center text-[#3984F5] dark:text-[#60A5FA]">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9]">100% Snapshot Undo</h3>
            <p className="text-xs text-[#64748B] dark:text-[#B6C2D6] leading-relaxed">
              Every autonomous adaptation preserves an immutable JSON snapshot of your exact itinerary. Roll back any adaptation with a single click.
            </p>
            <div className="pt-2 text-[11px] font-bold text-[#3984F5] dark:text-[#60A5FA]">
              • Auditable Revision History
            </div>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-[#F5F8FF] via-white to-[#F5F8FF] dark:from-[#121D33] dark:via-[#121D33] dark:to-[#192640] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-8 sm:p-14 text-center space-y-6 relative overflow-hidden shadow-xl shadow-slate-200/40 dark:shadow-black/40">
          <div className="absolute right-0 top-0 w-96 h-96 bg-[#3984F5]/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute left-0 bottom-0 w-96 h-96 bg-[#F472B6]/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="max-w-2xl mx-auto space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#3984F5]/10 border border-[#3984F5]/30 text-xs font-bold text-[#3984F5] dark:text-[#60A5FA]">
              <Sparkles className="w-3.5 h-3.5 text-[#FACC15]" />
              <span>Smart Travel Finance</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-[#172554] dark:text-[#F1F5F9] tracking-tight">
              Ready to Experience Intelligent Travel Planning?
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#B6C2D6]">
              Start with our verified journeys across India and the globe or create your own custom multi-day itinerary in seconds.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link
              to="/create-trip"
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs shadow-lg shadow-[#3984F5]/25 transition-all flex items-center justify-center gap-2"
            >
              <span>Design Your Trip Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            {!isAuthenticated && (
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white dark:bg-[#192640] hover:bg-[#F5F8FF] dark:hover:bg-[#192640]/80 text-[#172554] dark:text-[#F1F5F9] font-bold text-xs border border-[#DCE6F5] dark:border-[#2A3A56] shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <span>Log In with Demo Account</span>
              </Link>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};
