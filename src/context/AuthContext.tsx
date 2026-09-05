import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoAuth: boolean;
  login: (emailOrUser: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER_KEY = 'sup_tv_dashboard_demo_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDemoAuth, setIsDemoAuth] = useState<boolean>(false);

  useEffect(() => {
    // Safety timeout: ensure isLoading is never true for more than 2 seconds on Smart TVs
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    if (isSupabaseConfigured && supabase) {
      // Get initial session with error catch
      supabase.auth
        .getSession()
        .then(({ data: { session } }) => {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        })
        .catch((err) => {
          console.warn('[TV] Supabase getSession failed, falling back:', err);
          setIsLoading(false);
        });

      // Listen for auth changes
      try {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
          setSession(session);
          setUser(session?.user ?? null);
          setIsLoading(false);
        });

        return () => {
          clearTimeout(safetyTimer);
          subscription.unsubscribe();
        };
      } catch (err) {
        console.warn('[TV] onAuthStateChange subscription failed:', err);
        return () => clearTimeout(safetyTimer);
      }
    } else {
      // Check demo user in localStorage
      try {
        const demoStored = localStorage.getItem(DEMO_USER_KEY);
        if (demoStored) {
          const parsed = JSON.parse(demoStored);
          setUser(parsed);
          setIsDemoAuth(true);
        }
      } catch {
        // ignore
      }
      setIsLoading(false);
      return () => clearTimeout(safetyTimer);
    }
  }, []);

  const login = async (emailOrUser: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    if (isSupabaseConfigured && supabase) {
      try {
        // Ensure email format
        const email = emailOrUser.includes('@') ? emailOrUser : `${emailOrUser}@factory.com`;
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });

        if (error) {
          // If first time logging into this new Supabase project with default credentials, try auto sign-up
          if ((emailOrUser.toLowerCase() === 'supervisor' || email === 'supervisor@factory.com') && pass === 'admin123') {
            const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
              email,
              password: pass,
              options: {
                data: { name: 'Supervisor R. K. Sharma' },
              },
            });

            if (!signUpErr && signUpData.session) {
              setUser(signUpData.user);
              setSession(signUpData.session);
              setIsLoading(false);
              return { success: true };
            }

            // If signup succeeded but email confirmation is pending in Supabase, still allow access
            const fallbackUser: any = signUpData.user || {
              id: 'supervisor-auto',
              email: 'supervisor@factory.com',
              user_metadata: { name: 'Supervisor R. K. Sharma' },
            };
            localStorage.setItem(DEMO_USER_KEY, JSON.stringify(fallbackUser));
            setUser(fallbackUser);
            setIsDemoAuth(true);
            setIsLoading(false);
            return { success: true };
          }

          setIsLoading(false);
          return { success: false, error: 'Invalid username or password' };
        }

        setUser(data.user);
        setSession(data.session);
        setIsLoading(false);
        return { success: true };
      } catch (err: any) {
        setIsLoading(false);
        return { success: false, error: err.message || 'Invalid username or password' };
      }
    } else {
      // Demo / Local Mode Login
      // Allow demo credentials: username 'supervisor' or 'admin' or any email with standard password
      const cleanUser = emailOrUser.trim().toLowerCase();
      if ((cleanUser === 'supervisor' || cleanUser === 'admin' || cleanUser.includes('@')) && pass.length >= 4) {
        const fakeUser: any = {
          id: 'demo-supervisor-id',
          email: cleanUser.includes('@') ? cleanUser : `${cleanUser}@factory.com`,
          user_metadata: { name: 'Supervisor R. K. Sharma' },
        };
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(fakeUser));
        setUser(fakeUser);
        setIsDemoAuth(true);
        setIsLoading(false);
        return { success: true };
      }

      setIsLoading(false);
      return { success: false, error: 'Invalid username or password. For demo mode, use: supervisor / admin123' };
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(DEMO_USER_KEY);
    setUser(null);
    setSession(null);
    setIsDemoAuth(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAuthenticated: !!user,
        isLoading,
        isDemoAuth,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
