
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useProfile = (userId: string | undefined) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [clinicId, setClinicId] = useState<string | null>(null);
  
  // Função para buscar o perfil do usuário
  const fetchUserProfile = async (userId: string | undefined) => {
    if (!userId) {
      console.log('fetchUserProfile: nenhum userId fornecido');
      return null;
    }
    
    try {
      console.log('Buscando perfil do usuário:', userId);
      setLoading(true);
      
      // Usando a função RPC que evita a recursão infinita
      const { data: clinic, error: clinicError } = await supabase
        .rpc('get_user_clinic_id');
      
      if (clinicError) {
        console.error("Erro ao buscar clinic_id do usuário:", clinicError);
        throw clinicError;
      }
      
      if (clinic) {
        console.log("ID da clínica encontrado:", clinic);
        setClinicId(clinic);
        
        // Buscar o perfil do usuário diretamente usando o ID da clínica
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (error) {
          console.error("Erro ao buscar perfil do usuário:", error);
          throw error;
        }
        
        console.log("Perfil do usuário completo:", data);
        return data;
      } else {
        console.log("ID da clínica não encontrado para o usuário:", userId);
        return await createUserProfile(userId);
      }
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      toast.error("Erro ao verificar seu perfil. Por favor, faça logout e login novamente.");
      throw error;
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
          console.log("Perfil já existe, atualizando clinic_id");
          
          // Atualizar o perfil com o clinic_id correto
          const { data: updatedProfile, error: updateError } = await supabase
            .from('profiles')
            .update({ clinic_id: clinicId })
            .eq('id', userId)
            .select('*')
            .single();
            
          if (updateError) {
            console.error("Erro ao atualizar perfil:", updateError);
            throw updateError;
          }
          
          setClinicId(clinicId);
          return updatedProfile;
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
        setClinicId(clinicId);
        return newProfile;
      }
      
      return null;
    } catch (error) {
      console.error("Erro ao criar perfil do usuário:", error);
      toast.error("Erro ao configurar seu perfil. Por favor, tente novamente.");
      throw error;
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
    loading,
    clinicId
  };
};
