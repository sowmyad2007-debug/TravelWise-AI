import React, { createContext, useContext, useState, useEffect } from 'react';
import { Trip } from '../types';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

interface ActiveTripContextType {
  activeTrip: Trip | null;
  activeTripId: number | null;
  setActiveTripId: (id: number | null) => void;
  tripsList: Trip[];
  refreshTrips: () => Promise<void>;
  refreshTrip: () => Promise<void>;
  isLoading: boolean;
}

const ActiveTripContext = createContext<ActiveTripContextType | undefined>(undefined);

export const ActiveTripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [tripsList, setTripsList] = useState<Trip[]>([]);
  const [activeTripId, setActiveTripIdState] = useState<number | null>(() => {
    const saved = localStorage.getItem('travelwise_active_trip_id');
    return saved ? parseInt(saved, 10) : null;
  });
  const [activeTrip, setActiveTrip] = useState<Trip | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const setActiveTripId = (id: number | null) => {
    setActiveTripIdState(id);
    if (id) {
      localStorage.setItem('travelwise_active_trip_id', id.toString());
    } else {
      localStorage.removeItem('travelwise_active_trip_id');
    }
  };

  const refreshTrips = async () => {
    if (!isAuthenticated) {
      setTripsList([]);
      setActiveTrip(null);
      return;
    }
    try {
      const res = await api.getTrips();
      setTripsList(res.trips);
      // If activeTripId is not in list or not set, set to first trip
      if (res.trips.length > 0) {
        if (!activeTripId || !res.trips.some((t: Trip) => t.id === activeTripId)) {
          setActiveTripId(res.trips[0].id);
        }
      } else {
        setActiveTripId(null);
        setActiveTrip(null);
      }
    } catch (err) {
      console.error('Failed to load trips list', err);
    }
  };

  const refreshTrip = async () => {
    if (!activeTripId || !isAuthenticated) {
      setActiveTrip(null);
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.getTrip(activeTripId);
      setActiveTrip(res.trip);
    } catch (err) {
      console.error('Failed to load active trip details', err);
      setActiveTrip(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      refreshTrips();
    } else {
      setTripsList([]);
      setActiveTrip(null);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (activeTripId && isAuthenticated) {
      refreshTrip();
    }
  }, [activeTripId, isAuthenticated]);

  return (
    <ActiveTripContext.Provider
      value={{
        activeTrip,
        activeTripId,
        setActiveTripId,
        tripsList,
        refreshTrips,
        refreshTrip,
        isLoading,
      }}
    >
      {children}
    </ActiveTripContext.Provider>
  );
};

export const useActiveTrip = () => {
  const context = useContext(ActiveTripContext);
  if (!context) {
    throw new Error('useActiveTrip must be used within an ActiveTripProvider');
  }
  return context;
};
