
import React from 'react';
import { Link } from 'react-router-dom';

interface PatientNavigationProps {
  patientId: string;
  activePage: 'dados' | 'anamnese' | 'fotos' | 'radiografias' | 'documentos';
}

const PatientNavigation = ({ patientId, activePage }: PatientNavigationProps) => {
  return (
    <div className="flex overflow-x-auto border-b">
      <Link
        to={`/pacientes/${patientId}`}
        className={`px-4 py-2 border-b-2 transition-colors ${
          activePage === 'dados' 
            ? 'border-primary text-primary font-medium'
            : 'border-transparent hover:text-gray-700'
        }`}
      >
        Dados
      </Link>
      <Link
        to={`/pacientes/${patientId}/anamnese`}
        className={`px-4 py-2 border-b-2 transition-colors ${
          activePage === 'anamnese' 
            ? 'border-primary text-primary font-medium'
            : 'border-transparent hover:text-gray-700'
        }`}
      >
        Anamnese
      </Link>
      <Link
        to={`/pacientes/${patientId}/fotos`}
        className={`px-4 py-2 border-b-2 transition-colors ${
          activePage === 'fotos' 
            ? 'border-primary text-primary font-medium'
            : 'border-transparent hover:text-gray-700'
        }`}
      >
        Fotos clínicas
      </Link>
      <Link
        to={`/pacientes/${patientId}/radiografias`}
        className={`px-4 py-2 border-b-2 transition-colors ${
          activePage === 'radiografias' 
            ? 'border-primary text-primary font-medium'
            : 'border-transparent hover:text-gray-700'
        }`}
      >
        Radiografias
      </Link>
      <Link
        to={`/pacientes/${patientId}/documentos`}
        className={`px-4 py-2 border-b-2 transition-colors ${
          activePage === 'documentos' 
            ? 'border-primary text-primary font-medium'
            : 'border-transparent hover:text-gray-700'
        }`}
      >
        Documentos
      </Link>
    </div>
  );
};

export default PatientNavigation;
