
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Patient } from '@/types/patient';

// Importar componentes das abas
import PatientDataTab from '@/components/patients/tabs/Data';
import AnamnesisTab from '@/components/patients/tabs/Anamnese';
import ClinicalPhotosTab from '@/components/patients/tabs/Photos';
import XrayTab from '@/components/patients/tabs/Radiografias';
import DocsTab from '@/components/patients/tabs/Documents';

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('dados');

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

  // Função para renderizar o conteúdo ativo
  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dados':
        return <PatientDataTab patient={patient} />;
      case 'anam':
        return <AnamnesisTab patientId={id || ''} />;
      case 'fotos':
        return <ClinicalPhotosTab patientId={id || ''} />;
      case 'xrays':
        return <XrayTab patientId={id || ''} />;
      case 'docs':
        return <DocsTab patientId={id || ''} />;
      default:
        return <PatientDataTab patient={patient} />;
    }
  };

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
          <h1 className="text-2xl font-bold">{patient.name}</h1>
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
        {/* Navegação de seções - estilizado para parecer com abas */}
        <div className="flex overflow-x-auto border-b">
          <button
            onClick={() => setActiveSection('dados')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeSection === 'dados' 
                ? 'border-primary text-primary font-medium'
                : 'border-transparent hover:text-gray-700'
            }`}
          >
            Dados
          </button>
          <button
            onClick={() => setActiveSection('anam')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeSection === 'anam' 
                ? 'border-primary text-primary font-medium'
                : 'border-transparent hover:text-gray-700'
            }`}
          >
            Anamnese
          </button>
          <button
            onClick={() => setActiveSection('fotos')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeSection === 'fotos' 
                ? 'border-primary text-primary font-medium'
                : 'border-transparent hover:text-gray-700'
            }`}
          >
            Fotos clínicas
          </button>
          <button
            onClick={() => setActiveSection('xrays')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeSection === 'xrays' 
                ? 'border-primary text-primary font-medium'
                : 'border-transparent hover:text-gray-700'
            }`}
          >
            Radiografias
          </button>
          <button
            onClick={() => setActiveSection('docs')}
            className={`px-4 py-2 border-b-2 transition-colors ${
              activeSection === 'docs' 
                ? 'border-primary text-primary font-medium'
                : 'border-transparent hover:text-gray-700'
            }`}
          >
            Documentos
          </button>
        </div>

        {/* Conteúdo da seção ativa */}
        <div className="py-4">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
};

export default PatientDetail;
