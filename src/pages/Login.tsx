
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, isAuthenticated } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isRegister) {
        // Registrar novo usuário
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: 'admin_clinic'
            }
          }
        });
        
        if (error) throw error;
        
        if (data?.user) {
          // Criar clínica para o novo usuário
          const { error: clinicError } = await supabase
            .from('clinics')
            .insert({
              name: `Clínica de ${email.split('@')[0]}`
            })
            .select('id')
            .single();
            
          if (clinicError) throw clinicError;
            
          toast.success("Cadastro realizado com sucesso! Faça login para continuar.");
          setIsRegister(false);
        }
      } else {
        // Login do usuário
        await signIn(email, password);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast.error(error.message || "Ocorreu um erro durante a autenticação");
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-8 bg-white shadow-lg rounded-xl">
        <div className="text-center">
          <img 
            src="https://sq360.com.br/logo-hubb-novo/logo_hubb_assisit.png" 
            alt="Hubb Assist" 
            className="h-16 mx-auto" 
          />
          <h2 className="mt-6 text-2xl font-bold text-hubAssist-primary">
            {isRegister ? 'Criar Nova Conta' : 'Acesso ao Sistema'}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {isRegister ? 'Preencha os dados para se cadastrar' : 'Faça login para acessar o Hubb Assist'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="form-input-group">
              <Label htmlFor="email" className="required-field">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-input-group">
              <Label htmlFor="password" className="required-field">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              className="w-full btn-primary"
              disabled={isLoading}
            >
              {isLoading 
                ? (isRegister ? 'Cadastrando...' : 'Entrando...') 
                : (isRegister ? 'Cadastrar' : 'Entrar')}
            </Button>
          </div>
          
          <div className="text-center text-sm">
            <button 
              type="button" 
              className="text-hubAssist-primary hover:underline" 
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister 
                ? 'Já tem uma conta? Faça login' 
                : 'Não tem uma conta? Cadastre-se'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
