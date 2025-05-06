
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth as useAuthHook } from '@/hooks/useAuth';
import { User, Session } from '@supabase/supabase-js';

// Types for our auth context
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

// Creating the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { 
    user, 
    session, 
    loading, 
    signIn, 
    signOut, 
    setSessionAndUser, 
    isAuthenticated 
  } = useAuthHook();

  // Check if we have a session when the provider loads
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('Inicializando autenticação...');
      
      // Set up auth state listener FIRST
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, newSession) => {
          console.log('Auth state changed:', event);
          console.log('New session:', newSession?.user?.email || 'No user');
          
          setSessionAndUser(newSession);
        }
      );
      
      // THEN check for existing session
      const { data } = await supabase.auth.getSession();
      console.log('Sessão existente:', data.session?.user?.email || 'Nenhuma sessão');
      
      setSessionAndUser(data.session);
      
      return () => {
        subscription.unsubscribe();
      };
    };

    initializeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      signIn, 
      signOut,
      isAuthenticated 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
