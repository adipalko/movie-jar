import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getUserHouseholds } from '../lib/households';
import type { Household } from '../types';
import { useAuth } from './AuthContext';

interface HouseholdContextType {
  households: Household[];
  activeHousehold: Household | null;
  setActiveHousehold: (household: Household | null) => void;
  refreshHouseholds: () => Promise<void>;
  loading: boolean;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined);

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [activeHousehold, setActiveHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHouseholds();
    } else {
      setHouseholds([]);
      setActiveHousehold(null);
      setLoading(false);
    }
  }, [user]);

  // Load active household from localStorage on mount
  useEffect(() => {
    if (households.length > 0 && !activeHousehold) {
      const savedHouseholdId = localStorage.getItem('activeHouseholdId');
      if (savedHouseholdId) {
        const saved = households.find(h => h.id === savedHouseholdId);
        if (saved) {
          setActiveHousehold(saved);
          return;
        }
      }
      // Default to first household
      setActiveHousehold(households[0]);
    }
  }, [households]);

  // Save active household to localStorage
  useEffect(() => {
    if (activeHousehold) {
      localStorage.setItem('activeHouseholdId', activeHousehold.id);
    }
  }, [activeHousehold]);

  async function loadHouseholds() {
    setLoading(true);
    try {
      const userHouseholds = await getUserHouseholds();
      setHouseholds(userHouseholds);
    } catch (error) {
      console.error('Error loading households:', error);
    } finally {
      setLoading(false);
    }
  }

  async function refreshHouseholds() {
    await loadHouseholds();
  }

  return (
    <HouseholdContext.Provider
      value={{
        households,
        activeHousehold,
        setActiveHousehold,
        refreshHouseholds,
        loading,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error('useHousehold must be used within a HouseholdProvider');
  }
  return context;
}
