
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { ArrowLeft, Download, Save } from 'lucide-react';
import { useMockPatients } from '@/hooks/useMockPatients';

interface FacialPoint {
  id: string;
  label: string;
  x: number;
  y: number;
}

interface FacialAdjustment {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
}

const PatientPlanning = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPatientById } = useMockPatients();
  const [patient, setPatient] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const [facialPoints, setFacialPoints] = useState<FacialPoint[]>([]);
  const [adjustments, setAdjustments] = useState<FacialAdjustment[]>([
    { id: 'jawWidth', label: 'Largura da Mandíbula', value: 0, min: -20, max: 20, step: 1 },
    { id: 'cheekboneWidth', label: 'Largura do Zigomático', value: 0, min: -20, max: 20, step: 1 },
    { id: 'noseProjection', label: 'Projeção Nasal', value: 0, min: -20, max: 20, step: 1 },
    { id: 'lipFullness', label: 'Volume Labial', value: 0, min: -20, max: 20, step: 1 },
    { id: 'chinProjection', label: 'Projeção do Queixo', value: 0, min: -20, max: 20, step: 1 },
  ]);
  
  useEffect(() => {
    if (id) {
      const patientData = getPatientById(id);
      if (patientData) {
        setPatient(patientData);
      } else {
        toast.error("Paciente não encontrado");
        navigate('/pacientes');
      }
      setLoading(false);
    }
  }, [id, navigate, getPatientById]);

  useEffect(() => {
    if (imageRef.current && imageRef.current.complete && canvasRef.current) {
      initializeCanvas();
    }
  }, [patient]);

  const initializeCanvas = () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const img = imageRef.current;
    
    // Set canvas size to match image
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw the image on the canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // For demo purposes, just set some example facial points
    // In a real app, you would use face-api.js to detect these points
    const examplePoints: FacialPoint[] = [
      { id: 'jaw1', label: 'Jaw Left', x: canvas.width * 0.2, y: canvas.height * 0.8 },
      { id: 'jaw2', label: 'Jaw Right', x: canvas.width * 0.8, y: canvas.height * 0.8 },
      { id: 'nose', label: 'Nose Tip', x: canvas.width * 0.5, y: canvas.height * 0.5 },
      { id: 'leftCheek', label: 'Left Cheek', x: canvas.width * 0.3, y: canvas.height * 0.5 },
      { id: 'rightCheek', label: 'Right Cheek', x: canvas.width * 0.7, y: canvas.height * 0.5 },
    ];
    
    setFacialPoints(examplePoints);
    drawPoints(ctx, examplePoints);
  };
  
  const drawPoints = (ctx: CanvasRenderingContext2D, points: FacialPoint[]) => {
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(221, 107, 32, 0.8)';
      ctx.fill();
      ctx.strokeStyle = '#1B0B25';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  };
  
  const handleAdjustmentChange = (id: string, newValue: number[]) => {
    setAdjustments(prev => 
      prev.map(adj => 
        adj.id === id ? { ...adj, value: newValue[0] } : adj
      )
    );
    
    // In a real app, this would modify the facial points and redraw the canvas
    applyAdjustments();
  };
  
  const applyAdjustments = () => {
    if (!canvasRef.current || !imageRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas and redraw the image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
    
    // Apply adjustments to facial points (mock implementation)
    const adjustedPoints = facialPoints.map(point => {
      let x = point.x;
      let y = point.y;
      
      // Example of how adjustments could affect points
      const jawWidth = adjustments.find(a => a.id === 'jawWidth')?.value || 0;
      const cheekboneWidth = adjustments.find(a => a.id === 'cheekboneWidth')?.value || 0;
      
      if (point.id === 'jaw1') x -= jawWidth;
      if (point.id === 'jaw2') x += jawWidth;
      if (point.id === 'leftCheek') x -= cheekboneWidth;
      if (point.id === 'rightCheek') x += cheekboneWidth;
      
      return { ...point, x, y };
    });
    
    // Draw the adjusted points
    drawPoints(ctx, adjustedPoints);
  };
  
  const handleSave = () => {
    toast.success("Planejamento facial salvo com sucesso!");
  };
  
  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `planejamento_${patient?.name || 'paciente'}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    
    toast.success("Imagem do planejamento facial baixada com sucesso!");
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-hubAssist-primary"></div>
      </div>
    );
  }
  
  if (!patient) {
    return (
      <div className="text-center py-12">
        <p>Paciente não encontrado</p>
        <Button className="mt-4" onClick={() => navigate('/pacientes')}>
          Voltar para lista de pacientes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate('/pacientes')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold text-hubAssist-primary">
            Planejamento Facial: {patient.name}
          </h2>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" /> Baixar
          </Button>
          <Button className="btn-primary" onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" /> Salvar
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card className="overflow-hidden">
            <CardContent className="p-0 relative">
              <div className="relative">
                <img 
                  ref={imageRef}
                  src={patient.imageUrl || '/placeholder.svg'} 
                  alt={patient.name}
                  className="w-full h-auto object-contain"
                  onLoad={initializeCanvas}
                />
                <canvas 
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full"
                />
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-4">Ajustes Faciais</h3>
              
              <div className="space-y-6">
                {adjustments.map((adjustment) => (
                  <div key={adjustment.id} className="space-y-2">
                    <div className="flex justify-between">
                      <label className="text-sm font-medium">{adjustment.label}</label>
                      <span className="text-sm text-muted-foreground">
                        {adjustment.value > 0 && '+'}{adjustment.value}
                      </span>
                    </div>
                    <Slider
                      value={[adjustment.value]}
                      min={adjustment.min}
                      max={adjustment.max}
                      step={adjustment.step}
                      onValueChange={(value) => handleAdjustmentChange(adjustment.id, value)}
                    />
                  </div>
                ))}
              </div>
              
              <Button 
                className="w-full mt-6 btn-secondary" 
                onClick={() => setAdjustments(adj => adj.map(a => ({ ...a, value: 0 })))}
              >
                Resetar Ajustes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PatientPlanning;
