
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Spinner } from '@/components/ui/spinner';

interface AnamneseFormData {
  queixa_principal: string;
  alergias: string;
  doencas_sistemicas: string;
  medicacoes: string;
  observacoes: string;
}

interface AnamnesisTabProps {
  patientId: string;
}

const AnamnesisTab = ({ patientId }: AnamnesisTabProps) => {
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const form = useForm<AnamneseFormData>({
    defaultValues: {
      queixa_principal: '',
      alergias: '',
      doencas_sistemicas: '',
      medicacoes: '',
      observacoes: ''
    }
  });

  useEffect(() => {
    fetchAnamnesis();
  }, [patientId]);

  const fetchAnamnesis = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('anamneses')
        .select('*')
        .eq('patient_id', patientId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 é erro de "não encontrado"
        throw error;
      }

      if (data) {
        // Preencher o formulário com os dados da anamnese
        form.reset({
          queixa_principal: data.data.queixa_principal || '',
          alergias: data.data.alergias || '',
          doencas_sistemicas: data.data.doencas_sistemicas || '',
          medicacoes: data.data.medicacoes || '',
          observacoes: data.data.observacoes || ''
        });
      }
    } catch (error: any) {
      console.error('Erro ao buscar anamnese:', error);
      toast.error(`Erro ao carregar anamnese: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (formData: AnamneseFormData) => {
    try {
      setIsSaving(true);
      
      // Verificar se já existe uma anamnese para este paciente
      const { data: existingData, error: checkError } = await supabase
        .from('anamneses')
        .select('id')
        .eq('patient_id', patientId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingData) {
        // Atualizar anamnese existente
        const { error: updateError } = await supabase
          .from('anamneses')
          .update({
            data: formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);

        if (updateError) throw updateError;
      } else {
        // Criar nova anamnese
        const { error: insertError } = await supabase
          .from('anamneses')
          .insert({
            patient_id: patientId,
            data: formData
          });

        if (insertError) throw insertError;
      }

      toast.success('Anamnese salva com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar anamnese:', error);
      toast.error(`Erro ao salvar anamnese: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="queixa_principal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Queixa principal</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Descreva a queixa principal"
                    className="min-h-24"
                    {...field} 
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="alergias"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alergias</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Liste as alergias"
                    className="min-h-24"
                    {...field} 
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="doencas_sistemicas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Doenças sistêmicas</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Liste as doenças sistêmicas"
                    className="min-h-24"
                    {...field} 
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="medicacoes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medicações</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Liste as medicações em uso"
                    className="min-h-24"
                    {...field} 
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Observações adicionais"
                  className="min-h-24"
                  {...field} 
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Salvando...
              </>
            ) : (
              'Salvar anamnese'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AnamnesisTab;
