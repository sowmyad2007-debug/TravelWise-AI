import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActiveTrip } from '../context/ActiveTripContext';
import { DestinationImage } from '../components/DestinationImage';
import { api } from '../api/client';
import { Trip, Expense, BudgetSummary, ItineraryRevision } from '../types';
import { NavigationSidebar, DashboardTab } from '../components/NavigationSidebar';
import { ExpenseSummaryCard } from '../components/ExpenseSummaryCard';
import { TripCard } from '../components/TripCard';
import { AddExpenseForm } from '../components/AddExpenseForm';
import { ExpenseCharts } from '../components/ExpenseCharts';
import { CurrencyConverter } from '../components/CurrencyConverter';
import { TravelGoals } from '../components/TravelGoals';
import { TravelGlobe } from '../components/TravelGlobe';
import { AdaptiveModal } from '../components/AdaptiveModal';
import { ReceiptVault } from '../components/ReceiptVault';
import {
  Wallet,
  CreditCard,
  PiggyBank,
  Calendar,
  Clock,
  Sparkles,
  Search,
  PlusCircle,
  Plus,
  Trash2,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Users,
  CloudSun,
  CloudRain,
  AlertTriangle,
  History,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  Globe2,
  PieChart,
  Compass,
  DollarSign
} from 'lucide-react';

// Curated destinations for section 4 (Personalized Destination Inspiration)
const INSPIRATION_DESTINATIONS = [
  {
    name: 'Hyderabad',
    state: 'Telangana',
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/71/Charminar_Hyderabad_1.jpg',
    tag: 'Heritage & Palaces',
    dailyBudget: '₹2,800/day',
    highlight: 'Charminar, Golconda Fort & Nizam Royalty'
  },
  {
    name: 'Goa',
    state: 'Goa',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Fort_aguada.jpg',
    tag: 'Coastal Haven',
    dailyBudget: '₹3,200/day',
    highlight: 'Aguada Fort, UNESCO Churches & Sunsets'
  },
  {
    name: 'Ooty',
    state: 'Tamil Nadu',
    image: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Ooty_Lake_in_Tamil_Nadu_04.jpg',
    tag: 'Mountain Escape',
    dailyBudget: '₹2,500/day',
    highlight: 'Botanical Terraces, Ooty Lake & Tea Hills'
  },
  {
    name: 'Munnar',
    state: 'Kerala',
    image: 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Munnar_Overview.jpg',
    tag: 'Tea Highlands',
    dailyBudget: '₹2,600/day',
    highlight: 'Attukad Falls, Misty Peaks & Plantations'
  },
  {
    name: 'Jaipur',
    state: 'Rajasthan',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/41/East_facade_Hawa_Mahal_Jaipur_from_ground_level_%28July_2022%29_-_img_01.jpg',
    tag: 'Pink City Grandeur',
    dailyBudget: '₹3,000/day',
    highlight: 'Hawa Mahal, Amber Palace & Jal Mahal'
  },
  {
    name: 'Manali',
    state: 'Himachal Pradesh',
    image: 'https://upload.wikimedia.org/wikipedia/commons/0/03/Manali_City.jpg',
    tag: 'Alpine Sanctuary',
    dailyBudget: '₹2,700/day',
    highlight: 'Solang Valley, Pine Passes & Hot Springs'
  },
  {
    name: 'Bengaluru',
    state: 'Karnataka',
    image: 'https://upload.wikimedia.org/wikipedia/commons/8/8f/Bangalore_Mysore_Maharaja_Palace.jpg',
    tag: 'Garden Metropolis',
    dailyBudget: '₹3,500/day',
    highlight: 'Lalbagh Glasshouse & Bangalore Palace'
  },
  {
    name: 'Delhi',
    state: 'Delhi NCT',
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/India_Gate_front.jpg',
    tag: 'Imperial Capital',
    dailyBudget: '₹3,400/day',
    highlight: 'Qutub Minar, Red Fort & India Gate'
  },
  {
    name: 'Mumbai',
    state: 'Maharashtra',
    image: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Mumbai_03-2016_30_Gateway_of_India.jpg',
    tag: 'Maximum City',
    dailyBudget: '₹3,800/day',
    highlight: 'Gateway of India, Marine Drive & CSMT'
  },
  {
    name: 'Agra',
    state: 'Uttar Pradesh',
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Taj_Mahal_%28Edited%29.jpeg',
    tag: 'Mughal Wonder',
    dailyBudget: '₹3,000/day',
    highlight: 'Taj Mahal, Agra Fort & Mehtab Bagh'
  },
  {
    name: 'Tirupati',
    state: 'Andhra Pradesh',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Tirumala_090615.jpg',
    tag: 'Sacred Seven Hills',
    dailyBudget: '₹2,200/day',
    highlight: 'Venkateswara Temple, Silathoranam & Theertham'
  },
  {
    name: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/15/RK_Beach_Visakhapatnam.jpg',
    tag: 'Coast & Hills',
    dailyBudget: '₹2,500/day',
    highlight: 'INS Kursura Submarine, RK Beach & Kailasagiri'
  },
  {
    name: 'London',
    state: 'United Kingdom',
    image: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/London_Montage_L.jpg',
    tag: 'Global Metropolis',
    dailyBudget: '£65/day',
    highlight: 'Big Ben, Tower Bridge, British Museum & Eye'
  },
  {
    name: 'Sydney',
    state: 'Australia',
    image: 'https://upload.wikimedia.org/wikipedia/commons/7/7c/Sydney_Opera_House_-_Dec_2008.jpg',
    tag: 'Harbour Sails',
    dailyBudget: 'AU$90/day',
    highlight: 'Sydney Opera House, Harbour Bridge & Bondi Beach'
  },
  {
    name: 'Bali',
    state: 'Indonesia',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Uluwatu_Temple_Bali.jpg',
    tag: 'Tropical Island',
    dailyBudget: '₹2,400/day',
    highlight: 'Uluwatu Sea Temple, Rice Terraces & Tanah Lot'
  },
  {
    name: 'Puducherry',
    state: 'Puducherry UT',
    image: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Promenade_Beach_Pondicherry.jpg',
    tag: 'French Colonial',
    dailyBudget: '₹2,400/day',
    highlight: 'Promenade Beach, French Quarter & Auroville'
  },
  {
    name: 'Kedarnath',
    state: 'Uttarakhand',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Kedarnath_Temple_Uttarakhand.jpg',
    tag: 'Char Dham (Seasonal)',
    dailyBudget: '₹2,000/day',
    highlight: 'Kedarnath Temple, Himalayan Valley & Bhairavnath'
  }
];

