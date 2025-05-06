
import React from 'react';
import FileUploader from '../FileUploader';

interface XrayTabProps {
  patientId: string;
}

const XrayTab = ({ patientId }: XrayTabProps) => {
  return (
    <div>
      <FileUploader 
        patientId={patientId} 
        bucket="xray_images" 
        fileTypes={[
          'image/jpeg', 
          'image/png', 
          'image/dicom', 
          'application/dicom'
        ]}
        title="Radiografias"
        allowMultiple={true}
      />
    </div>
  );
};

export default XrayTab;
