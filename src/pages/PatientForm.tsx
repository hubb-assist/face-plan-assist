
import React, { useState, useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import ImageUpload from '@/components/patients/ImageUpload';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { Spinner } from '@/components/ui/spinner';

interface PatientFormProps {
  patient?: any;
  onSuccess?: () => void;
}

const PatientForm = ({ patient, onSuccess }: PatientFormProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(patient?.image_url || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const { user } = useAuth();
  const { clinicId } = useProfile(user?.id);
  const navigate = useNavigate();

  // Schema de validação
  const formSchema = z.object({
    name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
    cpf: z.string().min(11, { message: 'CPF deve ter 11 dígitos' }),
    gender: z.string().min(1, { message: 'Selecione o gênero' }),
    birth_date: z.string().min(1, { message: 'Informe a data de nascimento' }),
    cep: z.string().optional(),
    street: z.string().optional(),
    number: z.string().optional(),
    district: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
  });

  // Inicializando formulário com valores padrão
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: patient?.name || '',
      cpf: patient?.cpf || '',
      gender: patient?.gender || '',
      birth_date: patient?.birth_date ? patient.birth_date.split('T')[0] : '',
      cep: patient?.cep || '',
      street: patient?.street || '',
      number: patient?.number || '',
      district: patient?.district || '',
      city: patient?.city || '',
      state: patient?.state || '',
    },
  });

  // Se o formulário está sendo usado para edição e temos um paciente
  useEffect(() => {
    if (patient) {
      form.reset({
        name: patient.name || '',
        cpf: patient.cpf || '',
        gender: patient.gender || '',
        birth_date: patient.birth_date ? patient.birth_date.split('T')[0] : '',
        cep: patient.cep || '',
        street: patient.street || '',
        number: patient.number || '',
        district: patient.district || '',
        city: patient.city || '',
        state: patient.state || '',
      });
      
      if (patient.image_url) {
        setImagePreview(patient.image_url);
      }
    }
  }, [patient, form]);

  // Busca o CEP e preenche campos de endereço
  const fetchAddressByCep = async (cep: string) => {
    if (!cep || cep.length !== 8) return;
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }
      
      form.setValue('street', data.logradouro);
      form.setValue('district', data.bairro);
      form.setValue('city', data.localidade);
      form.setValue('state', data.uf);
      
      // Foca no campo número após preencher o endereço
      document.getElementById('number')?.focus();
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast.error('Erro ao buscar CEP. Tente novamente.');
    }
  };

  // Função para enviar o formulário
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast.error('Você precisa estar logado para cadastrar pacientes');
      return;
    }
    
    if (!clinicId) {
      toast.error('Erro ao obter ID da clínica');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let imageUrl = patient?.image_url || null;
      
      // Se tiver um arquivo de imagem, faz o upload
      if (imageFile) {
        const uploadedImageUrl = await handleImageUpload(imageFile);
        if (uploadedImageUrl) {
          imageUrl = uploadedImageUrl;
        }
      }
      
      // Dados do paciente para insert/update
      const patientData = {
        ...values,
        image_url: imageUrl,
        clinic_id: clinicId,
        user_id: user.id
      };
      
      let result;
      
      if (patient?.id) {
        // Atualizar paciente existente
        result = await supabase
          .from('patients')
          .update(patientData)
          .eq('id', patient.id);
      } else {
        // Inserir novo paciente
        result = await supabase
          .from('patients')
          .insert(patientData)
          .select();
      }
      
      if (result.error) {
        throw result.error;
      }
      
      // Sucesso!
      toast.success(
        patient?.id 
          ? 'Paciente atualizado com sucesso!' 
          : 'Paciente cadastrado com sucesso!'
      );
      
      // Callback de sucesso ou navegação
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/pacientes');
      }
      
    } catch (error: any) {
      console.error('Erro ao salvar paciente:', error);
      toast.error(`Erro ao salvar paciente: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upload da imagem para o Storage
  const handleImageUpload = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Gerar um nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${patient?.id || 'new'}/${fileName}`;
      
      // Fazer upload para o Storage
      const { error: uploadError, data } = await supabase.storage
        .from('patient_images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });
        
      if (uploadError) {
        console.error('Erro durante upload:', uploadError);
        throw uploadError;
      }
      
      // Fallback para arquivos pequenos
      setUploadProgress(100);
      
      console.log('Upload concluído com sucesso:', data);
      
      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('patient_images')
        .getPublicUrl(filePath);
        
      return urlData.publicUrl;
    } catch (error: any) {
      console.error('Erro no upload da imagem:', error);
      toast.error(`Erro ao enviar imagem: ${error.message}`);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Handler para a mudança de imagem
  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setImagePreview(objectUrl);
    } else {
      setImagePreview(patient?.image_url || null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        {patient?.id ? 'Editar Paciente' : 'Novo Paciente'}
      </h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo do paciente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="birth_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de nascimento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gênero</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="M">Masculino</SelectItem>
                          <SelectItem value="F">Feminino</SelectItem>
                          <SelectItem value="O">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="00000-000" 
                        {...field}
                        onBlur={(e) => {
                          field.onBlur();
                          fetchAddressByCep(e.target.value.replace(/\D/g, ''));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rua</FormLabel>
                        <FormControl>
                          <Input placeholder="Rua, Avenida, etc" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input id="number" placeholder="Nº" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input placeholder="Bairro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-4 gap-4">
                <div className="col-span-3">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Cidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>UF</FormLabel>
                      <FormControl>
                        <Input placeholder="UF" maxLength={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/pacientes')}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default PatientForm;