export const Dashboard: React.FC<{ defaultTab?: DashboardTab }> = ({ defaultTab }) => {
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as DashboardTab | null;
  const { user } = useAuth();
  const {
    tripsList,
    activeTrip,
    activeTripId,
    setActiveTripId,
    refreshTrips,
    refreshTrip
  } = useActiveTrip();
  const navigate = useNavigate();

  // Tab & Layout States
  const [activeTab, setActiveTab] = useState<DashboardTab>(defaultTab || urlTab || 'overview');
  const [receiptsCount, setReceiptsCount] = useState<number>(0);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    } else if (urlTab) {
      setActiveTab(urlTab);
    }
  }, [defaultTab, urlTab]);

  useEffect(() => {
    api.getReceipts().then(res => setReceiptsCount(res.summary?.total_count || 0)).catch(() => {});
  }, [activeTab]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ongoing' | 'upcoming' | 'completed'>('all');
  const [expenseSearch, setExpenseSearch] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  // Hero Quick Search Widget State
  const [heroDestination, setHeroDestination] = useState('');
  const [heroStartDate, setHeroStartDate] = useState('');
  const [heroTravelers, setHeroTravelers] = useState(2);
  const [heroBudget, setHeroBudget] = useState(15000);

  // Active Trip Specific States
  const [tripExpenses, setTripExpenses] = useState<Expense[]>([]);
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary | null>(null);
  const [revisions, setRevisions] = useState<ItineraryRevision[]>([]);
  const [isUndoing, setIsUndoing] = useState<number | null>(null);

  // Modals & Action States
  const [deletingTripId, setDeletingTripId] = useState<number | null>(null);
  const [adaptiveTripId, setAdaptiveTripId] = useState<number | null>(null);
  const [deletingExpenseId, setDeletingExpenseId] = useState<number | null>(null);

  // Settings State
  const [preferredCurrency, setPreferredCurrency] = useState(user?.preferred_currency || 'INR');
  const [preferredTravelStyle, setPreferredTravelStyle] = useState(user?.preferred_travel_style || 'balanced');
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Fetch expenses and revisions for the active trip
  const reloadExpenses = async () => {
    if (activeTripId) {
      try {
        const res = await api.getTripExpenses(activeTripId);
        setTripExpenses(res.expenses || []);
        setBudgetSummary(res.summary || null);
      } catch (err) {
        setTripExpenses([]);
        setBudgetSummary(null);
      }
    } else {
      setTripExpenses([]);
      setBudgetSummary(null);
    }
  };

  useEffect(() => {
    reloadExpenses();
  }, [activeTripId]);

  useEffect(() => {
    if (activeTripId) {
      api.getTripRevisions(activeTripId)
        .then((res) => setRevisions(res.revisions || []))
        .catch(() => setRevisions([]));
    } else {
      setRevisions([]);
    }
  }, [activeTripId]);

  const handleUndoRevision = async (revId: number) => {
    if (!activeTripId) return;
    if (!confirm('Undo this adaptation and restore the previous itinerary snapshot?')) return;
    setIsUndoing(revId);
    try {
      await api.undoRevision(activeTripId, revId);
      const res = await api.getTripRevisions(activeTripId);
      setRevisions(res.revisions || []);
      await refreshTrip();
      await reloadExpenses();
    } catch (err: any) {
      alert(err.message || 'Failed to rollback revision.');
    } finally {
      setIsUndoing(null);
    }
  };

  const handleDeleteTrip = async (id: number) => {
    try {
      await api.deleteTrip(id);
      await refreshTrips();
      setDeletingTripId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete trip.');
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await api.deleteExpense(id);
      await reloadExpenses();
      await refreshTrip();
      await refreshTrips();
      setDeletingExpenseId(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete expense.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateProfile({
        name: user?.name,
        preferred_currency: preferredCurrency,
        preferred_travel_style: preferredTravelStyle
      });
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update preferences.');
    }
  };

  const handleHeroQuickPlan = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/create-trip', {
      state: {
        destination: heroDestination,
        startDate: heroStartDate,
        travelers: heroTravelers,
        budget: heroBudget
      }
    });
  };

  // Helper date calculations
  const todayStr = new Date().toISOString().split('T')[0];

  const getTripStatus = (trip: Trip): 'ongoing' | 'upcoming' | 'completed' => {
    if (trip.start_date <= todayStr && trip.end_date >= todayStr) return 'ongoing';
    if (trip.start_date > todayStr) return 'upcoming';
    return 'completed';
  };

  const filteredTrips = tripsList.filter((t) => {
    const matchesSearch =
      t.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.starting_city.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return getTripStatus(t) === statusFilter;
  });

  const ongoingCount = tripsList.filter((t) => getTripStatus(t) === 'ongoing').length;
  const upcomingCount = tripsList.filter((t) => getTripStatus(t) === 'upcoming').length;
  const completedCount = tripsList.filter((t) => getTripStatus(t) === 'completed').length;

  // Aggregate metrics
  const totalBudgetManaged = tripsList.reduce((acc, t) => acc + (t.total_budget || 0), 0);
  const totalSpentAcrossTrips = tripsList.reduce((acc, t) => acc + (t.total_spent || 0), 0);

  // Active metrics
  const currentTrip = activeTrip || tripsList.find((t) => t.id === activeTripId) || tripsList[0];
  const activeCurrency = currentTrip?.currency || user?.preferred_currency || 'INR';

  const totalTripBudget = currentTrip ? currentTrip.total_budget : totalBudgetManaged;
  const totalAmountSpent = currentTrip ? currentTrip.total_spent : totalSpentAcrossTrips;
  const remainingBalance = currentTrip ? currentTrip.remaining_budget : Math.max(0, totalBudgetManaged - totalSpentAcrossTrips);

  const durationDays = currentTrip
    ? currentTrip.days?.length ||
      currentTrip.days_count ||
      Math.max(1, Math.ceil((new Date(currentTrip.end_date).getTime() - new Date(currentTrip.start_date).getTime()) / (1000 * 3600 * 24)) + 1)
    : 1;

  const dailyAverageSpending = durationDays > 0 ? Math.round(totalAmountSpent / durationDays) : 0;
  const utilizationPct = totalTripBudget > 0 ? Math.round((totalAmountSpent / totalTripBudget) * 100) : 0;

  // Filtered Expenses for History tab
  const filteredExpenses = tripExpenses.filter((exp) => {
    const matchQuery =
      exp.title.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      (exp.notes && exp.notes.toLowerCase().includes(expenseSearch.toLowerCase())) ||
      (exp.payer_name && exp.payer_name.toLowerCase().includes(expenseSearch.toLowerCase()));

    const matchCategory =
      selectedCategoryFilter === 'all' ||
      exp.category.toLowerCase() === selectedCategoryFilter.toLowerCase();

    return matchQuery && matchCategory;
  });

  // Recent 5 expenses for Overview
  const recentExpenses = [...tripExpenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#F5F8FF] dark:bg-[#0B1224] text-[#172554] dark:text-[#F1F5F9] flex transition-colors duration-300">
      
      {/* 1. LEFT COLLAPSIBLE SIDEBAR */}
      <NavigationSidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        tripsCount={tripsList.length}
        expensesCount={tripExpenses.length}
        receiptsCount={receiptsCount}
      />

      {/* 2. MAIN DASHBOARD CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 bg-[#F5F8FF]/90 dark:bg-[#0B1224]/90 backdrop-blur-md border-b border-[#DCE6F5] dark:border-[#2A3A56] px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Active Trip Picker / Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#3984F5]/10 dark:bg-[#60A5FA]/15 border border-[#3984F5]/30 text-[#3984F5] dark:text-[#60A5FA] flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-[#3984F5] dark:text-[#60A5FA] tracking-wider">
                  Active Travel Workspace
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-[#3984F5] animate-pulse" />
              </div>

              {tripsList.length > 0 ? (
                <div className="flex items-center gap-2">
                  <select
                    value={activeTripId || ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value, 10) : null;
                      setActiveTripId(val);
                    }}
                    className="bg-transparent font-black text-sm sm:text-base text-[#172554] dark:text-[#F1F5F9] cursor-pointer focus:outline-none hover:text-[#3984F5] dark:hover:text-[#60A5FA] transition-colors"
                  >
                    {tripsList.map((t) => (
                      <option key={t.id} value={t.id} className="text-[#172554] dark:bg-[#121D33] dark:text-[#F1F5F9]">
                        {t.title} ({t.destination})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <p className="text-sm font-bold text-[#172554] dark:text-[#F1F5F9]">No journeys planned yet</p>
              )}
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              onClick={() => setActiveTab('add_expense')}
              className="px-4 py-2.5 rounded-xl bg-[#F472B6]/10 hover:bg-[#F472B6]/20 text-[#DB2777] dark:bg-[#F9A8D4]/15 dark:hover:bg-[#F9A8D4]/25 dark:text-[#F9A8D4] font-bold text-xs border border-[#F472B6]/30 shadow-xs transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-[#F472B6] dark:text-[#F9A8D4]" />
              <span className="hidden sm:inline">Add Expense</span>
              <span className="sm:hidden">Log</span>
            </button>

            <Link
              to="/create-trip"
              className="px-4 py-2.5 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white dark:bg-[#60A5FA] dark:hover:bg-[#3B82F6] dark:text-[#0B1224] font-black text-xs shadow-sm shadow-[#3984F5]/25 hover:opacity-95 transition-all flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Plan Journey</span>
            </Link>
          </div>
        </header>

        {/* Inner Main Body */}
        <main className="p-4 sm:p-8 space-y-8 max-w-7xl w-full mx-auto">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* SECTION 1: IMMERSIVE 3D TRAVEL HERO & QUICK SEARCH PANEL */}
              <div className="relative rounded-3xl overflow-hidden border border-[#DCE6F5] dark:border-[#2A3A56] bg-gradient-to-br from-[#FFFFFF] via-[#F5F8FF] to-[#FCE7F3]/30 dark:from-[#121D33] dark:via-[#0B1224] dark:to-[#192640] p-6 sm:p-10 shadow-xs">
                
                {/* Layered Decorative Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#3984F5]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
                <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#F472B6]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  
                  {/* Left Column: Vision & Heading */}
                  <div className="lg:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 dark:bg-[#192640]/90 border border-[#3984F5]/30 text-xs font-bold text-[#3984F5] dark:text-[#60A5FA] shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-[#F472B6]" />
                      <span>Adaptive Travel Intelligence 2.0</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl font-black text-[#172554] dark:text-[#F1F5F9] tracking-tight leading-tight">
                      Your Next Adventure <br className="hidden sm:inline" />
                      <span className="bg-gradient-to-r from-[#3984F5] via-[#F472B6] to-[#FACC15] bg-clip-text text-transparent">
                        Starts Here.
                      </span>
                    </h1>

                    <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#B6C2D6] max-w-xl leading-relaxed">
                      Plan personalized multi-day journeys with authentic landmark photography, intelligent budget ceilings, verified coordinates, and zero-duplicate day schedules.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <Link
                        to="/create-trip"
                        className="px-6 py-3 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white dark:bg-[#60A5FA] dark:hover:bg-[#3B82F6] dark:text-[#0B1224] font-black text-xs sm:text-sm shadow-sm shadow-[#3984F5]/30 hover:opacity-95 transition-all flex items-center gap-2"
                      >
                        <Compass className="w-4 h-4 text-white dark:text-[#0B1224]" />
                        <span>Plan My Trip</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>

                      <button
                        onClick={() => setActiveTab('trips')}
                        className="px-5 py-3 rounded-xl bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] hover:bg-[#F5F8FF] dark:hover:bg-[#192640] text-[#172554] dark:text-[#F1F5F9] font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2"
                      >
                        <span>Browse My Itineraries</span>
                        <ChevronRight className="w-4 h-4 text-[#64748B] dark:text-[#B6C2D6]" />
                      </button>
                    </div>
                  </div>

                  {/* Right Column: Floating Quick-Search Travel Panel */}
                  <div className="lg:col-span-5">
                    <div className="bg-white/95 dark:bg-[#121D33]/95 backdrop-blur-xl border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-[#DCE6F5] dark:border-[#2A3A56] pb-3">
                        <span className="font-extrabold text-xs uppercase tracking-wider text-[#172554] dark:text-[#F1F5F9] flex items-center gap-2">
                          <Compass className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
                          Quick Travel Planner
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] border border-[#3984F5]/30">
                          Personalized
                        </span>
                      </div>

                      <form onSubmit={handleHeroQuickPlan} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-[#64748B] dark:text-[#B6C2D6] flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#3984F5] dark:text-[#60A5FA]" /> Destination
                          </label>
                          <select
                            value={heroDestination}
                            onChange={(e) => setHeroDestination(e.target.value)}
                            className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3.5 py-2.5 text-xs text-[#172554] dark:text-[#F1F5F9] font-semibold focus:outline-none focus:border-[#3984F5]"
                          >
                            <option value="">Select Destination...</option>
                            <optgroup label="South India & Coastal Highlights">
                              <option value="Visakhapatnam">Visakhapatnam (Vizag), Andhra Pradesh</option>
                              <option value="Hyderabad">Hyderabad, Telangana</option>
                              <option value="Munnar">Munnar, Kerala</option>
                              <option value="Kochi">Kochi (Cochin), Kerala</option>
                              <option value="Alappuzha">Alappuzha (Alleppey), Kerala</option>
                              <option value="Puducherry">Puducherry (Pondicherry)</option>
                              <option value="Goa">Goa Beaches & Heritage</option>
                              <option value="Ooty">Ooty, Nilgiris, Tamil Nadu</option>
                              <option value="Chennai">Chennai, Tamil Nadu</option>
                              <option value="Bengaluru">Bengaluru, Karnataka</option>
                              <option value="Mysuru">Mysuru (Mysore), Karnataka</option>
                              <option value="Vijayawada">Vijayawada, Andhra Pradesh</option>
                              <option value="Guntur">Guntur / Amaravati, Andhra Pradesh</option>
                              <option value="Kadapa">Kadapa / Gandikota, Andhra Pradesh</option>
                              <option value="Kurnool">Kurnool / Belum Caves, Andhra Pradesh</option>
                            </optgroup>
                            <optgroup label="Sacred Pilgrimage Destinations">
                              <option value="Tirupati">Tirupati Balaji, Andhra Pradesh</option>
                              <option value="Bhadrachalam">Bhadrachalam, Telangana</option>
                              <option value="Shirdi">Shirdi Sai Baba, Maharashtra</option>
                              <option value="Nashik">Nashik (Trimbakeshwar), Maharashtra</option>
                              <option value="Puri">Puri Jagannath, Odisha</option>
                              <option value="Kedarnath">Kedarnath (Char Dham, Seasonal), Uttarakhand</option>
                              <option value="Badrinath">Badrinath (Char Dham, Seasonal), Uttarakhand</option>
                            </optgroup>
                            <optgroup label="North & Heritage India">
                              <option value="Jaipur">Jaipur (Pink City), Rajasthan</option>
                              <option value="Agra">Agra (Taj Mahal), Uttar Pradesh</option>
                              <option value="Manali">Manali, Himachal Pradesh</option>
                              <option value="Jammu and Kashmir">Jammu and Kashmir (Dal Lake, Gulmarg)</option>
                              <option value="Delhi">Delhi, NCT</option>
                              <option value="Mumbai">Mumbai, Maharashtra</option>
                            </optgroup>
                            <optgroup label="International Destinations">
                              <option value="London">London, United Kingdom</option>
                              <option value="New York">New York City, USA</option>
                              <option value="California">California (SF, LA, Yosemite), USA</option>
                              <option value="Sydney">Sydney, Australia</option>
                              <option value="Melbourne">Melbourne, Australia</option>
                              <option value="Bali">Bali, Indonesia</option>
                              <option value="Vietnam">Vietnam (Ha Long Bay, Hanoi)</option>
                              <option value="Maldives">Maldives Islands</option>
                              <option value="Hong Kong">Hong Kong</option>
                              <option value="China">China (Beijing, Great Wall)</option>
                              <option value="Spain">Spain (Barcelona, Madrid)</option>
                              <option value="Germany">Germany (Berlin, Neuschwanstein)</option>
                              <option value="Russia">Russia (Moscow, St. Petersburg)</option>
                              <option value="Paris">Paris, France</option>
                            </optgroup>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-[#64748B] dark:text-[#B6C2D6] flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-[#3984F5] dark:text-[#60A5FA]" /> Start Date
                            </label>
                            <input
                              type="date"
                              value={heroStartDate}
                              onChange={(e) => setHeroStartDate(e.target.value)}
                              className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] font-semibold focus:outline-none focus:border-[#3984F5]"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[11px] font-bold text-[#64748B] dark:text-[#B6C2D6] flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-[#F472B6] dark:text-[#F9A8D4]" /> Travelers
                            </label>
                            <select
                              value={heroTravelers}
                              onChange={(e) => setHeroTravelers(parseInt(e.target.value, 10))}
                              className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] font-semibold focus:outline-none focus:border-[#3984F5]"
                            >
                              <option value={1}>Solo (1)</option>
                              <option value={2}>Couple (2)</option>
                              <option value={3}>Small Group (3)</option>
                              <option value={4}>Family / Friends (4+)</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <label className="font-bold text-[#64748B] dark:text-[#B6C2D6] flex items-center gap-1">
                              <DollarSign className="w-3.5 h-3.5 text-[#FACC15] dark:text-[#FDE047]" /> Target Budget
                            </label>
                            <span className="font-extrabold text-[#3984F5] dark:text-[#60A5FA] font-mono">
                              ₹{heroBudget.toLocaleString()}
                            </span>
                          </div>
                          <input
                            type="range"
                            min={4000}
                            max={60000}
                            step={1000}
                            value={heroBudget}
                            onChange={(e) => setHeroBudget(parseInt(e.target.value, 10))}
                            className="w-full accent-[#3984F5] dark:accent-[#60A5FA] cursor-pointer"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white dark:bg-[#60A5FA] dark:hover:bg-[#3B82F6] dark:text-[#0B1224] font-black text-xs shadow-sm shadow-[#3984F5]/25 hover:opacity-95 transition-all flex items-center justify-center gap-2"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#FACC15] dark:text-[#0B1224]" />
                          <span>Generate Tailored Itinerary</span>
                        </button>
                      </form>
                    </div>
                  </div>

                </div>
              </div>

              {/* SECTION 2: FOUR EXPENSE & BUDGET SUMMARY CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <ExpenseSummaryCard
                  title="Total Trip Budget"
                  amount={totalTripBudget}
                  currency={activeCurrency}
                  subtitle="Allocated spend ceiling"
                  icon={PiggyBank}
                  badgeText="Budget Cap"
                  badgeType="blue"
                />

                <ExpenseSummaryCard
                  title="Total Amount Spent"
                  amount={totalAmountSpent}
                  currency={activeCurrency}
                  subtitle="Verified ledger debits"
                  icon={CreditCard}
                  badgeText={`${utilizationPct}% Used`}
                  badgeType={utilizationPct > 100 ? 'amber' : 'pink'}
                />

                <ExpenseSummaryCard
                  title="Remaining Balance"
                  amount={remainingBalance}
                  currency={activeCurrency}
                  subtitle="Safe unspent reserves"
                  icon={ShieldCheck}
                  badgeText={remainingBalance < 0 ? 'Deficit' : 'Safe to Spend'}
                  badgeType={remainingBalance < 0 ? 'amber' : 'yellow'}
                />

                <ExpenseSummaryCard
                  title="Daily Avg Spending"
                  amount={dailyAverageSpending}
                  currency={activeCurrency}
                  subtitle={`Calculated over ${durationDays} days`}
                  icon={Calendar}
                  badgeText="Run Rate"
                  badgeType="blue"
                />
              </div>

              {/* SECTION 3: ACTIVE TRIP OVERVIEW & 3D TRAVEL RADAR */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Active Trip Hero Card (7 Cols) */}
                <div className="lg:col-span-7 bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#3984F5]/5 dark:bg-[#60A5FA]/10 rounded-full blur-3xl pointer-events-none" />

                  {currentTrip ? (
                    <>
                      <div className="space-y-4 relative z-10">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3984F5]/10 dark:bg-[#192640] border border-[#3984F5]/30 text-xs font-bold text-[#3984F5] dark:text-[#60A5FA]">
                            <Sparkles className="w-3.5 h-3.5 text-[#F472B6]" />
                            <span>Active Destination: {currentTrip.destination}</span>
                          </div>

                          {currentTrip.weather && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F8FF] dark:bg-[#192640] border border-[#DCE6F5] dark:border-[#2A3A56] text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] shadow-xs">
                              {currentTrip.weather.is_raining ? (
                                <CloudRain className="w-3.5 h-3.5 text-[#3984F5]" />
                              ) : (
                                <CloudSun className="w-3.5 h-3.5 text-[#FACC15]" />
                              )}
                              <span>{currentTrip.weather.temperature_c}°C</span>
                              <span className="text-[#64748B] dark:text-[#B6C2D6] hidden sm:inline">• {currentTrip.weather.condition}</span>
                            </div>
                          )}
                        </div>

                        <div>
                          <h2 className="text-xl sm:text-2xl font-black text-[#172554] dark:text-[#F1F5F9] tracking-tight">
                            {currentTrip.title}
                          </h2>
                          <p className="text-xs sm:text-sm text-[#64748B] dark:text-[#B6C2D6] mt-1 flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
                            <span>{currentTrip.starting_city} → {currentTrip.destination}</span>
                            <span className="text-[#DCE6F5] dark:text-[#2A3A56]">•</span>
                            <Clock className="w-4 h-4 text-[#FACC15]" />
                            <span>{durationDays} Days</span>
                            <span className="text-[#DCE6F5] dark:text-[#2A3A56]">•</span>
                            <Users className="w-4 h-4 text-[#F472B6]" />
                            <span>{currentTrip.travelers} Travelers</span>
                          </p>
                        </div>

                        {/* Budget Progress Meter */}
                        <div className="bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl p-4 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#64748B] dark:text-[#B6C2D6]">Budget Safe Margin</span>
                            <span className="font-extrabold text-[#172554] dark:text-[#F1F5F9] font-mono">
                              {currentTrip.currency} {currentTrip.total_spent.toLocaleString()} / {currentTrip.currency} {currentTrip.total_budget.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-[#DCE6F5] dark:bg-[#192640] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                utilizationPct > 100
                                  ? 'bg-[#EF4444]'
                                  : utilizationPct > 80
                                  ? 'bg-[#FACC15]'
                                  : 'bg-[#3984F5] dark:bg-[#60A5FA]'
                              }`}
                              style={{ width: `${Math.min(100, utilizationPct)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#B6C2D6] pt-1">
                            <span>{utilizationPct}% utilized</span>
                            <span className={remainingBalance < 0 ? 'text-[#EF4444] font-bold' : 'text-[#3984F5] dark:text-[#60A5FA] font-bold'}>
                              {currentTrip.currency} {remainingBalance.toLocaleString()} {remainingBalance < 0 ? 'deficit' : 'available'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Navigation Links */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#DCE6F5] dark:border-[#2A3A56] relative z-10">
                        <Link
                          to="/itinerary"
                          className="p-2.5 rounded-xl bg-[#3984F5]/10 hover:bg-[#3984F5]/20 dark:bg-[#60A5FA]/15 dark:hover:bg-[#60A5FA]/25 text-[#3984F5] dark:text-[#60A5FA] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Itinerary</span>
                        </Link>
                        <Link
                          to="/budget"
                          className="p-2.5 rounded-xl bg-[#FACC15]/15 hover:bg-[#FACC15]/25 dark:bg-[#FDE047]/15 dark:hover:bg-[#FDE047]/25 text-[#B45309] dark:text-[#FDE047] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        >
                          <PieChart className="w-3.5 h-3.5 text-[#FACC15]" />
                          <span>Guardian</span>
                        </Link>
                        <Link
                          to="/group-splitter"
                          className="p-2.5 rounded-xl bg-[#F472B6]/10 hover:bg-[#F472B6]/20 dark:bg-[#F9A8D4]/15 dark:hover:bg-[#F9A8D4]/25 text-[#DB2777] dark:text-[#F9A8D4] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Users className="w-3.5 h-3.5 text-[#F472B6]" />
                          <span>Splitter</span>
                        </Link>
                        <button
                          onClick={() => setAdaptiveTripId(currentTrip.id)}
                          className="p-2.5 rounded-xl bg-[#3984F5]/10 hover:bg-[#3984F5]/20 dark:bg-[#60A5FA]/15 dark:hover:bg-[#60A5FA]/25 text-[#3984F5] dark:text-[#60A5FA] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#3984F5] dark:text-[#60A5FA]" />
                          <span>Adaptive AI</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="py-12 text-center space-y-3">
                      <p className="text-sm font-semibold text-[#64748B] dark:text-[#B6C2D6]">No active journey selected.</p>
                      <Link
                        to="/create-trip"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3984F5] text-white font-bold text-xs shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create A Trip</span>
                      </Link>
                    </div>
                  )}
                </div>

                {/* 3D Earth Mini Radar (5 Cols) */}
                <div className="lg:col-span-5 bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-2">
                        <Globe2 className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
                        <span>Global Travel Radar</span>
                      </h3>
                      <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6]">Interactive 3D flight path projection</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] border border-[#3984F5]/30">
                      WebGL 3D
                    </span>
                  </div>

                  <TravelGlobe
                    activeDestination={currentTrip?.destination}
                    className="h-56 sm:h-64 w-full"
                  />

                  <div className="p-3 bg-[#F5F8FF] dark:bg-[#0B1224] rounded-2xl border border-[#DCE6F5] dark:border-[#2A3A56] flex items-center justify-between text-xs">
                    <span className="text-[#64748B] dark:text-[#B6C2D6] font-medium">Tracking Route:</span>
                    <span className="font-extrabold text-[#3984F5] dark:text-[#60A5FA] flex items-center gap-1">
                      <span>{currentTrip?.starting_city || 'Origin'}</span>
                      <ArrowRight className="w-3 h-3 text-[#F472B6]" />
                      <span>{currentTrip?.destination || 'Destination'}</span>
                    </span>
                  </div>
                </div>

              </div>

              {/* SECTION 4: PERSONALIZED DESTINATION INSPIRATION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-[#172554] dark:text-[#F1F5F9] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#F472B6]" />
                      <span>Curated Destination Inspiration</span>
                    </h3>
                    <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">
                      Verified authentic attractions, benchmarked daily budgets, and real scenery
                    </p>
                  </div>
                  <Link
                    to="/create-trip"
                    className="text-xs font-bold text-[#3984F5] dark:text-[#60A5FA] hover:underline flex items-center gap-1"
                  >
                    <span>Custom Destination</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {INSPIRATION_DESTINATIONS.slice(0, 5).map((dest) => (
                    <div
                      key={dest.name}
                      onClick={() => navigate('/create-trip', { state: { destination: dest.name } })}
                      className="group relative bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl overflow-hidden cursor-pointer shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div className="relative h-36 w-full overflow-hidden">
                        <DestinationImage
                          src={dest.image}
                          alt={dest.name}
                          fallbackText={dest.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B1224]/85 via-transparent to-transparent" />
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-white/90 dark:bg-[#121D33]/90 text-[10px] font-bold text-[#172554] dark:text-[#F1F5F9] backdrop-blur-sm border border-[#DCE6F5] dark:border-[#2A3A56]">
                          {dest.tag}
                        </span>
                        <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                          <p className="font-extrabold text-sm truncate">{dest.name}</p>
                          <p className="text-[10px] text-white/80">{dest.state}</p>
                        </div>
                      </div>

                      <div className="p-3 space-y-2 bg-white dark:bg-[#121D33]">
                        <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6] line-clamp-1">{dest.highlight}</p>
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-[#DCE6F5] dark:border-[#2A3A56]">
                          <span className="text-[10px] font-bold text-[#3984F5] dark:text-[#60A5FA]">{dest.dailyBudget}</span>
                          <span className="text-[10px] font-bold text-[#3984F5] dark:text-[#60A5FA] group-hover:underline">Plan &rarr;</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 5: MY UPCOMING & ONGOING JOURNEYS */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-black text-[#172554] dark:text-[#F1F5F9] flex items-center gap-2">
                      <Compass className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
                      <span>My Travel Itineraries ({tripsList.length})</span>
                    </h3>
                    <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">
                      Interact with your travel cards to review day-by-day plans
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('trips')}
                    className="text-xs font-bold text-[#3984F5] dark:text-[#60A5FA] hover:underline flex items-center gap-1"
                  >
                    <span>View All Catalog</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {tripsList.length === 0 ? (
                  <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-12 text-center space-y-4 shadow-xs">
                    <Globe2 className="w-12 h-12 text-[#3984F5] dark:text-[#60A5FA] mx-auto opacity-70" />
                    <div className="space-y-1">
                      <h4 className="text-base font-extrabold text-[#172554] dark:text-[#F1F5F9]">No active trips scheduled</h4>
                      <p className="text-xs text-[#64748B] dark:text-[#B6C2D6] max-w-sm mx-auto">
                        Choose any destination or click below to launch the personalized trip builder.
                      </p>
                    </div>
                    <Link
                      to="/create-trip"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs shadow-sm transition-all"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Build First Itinerary</span>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tripsList.slice(0, 6).map((trip) => (
                      <TripCard
                        key={trip.id}
                        trip={trip}
                        isActive={trip.id === activeTripId}
                        onSelect={(id) => {
                          setActiveTripId(id);
                        }}
                        onViewDetails={(id) => {
                          setActiveTripId(id);
                          navigate('/itinerary');
                        }}
                        onDelete={(id) => setDeletingTripId(id)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION 6: RECENT EXPENSES & ADAPTIVE HISTORY */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Recent Expenses Feed (7 Cols) */}
                <div className="lg:col-span-7 bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-[#172554] dark:text-[#F1F5F9]">Recent Transactions</h3>
                      <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">Latest expenses logged for this journey</p>
                    </div>
                    <button
                      onClick={() => setActiveTab('history')}
                      className="text-xs font-bold text-[#3984F5] dark:text-[#60A5FA] hover:underline flex items-center gap-1"
                    >
                      <span>View All ({tripExpenses.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {recentExpenses.length === 0 ? (
                    <div className="py-12 text-center bg-[#F5F8FF] dark:bg-[#0B1224] rounded-2xl border border-dashed border-[#DCE6F5] dark:border-[#2A3A56] space-y-3">
                      <CreditCard className="w-10 h-10 text-[#64748B] dark:text-[#B6C2D6] mx-auto" />
                      <div>
                        <p className="text-xs font-bold text-[#172554] dark:text-[#F1F5F9]">No expenses recorded yet</p>
                        <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6] mt-0.5">Start tracking flights, meals, or hotels</p>
                      </div>
                      <button
                        onClick={() => setActiveTab('add_expense')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#3984F5] text-white font-bold text-xs shadow-xs hover:bg-[#2563EB] transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Log First Expense</span>
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#DCE6F5] dark:divide-[#2A3A56]">
                      {recentExpenses.map((exp) => (
                        <div key={exp.id} className="py-3.5 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-[#3984F5]/10 dark:bg-[#192640] text-[#3984F5] dark:text-[#60A5FA] border border-[#3984F5]/20 flex items-center justify-center font-black text-xs uppercase shadow-xs">
                              {exp.category.slice(0, 3)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#172554] dark:text-[#F1F5F9]">{exp.title}</p>
                              <div className="flex items-center gap-2 text-[10px] text-[#64748B] dark:text-[#B6C2D6]">
                                <span>{exp.date}</span>
                                <span>•</span>
                                <span>Paid by {exp.payer_name}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <p className="text-xs font-black text-[#172554] dark:text-[#F1F5F9] font-mono">
                              {exp.currency} {exp.amount.toLocaleString()}
                            </p>
                            <span className="text-[10px] font-bold text-[#3984F5] dark:text-[#60A5FA] bg-[#3984F5]/10 dark:bg-[#192640] px-2 py-0.5 rounded-full border border-[#3984F5]/20">
                              {exp.category}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Adaptive Revisions Feed (5 Cols) */}
                <div className="lg:col-span-5 bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-extrabold text-[#172554] dark:text-[#F1F5F9] flex items-center gap-2">
                        <History className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
                        <span>Adaptive AI History</span>
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">Snapshots with 1-click rollback</p>
                    </div>
                    {revisions.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] border border-[#3984F5]/30">
                        {revisions.length} Snapshots
                      </span>
                    )}
                  </div>

                  {revisions.length === 0 ? (
                    <div className="py-10 text-center bg-[#F5F8FF] dark:bg-[#0B1224] rounded-2xl border border-dashed border-[#DCE6F5] dark:border-[#2A3A56] space-y-2">
                      <Sparkles className="w-8 h-8 text-[#F472B6] mx-auto opacity-70" />
                      <p className="text-xs font-bold text-[#172554] dark:text-[#F1F5F9]">Clean Baseline Schedule</p>
                      <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6] max-w-xs mx-auto">
                        No automated schedule adaptations made yet. Launch Adaptive AI anytime your plans change.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {revisions.slice(0, 3).map((rev) => (
                        <div
                          key={rev.id}
                          className="bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl p-3.5 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-full bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] text-[10px] font-extrabold uppercase border border-[#3984F5]/20">
                              {rev.scenario}
                            </span>
                            <span className="text-[10px] text-[#64748B] dark:text-[#B6C2D6]">
                              {new Date(rev.applied_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <p className="text-xs font-medium text-[#64748B] dark:text-[#B6C2D6]">
                            {rev.summary}
                          </p>

                          {rev.can_undo === 1 && (
                            <button
                              onClick={() => handleUndoRevision(rev.id)}
                              disabled={isUndoing === rev.id}
                              className="text-[11px] font-bold text-[#3984F5] dark:text-[#60A5FA] hover:underline flex items-center gap-1 transition-all"
                            >
                              <RotateCcw className={`w-3 h-3 ${isUndoing === rev.id ? 'animate-spin' : ''}`} />
                              <span>{isUndoing === rev.id ? 'Restoring...' : 'Rollback Revision'}</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: MY TRIPS */}
          {activeTab === 'trips' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Header & Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#172554] dark:text-[#F1F5F9]">Travel Itineraries Catalog</h2>
                  <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">All planned, active, and completed journeys</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* Status Pills */}
                  <div className="flex items-center bg-[#DCE6F5]/50 dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl p-1 text-xs">
                    <button
                      onClick={() => setStatusFilter('all')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        statusFilter === 'all'
                          ? 'bg-white dark:bg-[#192640] text-[#3984F5] dark:text-[#60A5FA] shadow-xs'
                          : 'text-[#64748B] dark:text-[#B6C2D6]'
                      }`}
                    >
                      All ({tripsList.length})
                    </button>
                    <button
                      onClick={() => setStatusFilter('ongoing')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        statusFilter === 'ongoing'
                          ? 'bg-white dark:bg-[#192640] text-[#3984F5] dark:text-[#60A5FA] shadow-xs'
                          : 'text-[#64748B] dark:text-[#B6C2D6]'
                      }`}
                    >
                      Active ({ongoingCount})
                    </button>
                    <button
                      onClick={() => setStatusFilter('upcoming')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        statusFilter === 'upcoming'
                          ? 'bg-white dark:bg-[#192640] text-[#3984F5] dark:text-[#60A5FA] shadow-xs'
                          : 'text-[#64748B] dark:text-[#B6C2D6]'
                      }`}
                    >
                      Upcoming ({upcomingCount})
                    </button>
                    <button
                      onClick={() => setStatusFilter('completed')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        statusFilter === 'completed'
                          ? 'bg-white dark:bg-[#192640] text-[#3984F5] dark:text-[#60A5FA] shadow-xs'
                          : 'text-[#64748B] dark:text-[#B6C2D6]'
                      }`}
                    >
                      Past ({completedCount})
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#64748B] dark:text-[#B6C2D6]" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search destination..."
                      className="w-full bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl pl-9 pr-3 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] placeholder-[#64748B] dark:placeholder-[#B6C2D6] focus:outline-none focus:border-[#3984F5] shadow-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Grid of Trips */}
              {filteredTrips.length === 0 ? (
                <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-12 text-center space-y-4 shadow-xs">
                  <Globe2 className="w-12 h-12 text-[#3984F5] dark:text-[#60A5FA] mx-auto opacity-70" />
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9]">No travel itineraries found</h3>
                    <p className="text-xs text-[#64748B] dark:text-[#B6C2D6] max-w-sm mx-auto">
                      {searchTerm || statusFilter !== 'all'
                        ? 'No trips matched your search filter. Try clearing your filters.'
                        : 'Ready for your next adventure? Build an intelligent, budget-guarded itinerary in seconds.'}
                    </p>
                  </div>
                  <Link
                    to="/create-trip"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs shadow-xs"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Plan New Journey</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTrips.map((trip) => (
                    <TripCard
                      key={trip.id}
                      trip={trip}
                      isActive={trip.id === activeTripId}
                      onSelect={(id) => {
                        setActiveTripId(id);
                        setActiveTab('overview');
                      }}
                      onViewDetails={(id) => {
                        setActiveTripId(id);
                        navigate('/itinerary');
                      }}
                      onDelete={(id) => setDeletingTripId(id)}
                    />
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB: RECEIPT VAULT */}
          {activeTab === 'receipts' && (
            <div className="space-y-6">
              <ReceiptVault
                trips={tripsList}
                activeTripId={activeTripId}
                onNavigateToTrip={(tid) => {
                  setActiveTripId(tid);
                  navigate('/itinerary');
                }}
              />
            </div>
          )}

          {/* TAB 3: ADD EXPENSE */}
          {activeTab === 'add_expense' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
              <AddExpenseForm
                trips={tripsList}
                activeTripId={activeTripId}
                onExpenseAdded={async () => {
                  await reloadExpenses();
                  await refreshTrip();
                  await refreshTrips();
                  setActiveTab('history');
                }}
                onCancel={() => setActiveTab('overview')}
              />
            </div>
          )}

          {/* TAB 4: EXPENSE HISTORY */}
          {activeTab === 'history' && (
            <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#172554] dark:text-[#F1F5F9]">Complete Expense Ledger</h2>
                  <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">
                    Showing verified expenses for {currentTrip?.title || 'active trip'}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* Category Filter */}
                  <select
                    value={selectedCategoryFilter}
                    onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                    className="bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-3 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  >
                    <option value="all">All Categories</option>
                    <option value="flights">Flights</option>
                    <option value="accommodation">Accommodation</option>
                    <option value="food">Food & Dining</option>
                    <option value="transportation">Transportation</option>
                    <option value="shopping">Shopping</option>
                    <option value="activities">Activities</option>
                    <option value="miscellaneous">Miscellaneous</option>
                  </select>

                  {/* Search Filter */}
                  <div className="relative w-full sm:w-56">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#64748B] dark:text-[#B6C2D6]" />
                    <input
                      type="text"
                      value={expenseSearch}
                      onChange={(e) => setExpenseSearch(e.target.value)}
                      placeholder="Search expenses..."
                      className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl pl-9 pr-3 py-2 text-xs text-[#172554] dark:text-[#F1F5F9] placeholder-[#64748B] dark:placeholder-[#B6C2D6] focus:outline-none focus:border-[#3984F5]"
                    />
                  </div>

                  <button
                    onClick={() => setActiveTab('add_expense')}
                    className="px-4 py-2 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4 text-white" />
                    <span>Add New</span>
                  </button>
                </div>
              </div>

              {/* Expense Table */}
              {filteredExpenses.length === 0 ? (
                <div className="py-16 text-center space-y-3 bg-[#F5F8FF] dark:bg-[#0B1224] rounded-2xl border border-dashed border-[#DCE6F5] dark:border-[#2A3A56]">
                  <CreditCard className="w-12 h-12 text-[#64748B] dark:text-[#B6C2D6] mx-auto" />
                  <p className="text-sm font-bold text-[#172554] dark:text-[#F1F5F9]">No matching transactions found</p>
                  <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">Try adjusting your category filter or search query</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#DCE6F5] dark:border-[#2A3A56] text-[10px] uppercase font-bold text-[#64748B] dark:text-[#B6C2D6] tracking-wider">
                        <th className="py-3 px-3">Expense Details</th>
                        <th className="py-3 px-3">Category</th>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">Payer</th>
                        <th className="py-3 px-3 text-right">Amount</th>
                        <th className="py-3 px-3 text-center">Receipt</th>
                        <th className="py-3 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE6F5] dark:divide-[#2A3A56]">
                      {filteredExpenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-[#F5F8FF] dark:hover:bg-[#192640] transition-colors">
                          <td className="py-3.5 px-3">
                            <p className="font-bold text-[#172554] dark:text-[#F1F5F9]">{exp.title}</p>
                            {exp.notes && (
                              <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6] truncate max-w-xs">{exp.notes}</p>
                            )}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] border border-[#3984F5]/20 capitalize">
                              {exp.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-[#64748B] dark:text-[#B6C2D6] font-mono">
                            {exp.date}
                          </td>
                          <td className="py-3.5 px-3 text-[#172554] dark:text-[#F1F5F9] font-medium">
                            {exp.payer_name}
                          </td>
                          <td className="py-3.5 px-3 text-right font-black font-mono text-[#172554] dark:text-[#F1F5F9]">
                            {exp.currency} {exp.amount.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            {exp.receipt_filename || exp.receipt_url ? (
                              <span className="text-[10px] font-bold text-[#3984F5] dark:text-[#60A5FA] bg-[#3984F5]/10 px-2 py-0.5 rounded-full border border-[#3984F5]/30">
                                Attached
                              </span>
                            ) : (
                              <span className="text-[#64748B] dark:text-[#B6C2D6]">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              onClick={() => setDeletingExpenseId(exp.id)}
                              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                              title="Delete Transaction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: BUDGET PLANNER */}
          {activeTab === 'budget_planner' && (
            <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 shadow-xs space-y-8 animate-fadeIn">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#172554] dark:text-[#F1F5F9]">Three-Tier Financial Guard</h2>
                  <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">
                    Separates verified debits from planned targets and living buffer reserves
                  </p>
                </div>
                <Link
                  to="/budget"
                  className="px-4 py-2 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <PieChart className="w-4 h-4 text-white" />
                  <span>Open Deep Guardian</span>
                </Link>
              </div>

              {/* Three Pillars Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] border border-[#3984F5]/30 flex items-center justify-center font-black">
                    1
                  </div>
                  <h3 className="text-sm font-bold text-[#172554] dark:text-[#F1F5F9]">Verified Actual Ledger</h3>
                  <p className="text-2xl font-black text-[#3984F5] dark:text-[#60A5FA] font-mono">
                    {activeCurrency} {totalAmountSpent.toLocaleString()}
                  </p>
                  <p className="text-xs text-[#64748B] dark:text-[#B6C2D6] leading-relaxed">
                    Hard debits logged via receipts and manual entries. Guaranteed spent.
                  </p>
                </div>

                <div className="bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#F472B6]/10 text-[#F472B6] dark:text-[#F9A8D4] border border-[#F472B6]/30 flex items-center justify-center font-black">
                    2
                  </div>
                  <h3 className="text-sm font-bold text-[#172554] dark:text-[#F1F5F9]">Future Commitments</h3>
                  <p className="text-2xl font-black text-[#F472B6] dark:text-[#F9A8D4] font-mono">
                    {activeCurrency} {budgetSummary?.estimated_future_commitments?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-[#64748B] dark:text-[#B6C2D6] leading-relaxed">
                    Unvisited itinerary stops, admission tickets, and transit scheduled ahead.
                  </p>
                </div>

                <div className="bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#FACC15]/20 text-[#B45309] dark:text-[#FDE047] border border-[#FACC15]/40 flex items-center justify-center font-black">
                    3
                  </div>
                  <h3 className="text-sm font-bold text-[#172554] dark:text-[#F1F5F9]">Living Expense Buffer</h3>
                  <p className="text-2xl font-black text-[#B45309] dark:text-[#FDE047] font-mono">
                    {activeCurrency} {Math.max(0, remainingBalance - (budgetSummary?.estimated_future_commitments || 0)).toLocaleString()}
                  </p>
                  <p className="text-xs text-[#64748B] dark:text-[#B6C2D6] leading-relaxed">
                    Emergency safety buffer reserved for meals, tips, transport surge, and contingencies.
                  </p>
                </div>
              </div>

              {/* Warning / Deficit Check */}
              {remainingBalance < 0 ? (
                <div className="p-5 rounded-2xl bg-[#EF4444]/10 dark:bg-[#EF4444]/15 border border-[#EF4444]/30 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#EF4444] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-[#EF4444]">Budget Deficit Detected</h4>
                    <p className="text-xs text-[#EF4444]/90">
                      Expenditures have exceeded the allocated budget by {activeCurrency} {Math.abs(remainingBalance).toLocaleString()}. Launch Adaptive AI to auto-swap upcoming high-cost attractions for free or budget alternatives.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-[#3984F5]/10 dark:bg-[#192640] border border-[#3984F5]/30 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-[#3984F5] dark:text-[#60A5FA] shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-[#3984F5] dark:text-[#60A5FA]">Financial Health: Safe Margin</h4>
                    <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">
                      Your travel plan is currently within budget limits with {activeCurrency} {remainingBalance.toLocaleString()} remaining.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: ANALYTICS & REPORTS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 animate-fadeIn">
              <ExpenseCharts
                expenses={tripExpenses}
                summary={budgetSummary}
                currency={activeCurrency}
              />
            </div>
          )}

          {/* TAB 7: CURRENCY CONVERTER */}
          {activeTab === 'converter' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
              <CurrencyConverter />
            </div>
          )}

          {/* TAB 8: TRAVEL GOALS */}
          {activeTab === 'goals' && (
            <div className="space-y-6 animate-fadeIn">
              <TravelGoals />
            </div>
          )}

          {/* TAB 9: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-black text-[#172554] dark:text-[#F1F5F9]">Account & Finance Preferences</h2>
                <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">Manage base currency and travel profile</p>
              </div>

              {settingsSuccess && (
                <div className="p-3 bg-[#3984F5]/10 border border-[#3984F5]/30 rounded-2xl text-xs font-bold text-[#3984F5] dark:text-[#60A5FA] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
                  <span>Preferences saved successfully!</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B] dark:text-[#B6C2D6]">User Name</label>
                  <input
                    type="text"
                    value={user?.name || ''}
                    disabled
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-4 py-2.5 text-xs text-[#64748B] dark:text-[#B6C2D6] cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B] dark:text-[#B6C2D6]">Email Address</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-4 py-2.5 text-xs text-[#64748B] dark:text-[#B6C2D6] cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B] dark:text-[#B6C2D6]">Default Currency</label>
                  <select
                    value={preferredCurrency}
                    onChange={(e) => setPreferredCurrency(e.target.value)}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-4 py-2.5 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  >
                    <option value="INR">INR (₹) - Indian Rupee</option>
                    <option value="USD">USD ($) - US Dollar</option>
                    <option value="EUR">EUR (€) - Euro</option>
                    <option value="GBP">GBP (£) - British Pound</option>
                    <option value="JPY">JPY (¥) - Japanese Yen</option>
                    <option value="AUD">AUD (A$) - Australian Dollar</option>
                    <option value="CAD">CAD (C$) - Canadian Dollar</option>
                    <option value="AED">AED - UAE Dirham</option>
                    <option value="SGD">SGD (S$) - Singapore Dollar</option>
                    <option value="CHF">CHF - Swiss Franc</option>
                    <option value="THB">THB (฿) - Thai Baht</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#64748B] dark:text-[#B6C2D6]">Travel Style Default</label>
                  <select
                    value={preferredTravelStyle}
                    onChange={(e) => setPreferredTravelStyle(e.target.value)}
                    className="w-full bg-[#F5F8FF] dark:bg-[#0B1224] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-xl px-4 py-2.5 text-xs text-[#172554] dark:text-[#F1F5F9] focus:outline-none focus:border-[#3984F5]"
                  >
                    <option value="budget">Budget-Conscious Traveler</option>
                    <option value="balanced">Balanced Value Explorer</option>
                    <option value="comfort">Comfort & Premium Experiences</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#3984F5] hover:bg-[#2563EB] text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Save Preferences</span>
                </button>
              </form>
            </div>
          )}

        </main>
      </div>

      {/* Trip Deletion Confirmation Modal */}
      {deletingTripId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9]">Delete Trip Permanently?</h3>
              <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">
                This will delete the itinerary, recorded expenses, and group splits.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeletingTripId(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#DCE6F5]/50 dark:bg-[#192640] text-[#172554] dark:text-[#F1F5F9] text-xs font-semibold hover:bg-[#DCE6F5]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTrip(deletingTripId)}
                className="flex-1 py-2.5 rounded-xl bg-[#EF4444] text-white text-xs font-bold hover:bg-[#DC2626] shadow-sm shadow-[#EF4444]/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expense Deletion Confirmation Modal */}
      {deletingExpenseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 text-[#EF4444] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-[#172554] dark:text-[#F1F5F9]">Delete Transaction?</h3>
              <p className="text-xs text-[#64748B] dark:text-[#B6C2D6]">
                This transaction will be removed from your ledger and budget totals will update immediately.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setDeletingExpenseId(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#DCE6F5]/50 dark:bg-[#192640] text-[#172554] dark:text-[#F1F5F9] text-xs font-semibold hover:bg-[#DCE6F5]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteExpense(deletingExpenseId)}
                className="flex-1 py-2.5 rounded-xl bg-[#EF4444] text-white text-xs font-bold hover:bg-[#DC2626] shadow-sm shadow-[#EF4444]/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adaptive Modal triggered from card or action */}
      <AdaptiveModal
        isOpen={adaptiveTripId !== null}
        onClose={() => setAdaptiveTripId(null)}
        initialScenario="overspent"
      />

    </div>
  );
};
