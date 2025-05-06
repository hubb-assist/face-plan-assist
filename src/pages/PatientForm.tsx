import React, { useState, useEffect, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import DatePicker from 'react-datepicker';
import { ptBR } from 'date-fns/locale';
import { isValid, isAfter, parse } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import ImageUpload from '@/components/patients/ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import InputMask from 'react-input-mask';
import 'react-datepicker/dist/react-datepicker.css';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { 
  AlertDialog, 
  AlertDialogTrigger, 
  AlertDialogContent,
  AlertDialogTitle, 
  AlertDialogDescription,
  AlertDialogCancel, 
  AlertDialogAction 
} from "@/components/ui/alert-dialog";

// Componente de input com máscara para o DatePicker
const MaskedInput = forwardRef<HTMLInputElement, any>((props, ref) => (
  <InputMask
    {...props}
    mask="99/99/9999"
    placeholder="DD/MM/AAAA"
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
    ref={ref}
  />
));
MaskedInput.displayName = 'MaskedInput';

interface PatientFormProps {
  patient?: {
    id: string;
    name: string;
    birth_date: string;
    gender: string;
    cpf: string;
    image_url?: string;
    cep?: string;
    street?: string;
    number?: string;
    district?: string;
    city?: string;
    state?: string;
  };
  onSuccess?: () => void;
}

const PatientForm = ({ patient, onSuccess }: PatientFormProps = {}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = !!patient?.id;
  
  const [formData, setFormData] = useState({
    name: '',
    birthDate: null as Date | null,
    gender: '',
    cpf: '',
    cep: '',
    street: '',
    number: '',
    district: '',
    city: '',
    state: ''
  });
  
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const maxDate = new Date();
  
  // Carregar dados para edição, se for o caso
  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name,
        birthDate: patient.birth_date ? new Date(patient.birth_date) : null,
        gender: patient.gender,
        cpf: patient.cpf,
        cep: patient.cep || '',
        street: patient.street || '',
        number: patient.number || '',
        district: patient.district || '',
        city: patient.city || '',
        state: patient.state || ''
      });
      
      if (patient.image_url) {
        setImagePreview(patient.image_url);
      }
    }
  }, [patient]);
  
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

  const handleBirthDateChange = (date: Date | null, e: React.SyntheticEvent<any>) => {
    // Se veio string digitada manualmente
    if (typeof (e as any).target?.value === 'string') {
      const str = (e as any).target.value; // dd/MM/yyyy
      const parsed = parse(str, 'dd/MM/yyyy', new Date());

      if (!isValid(parsed) || isAfter(parsed, maxDate)) {
        // Ignora entradas inválidas
        return;
      }
      setFormData({ ...formData, birthDate: parsed });
    } else {
      setFormData({ ...formData, birthDate: date });
    }
  };

  // Função para buscar endereço via CEP
  const fetchAddress = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    try {
      setIsFetchingAddress(true);
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      
      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        street: data.logradouro || prev.street,
        district: data.bairro || prev.district,
        city: data.localidade || prev.city,
        state: data.uf || prev.state
      }));
    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
      toast.error('Erro ao buscar o endereço. Tente novamente.');
    } finally {
      setIsFetchingAddress(false);
    }
  };

  // Handler para mudança no CEP
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, cep: value }));
    
    // Buscar endereço quando o CEP estiver completo
    const cleanCep = value.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      fetchAddress(value);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const fileExt = file.name.split('.').pop();
      // Gerando um nome de arquivo único usando timestamp e random
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user?.id || 'public'}/${fileName}`;
      
      console.log('Iniciando upload da imagem:', filePath);
      
      const { error: uploadError, data } = await supabase.storage
        .from('patient_images')
        .upload(filePath, file, {
          onUploadProgress: (event) => {
            const progress = (event.loaded / event.total) * 100;
            setUploadProgress(progress);
          }
        });
        
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
    } finally {
      setIsUploading(false);
    }
  };

  const submitForm = async () => {
    // Validation code from handleSubmit...
    if (!formData.name || !formData.birthDate || !formData.gender || !formData.cpf) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    
    if (isAfter(formData.birthDate, new Date())) {
      toast.error("Data de nascimento inválida");
      return;
    }
    
    try {
      setIsLoading(true);
      
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
      
      const body = {
        name: formData.name,
        birth_date: formData.birthDate?.toISOString().split('T')[0],
        gender: formData.gender,
        cpf: formData.cpf,
        user_id: user?.id,
        cep: formData.cep || null,
        street: formData.street || null,
        number: formData.number || null,
        district: formData.district || null,
        city: formData.city || null,
        state: formData.state || null
      };
      
      // Adicionar a URL da imagem apenas se tiver uma nova
      if (imageUrl) {
        body['image_url'] = imageUrl;
      }
      
      let error;
      
      if (isEdit) {
        // Atualizar paciente existente
        const { error: updateError } = await supabase
          .from('patients')
          .update(body)
          .eq('id', patient.id);
          
        error = updateError;
        
        if (!error) {
          toast.success("Paciente atualizado com sucesso!");
        }
      } else {
        // Inserir novo paciente
        const { error: insertError } = await supabase
          .from('patients')
          .insert([body])
          .select();
          
        error = insertError;
        
        if (!error) {
          toast.success("Paciente cadastrado com sucesso!");
        }
      }
      
      if (error) {
        console.error('Erro ao salvar paciente:', error);
        throw error;
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/pacientes");
      }
    } catch (error: any) {
      console.error("Error saving patient:", error);
      toast.error(`Erro ao ${isEdit ? 'atualizar' : 'cadastrar'} paciente: ${error.message || 'Verifique se todos os campos estão preenchidos corretamente'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitForm();
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

  const isFormDisabled = isLoading || isFetchingAddress || isUploading;

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-hubAssist-primary">
        {isEdit ? 'Editar Paciente' : 'Cadastrar Novo Paciente'}
      </h2>
      
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="form-input-group">
                      <Label htmlFor="birthDate" className="required-field">Data de nascimento</Label>
                      
                      <DatePicker
                        selected={formData.birthDate}
                        onChange={handleBirthDateChange}
                        locale={ptBR}
                        dateFormat="dd/MM/yyyy"
                        maxDate={maxDate}
                        showMonthDropdown
                        showYearDropdown
                        dropdownMode="select"
                        scrollableYearDropdown
                        yearDropdownItemNumber={120}
                        placeholderText="DD/MM/AAAA"
                        customInput={<MaskedInput />}
                        disabled={isFormDisabled}
                        popperClassName="z-50"
                        popperModifiers={[
                          {
                            name: "offset",
                            options: {
                              offset: [0, 10],
                            },
                          },
                        ]}
                      />
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

                    <div className="form-input-group">
                      <Label htmlFor="cpf" className="required-field">CPF</Label>
                      <InputMask
                        mask="999.999.999-99"
                        value={formData.cpf}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        disabled={isFormDisabled}
                      >
                        {(inputProps) => (
                          <Input
                            {...inputProps}
                            id="cpf"
                            className="max-w-sm"
                            placeholder="000.000.000-00"
                            required
                          />
                        )}
                      </InputMask>
                    </div>
                  </div>

                  {/* Endereço */}
                  <div className="pt-2 border-t">
                    <h3 className="text-lg font-medium mb-3">Endereço</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-input-group">
                        <Label htmlFor="cep">CEP</Label>
                        <InputMask
                          mask="99999-999"
                          value={formData.cep}
                          onChange={handleCepChange}
                          disabled={isFormDisabled}
                        >
                          {(inputProps) => (
                            <Input
                              {...inputProps}
                              id="cep"
                              className="max-w-xs"
                              placeholder="00000-000"
                            />
                          )}
                        </InputMask>
                        {isFetchingAddress && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Buscando endereço...
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                      <div className="md:col-span-3 form-input-group">
                        <Label htmlFor="street">Logradouro</Label>
                        <Input
                          id="street"
                          name="street"
                          value={formData.street}
                          onChange={handleInputChange}
                          placeholder="Rua, Avenida, etc."
                          disabled={isFormDisabled}
                        />
                      </div>

                      <div className="form-input-group">
                        <Label htmlFor="number">Número</Label>
                        <Input
                          id="number"
                          name="number"
                          value={formData.number}
                          onChange={handleInputChange}
                          placeholder="Nº"
                          disabled={isFormDisabled}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="form-input-group">
                        <Label htmlFor="district">Bairro</Label>
                        <Input
                          id="district"
                          name="district"
                          value={formData.district}
                          onChange={handleInputChange}
                          placeholder="Bairro"
                          disabled={isFormDisabled}
                        />
                      </div>

                      <div className="form-input-group">
                        <Label htmlFor="city">Cidade</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          placeholder="Cidade"
                          disabled={isFormDisabled}
                        />
                      </div>

                      <div className="form-input-group">
                        <Label htmlFor="state">Estado</Label>
                        <Input
                          id="state"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          placeholder="UF"
                          maxLength={2}
                          className="uppercase"
                          disabled={isFormDisabled}
                        />
                      </div>
                    </div>
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
                  isUploading={isUploading}
                  uploadProgress={uploadProgress}
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
          
          {isEdit ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  type="button" 
                  className="btn-primary"
                  disabled={isFormDisabled}
                >
                  {isLoading ? 'Salvando...' : 'Atualizar Paciente'}
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogTitle>Confirmar edição?</AlertDialogTitle>
                <AlertDialogDescription>
                  As alterações serão salvas imediatamente.
                </AlertDialogDescription>
                <div className="flex justify-end gap-2 mt-4">
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction type="button" onClick={submitForm}>
                    Salvar
                  </AlertDialogAction>
                </div>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button 
              type="submit" 
              className="btn-primary"
              disabled={isFormDisabled}
            >
              {isLoading ? 'Salvando...' : 'Salvar Paciente'}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default PatientForm;
