
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Types for our auth context
interface User {
  id: string;
  email: string;
  clinic_id: string;
  role: 'admin_clinic' | 'profissional_clinic';
}

interface AuthContextType {
  user: User | null;
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
  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  // Mock user for demo purposes (will be replaced with Supabase)
  const mockUser: User = {
    id: 'mock-user-id',
    email: 'demo@hubbassist.com',
    clinic_id: 'mock-clinic-id',
    role: 'admin_clinic'
  };

  // Check if we have a session when the provider loads
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Mock session check (will be replaced with Supabase session)
        const hasSession = localStorage.getItem('hubb_assist_session');
        
        if (hasSession) {
          setUser(mockUser);
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  // Sign in function
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // Mock sign in (will be replaced with Supabase auth)
      if (email && password) {
        // Store mock session
        localStorage.setItem('hubb_assist_session', 'mock-session-token');
        setUser(mockUser);
        toast.success("Login realizado com sucesso");
        navigate('/dashboard');
      } else {
        throw new Error("E-mail e senha são obrigatórios");
      }
    } catch (error) {
      toast.error("Erro ao fazer login: " + (error instanceof Error ? error.message : "Credenciais inválidas"));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      // Mock sign out (will be replaced with Supabase auth)
      localStorage.removeItem('hubb_assist_session');
      setUser(null);
      toast.success("Logout realizado com sucesso");
      navigate('/login');
    } catch (error) {
      toast.error("Erro ao fazer logout");
      console.error("Sign out error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signIn, 
      signOut,
      isAuthenticated: !!user 
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
