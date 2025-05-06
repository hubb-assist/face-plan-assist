
import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { Upload, File, Trash } from 'lucide-react';

export interface FileItem {
  id: string;
  name: string;
  size: number;
  created_at: string;
  url: string;
}

interface FileUploaderProps {
  patientId: string;
  bucket: string;
  fileTypes: string[];
  title: string;
  allowMultiple?: boolean;
}

const FileUploader = ({ patientId, bucket, fileTypes, title, allowMultiple = false }: FileUploaderProps) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles();
  }, [patientId, bucket]);

  const fetchFiles = async () => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(`${patientId}/`, {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        throw error;
      }

      // Filtrar pastas e arquivos vazios
      const fileItems = data
        .filter(item => !item.id.endsWith('/') && item.name !== '.emptyFolderPlaceholder')
        .map(item => ({
          id: item.id,
          name: item.name,
          size: item.metadata?.size || 0,
          created_at: item.created_at || new Date().toISOString(),
          url: supabase.storage.from(bucket).getPublicUrl(`${patientId}/${item.name}`).data.publicUrl
        }));

      setFiles(fileItems);
    } catch (error: any) {
      console.error(`Erro ao buscar arquivos da pasta ${bucket}/${patientId}:`, error);
      toast.error(`Erro ao carregar arquivos: ${error.message}`);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setIsUploading(true);
    setProgress(0);

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Validar tipo de arquivo
        if (!fileTypes.includes(file.type)) {
          toast.error(`Tipo de arquivo não permitido: ${file.type}`);
          continue;
        }

        // Validar tamanho (max 20MB)
        if (file.size > 20 * 1024 * 1024) {
          toast.error(`O arquivo ${file.name} excede o limite de 20MB.`);
          continue;
        }

        // Gerar nome único
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${file.name}`;
        const filePath = `${patientId}/${fileName}`;

        // Upload do arquivo
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            upsert: true,
            contentType: file.type
          });

        if (uploadError) {
          throw uploadError;
        }

        // Progresso para múltiplos arquivos
        setProgress(((i + 1) / selectedFiles.length) * 100);
      }

      // Atualizar lista de arquivos
      await fetchFiles();
      toast.success('Arquivo(s) enviado(s) com sucesso!');
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast.error(`Erro ao enviar arquivo: ${error.message}`);
    } finally {
      setIsUploading(false);
      // Limpar input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFile = async (fileId: string, fileName: string) => {
    if (!confirm(`Deseja mesmo excluir o arquivo ${fileName}?`)) return;

    try {
      const filePath = `${patientId}/${fileName}`;
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;

      // Atualizar lista de arquivos
      setFiles(prev => prev.filter(file => file.id !== fileId));
      toast.success(`Arquivo ${fileName} removido com sucesso!`);
    } catch (error: any) {
      console.error('Erro ao excluir arquivo:', error);
      toast.error(`Erro ao remover arquivo: ${error.message}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">{title}</h3>
        <Button 
          onClick={handleFileSelect} 
          className="gap-2" 
          disabled={isUploading}
        >
          <Upload size={16} />
          Enviar {allowMultiple ? 'arquivos' : 'arquivo'}
        </Button>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={fileTypes.join(',')}
        className="hidden"
        multiple={allowMultiple}
        disabled={isUploading}
      />

      {isUploading && (
        <div className="mt-2 w-full">
          <div className="flex items-center gap-2 mb-1">
            <Spinner size="sm" />
            <span className="text-sm">Enviando... {progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {files.length > 0 ? (
        <div className="border rounded-md divide-y">
          {files.map(file => (
            <div key={file.id} className="p-3 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <File size={20} className="text-gray-400" />
                <div>
                  <a 
                    href={file.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-medium hover:underline"
                  >
                    {file.name}
                  </a>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(file.size)} • {new Date(file.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleDeleteFile(file.id, file.name)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash size={16} />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="border border-dashed rounded-md p-8 text-center">
          <p className="text-gray-500">
            Nenhum arquivo enviado ainda.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Clique em "Enviar {allowMultiple ? 'arquivos' : 'arquivo'}" para começar.
          </p>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
