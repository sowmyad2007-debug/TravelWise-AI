import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useActiveTrip } from '../context/ActiveTripContext';
import { api } from '../api/client';
import { ItineraryActivity } from '../types';
import { AdaptiveModal } from '../components/AdaptiveModal';
import { DestinationImage, normalizeImageUrl } from '../components/DestinationImage';
import { normalizeMatchScore } from '../utils/formatters';
import {
  Clock,
  MapPin,
  Sparkles,
  Plus,
  Trash2,
  Edit2,
  ArrowRightLeft,
  Navigation,
  AlertCircle,
  Umbrella,
  DollarSign,
  Info,
  X,
  CloudSun,
  CloudRain,
  History,
  ShieldAlert,
  Car,
  Compass,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

const getCategoryBadgeClass = (category: string) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('nature') || cat.includes('outdoor') || cat.includes('beach')) {
    return 'bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] border border-[#3984F5]/25';
  }
  if (cat.includes('history') || cat.includes('heritage') || cat.includes('culture') || cat.includes('temple')) {
    return 'bg-[#F472B6]/10 text-[#DB2777] dark:text-[#F9A8D4] border border-[#F472B6]/25';
  }
  if (cat.includes('food') || cat.includes('dining') || cat.includes('culinary')) {
    return 'bg-[#FACC15]/20 text-[#B45309] dark:text-[#FDE047] border border-[#FACC15]/35';
  }
  if (cat.includes('shopping') || cat.includes('market')) {
    return 'bg-[#F472B6]/10 text-[#DB2777] dark:text-[#F9A8D4] border border-[#F472B6]/25';
  }
  if (cat.includes('relaxation') || cat.includes('wellness')) {
    return 'bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] border border-[#3984F5]/25';
  }
  return 'bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] border border-[#3984F5]/25';
};

const ActivityThumbnail: React.FC<{
  imageUrl?: string;
  name: string;
  category: string;
  attribution?: string;
}> = ({ imageUrl, name, category, attribution }) => {
  return (
    <div className="relative w-full md:w-52 h-44 md:h-auto rounded-2xl overflow-hidden bg-[#F5F8FF] dark:bg-[#0B1224] shrink-0 border border-[#DCE6F5] dark:border-[#2A3A56] flex items-center justify-center group shadow-xs">
      <DestinationImage
        src={imageUrl}
        alt={name}
        fallbackCategory={category}
        fallbackText={name}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B1224]/85 via-transparent to-transparent pointer-events-none" />
      <span className={`absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider shadow-xs z-10 ${getCategoryBadgeClass(category)}`}>
        {category}
      </span>
      {attribution && (
        <span
          title={attribution}
          className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-[#0B1224]/80 backdrop-blur-sm text-[9px] text-slate-200 truncate max-w-[120px] pointer-events-none z-10"
        >
          Photo
        </span>
      )}
    </div>
  );
};

