
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { format, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Image } from 'lucide-react';

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
}

const PatientCard = ({ patient }: PatientCardProps) => {
  const age = differenceInYears(new Date(), patient.birthDate);
  
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
      <CardFooter className="p-4 pt-0">
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
