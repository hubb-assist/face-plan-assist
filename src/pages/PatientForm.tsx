
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import ImageUpload from '@/components/patients/ImageUpload';
import { supabase } from '@/integrations/supabase/client';

const PatientForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    birthDate: undefined as Date | undefined,
    gender: '',
    cpf: '',
  });
  
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Handle CPF formatting
    if (name === 'cpf') {
      const cpfValue = value.replace(/\D/g, '');
      let formattedCpf = cpfValue;
      
      if (cpfValue.length > 3) {
        formattedCpf = cpfValue.replace(/^(\d{3})(\d)/, '$1.$2');
      }
      if (cpfValue.length > 6) {
        formattedCpf = formattedCpf.replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3');
      }
      if (cpfValue.length > 9) {
        formattedCpf = formattedCpf.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
      }
      
      setFormData({ ...formData, cpf: formattedCpf });
      return;
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      // Gerando um nome de arquivo único usando timestamp e random
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user?.id || 'public'}/${fileName}`;
      
      console.log('Iniciando upload da imagem:', filePath);
      
      const { error: uploadError, data } = await supabase.storage
        .from('patient_images')
        .upload(filePath, file);
        
      if (uploadError) {
        console.error('Erro durante upload:', uploadError);
        throw uploadError;
      }
      
      console.log('Upload concluído com sucesso:', data);
      
      const { data: urlData } = supabase.storage
        .from('patient_images')
        .getPublicUrl(filePath);
        
      console.log('URL pública gerada:', urlData.publicUrl);
      return urlData.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validação dos campos
    if (!formData.name || !formData.birthDate || !formData.gender || !formData.cpf) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      setIsLoading(false);
      return;
    }
    
    try {
      // Upload da imagem se fornecida
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image);
        if (!imageUrl) {
          toast.error("Erro ao fazer upload da imagem. Tente novamente.");
          setIsLoading(false);
          return;
        }
      }
      
      // Agora o clinic_id tem um valor padrão no banco de dados (get_clinic_id())
      // Não precisamos enviar clinic_id manualmente
      const { data, error } = await supabase
        .from('patients')
        .insert([{
          name: formData.name,
          birth_date: formData.birthDate?.toISOString().split('T')[0],
          gender: formData.gender,
          cpf: formData.cpf,
          image_url: imageUrl,
          user_id: user?.id
        }])
        .select();
      
      if (error) {
        console.error('Erro ao inserir paciente:', error);
        throw error;
      }
      
      toast.success("Paciente cadastrado com sucesso!");
      navigate("/pacientes");
    } catch (error: any) {
      console.error("Error saving patient:", error);
      toast.error(`Erro ao cadastrar paciente: ${error.message || 'Verifique se todos os campos estão preenchidos corretamente'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (file: File | null) => {
    setImage(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  // Não precisamos mais verificar o clinicId
  const isFormDisabled = isLoading;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-hubAssist-primary">Cadastrar Novo Paciente</h2>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="form-input-group">
                    <Label htmlFor="name" className="required-field">Nome completo</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Nome do paciente"
                      required
                      disabled={isFormDisabled}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-input-group">
                      <Label htmlFor="birthDate" className="required-field">Data de nascimento</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !formData.birthDate && "text-muted-foreground"
                            )}
                            disabled={isFormDisabled}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.birthDate ? (
                              format(formData.birthDate, "dd/MM/yyyy", { locale: pt })
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.birthDate}
                            onSelect={(date) => setFormData({ ...formData, birthDate: date || undefined })}
                            initialFocus
                            locale={pt}
                            disabled={isFormDisabled}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="form-input-group">
                      <Label htmlFor="gender" className="required-field">Gênero</Label>
                      <Select 
                        onValueChange={(value) => setFormData({ ...formData, gender: value })}
                        value={formData.gender}
                        disabled={isFormDisabled}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Masculino</SelectItem>
                          <SelectItem value="F">Feminino</SelectItem>
                          <SelectItem value="O">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="form-input-group">
                    <Label htmlFor="cpf" className="required-field">CPF</Label>
                    <Input
                      id="cpf"
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleInputChange}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      required
                      disabled={isFormDisabled}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <Label className="required-field mb-2 block">Foto do paciente</Label>
                <ImageUpload 
                  imagePreview={imagePreview}
                  onImageChange={handleImageChange}
                  disabled={isFormDisabled}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Formatos aceitos: JPG, PNG. Tamanho máximo: 5MB
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/pacientes')}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            className="btn-primary"
            disabled={isFormDisabled}
          >
            {isLoading ? 'Salvando...' : 'Salvar Paciente'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PatientForm;
