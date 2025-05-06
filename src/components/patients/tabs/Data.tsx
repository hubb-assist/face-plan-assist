
import React from 'react';
import { Patient } from '@/types/patient';
import { format } from 'date-fns';

interface PatientDataTabProps {
  patient: Patient;
}

const PatientDataTab = ({ patient }: PatientDataTabProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Informações pessoais</h3>
          <div className="mt-2 grid grid-cols-1 gap-4">
            <div>
              <span className="text-sm text-gray-500">Nome completo</span>
              <p className="text-sm font-medium">{patient.name}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">CPF</span>
              <p className="text-sm font-medium">{patient.cpf}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Data de nascimento</span>
              <p className="text-sm font-medium">
                {format(new Date(patient.birth_date), 'dd/MM/yyyy')}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Gênero</span>
              <p className="text-sm font-medium">{patient.gender}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Endereço</h3>
          <div className="mt-2 grid grid-cols-1 gap-4">
            {patient.street && (
              <div>
                <span className="text-sm text-gray-500">Rua</span>
                <p className="text-sm font-medium">{patient.street}{patient.number && `, ${patient.number}`}</p>
              </div>
            )}
            {patient.district && (
              <div>
                <span className="text-sm text-gray-500">Bairro</span>
                <p className="text-sm font-medium">{patient.district}</p>
              </div>
            )}
            {patient.city && (
              <div>
                <span className="text-sm text-gray-500">Cidade</span>
                <p className="text-sm font-medium">{patient.city} {patient.state && `- ${patient.state}`}</p>
              </div>
            )}
            {patient.cep && (
              <div>
                <span className="text-sm text-gray-500">CEP</span>
                <p className="text-sm font-medium">{patient.cep}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDataTab;
