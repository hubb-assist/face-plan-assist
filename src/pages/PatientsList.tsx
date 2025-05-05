
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Search, Users } from 'lucide-react';
import PatientCard from '@/components/patients/PatientCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Patient {
  id: string;
  name: string;
  birth_date: string;
  cpf: string;
  image_url?: string;
  created_at: string;
}

const PatientsList = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, session } = useAuth();

  useEffect(() => {
    const fetchPatients = async () => {
      if (!user) {
        console.log('Nenhum usuário autenticado, não é possível buscar pacientes');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log('Buscando pacientes para o usuário:', user.id);
        console.log('Estado da sessão:', session ? 'Autenticado' : 'Não autenticado');
        
        // Primeiro, buscar o perfil do usuário para obter a clinic_id
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('clinic_id')
          .eq('id', user.id)
          .maybeSingle();
          
        if (profileError) {
          console.error('Erro ao buscar perfil do usuário:', profileError);
          throw profileError;
        }
        
        if (!profileData || !profileData.clinic_id) {
          console.error('Perfil do usuário não encontrado ou sem clinic_id');
          setPatients([]);
          setLoading(false);
          return;
        }
        
        console.log('Clinic ID encontrado:', profileData.clinic_id);
        
        // Depois, buscar os pacientes da clínica
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('clinic_id', profileData.clinic_id)
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Erro ao buscar pacientes:', error);
          throw error;
        }
        
        console.log('Pacientes encontrados:', data?.length || 0);
        setPatients(data || []);
      } catch (error: any) {
        console.error('Erro ao buscar pacientes:', error);
        toast.error(`Erro ao carregar pacientes: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatients();
  }, [user, session]);

  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.cpf.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-bold text-hubAssist-primary">Pacientes</h2>
        <Link to="/pacientes/novo">
          <Button className="btn-secondary">
            <Plus className="mr-2 h-4 w-4" /> Novo Paciente
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por nome ou CPF..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-hubAssist-primary"></div>
        </div>
      ) : filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPatients.map((patient) => (
            <PatientCard 
              key={patient.id} 
              patient={{
                id: patient.id,
                name: patient.name,
                birthDate: new Date(patient.birth_date),
                cpf: patient.cpf,
                imageUrl: patient.image_url,
                createdAt: new Date(patient.created_at)
              }} 
            />
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <Users className="h-10 w-10 text-muted-foreground" />
            <h3 className="font-medium text-lg">Nenhum paciente encontrado</h3>
            {searchTerm ? (
              <p className="text-muted-foreground">
                Não encontramos pacientes com o termo "{searchTerm}"
              </p>
            ) : (
              <p className="text-muted-foreground">
                Você ainda não possui pacientes cadastrados
              </p>
            )}
            <Link to="/pacientes/novo" className="mt-4">
              <Button className="btn-secondary">
                <Plus className="mr-2 h-4 w-4" /> Cadastrar Paciente
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PatientsList;
