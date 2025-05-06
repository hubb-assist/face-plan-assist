
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useProfile = (userId: string | undefined) => {
  const [loading, setLoading] = useState<boolean>(false);
  
  // Função para buscar o perfil do usuário
  const fetchUserProfile = async (userId: string | undefined) => {
    if (!userId) {
      console.log('fetchUserProfile: nenhum userId fornecido');
      return;
    }
    
    try {
      console.log('Buscando perfil do usuário:', userId);
      setLoading(true);
      
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
          return await createUserProfile(userId);
        }
      } else if (!data) {
        console.log('Perfil não encontrado, criando novo perfil...');
        // Se não há erro mas também não há dados, criamos o perfil
        return await createUserProfile(userId);
      } else {
        console.log("Perfil do usuário encontrado:", data);
        return data;
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Função para criar o perfil do usuário se não existir
  const createUserProfile = async (userId: string) => {
    try {
      console.log("Criando perfil para o usuário:", userId);
      
      // Buscar dados do usuário
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Erro ao buscar dados do usuário:", userError);
        throw userError;
      }
      
      if (!userData.user) {
        console.log('createUserProfile: nenhum usuário autenticado');
        return null;
      }
      
      // Verificar se já existe uma clínica para este usuário
      const { data: existingClinic, error: clinicCheckError } = await supabase
        .from('clinics')
        .select('id')
        .eq('name', `Clínica de ${userData.user.email?.split('@')[0] || 'Novo Usuário'}`)
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
            name: `Clínica de ${userData.user.email?.split('@')[0] || 'Novo Usuário'}`
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
          
          // Retornar o perfil existente
          const { data: profile, error: getProfileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
            
          if (getProfileError) {
            console.error("Erro ao buscar perfil existente:", getProfileError);
            throw getProfileError;
          }
          
          return profile;
        }
        
        // Criar o perfil do usuário com a clínica
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: userId,
            email: userData.user.email,
            role: 'admin_clinic',
            clinic_id: clinicId
          }])
          .select('*')
          .single();
          
        if (profileError) {
          console.error("Erro ao criar perfil:", profileError);
          throw profileError;
        }
        
        console.log("Perfil do usuário criado com sucesso:", newProfile);
        return newProfile;
      }
      
      return null;
    } catch (error) {
      console.error("Erro ao criar perfil do usuário:", error);
      toast.error("Erro ao configurar seu perfil. Por favor, tente novamente.");
      return null;
    }
  };
  
  // Efeito para buscar o perfil quando o userId mudar
  useEffect(() => {
    if (userId) {
      fetchUserProfile(userId);
    }
  }, [userId]);

  return {
    fetchUserProfile,
    createUserProfile,
    loading
  };
};
