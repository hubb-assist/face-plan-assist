
import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from '@/components/ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

// Esquema de validação para o formulário
const loginSchema = z.object({
  email: z.string().email('E-mail inválido').min(1, 'E-mail é obrigatório'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres')
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailConfirmationNeeded, setEmailConfirmationNeeded] = useState(false);
  const { signIn, isAuthenticated } = useAuth();

  // Inicializar o formulário com zod resolver
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // Limpar erros quando alternar entre login e registro
  useEffect(() => {
    setError(null);
    setEmailConfirmationNeeded(false);
    form.reset();
  }, [isRegister, form]);

  const handleSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    setError(null);
    setEmailConfirmationNeeded(false);
    
    try {
      if (isRegister) {
        // Registrar novo usuário
        const { data, error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              role: 'admin_clinic'
            }
          }
        });
        
        if (error) throw error;
        
        if (data?.user?.identities?.length === 0) {
          // Usuário já existe
          setError('Este e-mail já está cadastrado. Por favor, faça login.');
          setIsRegister(false);
        } else if (data?.user && !data.session) {
          // Email de confirmação foi enviado
          setEmailConfirmationNeeded(true);
          toast.success("Cadastro realizado! Verifique seu e-mail para confirmar.");
        } else {
          // Usuário criado e logado automaticamente
          toast.success("Cadastro realizado com sucesso!");
        }
      } else {
        // Login do usuário
        await signIn(values.email, values.password);
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      
      // Tratamento de mensagens de erro
      if (error.message?.includes('Invalid login credentials')) {
        setError('E-mail ou senha incorretos');
      } else if (error.message?.includes('already registered')) {
        setError('Este e-mail já está cadastrado. Faça login.');
        setIsRegister(false);
      } else if (error.message?.includes('rate limit') || error.message?.includes('40 seconds')) {
        setError('Muitas tentativas. Por favor, aguarde alguns instantes antes de tentar novamente.');
      } else if (error.message?.includes('password')) {
        setError('A senha deve ter no mínimo 6 caracteres');
      } else {
        setError(error.message || "Ocorreu um erro durante a autenticação");
      }
      
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

        {error && (
          <Alert className="border-red-300 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-600">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {emailConfirmationNeeded && (
          <Alert className="border-blue-300 bg-blue-50">
            <AlertDescription className="text-blue-600">
              Enviamos um e-mail de confirmação para você. Por favor, verifique seu e-mail para ativar sua conta antes de fazer login.
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-8 space-y-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="required-field">E-mail</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="seu@email.com"
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="required-field">Senha</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="••••••••"
                        autoComplete={isRegister ? 'new-password' : 'current-password'}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <Button
                type="submit"
                className="w-full btn-primary"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
        </Form>
      </div>
    </div>
  );
};

export default Login;
