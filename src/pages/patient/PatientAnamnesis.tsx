
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Patient } from '@/types/patient';
import AnamnesisTab from '@/components/patients/tabs/Anamnese';

const PatientAnamnesis = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPatient(id);
    }
  }, [id]);

  const fetchPatient = async (patientId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single();

      if (error) {
        throw error;
      }

      setPatient(data);
    } catch (error: any) {
      console.error('Erro ao buscar paciente:', error);
      toast.error(`Erro ao carregar dados do paciente: ${error.message}`);
      navigate('/pacientes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-2">Paciente não encontrado</h2>
        <p className="text-gray-500 mb-4">
          O paciente que você está procurando não foi encontrado.
        </p>
        <Button variant="outline" onClick={() => navigate('/pacientes')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para lista de pacientes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button 
            variant="ghost" 
            onClick={() => navigate('/pacientes')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">{patient.name} - Anamnese</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/pacientes/${id}/edit`)}
          >
            Editar
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate(`/pacientes/${id}/planejamento`)}
          >
            Planejamento
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Navegação para as subpáginas */}
        <div className="flex overflow-x-auto border-b">
          <Link
            to={`/pacientes/${id}`}
            className="px-4 py-2 border-b-2 border-transparent hover:text-gray-700"
          >
            Dados
          </Link>
          <Link
            to={`/pacientes/${id}/anamnese`}
            className="px-4 py-2 border-b-2 border-primary text-primary font-medium"
          >
            Anamnese
          </Link>
          <Link
            to={`/pacientes/${id}/fotos`}
            className="px-4 py-2 border-b-2 border-transparent hover:text-gray-700"
          >
            Fotos clínicas
          </Link>
          <Link
            to={`/pacientes/${id}/radiografias`}
            className="px-4 py-2 border-b-2 border-transparent hover:text-gray-700"
          >
            Radiografias
          </Link>
          <Link
            to={`/pacientes/${id}/documentos`}
            className="px-4 py-2 border-b-2 border-transparent hover:text-gray-700"
          >
            Documentos
          </Link>
        </div>

        {/* Conteúdo de anamnese */}
        <div className="py-4">
          <AnamnesisTab patientId={id || ''} />
        </div>
      </div>
    </div>
  );
};

export default PatientAnamnesis;
