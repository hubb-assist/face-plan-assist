
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PatientForm from './PatientForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const EditPatient = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatient = async () => {
      if (!id) {
        navigate('/pacientes');
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          throw error;
        }

        if (!data) {
          toast.error("Paciente não encontrado");
          navigate('/pacientes');
          return;
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

    fetchPatient();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-hubAssist-primary"></div>
      </div>
    );
  }

  return (
    <PatientForm
      patient={patient}
      onSuccess={() => navigate('/pacientes')}
    />
  );
};

export default EditPatient;
