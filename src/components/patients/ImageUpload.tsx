
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Image } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';

interface ImageUploadProps {
  imagePreview: string | null;
  onImageChange: (file: File | null) => void;
  disabled?: boolean;
  isUploading?: boolean;
  uploadProgress?: number;
}

const ImageUpload = ({ 
  imagePreview, 
  onImageChange, 
  disabled = false,
  isUploading = false,
  uploadProgress = 0
}: ImageUploadProps) => {
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
        disabled={disabled || isUploading}
      />
      
      <div className="flex gap-2">
        <Button 
          type="button" 
          onClick={handleClick}
          variant="outline"
          className="flex-1"
          disabled={disabled || isUploading}
          aria-label={imagePreview ? "Alterar imagem" : "Adicionar imagem"}
        >
          <Upload className="mr-2 h-4 w-4" />
          {imagePreview ? 'Alterar' : 'Adicionar'}
        </Button>
        
        {imagePreview && (
          <Button 
            type="button" 
            variant="destructive"
            onClick={handleRemoveImage}
            disabled={disabled || isUploading}
          >
            Remover
          </Button>
        )}
      </div>

      {isUploading && (
        <div className="mt-2 w-full max-w-[250px]">
          <div className="flex items-center gap-2 mb-1">
            {uploadProgress === 0 ? (
              <>
                <Spinner size="sm" />
                <span className="text-sm">Preparando upload...</span>
              </>
            ) : (
              <>
                <Spinner size="sm" />
                <span className="text-sm">Enviando... {uploadProgress.toFixed(0)}%</span>
              </>
            )}
          </div>
          <Progress value={uploadProgress} className="h-2 max-w-[60px] sm:max-w-full" />
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
