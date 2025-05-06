
import React from 'react';
import FileUploader from '../FileUploader';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import type { FileItem } from '../FileUploader';

interface DocsTabProps {
  patientId: string;
}

const DocsTab = ({ patientId }: DocsTabProps) => {
  const handleSignDocument = (file: FileItem) => {
    // Esta funcionalidade seria implementada em uma versão futura
    toast.info('Funcionalidade de assinatura em desenvolvimento.');
  };

  return (
    <div className="space-y-6">
      <FileUploader 
        patientId={patientId} 
        bucket="documents" 
        fileTypes={['application/pdf']}
        title="Documentos"
        allowMultiple={true}
      />

      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-sm font-medium mb-2">Sobre assinatura digital</h3>
        <p className="text-sm text-gray-500">
          A funcionalidade de assinatura digital estará disponível em breve. 
          Você poderá assinar documentos PDF diretamente na plataforma.
        </p>
      </div>
    </div>
  );
};

export default DocsTab;
