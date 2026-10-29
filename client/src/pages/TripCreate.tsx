import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useActiveTrip } from '../context/ActiveTripContext';
import { api } from '../api/client';
import { DestinationImage } from '../components/DestinationImage';
import {
  Compass,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  TreePine,
  Utensils,
  Landmark,
  Camera,
  Flame,
  ShoppingBag,
  Coffee,
  Globe
} from 'lucide-react';

interface QuickDestination {
  name: string;
  tagline: string;
  image: string;
  defaultBudget: number;
  category: 'south' | 'pilgrimage' | 'north' | 'international';
  currency?: string;
}

const FEATURED_DESTINATIONS: QuickDestination[] = [
  // South India & Coastal
  {
    name: 'Hyderabad',
    tagline: 'City of Pearls & Royal Nizami Heritage',
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/71/Charminar_Hyderabad_1.jpg',
    defaultBudget: 14000,
    category: 'south',
    currency: 'INR'
  },
  {
    name: 'Visakhapatnam',
    tagline: 'Jewel of the East Coast & Submarine Museum',
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/15/RK_Beach_Visakhapatnam.jpg',
    defaultBudget: 12000,
    category: 'south',
    currency: 'INR'
  },
  {
    name: 'Munnar',
    tagline: 'Misty Hills & Emerald Tea Estates',
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/29/Tea_plantations_in_Munnar.jpg',
    defaultBudget: 12000,
    category: 'south',
    currency: 'INR'
  },
  {
    name: 'Kochi',
    tagline: 'Historic Colonial Port & Chinese Fishing Nets',
    image: 'https://upload.wikimedia.org/wikipedia/commons/e/e6/Chinese_fishing_nets_Kochi.jpg',
    defaultBudget: 13000,
    category: 'south',
    currency: 'INR'
  },
  {
    name: 'Alappuzha',
    tagline: 'Houseboat Cruises & Palm-Fringed Backwaters',
    image: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/Alappuzha_Boat_Beauty_W.jpg',
    defaultBudget: 15000,
    category: 'south',
    currency: 'INR'
  },
  {
    name: 'Puducherry',
    tagline: 'French Quarter Villas & Promenade Beach',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Promenade_Beach_Pondicherry.jpg',
    defaultBudget: 12000,
    category: 'south',
    currency: 'INR'
  },
  {
    name: 'Ooty',
    tagline: 'Queen of Hill Stations & Botanical Gardens',
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Ooty_Lake_Tamil_Nadu.jpg',
    defaultBudget: 10000,
    category: 'south',
    currency: 'INR'
  },
  {
    name: 'Goa',
    tagline: 'Sun-Kissed Beaches & Historic Forts',
    image: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Calangute_Beach_Goa.jpg',
    defaultBudget: 16000,
    category: 'south',
    currency: 'INR'
  },
  {
    name: 'Bengaluru',
    tagline: 'Garden City, Tech Innovation & Palaces',
    image: 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Bangalore_Mysore_Maharaja_Palace.jpg',
    defaultBudget: 15000,
    category: 'south',
    currency: 'INR'
  },
  {
    name: 'Mysuru',
    tagline: 'Royal Mysore Palace & Chamundi Hill',
    image: 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Mysore_Palace_Morning.jpg',
    defaultBudget: 11000,
    category: 'south',
    currency: 'INR'
  },

  // Sacred Pilgrimage
  {
    name: 'Tirupati',
    tagline: 'Lord Venkateswara Sacred Seven Hills',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Tirumala_090615.jpg',
    defaultBudget: 10000,
    category: 'pilgrimage',
    currency: 'INR'
  },
  {
    name: 'Bhadrachalam',
    tagline: 'Sri Sita Ramachandra Swamy Temple on Godavari',
    image: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Bhadrachalam_Temple_Gopuram.jpg',
    defaultBudget: 8000,
    category: 'pilgrimage',
    currency: 'INR'
  },
  {
    name: 'Shirdi',
    tagline: 'Shri Sai Baba Samadhi Mandir & Dwarkamai',
    image: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Sai_baba_mandir_shirdi.jpg',
    defaultBudget: 9000,
    category: 'pilgrimage',
    currency: 'INR'
  },
  {
    name: 'Nashik',
    tagline: 'Trimbakeshwar Shiva Jyotirlinga & Sula Vineyards',
    image: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Trimbakeshwar_Temple_Nashik.jpg',
    defaultBudget: 9500,
    category: 'pilgrimage',
    currency: 'INR'
  },
  {
    name: 'Puri',
    tagline: 'Lord Jagannath Temple & Golden Beach',
    image: 'https://upload.wikimedia.org/wikipedia/commons/5/52/Jagannath_Temple_Puri.jpg',
    defaultBudget: 10000,
    category: 'pilgrimage',
    currency: 'INR'
  },
  {
    name: 'Kedarnath',
    tagline: 'Char Dham Himalayan Shrine (Open May-Oct)',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Kedarnath_Temple_Uttarakhand.jpg',
    defaultBudget: 18000,
    category: 'pilgrimage',
    currency: 'INR'
  },
  {
    name: 'Badrinath',
    tagline: 'Char Dham Badri Vishal Temple in Chamoli',
    image: 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Badrinath_Temple_in_Uttarakhand.jpg',
    defaultBudget: 18000,
    category: 'pilgrimage',
    currency: 'INR'
  },

  // North India & Heritage
  {
    name: 'Jaipur',
    tagline: 'The Pink City, Amber Fort & Hawa Mahal',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/41/East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg',
    defaultBudget: 15000,
    category: 'north',
    currency: 'INR'
  },
  {
    name: 'Agra',
    tagline: 'Taj Mahal & Mughal Architecture Heritage',
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Taj_Mahal_%28Edited%29.jpeg',
    defaultBudget: 12000,
    category: 'north',
    currency: 'INR'
  },
  {
    name: 'Manali',
    tagline: 'Snowy Passes, Rohtang & Pine Valleys',
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Manali_City.jpg',
    defaultBudget: 16000,
    category: 'north',
    currency: 'INR'
  },
  {
    name: 'Jammu and Kashmir',
    tagline: 'Paradise on Earth: Dal Lake & Gulmarg Gondola',
    image: 'https://upload.wikimedia.org/wikipedia/commons/b/b3/Shikaras_on_Dal_Lake.jpg',
    defaultBudget: 22000,
    category: 'north',
    currency: 'INR'
  },
  {
    name: 'Delhi',
    tagline: 'Imperial Capital, Red Fort & Qutub Minar',
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/India_Gate_front.jpg',
    defaultBudget: 16000,
    category: 'north',
    currency: 'INR'
  },
  {
    name: 'Mumbai',
    tagline: 'Gateway of India, Marine Drive & Arabian Sea',
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Mumbai_03-2016_30_Gateway_of_India.jpg',
    defaultBudget: 18000,
    category: 'north',
    currency: 'INR'
  },

  // International
  {
    name: 'London',
    tagline: 'Big Ben, Tower Bridge & Royal Palaces',
    image: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/London_Montage_L.jpg',
    defaultBudget: 180000,
    category: 'international',
    currency: 'GBP'
  },
  {
    name: 'New York',
    tagline: 'Times Square, Central Park & Broadway',
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/7a/View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg',
    defaultBudget: 220000,
    category: 'international',
    currency: 'USD'
  },
  {
    name: 'California',
    tagline: 'Golden Gate, Pacific Coast Highway & Yosemite',
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/GoldenGateBridge-001.jpg',
    defaultBudget: 230000,
    category: 'international',
    currency: 'USD'
  },
  {
    name: 'Sydney',
    tagline: 'Sydney Opera House & Bondi Coast',
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Sydney_Opera_House_-_Dec_2008.jpg',
    defaultBudget: 200000,
    category: 'international',
    currency: 'AUD'
  },
  {
    name: 'Bali',
    tagline: 'Tropical Temples, Surf Beaches & Terraces',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Uluwatu_Temple_Bali.jpg',
    defaultBudget: 55000,
    category: 'international',
    currency: 'INR'
  },
  {
    name: 'Vietnam',
    tagline: 'Ha Long Bay, Old Hanoi & Lantern Towns',
    image: 'https://upload.wikimedia.org/wikipedia/commons/2/26/Ha_Long_Bay_Vietnam.jpg',
    defaultBudget: 60000,
    category: 'international',
    currency: 'INR'
  },
  {
    name: 'Maldives',
    tagline: 'Overwater Bungalows & Turquoise Lagoons',
    image: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Maldives_Resort_Island.jpg',
    defaultBudget: 120000,
    category: 'international',
    currency: 'USD'
  },
  {
    name: 'Hong Kong',
    tagline: 'Victoria Peak & Symphony of Lights',
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/0d/Hong_Kong_Skyline_Restitch_-_Dec_2007.jpg',
    defaultBudget: 90000,
    category: 'international',
    currency: 'USD'
  },
  {
    name: 'Paris',
    tagline: 'Eiffel Tower, Louvre Museum & Seine River',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg',
    defaultBudget: 190000,
    category: 'international',
    currency: 'EUR'
  }
];

