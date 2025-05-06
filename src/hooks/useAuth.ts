
import { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useProfile } from './useProfile';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { fetchUserProfile } = useProfile(user?.id);

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
      
      setUser(loginResult.data.user);
      setSession(loginResult.data.session);
      
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
      
      setUser(null);
      setSession(null);
      
      navigate('/login');
    } catch (error: any) {
      toast.error("Erro ao fazer logout: " + error.message);
      console.error("Sign out error:", error);
    }
  };

  // Função para atualizar o estado com base na sessão
  const setSessionAndUser = (newSession: Session | null) => {
    setSession(newSession);
    setUser(newSession?.user ?? null);
  };

  return {
    user,
    session,
    loading,
    signIn,
    signOut,
    setSessionAndUser,
    isAuthenticated: !!session
  };
};
