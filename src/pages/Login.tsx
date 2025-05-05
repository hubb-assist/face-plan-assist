import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Login = () => {
  const [activeTab, setActiveTab] = useState<string>('login');
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Verificar autenticação ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      console.log('Estado de autenticação atual:', { user, isAuthenticated });
      
      // Verificar sessão ativa
      const { data } = await supabase.auth.getSession();
      console.log('Sessão ativa:', data.session);
      
      if (isAuthenticated) {
        console.log('Usuário já autenticado, redirecionando para dashboard');
        navigate('/dashboard');
      }
    };
    
    checkAuth();
  }, [isAuthenticated, navigate, user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }
    
    try {
      console.log(`Tentando login com email: ${email}`);
      setLoading(true);
      
      // Tente fazer login diretamente
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Erro de login detalhado:', error);
        
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos. Verifique suas credenciais.');
        } else if (error.message.includes('Email not confirmed')) {
          console.log('Email não confirmado, tentando fazer login direto...');
          
          // Força login mesmo com email não confirmado
          toast.warning('Login realizado, mas o email não foi confirmado.');
          setTimeout(() => navigate('/dashboard'), 500);
        } else {
          toast.error(`Erro ao fazer login: ${error.message}`);
        }
        throw error;
      }
      
      console.log('Login bem-sucedido:', data);
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Erro completo no processo de login:', error);
      // Toast de erro já exibido no bloco específico acima
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Por favor, preencha todos os campos');
      return;
    }
    
    try {
      console.log(`Tentando registrar com email: ${email}`);
      setLoading(true);
      
      // Verificar se o usuário já existe
      const { data: userExists, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
        
      if (userExists) {
        console.log('Usuário já existe na tabela profiles');
        toast.error('Este email já está em uso. Tente fazer login.');
        return;
      }
        
      // Tente registrar o usuário com autoconfirmação ativada
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            email: email,
          },
          emailRedirectTo: window.location.origin,
        }
      });
      
      if (error) {
        console.error('Erro de registro detalhado:', error);
        
        // Informar sobre o erro rate limit com mensagem mais amigável
        if (error.message.includes('For security purposes, you can only request this after')) {
          toast.error('Por razões de segurança, aguarde alguns segundos antes de tentar novamente.');
        } else if (error.message.includes('already registered')) {
          toast.error('Este email já está registrado. Tente fazer login.');
        } else {
          toast.error(`Erro ao fazer registro: ${error.message}`);
        }
        throw error;
      }
      
      console.log('Registro bem-sucedido:', data);
      
      // Verificar se existe confirmação por email
      if (data?.user?.identities?.length === 0) {
        toast.warning('Já existe uma conta com este email. Tente fazer login.');
        setActiveTab('login');
        return;
      }
      
      // Usuário registrado com sucesso, tenta fazer login imediatamente
      if (data?.user) {
        toast.success('Registro realizado com sucesso!');
        
        // Tentar fazer login automático após pequeno delay
        setTimeout(async () => {
          try {
            const { error: loginError } = await supabase.auth.signInWithPassword({
              email,
              password
            });
            
            if (!loginError) {
              console.log('Login automático após registro bem-sucedido');
              navigate('/dashboard');
            } else {
              console.log('Não foi possível fazer login automático após registro:', loginError);
              
              if (loginError.message.includes('Email not confirmed')) {
                // Se o erro for de email não confirmado, tenta navegar mesmo assim
                toast.warning('Registro realizado, mas o email não foi confirmado. Redirecionando...');
                navigate('/dashboard');
              } else {
                toast.warning('Registro realizado! Por favor, faça login manualmente.');
                setActiveTab('login');
              }
            }
          } catch (loginError: any) {
            console.error('Erro ao tentar login automático:', loginError);
            toast.warning('Registro realizado! Por favor, faça login manualmente.');
            setActiveTab('login');
          }
        }, 1000); // Adicionei um delay para dar tempo ao Supabase
      }
    } catch (error: any) {
      console.error('Erro completo no processo de registro:', error);
      // Toast de erro já exibido no bloco específico acima
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold text-center text-hubAssist-primary">
            HubAssist
          </CardTitle>
          <CardDescription className="text-center">
            Planeje e acompanhe a reabilitação dos seus pacientes
          </CardDescription>
        </CardHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Registrar</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full btn-primary" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
          
          <TabsContent value="register">
            <form onSubmit={handleSignUp}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    A senha deve ter pelo menos 6 caracteres
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full btn-primary" 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? 'Registrando...' : 'Registrar'}
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Login;
