import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  ArrowRight,
  MapPin,
  Calendar,
  DollarSign,
  CloudSun,
  ShieldCheck,
  Search,
  Sliders,
  ChevronDown
} from 'lucide-react';

export const CinematicHero: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  // Handle gentle pointer-based parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setMouseOffset({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/create-trip?destination=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/create-trip');
    }
  };

  const popularSuggestions = ['Munnar', 'Ooty', 'Goa', 'Jaipur', 'Manali', 'Paris', 'Hyderabad'];

  return (
    <div className="relative min-h-[85vh] lg:min-h-[92vh] flex items-center justify-center overflow-hidden rounded-3xl mx-4 sm:mx-6 lg:mx-8 my-4 border border-[#DCE6F5] dark:border-[#2A3A56] shadow-[0_30px_100px_rgba(23,37,84,0.15)] dark:shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
      
      {/* Layer 1: Photographic High-Res Landscape */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out will-change-transform scale-105"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1596401057633-54a8fe8ef647?auto=format&fit=crop&w=2200&q=85')`,
          transform: `translate(${mouseOffset.x * -12}px, ${mouseOffset.y * -12}px) scale(1.06)`
        }}
      />

      {/* Layer 2: Natural Sunlight and Atmospheric Cloud Gradient Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1224] via-[#0B1224]/65 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0B1224]/85 via-transparent to-[#0B1224]/75 pointer-events-none" />
      
      {/* Layer 3: Warm Sunlight Ray from Top Right */}
      <div
        className="absolute -top-24 -right-24 w-[600px] h-[600px] rounded-full pointer-events-none opacity-40 blur-3xl transition-transform duration-1000"
        style={{
          background: 'radial-gradient(circle, rgba(57, 132, 245, 0.35) 0%, rgba(244, 114, 182, 0.25) 50%, transparent 70%)',
          transform: `translate(${mouseOffset.x * 20}px, ${mouseOffset.y * 20}px)`
        }}
      />

      {/* Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16 text-center space-y-8 animate-fadeIn text-white">
        
        {/* Subtle Pill Tag */}
        <div className="inline-flex items-center gap-2.5 bg-[#121D33]/85 backdrop-blur-xl border border-[#3984F5]/40 px-4 py-1.5 rounded-full text-xs font-bold text-[#60A5FA] shadow-xl">
          <Sparkles className="w-4 h-4 text-[#FACC15]" />
          <span>Next-Gen Adaptive Travel Intelligence 2.0</span>
          <span className="w-1.5 h-1.5 rounded-full bg-[#3984F5] animate-pulse"></span>
        </div>

        {/* Cinematic Headline */}
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08] drop-shadow-2xl">
            Where Ambition Meets <br />
            <span className="bg-gradient-to-r from-[#3984F5] via-[#F472B6] to-[#FACC15] bg-clip-text text-transparent">
              Adaptive Intelligence
            </span>
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-slate-200/90 max-w-2xl mx-auto font-normal leading-relaxed drop-shadow-md">
            Plan realistic journeys that automatically re-calibrate when budgets tighten, mountain rains roll in, or group dynamics shift. Powered by live satellite weather and zero-deficit financial modeling.
          </p>
        </div>

        {/* Prominent Trip Planning Search Bar */}
        <div className="max-w-2xl mx-auto">
          <form
            onSubmit={handleSearchSubmit}
            className="bg-[#121D33]/90 backdrop-blur-2xl border border-white/20 p-2 sm:p-2.5 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center gap-2 group focus-within:border-[#3984F5] transition-all duration-300"
          >
            <div className="flex items-center gap-3 px-4 py-2 w-full flex-1">
              <MapPin className="w-5 h-5 text-[#3984F5] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Where to next? (e.g. Munnar, Ooty, Goa, Paris...)"
                className="w-full bg-transparent text-sm text-white placeholder-slate-300 focus:outline-none font-medium"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs shadow-xl shadow-[#3984F5]/30 hover:opacity-95 transition-all flex items-center justify-center gap-2 shrink-0 group-hover:scale-[1.02]"
            >
              <span>Plan My Journey</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </form>

          {/* Quick Suggestion Chips */}
          <div className="flex items-center justify-center gap-2 mt-3 flex-wrap text-xs text-slate-300">
            <span className="text-[11px] text-slate-300 font-semibold">Popular Inspirations:</span>
            {popularSuggestions.map((dest) => (
              <button
                key={dest}
                onClick={() => navigate(`/create-trip?destination=${encodeURIComponent(dest)}`)}
                className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-[11px] text-slate-200 hover:text-white hover:border-[#3984F5] transition-colors"
              >
                {dest}
              </button>
            ))}
          </div>
        </div>

        {/* 3 Value Proposition Metric Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto pt-4 text-left">
          <div className="bg-[#121D33]/85 backdrop-blur-xl border border-white/15 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-[#3984F5]/20 border border-[#3984F5]/30 flex items-center justify-center text-[#60A5FA] shrink-0">
              <CloudSun className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Live Satellite Weather</p>
              <p className="text-[10px] text-slate-300">Open-Meteo precipitation alerts</p>
            </div>
          </div>

          <div className="bg-[#121D33]/85 backdrop-blur-xl border border-white/15 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-[#F472B6]/20 border border-[#F472B6]/30 flex items-center justify-center text-[#F9A8D4] shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Three-Tier Budget Guard</p>
              <p className="text-[10px] text-slate-300">Actuals vs Future Commitments</p>
            </div>
          </div>

          <div className="bg-[#121D33]/85 backdrop-blur-xl border border-white/15 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-[#FACC15]/20 border border-[#FACC15]/30 flex items-center justify-center text-[#FDE047] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">100% Snapshot Undo</p>
              <p className="text-[10px] text-slate-300">Auditable, reversible changes</p>
            </div>
          </div>
        </div>

      </div>

      {/* Down arrow indicator to scroll */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-slate-300 animate-bounce">
        <ChevronDown className="w-5 h-5 opacity-80" />
      </div>

    </div>
  );
};
