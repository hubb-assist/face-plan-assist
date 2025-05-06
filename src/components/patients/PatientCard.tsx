
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { format, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Image, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Patient {
  id: string;
  name: string;
  birthDate: Date;
  imageUrl?: string;
  cpf: string;
  createdAt: Date;
}

interface PatientCardProps {
  patient: Patient;
  onDelete?: (id: string) => void;
}

const PatientCard = ({ patient, onDelete }: PatientCardProps) => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const age = differenceInYears(new Date(), patient.birthDate);
  
  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir este paciente?')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      
      // Deletar o paciente no banco de dados
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patient.id);
        
      if (error) {
        throw error;
      }
      
      // Se tiver uma imagem, remover do storage também
      if (patient.imageUrl) {
        // Extrai o caminho da imagem da URL completa
        const imagePath = patient.imageUrl.split('/patient_images/')[1];
        if (imagePath) {
          await supabase.storage
            .from('patient_images')
            .remove([imagePath]);
        }
      }
      
      toast.success('Paciente excluído com sucesso');
      
      // Notificar o componente pai para atualizar a lista
      if (onDelete) {
        onDelete(patient.id);
      }
    } catch (error: any) {
      console.error('Erro ao excluir paciente:', error);
      toast.error(`Erro ao excluir paciente: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <Card className="overflow-hidden patient-card">
      <div className="patient-img-container h-[180px] bg-gray-100">
        {patient.imageUrl ? (
          <img 
            src={patient.imageUrl} 
            alt={patient.name} 
            className="object-cover h-full w-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Image className="h-12 w-12 text-gray-300" />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium text-lg line-clamp-1">{patient.name}</h3>
        <div className="text-sm text-muted-foreground mt-1">
          <p>{age} anos</p>
          <p>Cadastrado em {format(patient.createdAt, "dd/MM/yyyy", { locale: ptBR })}</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex-col gap-2">
        <div className="flex gap-2 w-full">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => navigate(`/pacientes/${patient.id}/edit`)}
          >
            <Pencil className="h-4 w-4 mr-1" /> Editar
          </Button>
          <Button 
            variant="destructive" 
            className="flex-1"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Excluir
          </Button>
        </div>
        <Link to={`/pacientes/${patient.id}/planejamento`} className="w-full">
          <Button className="w-full btn-primary">
            Iniciar Planejamento
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default PatientCard;