const REGIONAL_HUBS: Record<string, { label: string; hubs: { name: string; tag: string; budget: number }[] }> = {
  kerala: {
    label: 'Kerala Regional Highlights',
    hubs: [
      { name: 'Munnar', tag: 'Tea Hills', budget: 12000 },
      { name: 'Kochi', tag: 'Historic Port', budget: 13000 },
      { name: 'Alappuzha', tag: 'Backwaters', budget: 15000 },
    ],
  },
  karnataka: {
    label: 'Karnataka Highlights',
    hubs: [
      { name: 'Bengaluru', tag: 'Garden Tech', budget: 15000 },
      { name: 'Mysuru', tag: 'Palaces & Heritage', budget: 11000 },
    ],
  },
  tamil_nadu: {
    label: 'Tamil Nadu & Puducherry',
    hubs: [
      { name: 'Ooty', tag: 'Nilgiri Hills', budget: 10000 },
      { name: 'Chennai', tag: 'Marina & Temples', budget: 13000 },
      { name: 'Puducherry', tag: 'French Colony', budget: 12000 },
    ],
  },
  california: {
    label: 'California Golden State Tour',
    hubs: [
      { name: 'San Francisco', tag: 'Golden Gate & Bay', budget: 220000 },
      { name: 'Los Angeles', tag: 'Hollywood & Coast', budget: 230000 },
    ],
  },
  united_states: {
    label: 'United States Multi-City',
    hubs: [
      { name: 'New York', tag: 'Manhattan & Liberty', budget: 220000 },
      { name: 'San Francisco', tag: 'West Coast Bay', budget: 220000 },
      { name: 'Los Angeles', tag: 'Entertainment Capital', budget: 230000 },
    ],
  },
  australia: {
    label: 'Australia Multi-City Highlights',
    hubs: [
      { name: 'Sydney', tag: 'Opera House & Harbour', budget: 200000 },
      { name: 'Melbourne', tag: 'Arts Laneways & Ocean Rd', budget: 190000 },
    ],
  },
};

