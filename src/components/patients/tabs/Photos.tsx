
import React from 'react';
import PhotoUploader from '../PhotoUploader';

interface ClinicalPhotosTabProps {
  patientId: string;
}

const ClinicalPhotosTab = ({ patientId }: ClinicalPhotosTabProps) => {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PhotoUploader 
          patientId={patientId} 
          view="principal" 
          label="Foto do paciente" 
        />
        <PhotoUploader 
          patientId={patientId} 
          view="frontal_0" 
          label="Frontal 0°" 
        />
        <PhotoUploader 
          patientId={patientId} 
          view="lateral_90" 
          label="Lateral 90°" 
        />
        <PhotoUploader 
          patientId={patientId} 
          view="diagonal_15" 
          label="Diagonal 15°" 
        />
      </div>
    </div>
  );
};

export default ClinicalPhotosTab;
