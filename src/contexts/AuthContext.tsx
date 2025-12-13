import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getCurrentAppUser } from '../lib/auth';
import type { AppUser } from '../types';

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  setAppUser: (user: AppUser | null) => void;
  refreshAppUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadAppUser();
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadAppUser();
      } else {
        setAppUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadAppUser() {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      const currentAppUser = await getCurrentAppUser();
      setAppUser(currentAppUser);
      
      // Update email if it's missing
      if (currentAppUser && currentUser && !currentAppUser.email && currentUser.email) {
        try {
          await supabase
            .from('app_users')
            .update({ email: currentUser.email })
            .eq('id', currentUser.id);
          // Refresh app user after update
          const updated = await getCurrentAppUser();
          setAppUser(updated);
        } catch (error) {
          console.warn('Failed to update email:', error);
        }
      }
    } catch (error) {
      console.error('Error loading app user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function refreshAppUser() {
    await loadAppUser();
  }

  return (
    <AuthContext.Provider value={{ user, appUser, loading, setAppUser, refreshAppUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