const CANONICAL_AUTOCOMPLETE_OPTIONS = [
  'Visakhapatnam (Vizag)',
  'Tirupati (Tirumala)',
  'Hyderabad',
  'Munnar',
  'Kochi (Cochin)',
  'Alappuzha (Alleppey)',
  'Puducherry (Pondicherry)',
  'Shirdi',
  'Nashik (Trimbakeshwar)',
  'Bhadrachalam',
  'Guntur (Amaravati)',
  'Vijayawada',
  'Kadapa (Gandikota)',
  'Kurnool (Belum Caves)',
  'Chennai',
  'Bengaluru (Bangalore)',
  'Mysuru (Mysore)',
  'Goa',
  'Ooty',
  'Jaipur',
  'Agra',
  'Manali',
  'Jammu and Kashmir',
  'Delhi',
  'Mumbai',
  'Puri',
  'Kedarnath',
  'Badrinath',
  'London',
  'New York',
  'California',
  'Sydney',
  'Melbourne',
  'Bali',
  'Vietnam',
  'Maldives',
  'Hong Kong',
  'China',
  'Spain',
  'Germany',
  'Russia',
  'Paris'
];

export const TripCreate: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { setActiveTripId, refreshTrips } = useActiveTrip();

  // Form states
  const [startingCity, setStartingCity] = useState('Bangalore');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelers, setTravelers] = useState(2);
  const [totalBudget, setTotalBudget] = useState(14000);
  const [currency, setCurrency] = useState('INR');
  const [travelStyle, setTravelStyle] = useState('balanced');
  const [destCategory, setDestCategory] = useState<'all' | 'south' | 'pilgrimage' | 'north' | 'international'>('all');

  const [interests, setInterests] = useState<string[]>(['nature', 'food', 'photography']);
  const [accommodationPref, setAccommodationPref] = useState('budget_hotel');
  const [dietaryPref, setDietaryPref] = useState('no_preference');
  const [accessibilityPref, setAccessibilityPref] = useState('standard');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-fill destination from query parameter or router state if provided
  useEffect(() => {
    const dest = searchParams.get('destination');
    if (dest) {
      setDestination(dest);
    }

    const navState = location.state as {
      destination?: string;
      startDate?: string;
      travelers?: number;
      budget?: number;
    } | null;

    if (navState) {
      if (navState.destination) setDestination(navState.destination);
      if (navState.startDate) {
        setStartDate(navState.startDate);
        const d = new Date(navState.startDate);
        d.setDate(d.getDate() + 3);
        setEndDate(d.toISOString().split('T')[0]);
      }
      if (navState.travelers) setTravelers(navState.travelers);
      if (navState.budget) setTotalBudget(navState.budget);
    } else {
      // Set default dates: tomorrow to +3 days
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const returnDay = new Date();
      returnDay.setDate(returnDay.getDate() + 4);

      setStartDate(tomorrow.toISOString().split('T')[0]);
      setEndDate(returnDay.toISOString().split('T')[0]);
    }
  }, [searchParams, location.state]);

  const interestOptions = [
    { id: 'nature', label: 'Nature & Scenic Trails', icon: TreePine },
    { id: 'food', label: 'Culinary & Dining', icon: Utensils },
    { id: 'history', label: 'Heritage & Architecture', icon: Landmark },
    { id: 'photography', label: 'Photography Sights', icon: Camera },
    { id: 'adventure', label: 'Adventure & Treks', icon: Flame },
    { id: 'shopping', label: 'Local Bazaars & Crafts', icon: ShoppingBag },
    { id: 'relaxation', label: 'Relaxation & Wellness', icon: Coffee },
  ];

  const toggleInterest = (id: string) => {
    if (interests.includes(id)) {
      setInterests(interests.filter((i) => i !== id));
    } else {
      setInterests([...interests, id]);
    }
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const daysCount = calculateDays();
  const estDailyBudget = Math.round(totalBudget / Math.max(1, daysCount));

  const selectQuickDestination = (dest: QuickDestination) => {
    setDestination(dest.name);
    setTotalBudget(dest.defaultBudget);
    if (dest.currency) {
      setCurrency(dest.currency);
    }
  };

  const getActiveRegionalHubs = () => {
    const d = destination.toLowerCase().trim();
    if (!d) return null;
    if (d.includes('kerala')) return REGIONAL_HUBS.kerala;
    if (d.includes('karnataka')) return REGIONAL_HUBS.karnataka;
    if (d.includes('tamil') || d.includes('pondy') || d.includes('puducherry')) return REGIONAL_HUBS.tamil_nadu;
    if (d.includes('california')) return REGIONAL_HUBS.california;
    if (d.includes('usa') || d.includes('america') || d.includes('united states')) return REGIONAL_HUBS.united_states;
    if (d.includes('australia')) return REGIONAL_HUBS.australia;
    return null;
  };

  const activeHubs = getActiveRegionalHubs();
  const displayedDestinations = destCategory === 'all'
    ? FEATURED_DESTINATIONS
    : FEATURED_DESTINATIONS.filter((d) => d.category === destCategory);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startingCity.trim()) {
      setErrorMsg('Please enter your starting city.');
      return;
    }
    if (!destination.trim()) {
      setErrorMsg('Please enter your destination.');
      return;
    }
    if (!startDate || !endDate) {
      setErrorMsg('Please select both departure and return dates.');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setErrorMsg('Return date cannot be earlier than departure date.');
      return;
    }
    if (totalBudget <= 0) {
      setErrorMsg('Please specify a valid total budget.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await api.createTrip({
        title: `${destination.trim()} Getaway`,
        starting_city: startingCity.trim(),
        destination: destination.trim(),
        start_date: startDate,
        end_date: endDate,
        travelers,
        total_budget: totalBudget,
        currency,
        travel_style: travelStyle,
        interests,
        accommodation_pref: accommodationPref,
        dietary_pref: dietaryPref,
        accessibility_pref: accessibilityPref,
      });

      await refreshTrips();
      setActiveTripId(res.trip_id);
      navigate('/itinerary');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to generate itinerary. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fadeIn">
      
      {/* Page Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-[#3984F5]/10 border border-[#3984F5]/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#3984F5] dark:text-[#60A5FA] shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-[#F472B6]" />
          <span>Adaptive Intelligence 2.0 • Real Landmark Guarantee</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-[#172554] dark:text-[#F1F5F9] tracking-tight">
          Design Your Next Journey
        </h1>
        <p className="text-sm text-[#64748B] dark:text-[#B6C2D6] max-w-2xl mx-auto leading-relaxed">
          Specify your route, travel dates, and budget. Our multi-factor engine orchestrates authentic sightseeing spots, live weather forecasts, and route-optimized day plans.
        </p>
      </div>

      {/* Quick Inspiration Carousel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#172554] dark:text-[#F1F5F9]">
              Trending Verified Destinations
            </h2>
          </div>
          <span className="text-[11px] text-[#64748B] dark:text-[#B6C2D6]">Click to select instantly</span>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'All Curated' },
            { id: 'south', label: 'South India & Coast' },
            { id: 'pilgrimage', label: 'Sacred Pilgrimage' },
            { id: 'north', label: 'North & Hills' },
            { id: 'international', label: 'International' },
          ].map((cat) => (
            <button
              type="button"
              key={cat.id}
              onClick={() => setDestCategory(cat.id as any)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all shrink-0 ${
                destCategory === cat.id
                  ? 'bg-[#3984F5] text-white dark:bg-[#60A5FA] dark:text-[#0B1224] shadow-xs'
                  : 'bg-white dark:bg-[#192640] border border-[#DCE6F5] dark:border-[#2A3A56] text-[#64748B] dark:text-[#B6C2D6] hover:bg-[#F5F8FF] dark:hover:bg-[#121D33]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {displayedDestinations.map((dest) => {
            const isSelected = destination.toLowerCase() === dest.name.toLowerCase();
            return (
              <button
                type="button"
                key={dest.name}
                onClick={() => selectQuickDestination(dest)}
                className={`group relative h-28 rounded-2xl overflow-hidden border text-left transition-all duration-300 focus:outline-none ${
                  isSelected
                    ? 'ring-2 ring-[#3984F5] dark:ring-[#60A5FA] shadow-md shadow-[#3984F5]/20 border-transparent scale-[1.02]'
                    : 'border-[#DCE6F5] dark:border-[#2A3A56] hover:border-[#3984F5]/60 hover:shadow-xs'
                }`}
              >
                <DestinationImage
                  src={dest.image}
                  alt={dest.name}
                  fallbackCategory={dest.category}
                  fallbackText={dest.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1224] via-[#0B1224]/40 to-transparent" />
                
                {isSelected && (
                  <span className="absolute top-2 right-2 p-1 rounded-full bg-[#3984F5] text-white shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </span>
                )}

                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <p className="text-xs font-bold drop-shadow-xs flex items-center justify-between">
                    <span>{dest.name}</span>
                    <span className="text-[10px] text-[#FACC15] dark:text-[#FDE047] font-semibold">₹{dest.defaultBudget.toLocaleString()}</span>
                  </p>
                  <p className="text-[9px] text-[#DCE6F5] truncate opacity-90">{dest.tagline}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-xs flex items-center gap-2.5 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Planner Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-10 space-y-8 shadow-xs">
        
        {/* Section 1: Route & Travel Schedule */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#DCE6F5] dark:border-[#2A3A56]">
            <span className="w-6 h-6 rounded-full bg-[#3984F5]/15 text-[#3984F5] dark:text-[#60A5FA] flex items-center justify-center text-xs font-bold">1</span>
            <h3 className="text-xs font-bold text-[#172554] dark:text-[#F1F5F9] uppercase tracking-wider">
              Route & Travel Schedule
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1.5">
                Starting City
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#64748B] dark:text-[#B6C2D6] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={startingCity}
                  onChange={(e) => setStartingCity(e.target.value)}
                  placeholder="e.g. Bangalore, Delhi, Mumbai"
                  required
                  className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#172554] dark:text-[#F1F5F9] placeholder-[#64748B] dark:placeholder-[#B6C2D6] focus:outline-none focus:border-[#3984F5] focus:ring-1 focus:ring-[#3984F5] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1.5">
                Destination City
              </label>
              <div className="relative">
                <Compass className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA] absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  list="destinations-catalog"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="e.g. Visakhapatnam, Tirupati, Munnar, London, Sydney"
                  required
                  className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#172554] dark:text-[#F1F5F9] placeholder-[#64748B] dark:placeholder-[#B6C2D6] focus:outline-none focus:border-[#3984F5] focus:ring-1 focus:ring-[#3984F5] font-semibold transition-all"
                />
                <datalist id="destinations-catalog">
                  {CANONICAL_AUTOCOMPLETE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} />
                  ))}
                </datalist>
              </div>

              {/* Sub-destination regional recommendations */}
              {activeHubs && (
                <div className="mt-2.5 p-3 rounded-2xl bg-[#3984F5]/10 border border-[#3984F5]/30 text-xs text-[#172554] dark:text-[#F1F5F9] animate-fadeIn">
                  <div className="flex items-center gap-1.5 font-bold text-[#3984F5] dark:text-[#60A5FA] mb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#F472B6]" />
                    <span>{activeHubs.label} — Choose a Highlight or Tour Multi-City:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {activeHubs.hubs.map((hub) => (
                      <button
                        type="button"
                        key={hub.name}
                        onClick={() => {
                          setDestination(hub.name);
                          setTotalBudget(hub.budget);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#192640] border border-[#3984F5]/40 hover:border-[#3984F5] text-[11px] font-semibold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-1.5 shadow-xs transition-all"
                      >
                        <span>{hub.name}</span>
                        <span className="text-[9px] text-[#3984F5] dark:text-[#60A5FA] font-normal">({hub.tag})</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Seasonal Pilgrimage Advisory Banner */}
              {(destination.toLowerCase().includes('kedarnath') || destination.toLowerCase().includes('badrinath')) && (
                <div className="mt-2.5 p-3 rounded-2xl bg-[#FACC15]/15 border border-[#FACC15]/40 flex items-start gap-2.5 text-xs text-[#172554] dark:text-[#F1F5F9] animate-fadeIn">
                  <AlertCircle className="w-4 h-4 text-[#FACC15] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#B45309] dark:text-[#FDE047] block mb-0.5">
                      Seasonal Pilgrimage Advisory
                    </span>
                    <span>
                      {destination.toLowerCase().includes('kedarnath')
                        ? 'Kedarnath Temple operates seasonally from May to October (closed in winter due to Himalayan snowfall). Advance biometric registration and physical fitness preparation are recommended.'
                        : 'Badrinath Temple operates seasonally from May to November (closed in winter). Advance mandatory registration via Uttarakhand Char Dham Devasthanam Board is required.'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1.5">
                Departure Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#64748B] dark:text-[#B6C2D6] absolute left-3.5 top-3.5" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] focus:ring-1 focus:ring-[#3984F5] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1.5">
                Return Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-[#64748B] dark:text-[#B6C2D6] absolute left-3.5 top-3.5" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] focus:ring-1 focus:ring-[#3984F5] transition-all"
                />
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-[#F5F8FF] dark:bg-[#0B1224] rounded-2xl border border-[#DCE6F5] dark:border-[#2A3A56] flex flex-wrap items-center justify-between text-xs text-[#64748B] dark:text-[#B6C2D6] gap-2">
            <span>Trip Duration: <strong className="text-[#172554] dark:text-[#F1F5F9]">{daysCount} Days</strong></span>
            <span className="text-[#3984F5] dark:text-[#60A5FA] font-semibold">
              Daily Target: ~{currency} {estDailyBudget.toLocaleString()}/day
            </span>
          </div>
        </div>

        {/* Section 2: Budget & Travelers */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#DCE6F5] dark:border-[#2A3A56]">
            <span className="w-6 h-6 rounded-full bg-[#FACC15]/20 text-[#B45309] dark:text-[#FDE047] flex items-center justify-center text-xs font-bold">2</span>
            <h3 className="text-xs font-bold text-[#172554] dark:text-[#F1F5F9] uppercase tracking-wider">
              Budget & Group Size
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1.5">Number of Travelers</label>
              <div className="relative">
                <Users className="w-4 h-4 text-[#64748B] dark:text-[#B6C2D6] absolute left-3.5 top-3.5" />
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={travelers}
                  onChange={(e) => setTravelers(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1.5">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2.5 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] transition-all"
              >
                <option value="INR">INR (₹) - Indian Rupee</option>
                <option value="USD">USD ($) - US Dollar</option>
                <option value="EUR">EUR (€) - Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="AUD">AUD (A$) - Australian Dollar</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1.5">Total Trip Budget</label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA] absolute left-3.5 top-3.5" />
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-[#172554] dark:text-[#F1F5F9] font-bold focus:outline-none focus:border-[#3984F5] transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Travel Style */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#DCE6F5] dark:border-[#2A3A56]">
            <span className="w-6 h-6 rounded-full bg-[#F472B6]/20 text-[#DB2777] dark:text-[#F9A8D4] flex items-center justify-center text-xs font-bold">3</span>
            <h3 className="text-xs font-bold text-[#172554] dark:text-[#F1F5F9] uppercase tracking-wider">
              Travel Comfort Tier
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {[
              {
                id: 'budget',
                title: 'Budget Explorer',
                desc: 'Hostels, shared transit, local street food & free scenic viewpoints.',
              },
              {
                id: 'balanced',
                title: 'Balanced Comfort',
                desc: 'Standard 3-star stays, mix of cabs & scenic transit, popular cafes.',
              },
              {
                id: 'comfort',
                title: 'Premium Comfort',
                desc: 'Boutique hotels & villas, private vehicle hire, signature fine dining.',
              }
            ].map((style) => (
              <button
                type="button"
                key={style.id}
                onClick={() => setTravelStyle(style.id)}
                className={`p-4 rounded-2xl border text-left transition-all duration-200 ${
                  travelStyle === style.id
                    ? 'bg-[#3984F5]/10 dark:bg-[#60A5FA]/15 border-[#3984F5] dark:border-[#60A5FA] shadow-xs ring-1 ring-[#3984F5]/30'
                    : 'bg-[#F5F8FF]/50 dark:bg-[#0B1224]/50 border-[#DCE6F5] dark:border-[#2A3A56] hover:border-[#3984F5]/40'
                }`}
              >
                <div className="text-xs font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center justify-between">
                  <span>{style.title}</span>
                  {travelStyle === style.id && <CheckCircle2 className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />}
                </div>
                <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6] mt-1 leading-snug">{style.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Section 4: Travel Interests */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#DCE6F5] dark:border-[#2A3A56]">
            <span className="w-6 h-6 rounded-full bg-[#3984F5]/15 text-[#3984F5] dark:text-[#60A5FA] flex items-center justify-center text-xs font-bold">4</span>
            <h3 className="text-xs font-bold text-[#172554] dark:text-[#F1F5F9] uppercase tracking-wider">
              Travel Passions & Preferences
            </h3>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {interestOptions.map((opt) => {
              const Icon = opt.icon;
              const isSelected = interests.includes(opt.id);
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => toggleInterest(opt.id)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all duration-200 ${
                    isSelected
                      ? 'bg-[#3984F5] text-white dark:bg-[#60A5FA] dark:text-[#0B1224] border-transparent shadow-xs'
                      : 'bg-[#F5F8FF] dark:bg-[#192640] border-[#DCE6F5] dark:border-[#2A3A56] text-[#64748B] dark:text-[#B6C2D6] hover:border-[#3984F5]/40 hover:text-[#3984F5]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 5: Accommodation & Dietary Preferences */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 pb-2 border-b border-[#DCE6F5] dark:border-[#2A3A56]">
            <span className="w-6 h-6 rounded-full bg-[#FACC15]/20 text-[#B45309] dark:text-[#FDE047] flex items-center justify-center text-xs font-bold">5</span>
            <h3 className="text-xs font-bold text-[#172554] dark:text-[#F1F5F9] uppercase tracking-wider">
              Stay & Dietary Specifics
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1.5">Accommodation</label>
              <select
                value={accommodationPref}
                onChange={(e) => setAccommodationPref(e.target.value)}
                className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] transition-all"
              >
                <option value="budget_hotel">Budget Hotel / Guest House</option>
                <option value="hostel">Backpacker Hostel</option>
                <option value="midrange_hotel">3-Star Hotel</option>
                <option value="resort">Resort & Boutique Villa</option>
                <option value="homestay">Local Homestay / Apartment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1.5">Dietary Preference</label>
              <select
                value={dietaryPref}
                onChange={(e) => setDietaryPref(e.target.value)}
                className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] transition-all"
              >
                <option value="no_preference">No Preference</option>
                <option value="vegetarian">Pure Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="non_veg">Non-Vegetarian</option>
                <option value="halal">Halal</option>
                <option value="jain">Jain Vegetarian</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] mb-1.5">Accessibility</label>
              <select
                value={accessibilityPref}
                onChange={(e) => setAccessibilityPref(e.target.value)}
                className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5] transition-all"
              >
                <option value="standard">Standard Walking</option>
                <option value="wheelchair">Wheelchair Accessible</option>
                <option value="senior">Senior / Easy Mobility</option>
                <option value="low_walking">Low Walking / Short Transit</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-[#DCE6F5] dark:border-[#2A3A56] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6]">
            All itineraries guarantee authentic verified landmarks and no repeated attractions.
          </p>

          <button
            type="submit"
            disabled={isLoading}
            className="px-7 py-3 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white dark:bg-[#60A5FA] dark:hover:bg-[#3B82F6] dark:text-[#0B1224] font-bold text-xs shadow-md shadow-[#3984F5]/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin text-[#FACC15] dark:text-[#0B1224]" />
                <span>Generating Adaptive Itinerary...</span>
              </>
            ) : (
              <>
                <span>Generate Itinerary & Budget Plan</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
