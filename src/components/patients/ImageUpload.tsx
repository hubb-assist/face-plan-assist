
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Image } from 'lucide-react';

interface ImageUploadProps {
  imagePreview: string | null;
  onImageChange: (file: File | null) => void;
  disabled?: boolean;
}

const ImageUpload = ({ imagePreview, onImageChange, disabled = false }: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        alert('Por favor, selecione uma imagem JPG ou PNG.');
        return;
      }
      
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.');
        return;
      }
    }
    
    onImageChange(file);
  };

  const handleRemoveImage = () => {
    onImageChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        className="border border-dashed border-gray-300 rounded-lg aspect-[3/4] w-full overflow-hidden relative"
        style={{ maxWidth: '250px' }}
      >
        {imagePreview ? (
          <img 
            src={imagePreview} 
            alt="Preview" 
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <Image className="h-12 w-12 text-gray-300 mb-2" />
            <p className="text-sm text-center text-gray-500">
              Clique para adicionar uma foto frontal do paciente
            </p>
          </div>
        )}
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png"
        className="hidden"
        disabled={disabled}
      />
      
      <div className="flex gap-2">
        <Button 
          type="button" 
          onClick={handleClick}
          variant="outline"
          className="flex-1"
          disabled={disabled}
        >
          <Upload className="mr-2 h-4 w-4" />
          {imagePreview ? 'Alterar' : 'Adicionar'}
        </Button>
        
        {imagePreview && (
          <Button 
            type="button" 
            variant="destructive"
            onClick={handleRemoveImage}
            disabled={disabled}
          >
            Remover
          </Button>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
