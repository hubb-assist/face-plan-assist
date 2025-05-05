
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Plus, Search, Users } from 'lucide-react';
import PatientCard from '@/components/patients/PatientCard';
import { useMockPatients } from '@/hooks/useMockPatients';

const PatientsList = () => {
  const { patients, loading } = useMockPatients();
  const [searchTerm, setSearchTerm] = useState('');

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
            <PatientCard key={patient.id} patient={patient} />
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
