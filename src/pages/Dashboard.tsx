
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Image, Plus } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-hubAssist-primary">Bem-vindo ao Hubb Assist</h2>
        <Link to="/pacientes/novo">
          <Button className="btn-secondary">
            <Plus className="mr-2 h-4 w-4" /> Novo Paciente
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xl font-medium">Pacientes</CardTitle>
            <Users className="h-5 w-5 text-hubAssist-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <CardDescription>pacientes cadastrados</CardDescription>
            <Link to="/pacientes" className="text-hubAssist-secondary hover:underline text-sm block mt-4">
              Ver todos os pacientes →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xl font-medium">Agendamentos</CardTitle>
            <Calendar className="h-5 w-5 text-hubAssist-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <CardDescription>agendamentos pendentes</CardDescription>
            <Link to="/agendamentos" className="text-hubAssist-secondary hover:underline text-sm block mt-4">
              Ver agenda →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xl font-medium">Planejamentos</CardTitle>
            <Image className="h-5 w-5 text-hubAssist-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <CardDescription>planejamentos faciais</CardDescription>
            <Link to="/planejamento" className="text-hubAssist-secondary hover:underline text-sm block mt-4">
              Ver planejamentos →
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Acesse as principais funcionalidades do sistema</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Link to="/pacientes/novo">
              <Button variant="outline" className="w-full text-left justify-start h-auto py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-hubAssist-primary/10">
                    <Plus className="h-5 w-5 text-hubAssist-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Cadastrar Paciente</div>
                    <div className="text-sm text-muted-foreground">Adicione um novo paciente ao sistema</div>
                  </div>
                </div>
              </Button>
            </Link>
            
            <Link to="/pacientes">
              <Button variant="outline" className="w-full text-left justify-start h-auto py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-hubAssist-primary/10">
                    <Users className="h-5 w-5 text-hubAssist-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Listar Pacientes</div>
                    <div className="text-sm text-muted-foreground">Visualize todos os pacientes cadastrados</div>
                  </div>
                </div>
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
