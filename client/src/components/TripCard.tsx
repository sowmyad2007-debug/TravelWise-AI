import React, { useState, useRef } from 'react';
import { Trip } from '../types';
import { DestinationImage } from './DestinationImage';
import {
  Calendar,
  ArrowRight,
  MapPin,
  Clock,
  Trash2
} from 'lucide-react';

interface TripCardProps {
  trip: Trip;
  isActive: boolean;
  onSelect: (tripId: number) => void;
  onViewDetails: (tripId: number) => void;
  onDelete?: (tripId: number) => void;
}

const DESTINATION_IMAGES: Record<string, string> = {
  hyderabad: 'https://upload.wikimedia.org/wikipedia/commons/7/71/Charminar_Hyderabad_1.jpg',
  munnar: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Munnar_Overview.jpg',
  ooty: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Ooty_Lake_in_Tamil_Nadu_04.jpg',
  goa: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Fort_aguada.jpg',
  bengaluru: 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Bangalore_Mysore_Maharaja_Palace.jpg',
  bangalore: 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Bangalore_Mysore_Maharaja_Palace.jpg',
  delhi: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/India_Gate_front.jpg',
  mumbai: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Mumbai_03-2016_30_Gateway_of_India.jpg',
  agra: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Taj_Mahal_%28Edited%29.jpeg',
  paris: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg',
  manali: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Manali_City.jpg',
  jaipur: 'https://upload.wikimedia.org/wikipedia/commons/4/41/East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg',
  tirupati: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Tirumala_090615.jpg',
  visakhapatnam: 'https://upload.wikimedia.org/wikipedia/commons/1/15/RK_Beach_Visakhapatnam.jpg',
  vizag: 'https://upload.wikimedia.org/wikipedia/commons/1/15/RK_Beach_Visakhapatnam.jpg',
  bhadrachalam: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Bhadrachalam_Temple_Gopuram.jpg',
  kochi: 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Chinese_fishing_nets_Kochi.jpg',
  alappuzha: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Alappuzha_Boat_Beauty_W.jpg',
  alleppey: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Alappuzha_Boat_Beauty_W.jpg',
  puducherry: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Promenade_Beach_Pondicherry.jpg',
  pondicherry: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Promenade_Beach_Pondicherry.jpg',
  shirdi: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Sai_baba_mandir_shirdi.jpg',
  nashik: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Trimbakeshwar_Temple_Nashik.jpg',
  guntur: 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Amaravathi_Stupa.jpg',
  vijayawada: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Kanaka_Durga_Temple_Vijayawada.jpg',
  mysuru: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Mysore_Palace_Morning.jpg',
  mysore: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Mysore_Palace_Morning.jpg',
  kadapa: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Gandikota_Gorge_and_River_Pennar.jpg',
  kurnool: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Belum_Caves_Kurnool.jpg',
  chennai: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Marina_Beach_Chennai_Sunrise.jpg',
  puri: 'https://upload.wikimedia.org/wikipedia/commons/6/60/Jagannath_Temple_Puri.jpg',
  kedarnath: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Kedarnath_Temple_Uttarakhand.jpg',
  badrinath: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Badrinath_Temple_in_Uttarakhand.jpg',
  kashmir: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Shikaras_on_Dal_Lake.jpg',
  london: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/London_Montage_L.jpg',
  new_york: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg',
  california: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/GoldenGateBridge-001.jpg',
  sydney: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Sydney_Opera_House_-_Dec_2008.jpg',
  melbourne: 'https://upload.wikimedia.org/wikipedia/commons/d/d6/Flinders_Street_Station_Melbourne_dusk.jpg',
  australia: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Sydney_Opera_House_-_Dec_2008.jpg',
  bali: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Uluwatu_Temple_Bali.jpg',
  vietnam: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Ha_Long_Bay_Vietnam.jpg',
  maldives: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Maldives_Resort_Island.jpg',
  hong_kong: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Hong_Kong_Skyline_Restitch_-_Dec_2007.jpg',
  china: 'https://upload.wikimedia.org/wikipedia/commons/2/23/The_Great_Wall_of_China_at_Mutianyu_-_side_view.jpg',
  spain: 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Sagrada_Familia_01.jpg',
  russia: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Saint_Basil%27s_Cathedral_Moscow.jpg',
  germany: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Brandenburger_Tor_abends.jpg'
};

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  isActive,
  onSelect,
  onViewDetails,
  onDelete
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const destKey = trip.destination.toLowerCase().trim();
  const matchedKey = Object.keys(DESTINATION_IMAGES).find((k) => destKey.includes(k));
  const rawImageUrl = trip.cover_image || (matchedKey ? DESTINATION_IMAGES[matchedKey] : null);

  const totalBudget = trip.total_budget || 1;
  const spent = trip.total_spent || 0;
  const remaining = trip.remaining_budget || Math.max(0, totalBudget - spent);
  const utilization = Math.min(100, Math.round((spent / totalBudget) * 100));

  // Calculate duration in days
  const d1 = new Date(trip.start_date);
  const d2 = new Date(trip.end_date);
  const diffDays = Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)) + 1);

  // 3D Pointer Tilt Handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rX = ((y - centerY) / centerY) * -5;
    const rY = ((x - centerX) / centerX) * 5;
    setRotateX(rX);
    setRotateY(rY);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <div
      ref={cardRef}
      onClick={() => onSelect(trip.id)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isHovered
          ? `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      className={`group relative bg-white dark:bg-[#121D33] border rounded-3xl overflow-hidden cursor-pointer flex flex-col justify-between transition-shadow duration-300 ${
        isActive
          ? 'border-[#3984F5] dark:border-[#60A5FA] ring-2 ring-[#3984F5]/30 shadow-md'
          : 'border-[#DCE6F5] dark:border-[#2A3A56] hover:border-[#3984F5]/50 shadow-xs hover:shadow-md'
      }`}
    >
      {/* Top Photograph Container */}
      <div className="relative h-48 w-full overflow-hidden bg-[#F5F8FF] dark:bg-[#0B1224] flex items-center justify-center">
        <DestinationImage
          src={rawImageUrl}
          alt={trip.destination}
          fallbackText={trip.destination}
          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-108"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1224]/85 via-[#0B1224]/30 to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <span className="px-3 py-1 rounded-full bg-white/90 dark:bg-[#121D33]/90 backdrop-blur-md text-[#172554] dark:text-[#F1F5F9] font-bold text-[11px] shadow-xs flex items-center gap-1.5 border border-[#DCE6F5] dark:border-[#2A3A56]">
            <MapPin className="w-3.5 h-3.5 text-[#3984F5] dark:text-[#60A5FA]" />
            <span>{trip.destination}</span>
          </span>

          {isActive && (
            <span className="px-2.5 py-1 rounded-full bg-[#3984F5] text-white dark:bg-[#60A5FA] dark:text-[#0B1224] font-black text-[10px] uppercase tracking-wider shadow-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-[#0B1224] animate-pulse" />
              Active Trip
            </span>
          )}
        </div>

        {/* Bottom Photograph Details */}
        <div className="absolute bottom-3 left-3 right-3 text-white z-10">
          <p className="text-xs font-bold opacity-95 truncate drop-shadow-xs text-white">
            {trip.starting_city} → {trip.destination}
          </p>
          <div className="flex items-center gap-3 text-[11px] text-white/90 font-semibold mt-0.5 drop-shadow-xs">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#3984F5] dark:text-[#60A5FA]" />
              {trip.start_date.slice(5)} to {trip.end_date.slice(5)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#FACC15] dark:text-[#FDE047]" />
              {diffDays} {diffDays === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>
      </div>

      {/* Card Content & Financial Metrics */}
      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between bg-white dark:bg-[#121D33]">
        
        {/* Title and Style Tag */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-extrabold text-base text-[#172554] dark:text-[#F1F5F9] truncate">
              {trip.title || `${trip.destination} Adventure`}
            </h3>
            <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-[#F472B6]/15 dark:bg-[#F9A8D4]/15 text-[#DB2777] dark:text-[#F9A8D4] border border-[#F472B6]/30 shrink-0">
              {trip.travel_style || 'Balanced'}
            </span>
          </div>
        </div>

        {/* Budget Progress Meter */}
        <div className="space-y-1.5 bg-[#F5F8FF] dark:bg-[#0B1224] p-3 rounded-2xl border border-[#DCE6F5] dark:border-[#2A3A56]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#64748B] dark:text-[#B6C2D6] font-medium">Spent: <strong className="text-[#172554] dark:text-[#F1F5F9] font-bold">{trip.currency} {spent.toLocaleString()}</strong></span>
            <span className="text-[#64748B] dark:text-[#B6C2D6] font-medium">Target: <strong className="text-[#172554] dark:text-[#F1F5F9] font-bold">{trip.currency} {totalBudget.toLocaleString()}</strong></span>
          </div>

          <div className="w-full h-2 bg-[#DCE6F5] dark:bg-[#192640] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                utilization > 100
                  ? 'bg-[#EF4444]'
                  : utilization > 80
                  ? 'bg-[#FACC15]'
                  : 'bg-[#3984F5] dark:bg-[#60A5FA]'
              }`}
              style={{ width: `${utilization}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] pt-0.5">
            <span className="text-[#3984F5] dark:text-[#60A5FA] font-bold">
              {trip.currency} {remaining.toLocaleString()} Available
            </span>
            <span className="text-[#64748B] dark:text-[#B6C2D6] font-medium">{utilization}% used</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 border-t border-[#DCE6F5] dark:border-[#2A3A56] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(trip.id);
            }}
            className="flex-1 py-2.5 px-3 rounded-xl bg-[#3984F5]/10 hover:bg-[#3984F5]/20 dark:bg-[#60A5FA]/15 dark:hover:bg-[#60A5FA]/25 text-[#3984F5] dark:text-[#60A5FA] font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            <span>View Itinerary</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete trip to ${trip.destination}?`)) {
                  onDelete(trip.id);
                }
              }}
              className="p-2.5 rounded-xl text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
              title="Delete Trip"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
