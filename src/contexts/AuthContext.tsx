
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
      console.log('Inicializando autenticação...');
      setLoading(true);
      
      // Set up auth state listener FIRST
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, newSession) => {
          console.log('Auth state changed:', event);
          console.log('New session:', newSession?.user?.email || 'No user');
          
          setSession(newSession);
          setUser(newSession?.user ?? null);
          
          if (event === 'SIGNED_IN') {
            toast.success("Login realizado com sucesso");
            // Buscamos o perfil do usuário após login para ter certeza que existe
            if (newSession?.user?.id) {
              setTimeout(() => {
                fetchUserProfile(newSession.user.id);
              }, 100);
            }
          } else if (event === 'SIGNED_OUT') {
            toast.success("Logout realizado com sucesso");
          } else if (event === 'USER_UPDATED') {
            console.log("Usuário atualizado:", newSession?.user);
          }
        }
      );
      
      // THEN check for existing session
      const { data } = await supabase.auth.getSession();
      console.log('Sessão existente:', data.session?.user?.email || 'Nenhuma sessão');
      
      setSession(data.session);
      setUser(data.session?.user ?? null);
      
      if (data.session?.user) {
        // Buscamos o perfil do usuário se já estiver autenticado
        setTimeout(() => {
          fetchUserProfile(data.session.user.id);
        }, 100);
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
    if (!userId) {
      console.log('fetchUserProfile: nenhum userId fornecido');
      return;
    }
    
    try {
      console.log('Buscando perfil do usuário:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error("Erro ao buscar perfil do usuário:", error);
        
        // Se o perfil não existir, podemos tentar criá-lo
        if (error.code === 'PGRST116') {
          console.log('Perfil não encontrado, tentando criar...');
          createUserProfile(userId);
        }
      } else if (!data) {
        console.log('Perfil não encontrado, criando novo perfil...');
        // Se não há erro mas também não há dados, criamos o perfil
        createUserProfile(userId);
      } else {
        console.log("Perfil do usuário encontrado:", data);
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
    }
  };
  
  // Função para criar o perfil do usuário se não existir
  const createUserProfile = async (userId: string) => {
    if (!user) {
      console.log('createUserProfile: nenhum usuário autenticado');
      return;
    }
    
    try {
      console.log("Criando perfil para o usuário:", userId);
      
      // Verificar se já existe uma clínica para este usuário
      const { data: existingClinic, error: clinicCheckError } = await supabase
        .from('clinics')
        .select('id')
        .eq('name', `Clínica de ${user.email?.split('@')[0] || 'Novo Usuário'}`)
        .maybeSingle();
        
      if (clinicCheckError) {
        console.error("Erro ao verificar clínica existente:", clinicCheckError);
      }
      
      let clinicId;
      
      if (existingClinic) {
        console.log("Clínica já existe, usando existente:", existingClinic.id);
        clinicId = existingClinic.id;
      } else {
        // Primeiro criamos uma clínica para o usuário
        const { data: newClinic, error: clinicError } = await supabase
          .from('clinics')
          .insert([{
            name: `Clínica de ${user.email?.split('@')[0] || 'Novo Usuário'}`
          }])
          .select('id')
          .single();
          
        if (clinicError) {
          console.error("Erro ao criar clínica:", clinicError);
          throw clinicError;
        }
        
        console.log("Clínica criada com sucesso:", newClinic);
        clinicId = newClinic?.id;
      }
      
      if (clinicId) {
        // Verificar se o perfil já existe
        const { data: existingProfile, error: profileCheckError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
          
        if (profileCheckError) {
          console.error("Erro ao verificar perfil existente:", profileCheckError);
        }
        
        if (existingProfile) {
          console.log("Perfil já existe, não é necessário criar novamente");
          return;
        }
        
        // Depois criamos o perfil do usuário com a clínica
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            email: user.email,
            role: 'admin_clinic',
            clinic_id: clinicId
          }]);
          
        if (profileError) {
          console.error("Erro ao criar perfil:", profileError);
          throw profileError;
        }
        
        console.log("Perfil do usuário criado com sucesso");
      }
    } catch (error) {
      console.error("Erro ao criar perfil do usuário:", error);
      toast.error("Erro ao configurar seu perfil. Por favor, tente novamente.");
    }
  };

  // Sign in function
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      console.log("Tentando fazer login com:", email);
      
      // Verificar se o usuário existe mesmo que tenha um erro de email não confirmado
      let loginResult = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      // Se der erro de email não confirmado, tenta atualizar o usuário para confirmado
      if (loginResult.error && loginResult.error.message.includes('Email not confirmed')) {
        console.log("Email não confirmado, tentando confirmar automaticamente...");
        
        // Tenta atualizar o usuário para confirmado e fazer login novamente
        try {
          // Primeiro, tenta obter o usuário atual (pode funcionar em alguns casos)
          const { data: authData } = await supabase.auth.getUser();
          
          if (authData.user) {
            console.log("Usuário encontrado, criando perfil se necessário");
            setTimeout(() => {
              fetchUserProfile(authData.user?.id);
            }, 100);
            
            // Tenta login novamente
            loginResult = await supabase.auth.signInWithPassword({
              email,
              password
            });
          } else {
            console.log("Usuário não encontrado após tentativa de auto-confirmação");
          }
        } catch (confirmError) {
          console.error("Erro ao tentar auto-confirmar email:", confirmError);
        }
      }
      
      // Verifica o resultado final do login
      if (loginResult.error) {
        console.error("Erro final ao fazer login:", loginResult.error);
        throw loginResult.error;
      }

      console.log("Login bem-sucedido:", loginResult.data.user?.email);
      
      // Verificar e garantir que o perfil do usuário existe
      if (loginResult.data.user) {
        setTimeout(() => {
          fetchUserProfile(loginResult.data.user?.id);
        }, 100);
      }
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error("Erro completo ao fazer login:", error);
      toast.error("Erro ao fazer login: " + error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      console.log("Fazendo logout...");
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
