import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActiveTrip } from '../context/ActiveTripContext';
import { useTheme } from '../context/ThemeContext';
import {
  Compass,
  MapPin,
  Calendar,
  PieChart,
  Users,
  HelpCircle,
  PlusCircle,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Sun,
  Moon,
  Receipt as ReceiptIcon
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { activeTrip, tripsList, setActiveTripId } = useActiveTrip();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileOpen, setProfileOpen] = useState(false);
  const [tripDropdownOpen, setTripDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 dark:bg-[#121D33]/95 backdrop-blur-md border-b border-[#DCE6F5] dark:border-[#2A3A56] text-[#172554] dark:text-[#F1F5F9] transition-colors duration-250 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group" aria-label="TravelWise AI+ Home">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3984F5] via-[#F472B6] to-[#FACC15] flex items-center justify-center shadow-md shadow-[#3984F5]/25 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
                <Compass className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight text-[#172554] dark:text-[#F1F5F9] flex items-center gap-1">
                  TravelWise <span className="bg-gradient-to-r from-[#3984F5] via-[#F472B6] to-[#FACC15] bg-clip-text text-transparent">AI+</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B] dark:text-[#B6C2D6] -mt-1 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-[#FACC15]" />
                  <span>Adaptive Travel Tech</span>
                </span>
              </div>
            </Link>
          </div>

          {/* Center Navigation Links (Authenticated) */}
          {isAuthenticated ? (
            <div className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
              <Link
                to="/dashboard"
                className={`px-3 py-1.5 rounded-xl text-xs lg:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  isActive('/dashboard')
                    ? 'bg-[#3984F5]/10 text-[#3984F5] dark:bg-[#60A5FA]/15 dark:text-[#60A5FA] border border-[#3984F5]/30 shadow-xs'
                    : 'text-[#64748B] dark:text-[#B6C2D6] hover:text-[#172554] dark:hover:text-white hover:bg-[#F5F8FF] dark:hover:bg-[#192640]'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/create-trip"
                className={`px-3 py-1.5 rounded-xl text-xs lg:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  isActive('/create-trip')
                    ? 'bg-[#3984F5]/10 text-[#3984F5] dark:bg-[#60A5FA]/15 dark:text-[#60A5FA] border border-[#3984F5]/30 shadow-xs'
                    : 'text-[#64748B] dark:text-[#B6C2D6] hover:text-[#172554] dark:hover:text-white hover:bg-[#F5F8FF] dark:hover:bg-[#192640]'
                }`}
              >
                <PlusCircle className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
                Plan Trip
              </Link>
              <Link
                to="/itinerary"
                className={`px-3 py-1.5 rounded-xl text-xs lg:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  isActive('/itinerary')
                    ? 'bg-[#3984F5]/10 text-[#3984F5] dark:bg-[#60A5FA]/15 dark:text-[#60A5FA] border border-[#3984F5]/30 shadow-xs'
                    : 'text-[#64748B] dark:text-[#B6C2D6] hover:text-[#172554] dark:hover:text-white hover:bg-[#F5F8FF] dark:hover:bg-[#192640]'
                }`}
              >
                <Calendar className="w-4 h-4 text-[#F472B6] dark:text-[#F9A8D4]" />
                Itinerary
              </Link>
              <Link
                to="/budget"
                className={`px-3 py-1.5 rounded-xl text-xs lg:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  isActive('/budget')
                    ? 'bg-[#3984F5]/10 text-[#3984F5] dark:bg-[#60A5FA]/15 dark:text-[#60A5FA] border border-[#3984F5]/30 shadow-xs'
                    : 'text-[#64748B] dark:text-[#B6C2D6] hover:text-[#172554] dark:hover:text-white hover:bg-[#F5F8FF] dark:hover:bg-[#192640]'
                }`}
              >
                <PieChart className="w-4 h-4 text-[#FACC15] dark:text-[#FDE047]" />
                Budget Guardian
              </Link>
              <Link
                to="/receipts"
                className={`px-3 py-1.5 rounded-xl text-xs lg:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  isActive('/receipts')
                    ? 'bg-[#3984F5]/10 text-[#3984F5] dark:bg-[#60A5FA]/15 dark:text-[#60A5FA] border border-[#3984F5]/30 shadow-xs'
                    : 'text-[#64748B] dark:text-[#B6C2D6] hover:text-[#172554] dark:hover:text-white hover:bg-[#F5F8FF] dark:hover:bg-[#192640]'
                }`}
              >
                <ReceiptIcon className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
                Receipts
              </Link>
              <Link
                to="/group-splitter"
                className={`px-3 py-1.5 rounded-xl text-xs lg:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  isActive('/group-splitter')
                    ? 'bg-[#3984F5]/10 text-[#3984F5] dark:bg-[#60A5FA]/15 dark:text-[#60A5FA] border border-[#3984F5]/30 shadow-xs'
                    : 'text-[#64748B] dark:text-[#B6C2D6] hover:text-[#172554] dark:hover:text-white hover:bg-[#F5F8FF] dark:hover:bg-[#192640]'
                }`}
              >
                <Users className="w-4 h-4 text-[#F472B6] dark:text-[#F9A8D4]" />
                Group Splitter
              </Link>
              <Link
                to="/helper"
                className={`px-3 py-1.5 rounded-xl text-xs lg:text-sm font-semibold transition-all flex items-center gap-1.5 ${
                  isActive('/helper')
                    ? 'bg-[#3984F5]/10 text-[#3984F5] dark:bg-[#60A5FA]/15 dark:text-[#60A5FA] border border-[#3984F5]/30 shadow-xs'
                    : 'text-[#64748B] dark:text-[#B6C2D6] hover:text-[#172554] dark:hover:text-white hover:bg-[#F5F8FF] dark:hover:bg-[#192640]'
                }`}
              >
                <HelpCircle className="w-4 h-4 text-[#FACC15] dark:text-[#FDE047]" />
                Travel Helper
              </Link>
            </div>
          ) : (
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/#features" className="text-sm text-[#64748B] dark:text-[#B6C2D6] hover:text-[#3984F5] dark:hover:text-[#60A5FA] font-medium transition-colors">Features</Link>
              <Link to="/#destinations" className="text-sm text-[#64748B] dark:text-[#B6C2D6] hover:text-[#3984F5] dark:hover:text-[#60A5FA] font-medium transition-colors">Destinations</Link>
              <Link to="/helper" className="text-sm text-[#64748B] dark:text-[#B6C2D6] hover:text-[#3984F5] dark:hover:text-[#60A5FA] font-medium transition-colors">Travel FAQs & Safety</Link>
            </div>
          )}

          {/* Right Section: Active Trip Selector, Theme Toggle & User Profile */}
          <div className="hidden md:flex items-center space-x-3">
            
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-[#F5F8FF] dark:bg-[#192640] border border-[#DCE6F5] dark:border-[#2A3A56] hover:border-[#3984F5]/50 text-[#172554] dark:text-[#F1F5F9] transition-all focus:outline-none focus:ring-2 focus:ring-[#3984F5]/30"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#FDE047] transition-transform duration-300 hover:rotate-45" />
              ) : (
                <Moon className="w-4 h-4 text-[#3984F5] transition-transform duration-300 hover:-rotate-12" />
              )}
            </button>

            {isAuthenticated ? (
              <>
                {/* Active Trip Selector Pill */}
                {tripsList.length > 0 && (
                  <div className="relative">
                    <button
                      onClick={() => setTripDropdownOpen(!tripDropdownOpen)}
                      className="flex items-center gap-2 bg-white dark:bg-[#192640] border border-[#DCE6F5] dark:border-[#2A3A56] hover:border-[#3984F5]/60 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#172554] dark:text-[#F1F5F9] transition-all shadow-xs hover:shadow-sm"
                      aria-haspopup="true"
                      aria-expanded={tripDropdownOpen}
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#3984F5] dark:text-[#60A5FA]" />
                      <span className="max-w-[120px] truncate">
                        {activeTrip ? activeTrip.destination : 'Select Trip'}
                      </span>
                      {activeTrip?.weather && (
                        <span className="text-[10px] bg-[#3984F5]/10 dark:bg-[#60A5FA]/15 px-1.5 py-0.5 rounded-md text-[#2563EB] dark:text-[#93C5FD] font-mono flex items-center gap-1 border border-[#3984F5]/20">
                          <span>{activeTrip.weather.temperature_c}°C</span>
                          <span>{activeTrip.weather.icon}</span>
                        </span>
                      )}
                      <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                    </button>

                    {tripDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl shadow-xl py-2 z-50 animate-fadeIn">
                        <div className="px-3.5 py-1.5 text-[11px] font-bold text-[#64748B] dark:text-[#B6C2D6] uppercase tracking-wider border-b border-[#DCE6F5] dark:border-[#2A3A56]">
                          Active Trip Workspace
                        </div>
                        <div className="max-h-56 overflow-y-auto">
                          {tripsList.map((t) => (
                            <button
                              key={t.id}
                              onClick={() => {
                                setActiveTripId(t.id);
                                setTripDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3.5 py-2 text-xs flex items-center justify-between hover:bg-[#F5F8FF] dark:hover:bg-[#192640] transition-colors ${
                                activeTrip?.id === t.id ? 'bg-[#3984F5]/10 text-[#3984F5] dark:text-[#60A5FA] font-bold' : 'text-[#172554] dark:text-[#F1F5F9]'
                              }`}
                            >
                              <div className="truncate pr-2">
                                <p className="font-semibold text-[#172554] dark:text-[#F1F5F9] truncate">{t.destination}</p>
                                <p className="text-[10px] text-[#64748B] dark:text-[#B6C2D6]">{t.travel_style} • {t.currency} {t.total_budget.toLocaleString()}</p>
                              </div>
                              {activeTrip?.id === t.id && (
                                <span className="w-2 h-2 rounded-full bg-[#3984F5] dark:bg-[#60A5FA]"></span>
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-[#DCE6F5] dark:border-[#2A3A56] pt-1.5 mt-1 px-2">
                          <Link
                            to="/create-trip"
                            onClick={() => setTripDropdownOpen(false)}
                            className="w-full text-left px-2 py-1.5 text-xs text-[#3984F5] dark:text-[#60A5FA] hover:underline flex items-center gap-1.5 font-bold"
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-[#3984F5] dark:text-[#60A5FA]" />
                            + Plan New Trip
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 bg-white dark:bg-[#192640] hover:bg-[#F5F8FF] dark:hover:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] p-1.5 pl-3 rounded-full text-xs text-[#172554] dark:text-white transition-all shadow-xs focus:outline-none"
                    aria-haspopup="true"
                    aria-expanded={profileOpen}
                  >
                    <span className="font-bold">{user?.name?.split(' ')[0] || 'User'}</span>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#3984F5] via-[#F472B6] to-[#FACC15] text-white font-black flex items-center justify-center shadow-xs">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#121D33] border border-[#DCE6F5] dark:border-[#2A3A56] rounded-2xl shadow-xl py-2 z-50 animate-fadeIn">
                      <div className="px-4 py-2 border-b border-[#DCE6F5] dark:border-[#2A3A56]">
                        <p className="text-xs font-bold text-[#172554] dark:text-white truncate">{user?.name}</p>
                        <p className="text-[11px] text-[#64748B] dark:text-[#B6C2D6] truncate">{user?.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-[#64748B] dark:text-[#B6C2D6] hover:bg-[#F5F8FF] dark:hover:bg-[#192640] hover:text-[#172554] dark:hover:text-white transition-colors"
                      >
                        <User className="w-4 h-4 text-[#3984F5] dark:text-[#60A5FA]" />
                        Profile & Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors text-left font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-xs font-bold text-[#172554] dark:text-white hover:text-[#3984F5] px-3.5 py-2 rounded-xl hover:bg-[#F5F8FF] dark:hover:bg-[#192640] transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="text-xs font-bold bg-[#3984F5] hover:bg-[#2563EB] text-white px-4.5 py-2 rounded-xl shadow-md shadow-[#3984F5]/25 hover:shadow-lg hover:scale-105 transition-all"
                >
                  Sign Up Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-[#F5F8FF] dark:bg-[#192640] border border-[#DCE6F5] dark:border-[#2A3A56] text-[#172554] dark:text-[#F1F5F9]"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[#FDE047]" /> : <Moon className="w-4 h-4 text-[#3984F5]" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#172554] dark:text-white hover:bg-[#F5F8FF] dark:hover:bg-[#192640] focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-[#121D33] border-b border-[#DCE6F5] dark:border-[#2A3A56] px-4 pt-2 pb-6 space-y-2 animate-fadeIn shadow-xl">
          {isAuthenticated ? (
            <>
              <div className="px-3 py-2 border-b border-[#DCE6F5] dark:border-[#2A3A56] mb-2">
                <p className="text-xs font-bold text-[#172554] dark:text-white">{user?.name}</p>
                <p className="text-[11px] text-[#3984F5] dark:text-[#60A5FA]">{user?.email}</p>
                {activeTrip && (
                  <p className="text-[10px] text-[#64748B] dark:text-[#B6C2D6] mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#3984F5]" />
                    Active: {activeTrip.destination}
                  </p>
                )}
              </div>
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#172554] dark:text-[#F1F5F9] hover:bg-[#F5F8FF] dark:hover:bg-[#192640]"
              >
                Dashboard
              </Link>
              <Link
                to="/create-trip"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-bold text-[#3984F5] dark:text-[#60A5FA] hover:bg-[#F5F8FF] dark:hover:bg-[#192640]"
              >
                + Plan New Trip
              </Link>
              <Link
                to="/itinerary"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#172554] dark:text-[#F1F5F9] hover:bg-[#F5F8FF] dark:hover:bg-[#192640]"
              >
                Itinerary Timeline
              </Link>
              <Link
                to="/budget"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#172554] dark:text-[#F1F5F9] hover:bg-[#F5F8FF] dark:hover:bg-[#192640]"
              >
                Budget Guardian
              </Link>
              <Link
                to="/receipts"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#172554] dark:text-[#F1F5F9] hover:bg-[#F5F8FF] dark:hover:bg-[#192640]"
              >
                Receipt Vault & Invoices
              </Link>
              <Link
                to="/group-splitter"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#172554] dark:text-[#F1F5F9] hover:bg-[#F5F8FF] dark:hover:bg-[#192640]"
              >
                Group Expense Splitter
              </Link>
              <Link
                to="/helper"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#172554] dark:text-[#F1F5F9] hover:bg-[#F5F8FF] dark:hover:bg-[#192640]"
              >
                Travel Helper & FAQs
              </Link>
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-xl text-sm font-semibold text-[#172554] dark:text-[#F1F5F9] hover:bg-[#F5F8FF] dark:hover:bg-[#192640]"
              >
                Profile & Settings
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20"
              >
                Log Out
              </button>
            </>
          ) : (
            <div className="space-y-3 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-2.5 rounded-xl text-sm font-bold text-[#172554] dark:text-white bg-[#F5F8FF] dark:bg-[#192640] border border-[#DCE6F5] dark:border-[#2A3A56]"
              >
                Log In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center w-full py-2.5 rounded-xl text-sm font-bold bg-[#3984F5] text-white"
              >
                Sign Up Free
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
