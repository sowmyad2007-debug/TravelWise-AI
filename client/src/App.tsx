import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ActiveTripProvider } from './context/ActiveTripContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ChatbotDrawer } from './components/ChatbotDrawer';
import { AdaptiveModal } from './components/AdaptiveModal';

// Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { TripCreate } from './pages/TripCreate';
import { ItineraryView } from './pages/ItineraryView';
import { BudgetDashboard } from './pages/BudgetDashboard';
import { GroupSplitter } from './pages/GroupSplitter';
import { TravelHelper } from './pages/TravelHelper';
import { UserProfile } from './pages/UserProfile';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [globalAdaptiveOpen, setGlobalAdaptiveOpen] = useState(false);
  const [globalAdaptiveScenario, setGlobalAdaptiveScenario] = useState('overspent');

  const handleOpenAdaptive = (scenario: string) => {
    setGlobalAdaptiveScenario(scenario);
    setGlobalAdaptiveOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F8FF] text-[#172554] dark:bg-[#0B1224] dark:text-[#F1F5F9] font-sans selection:bg-[#3984F5] selection:text-white transition-colors duration-250">
      <Navbar />
      
      <main className="flex-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/helper" element={<TravelHelper />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receipts"
            element={
              <ProtectedRoute>
                <Dashboard defaultTab="receipts" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-trip"
            element={
              <ProtectedRoute>
                <TripCreate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/itinerary"
            element={
              <ProtectedRoute>
                <ItineraryView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/budget"
            element={
              <ProtectedRoute>
                <BudgetDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/group-splitter"
            element={
              <ProtectedRoute>
                <GroupSplitter />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />

      {/* Floating AI Travel Buddy Chatbot */}
      <ChatbotDrawer onOpenAdaptive={handleOpenAdaptive} />

      {/* Global Adaptive Modal triggered from chatbot or anywhere */}
      <AdaptiveModal
        isOpen={globalAdaptiveOpen}
        onClose={() => setGlobalAdaptiveOpen(false)}
        initialScenario={globalAdaptiveScenario}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <ActiveTripProvider>
            <AppContent />
          </ActiveTripProvider>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}
