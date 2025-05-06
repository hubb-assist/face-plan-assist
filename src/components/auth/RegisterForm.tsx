
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardContent, CardFooter } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const RegisterForm = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { signIn } = useAuth();

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
      const { data: userExists } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
        
      if (userExists) {
        console.log('Usuário já existe na tabela profiles');
        toast.error('Este email já está em uso. Tente fazer login.');
        return;
      }
        
      // Registrar o usuário sem exigir confirmação de email
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
        return;
      }
      
      // Usuário registrado com sucesso, fazer login imediatamente
      if (data?.user) {
        toast.success('Registro realizado com sucesso!');
        
        // Fazer login automático após pequeno delay
        setTimeout(async () => {
          try {
            await signIn(email, password);
          } catch (loginError: any) {
            console.error('Erro ao tentar login automático:', loginError);
            toast.warning('Registro realizado! Por favor, faça login manualmente.');
          }
        }, 800);
      }
    } catch (error: any) {
      console.error('Erro completo no processo de registro:', error);
      // Toast de erro já exibido no bloco específico acima
    } finally {
      setLoading(false);
    }
  };

  return (
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
  );
};

export default RegisterForm;
