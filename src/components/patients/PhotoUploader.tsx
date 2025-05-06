
import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { Upload, Image, Trash } from 'lucide-react';

interface PhotoUploaderProps {
  patientId: string;
  view: string;
  label: string;
}

const PhotoUploader = ({ patientId, view, label }: PhotoUploaderProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchImage();
  }, [patientId, view]);

  const fetchImage = async () => {
    try {
      const filePath = `${patientId}/${view}.jpg`;
      const { data } = await supabase.storage
        .from('clinical_photos')
        .getPublicUrl(filePath);
      
      // Verificar se a imagem existe tentando carregá-la
      const img = new Image();
      img.onload = () => setImageUrl(data.publicUrl);
      img.onerror = () => setImageUrl(null);
      img.src = data.publicUrl;
    } catch (error) {
      console.error(`Erro ao buscar imagem ${view}:`, error);
      setImageUrl(null);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      toast.error('Por favor, selecione uma imagem JPG ou PNG.');
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB.');
      return;
    }

    try {
      setIsUploading(true);
      setProgress(0);

      // Upload da imagem
      const filePath = `${patientId}/${view}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('clinical_photos')
        .upload(filePath, file, {
          upsert: true,
          contentType: 'image/jpeg',
          onUploadProgress: (evt) => {
            if (evt?.total) {
              const pct = Math.round((evt.loaded / evt.total) * 100);
              setProgress(pct);
            }
          }
        });

      if (uploadError) {
        throw uploadError;
      }

      // Fallback para arquivos pequenos
      setProgress(100);
      
      // Atualizar a imagem
      await fetchImage();
      toast.success(`Foto ${label} enviada com sucesso!`);
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error(`Erro ao enviar imagem: ${error.message}`);
    } finally {
      setIsUploading(false);
      // Limpar input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Deseja mesmo excluir a foto ${label}?`)) return;

    try {
      const filePath = `${patientId}/${view}.jpg`;
      const { error } = await supabase.storage
        .from('clinical_photos')
        .remove([filePath]);

      if (error) throw error;

      setImageUrl(null);
      toast.success(`Foto ${label} removida com sucesso!`);
    } catch (error: any) {
      console.error('Erro ao excluir imagem:', error);
      toast.error(`Erro ao remover imagem: ${error.message}`);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <span className="font-medium text-sm">{label}</span>
      <div 
        className="border border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex flex-col items-center justify-center relative"
        style={{ height: '220px' }}
      >
        {imageUrl ? (
          <div className="h-full w-full relative">
            <img src={imageUrl} alt={label} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <Image className="h-12 w-12 text-gray-300 mb-2" />
            <p className="text-sm text-center text-gray-500">
              Clique para adicionar {label}
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
        disabled={isUploading}
      />

      {isUploading ? (
        <div className="mt-2 w-full">
          <div className="flex items-center gap-2 mb-1">
            {progress === 0 ? (
              <>
                <Spinner size="sm" />
                <span className="text-sm">Preparando upload...</span>
              </>
            ) : (
              <>
                <Spinner size="sm" />
                <span className="text-sm">Enviando... {progress.toFixed(0)}%</span>
              </>
            )}
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      ) : (
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleFileSelect}
            className="flex-1"
            size="sm"
          >
            <Upload className="h-4 w-4 mr-2" />
            {imageUrl ? 'Alterar' : 'Adicionar'}
          </Button>
          
          {imageUrl && (
            <Button 
              type="button" 
              variant="destructive"
              onClick={handleDelete}
              size="sm"
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default PhotoUploader;
