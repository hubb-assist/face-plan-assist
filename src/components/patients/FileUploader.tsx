
import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { Download, Trash, Upload } from 'lucide-react';
import { format } from 'date-fns';

export interface FileItem {
  name: string;
  size: number;
  created_at: string;
  path: string;
}

interface FileUploaderProps {
  patientId: string;
  bucket: 'xray_images' | 'documents';
  fileTypes: string[];
  title: string;
  allowMultiple?: boolean;
}

const FileUploader = ({ 
  patientId, 
  bucket, 
  fileTypes, 
  title,
  allowMultiple = false
}: FileUploaderProps) => {
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
        .list(patientId, {
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) throw error;

      if (data) {
        const fileItems: FileItem[] = data
          .filter(item => !item.id.endsWith('/')) // Filtrar pastas
          .map(item => ({
            name: item.name,
            size: item.metadata?.size || 0,
            created_at: item.created_at || new Date().toISOString(),
            path: `${patientId}/${item.name}`
          }));
        
        setFiles(fileItems);
      }
    } catch (error: any) {
      console.error(`Erro ao buscar arquivos do ${bucket}:`, error);
      toast.error(`Erro ao buscar arquivos: ${error.message}`);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    try {
      setIsUploading(true);
      setProgress(0);

      // Upload de múltiplos arquivos em sequência
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Validar tipo de arquivo
        if (!fileTypes.includes(file.type)) {
          toast.error(`Tipo de arquivo não permitido: ${file.type}`);
          continue;
        }

        // Validar tamanho (max 15MB)
        if (file.size > 15 * 1024 * 1024) {
          toast.error(`O arquivo ${file.name} excede o limite de 15MB.`);
          continue;
        }

        // Upload do arquivo
        const filePath = `${patientId}/${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            upsert: true,
            onUploadProgress: (evt) => {
              if (evt?.total) {
                const pct = Math.round((evt.loaded / evt.total) * 100);
                setProgress(pct);
              }
            }
          });

        if (uploadError) {
          console.error(`Erro ao fazer upload de ${file.name}:`, uploadError);
          toast.error(`Erro ao enviar ${file.name}: ${uploadError.message}`);
          continue;
        }

        // Arquivo pequeno
        setProgress(100);
      }

      // Atualizar lista de arquivos
      await fetchFiles();
      toast.success('Arquivos enviados com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error(`Erro ao enviar arquivos: ${error.message}`);
    } finally {
      setIsUploading(false);
      // Limpar input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Deseja mesmo excluir o arquivo ${file.name}?`)) return;

    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([file.path]);

      if (error) throw error;

      // Atualizar lista de arquivos
      setFiles(files.filter(f => f.path !== file.path));
      toast.success(`Arquivo ${file.name} removido com sucesso!`);
    } catch (error: any) {
      console.error('Erro ao excluir arquivo:', error);
      toast.error(`Erro ao remover arquivo: ${error.message}`);
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(file.path);

      if (error) throw error;

      // Criar URL de download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Erro ao baixar arquivo:', error);
      toast.error(`Erro ao baixar arquivo: ${error.message}`);
    }
  };

  // Função para formatar o tamanho do arquivo
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
          type="button" 
          variant="outline" 
          onClick={handleFileSelect}
          disabled={isUploading}
          size="sm"
        >
          <Upload className="h-4 w-4 mr-2" />
          Enviar {allowMultiple ? 'arquivos' : 'arquivo'}
        </Button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={fileTypes.join(',')}
          className="hidden"
          multiple={allowMultiple}
          disabled={isUploading}
        />
      </div>

      {isUploading && (
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
      )}

      {files.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500">Nenhum arquivo encontrado</p>
          <p className="text-sm text-gray-400 mt-1">
            Clique em "Enviar {allowMultiple ? 'arquivos' : 'arquivo'}" para adicionar
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tamanho
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {files.map((file, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm text-gray-900 font-medium">{file.name}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm text-gray-500">{formatFileSize(file.size)}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm text-gray-500">
                      {format(new Date(file.created_at), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDownload(file)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDelete(file)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FileUploader;