export const ItineraryView: React.FC = () => {
  const { activeTrip, refreshTrip } = useActiveTrip();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isAdaptiveOpen, setIsAdaptiveOpen] = useState(false);
  const [adaptiveScenario, setAdaptiveScenario] = useState('overspent');

  // Modals state
  const [editingActivity, setEditingActivity] = useState<ItineraryActivity | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newActivityData, setNewActivityData] = useState({
    name: '',
    description: '',
    category: 'sightseeing',
    time_slot: '10:00 AM - 12:00 PM',
    duration_hours: 2,
    estimated_entry_cost: 50,
    estimated_transport_cost: 50,
    interest_match_reason: 'Custom activity',
    opening_hours: '09:00 - 18:00',
    weather_suitability: 'all-weather',
    transit_time_mins: 15
  });

  if (!activeTrip) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4 animate-fadeIn">
        <div className="w-16 h-16 rounded-3xl bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] flex items-center justify-center mx-auto shadow-xs">
          <Compass className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-[#172554] dark:text-[#F1F5F9]">No active trip selected</h2>
        <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#B6C2D6] max-w-md mx-auto">
          Please select a journey from your Dashboard or plan a new trip to view its sequential day-by-day travel magazine itinerary.
        </p>
        <Link
          to="/create-trip"
          className="inline-block px-6 py-3 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs shadow-sm transition-all"
        >
          Plan New Journey
        </Link>
      </div>
    );
  }

  const days = activeTrip.days || [];
  const activeDay = days[selectedDayIndex] || days[0];

  const handleDeleteActivity = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this activity from your itinerary?')) return;
    try {
      await api.deleteActivity(id);
      await refreshTrip();
    } catch (err: any) {
      alert(err.message || 'Failed to remove activity.');
    }
  };

  const handleQuickReplace = async (activity: ItineraryActivity, type: string) => {
    try {
      await api.replaceActivity(activity.id, {
        type,
        current_name: activity.name,
      });
      await refreshTrip();
    } catch (err: any) {
      alert(err.message || 'Failed to replace activity.');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity) return;
    try {
      await api.updateActivity(editingActivity.id, editingActivity);
      setEditingActivity(null);
      await refreshTrip();
    } catch (err: any) {
      alert(err.message || 'Failed to update activity.');
    }
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDay) return;
    try {
      await api.addActivity(activeDay.id, newActivityData);
      setIsAddModalOpen(false);
      setNewActivityData({
        name: '',
        description: '',
        category: 'sightseeing',
        time_slot: '10:00 AM - 12:00 PM',
        duration_hours: 2,
        estimated_entry_cost: 50,
        estimated_transport_cost: 50,
        interest_match_reason: 'Custom activity',
        opening_hours: '09:00 - 18:00',
        weather_suitability: 'all-weather',
        transit_time_mins: 15
      });
      await refreshTrip();
    } catch (err: any) {
      alert(err.message || 'Failed to add activity.');
    }
  };

  const openAdaptiveWithScenario = (sc: string) => {
    setAdaptiveScenario(sc);
    setIsAdaptiveOpen(true);
  };

  const weather = activeTrip.weather;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* 1. CINEMATIC DESTINATION HEADER BANNER */}
      <div className="relative rounded-3xl overflow-hidden border border-[#DCE6F5] dark:border-[#2A3A56] shadow-sm p-6 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 bg-[#121D33] text-white">
        
        {/* Photographic Backdrop */}
        {activeTrip.cover_image && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{
              backgroundImage: `url('${normalizeImageUrl(activeTrip.cover_image) || activeTrip.cover_image}')`
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#121D33] via-[#121D33]/90 to-[#0B1224]/85 pointer-events-none" />
        <div className="absolute -right-10 -top-10 w-96 h-96 bg-[#3984F5]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header Text & Live Metadata */}
        <div className="space-y-3 relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3.5 py-1 rounded-full bg-[#3984F5]/20 border border-[#3984F5]/40 text-[#60A5FA] font-bold text-xs flex items-center gap-1.5 shadow-xs">
              <MapPin className="w-3.5 h-3.5" />
              {activeTrip.starting_city} → {activeTrip.destination}
            </span>
            <span className="px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-slate-200 font-semibold text-xs border border-white/15">
              {days.length} Days Schedule
            </span>
            {weather && (
              <span className={`px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border shadow-xs ${
                weather.has_precipitation_risk || weather.is_raining
                  ? 'bg-[#EF4444]/20 border-[#EF4444]/40 text-[#FCA5A5]'
                  : 'bg-[#3984F5]/20 border-[#3984F5]/40 text-[#60A5FA]'
              }`}>
                {weather.has_precipitation_risk || weather.is_raining ? (
                  <CloudRain className="w-3.5 h-3.5 text-[#FCA5A5]" />
                ) : (
                  <CloudSun className="w-3.5 h-3.5 text-[#60A5FA]" />
                )}
                <span>Satellite: {weather.temperature_c}°C, {weather.condition}</span>
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-xs">
            {activeTrip.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 pt-1">
            <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              Total Budget: <span className="font-bold text-white">{activeTrip.currency} {activeTrip.total_budget.toLocaleString()}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              Spent: <span className="font-bold text-[#60A5FA]">{activeTrip.currency} {activeTrip.total_spent.toLocaleString()}</span>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
              Remaining: <span className="font-bold text-[#F9A8D4]">{activeTrip.currency} {activeTrip.remaining_budget.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Adaptive Travel Intelligence Quick Triggers */}
        <div className="bg-[#192640]/90 backdrop-blur-xl p-5 rounded-3xl border border-[#3984F5]/30 flex flex-col gap-3 shrink-0 w-full lg:w-auto relative z-10 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Sparkles className="w-4 h-4 text-[#FACC15]" />
              <span>Adaptive Intelligence 2.0</span>
            </div>
            <button
              onClick={() => {
                setIsAdaptiveOpen(true);
              }}
              className="text-[11px] text-[#60A5FA] hover:text-white flex items-center gap-1 font-semibold transition-colors"
            >
              <History className="w-3.5 h-3.5" />
              <span>History & Undo</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => {
                openAdaptiveWithScenario('overspent');
              }}
              className="px-3.5 py-2 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Budget Cut</span>
            </button>
            <button
              onClick={() => {
                openAdaptiveWithScenario('rain');
              }}
              className="px-3.5 py-2 rounded-xl bg-[#121D33] hover:bg-[#192640] text-[#60A5FA] font-semibold text-xs flex items-center gap-1.5 border border-[#60A5FA]/40 transition-all shadow-xs"
            >
              <Umbrella className="w-3.5 h-3.5 text-[#60A5FA]" />
              <span>Rain Adapt</span>
            </button>
            <button
              onClick={() => {
                openAdaptiveWithScenario('shorter_hours');
              }}
              className="px-3.5 py-2 rounded-xl bg-[#121D33] hover:bg-[#192640] text-[#F9A8D4] font-semibold text-xs flex items-center gap-1.5 border border-[#F9A8D4]/40 transition-all shadow-xs"
            >
              <Clock className="w-3.5 h-3.5 text-[#F9A8D4]" />
              <span>Time Tight</span>
            </button>
          </div>
        </div>
      </div>

      {/* Seasonal Pilgrimage Advisory Banner */}
      {activeTrip.seasonal_advisory && (
        <div className="bg-[#FACC15]/15 border border-[#FACC15]/40 rounded-2xl p-4 flex items-start gap-3 text-xs text-[#172554] dark:text-[#F1F5F9] shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-[#B45309] dark:text-[#FDE047] mt-0.5" />
          <div>
            <span className="font-bold text-[#B45309] dark:text-[#FDE047] block mb-0.5">
              Official Pilgrimage & Seasonal Timings Advisory
            </span>
            <span className="text-[#64748B] dark:text-[#B6C2D6] leading-relaxed">
              {activeTrip.seasonal_advisory}
            </span>
          </div>
        </div>
      )}

      {/* Weather Alert Notification Banner if Rain Detected */}
      {(weather?.has_precipitation_risk || weather?.is_raining) && (
        <div className="bg-[#FACC15]/15 dark:bg-[#121D33] border border-[#FACC15]/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#172554] dark:text-[#F1F5F9] shadow-xs">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 shrink-0 text-[#B45309] dark:text-[#FDE047]" />
            <div>
              <span className="font-bold text-[#B45309] dark:text-[#FDE047]">Live Weather Advisory ({weather.source}):</span>
              <span className="ml-1 text-[#64748B] dark:text-[#B6C2D6]">
                Precipitation detected in {activeTrip.destination}. Outdoor activities can be automatically swapped for covered museums and indoor cultural venues.
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              openAdaptiveWithScenario('rain');
            }}
            className="px-4 py-2 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs shrink-0 transition-opacity shadow-xs"
          >
            Auto-Swap Outdoor Stops
          </button>
        </div>
      )}

      {/* Day Selector Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#DCE6F5] dark:border-[#2A3A56] no-scrollbar">
        {days.map((day, idx) => (
          <button
            key={day.id}
            onClick={() => setSelectedDayIndex(idx)}
            className={`px-5 py-3 rounded-2xl text-xs font-bold shrink-0 transition-all flex items-center gap-2 ${
              selectedDayIndex === idx
                ? 'bg-[#3984F5] text-white dark:bg-[#60A5FA] dark:text-[#0B1224] shadow-xs'
                : 'bg-white dark:bg-[#121D33] text-[#64748B] dark:text-[#B6C2D6] hover:text-[#172554] dark:hover:text-[#F1F5F9] border border-[#DCE6F5] dark:border-[#2A3A56]'
            }`}
          >
            <span>Day {day.day_number}</span>
            <span className={`text-[10px] font-normal ${selectedDayIndex === idx ? 'text-white/90 dark:text-[#0B1224]/80 font-medium' : 'text-[#64748B] dark:text-[#B6C2D6]'}`}>
              ({day.date})
            </span>
          </button>
        ))}
      </div>

      {/* 2. REFINED VERTICAL TRAVEL TIMELINE WITH LUXURY ACTIVITY CARDS */}
      {activeDay && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#172554] dark:text-[#F1F5F9] flex items-center gap-2">
                <span>{activeDay.title}</span>
                <span className="text-xs text-[#3984F5] dark:text-[#60A5FA] font-bold">({activeDay.activities?.length || 0} stops planned)</span>
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">Sequential travel timeline optimized for route transit and opening hours.</p>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#121D33] hover:bg-[#F5F8FF] dark:hover:bg-[#192640] text-[#3984F5] dark:text-[#60A5FA] font-bold text-xs border border-[#DCE6F5] dark:border-[#2A3A56] flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
              <span>Add Custom Stop</span>
            </button>
          </div>

          {/* Activities Vertical Timeline List */}
          {(!activeDay.activities || activeDay.activities.length === 0) ? (
            <div className="p-12 text-center bg-white dark:bg-[#121D33] rounded-3xl border border-[#DCE6F5] dark:border-[#2A3A56] text-[#64748B] dark:text-[#B6C2D6] text-xs shadow-xs">
              No activities planned for this day yet. Click "Add Custom Stop" or launch Adaptive Intelligence to auto-populate this day.
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-10 space-y-6">
              
              {/* Continuous Vertical Timeline Stem */}
              <div className="absolute top-4 bottom-4 left-3 sm:left-5 w-0.5 bg-gradient-to-b from-[#3984F5] via-[#F472B6] to-[#FACC15] pointer-events-none" />

              {activeDay.activities.map((act, actIdx) => {
                const matchPct = normalizeMatchScore(act.match_score);

                return (
                  <div key={act.id} className="relative group">
                    
                    {/* Sequence Node on the Timeline Stem */}
                    <div className="absolute -left-6 sm:-left-10 top-6 -translate-x-1/2 w-8 h-8 rounded-full bg-[#3984F5] text-white border-2 border-white dark:border-[#0B1224] flex items-center justify-center text-xs font-black shadow-xs z-10">
                      {actIdx + 1}
                    </div>

                    {/* Activity Card */}
                    <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] hover:border-[#3984F5]/50 rounded-3xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col md:flex-row gap-5">
                      
                      {/* Left: Authentic Attraction Photo or Clean Fallback */}
                      <ActivityThumbnail
                        imageUrl={act.image_url}
                        name={act.name}
                        category={act.category}
                        attribution={act.photo_attribution}
                      />

                      {/* Right: Activity Details & Controls */}
                      <div className="flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="text-base sm:text-lg font-black text-[#172554] dark:text-[#F1F5F9]">
                                {act.name}
                              </h3>
                              {matchPct !== null && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] border border-[#3984F5]/30 flex items-center gap-1">
                                  <Sparkles className="w-2.5 h-2.5 text-[#F472B6]" />
                                  {matchPct}% Match
                                </span>
                              )}
                              {act.verification_status === 'verified' && (
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] border border-[#3984F5]/30 flex items-center gap-1">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-[#3984F5] dark:text-[#60A5FA]" />
                                  Verified Landmark
                                </span>
                              )}
                              {act.verification_status === 'scheduled_break' && (
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#DCE6F5]/50 dark:bg-[#192640] text-[#64748B] dark:text-[#B6C2D6] border border-[#DCE6F5] dark:border-[#2A3A56] flex items-center gap-1">
                                  Personal Leisure Break
                                </span>
                              )}
                              {act.verification_status === 'unverified_estimate' && (
                                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#FACC15]/20 text-[#B45309] dark:text-[#FDE047] border border-[#FACC15]/30 flex items-center gap-1">
                                  Estimated Landmark
                                </span>
                              )}
                            </div>

                            {/* Estimated Costs Pill */}
                            <div className="flex items-center gap-2 text-xs shrink-0">
                              <div className="bg-[#F5F8FF] dark:bg-[#0B1224] px-3 py-1 rounded-xl border border-[#DCE6F5] dark:border-[#2A3A56] text-right">
                                <span className="text-[9px] block text-[#64748B] dark:text-[#B6C2D6]">Entry</span>
                                <span className="font-bold text-[#3984F5] dark:text-[#60A5FA]">
                                  {act.estimated_entry_cost === 0 ? 'FREE' : `${activeTrip.currency} ${act.estimated_entry_cost}`}
                                </span>
                              </div>
                              <div className="bg-[#F5F8FF] dark:bg-[#0B1224] px-3 py-1 rounded-xl border border-[#DCE6F5] dark:border-[#2A3A56] text-right">
                                <span className="text-[9px] block text-[#64748B] dark:text-[#B6C2D6]">Transit</span>
                                <span className="font-bold text-[#F472B6] dark:text-[#F9A8D4]">
                                  {activeTrip.currency} {act.estimated_transport_cost}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Metadata chips: Time slot, transit duration, opening hours, official source */}
                          <div className="text-xs text-[#64748B] dark:text-[#B6C2D6] flex flex-wrap items-center gap-3 mt-1.5">
                            <span className="flex items-center gap-1 font-medium">
                              <Clock className="w-3.5 h-3.5 text-[#64748B] dark:text-[#B6C2D6]" />
                              {act.time_slot} ({act.duration_hours} hrs)
                            </span>
                            {act.transit_time_mins && (
                              <span className="flex items-center gap-1">
                                <Car className="w-3.5 h-3.5 text-[#64748B] dark:text-[#B6C2D6]" />
                                ~{act.transit_time_mins} mins transit
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#3984F5]"></span>
                              Open: {act.opening_hours || 'Check current opening hours'}
                            </span>
                            {act.source_url && (
                              <a
                                href={act.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[11px] text-[#3984F5] dark:text-[#60A5FA] hover:underline flex items-center gap-1 font-bold"
                                title="Official Tourism / Heritage Source"
                              >
                                <span>Official Source</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>

                          <p className="text-xs text-[#64748B] dark:text-[#B6C2D6] leading-relaxed mt-2.5">
                            {act.description}
                          </p>
                        </div>

                        {/* Footer Rationale & Functional Action Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#DCE6F5] dark:border-[#2A3A56] text-xs">
                          <div className="flex items-center gap-1.5 text-[#3984F5] dark:text-[#60A5FA] text-[11px] font-semibold">
                            <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#F472B6]" />
                            <span>{act.interest_match_reason || 'Matches your travel interests.'}</span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Functional Google Maps Link */}
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(act.map_query || `${act.name}, ${activeTrip.destination}`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-[#3984F5]/10 hover:bg-[#3984F5]/20 text-[#3984F5] dark:text-[#60A5FA] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                              title="Directions on Google Maps"
                            >
                              <Navigation className="w-3.5 h-3.5 text-[#3984F5] dark:text-[#60A5FA]" />
                              <span>Map / Route</span>
                            </a>

                            {/* Cheaper spot swap */}
                            <button
                              onClick={() => handleQuickReplace(act, 'cheaper')}
                              className="px-3 py-1.5 rounded-xl bg-[#FACC15]/15 hover:bg-[#FACC15]/25 text-[#B45309] dark:text-[#FDE047] text-xs font-bold flex items-center gap-1.5 transition-colors"
                              title="Swap with Cheaper Option"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5 text-[#FACC15]" />
                              <span>Cheaper Spot</span>
                            </button>

                            {/* Edit details */}
                            <button
                              onClick={() => setEditingActivity(act)}
                              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172554] dark:hover:text-white hover:bg-[#F5F8FF] dark:hover:bg-[#192640] transition-colors"
                              title="Edit Details"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Remove stop */}
                            <button
                              onClick={() => handleDeleteActivity(act.id)}
                              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                              title="Remove Activity"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Transparency Disclaimer Banner */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] text-[#64748B] dark:text-[#B6C2D6] text-xs flex items-center gap-3 shadow-xs">
        <Info className="w-5 h-5 text-[#3984F5] dark:text-[#60A5FA] shrink-0" />
        <p className="leading-relaxed">
          <strong className="text-[#172554] dark:text-[#F1F5F9]">Cost Transparency Guarantee:</strong> All attraction admission prices and transit estimates are calculated algorithmically based on official local tariffs and verified open data. Real-time satellite weather provided by Open-Meteo.
        </p>
      </div>

      {/* Adaptive Modal */}
      <AdaptiveModal
        isOpen={isAdaptiveOpen}
        onClose={() => setIsAdaptiveOpen(false)}
        initialScenario={adaptiveScenario}
        onSuccess={() => refreshTrip()}
      />

      {/* Edit Activity Modal */}
      {editingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DCE6F5] dark:border-[#2A3A56] pb-3">
              <h3 className="text-sm font-bold text-[#172554] dark:text-[#F1F5F9]">Edit Activity Details</h3>
              <button onClick={() => setEditingActivity(null)} className="text-[#64748B] hover:text-[#172554] dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Place Name</label>
                <input
                  type="text"
                  value={editingActivity.name}
                  onChange={(e) => setEditingActivity({ ...editingActivity, name: e.target.value })}
                  className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingActivity.description}
                  onChange={(e) => setEditingActivity({ ...editingActivity, description: e.target.value })}
                  className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={editingActivity.time_slot}
                    onChange={(e) => setEditingActivity({ ...editingActivity, time_slot: e.target.value })}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  />
                </div>
                <div>
                  <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Duration (Hours)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editingActivity.duration_hours}
                    onChange={(e) => setEditingActivity({ ...editingActivity, duration_hours: parseFloat(e.target.value) || 1 })}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Est. Entry ({activeTrip.currency})</label>
                  <input
                    type="number"
                    value={editingActivity.estimated_entry_cost}
                    onChange={(e) => setEditingActivity({ ...editingActivity, estimated_entry_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  />
                </div>
                <div>
                  <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Est. Transit ({activeTrip.currency})</label>
                  <input
                    type="number"
                    value={editingActivity.estimated_transport_cost}
                    onChange={(e) => setEditingActivity({ ...editingActivity, estimated_transport_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE6F5] dark:border-[#2A3A56]">
                <button
                  type="button"
                  onClick={() => setEditingActivity(null)}
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

      {/* Add Custom Stop Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DCE6F5] dark:border-[#2A3A56] pb-3">
              <h3 className="text-sm font-bold text-[#172554] dark:text-[#F1F5F9]">Add Stop to Day {activeDay?.day_number}</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#64748B] hover:text-[#172554] dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Activity / Landmark Name</label>
                <input
                  type="text"
                  placeholder="e.g. Visit Botanical Gardens"
                  value={newActivityData.name}
                  onChange={(e) => setNewActivityData({ ...newActivityData, name: e.target.value })}
                  className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Short note or description..."
                  value={newActivityData.description}
                  onChange={(e) => setNewActivityData({ ...newActivityData, description: e.target.value })}
                  className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Category</label>
                  <select
                    value={newActivityData.category}
                    onChange={(e) => setNewActivityData({ ...newActivityData, category: e.target.value })}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  >
                    <option value="sightseeing">Sightseeing</option>
                    <option value="nature">Nature & Outdoors</option>
                    <option value="food">Culinary & Dining</option>
                    <option value="history">History & Heritage</option>
                    <option value="shopping">Shopping</option>
                    <option value="relaxation">Relaxation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Time Slot</label>
                  <input
                    type="text"
                    value={newActivityData.time_slot}
                    onChange={(e) => setNewActivityData({ ...newActivityData, time_slot: e.target.value })}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Est. Entry ({activeTrip.currency})</label>
                  <input
                    type="number"
                    value={newActivityData.estimated_entry_cost}
                    onChange={(e) => setNewActivityData({ ...newActivityData, estimated_entry_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  />
                </div>
                <div>
                  <label className="block text-[#172554] dark:text-[#F1F5F9] font-semibold mb-1">Est. Transit ({activeTrip.currency})</label>
                  <input
                    type="number"
                    value={newActivityData.estimated_transport_cost}
                    onChange={(e) => setNewActivityData({ ...newActivityData, estimated_transport_cost: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2 text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DCE6F5] dark:border-[#2A3A56]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#DCE6F5]/50 dark:bg-[#192640] text-[#172554] dark:text-[#F1F5F9] hover:bg-[#DCE6F5] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold shadow-xs transition-colors"
                >
                  Add Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
