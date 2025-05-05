
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Check if we have a session when the provider loads
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      
      // Set up auth state listener FIRST
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, newSession) => {
          console.log('Auth state changed:', event);
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          if (event === 'SIGNED_IN') {
            toast.success("Login realizado com sucesso");
            // Buscamos o perfil do usuário após login para ter certeza que existe
            setTimeout(() => {
              fetchUserProfile(newSession?.user?.id);
            }, 0);
          } else if (event === 'SIGNED_OUT') {
            toast.success("Logout realizado com sucesso");
          }
        }
      );
      
      // THEN check for existing session
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user ?? null);
      
      if (data.session?.user) {
        // Buscamos o perfil do usuário se já estiver autenticado
        fetchUserProfile(data.session.user.id);
      }
      
      setLoading(false);
      
      return () => {
        subscription.unsubscribe();
      };
    };

    initializeAuth();
  }, []);

  // Função para buscar o perfil do usuário
  const fetchUserProfile = async (userId: string | undefined) => {
    if (!userId) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error("Erro ao buscar perfil do usuário:", error);
        
        // Se o perfil não existir, podemos tentar criá-lo
        if (error.code === 'PGRST116') {
          createUserProfile(userId);
        }
      }
      
      console.log("Perfil do usuário:", data);
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
    }
  };
  
  // Função para criar o perfil do usuário se não existir
  const createUserProfile = async (userId: string) => {
    if (!user) return;
    
    try {
      // Primeiro criamos uma clínica para o usuário
      const { data: clinicData, error: clinicError } = await supabase
        .from('clinics')
        .insert({
          name: `Clínica de ${user.email?.split('@')[0] || 'Novo Usuário'}`
        })
        .select('id')
        .single();
        
      if (clinicError) throw clinicError;
      
      if (clinicData) {
        // Depois criamos o perfil do usuário com a clínica
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: user.email,
            role: 'admin_clinic',
            clinic_id: clinicData.id
          });
          
        if (profileError) throw profileError;
        
        console.log("Perfil do usuário criado com sucesso");
      }
    } catch (error) {
      console.error("Erro ao criar perfil do usuário:", error);
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      navigate('/dashboard');
    } catch (error: any) {
      toast.error("Erro ao fazer login: " + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      navigate('/login');
    } catch (error: any) {
      toast.error("Erro ao fazer logout: " + error.message);
      console.error("Sign out error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      loading, 
      signIn, 
      signOut,
      isAuthenticated: !!session 
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
