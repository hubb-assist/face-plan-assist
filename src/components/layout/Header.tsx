
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  
  // Map routes to readable titles
  const getPageTitle = () => {
    const routes: Record<string, string> = {
      '/dashboard': 'Dashboard',
      '/pacientes': 'Gerenciamento de Pacientes',
      '/pacientes/novo': 'Cadastrar Novo Paciente',
      '/agendamentos': 'Agendamentos',
      '/planejamento': 'Planejamento Facial',
      '/configuracoes': 'Configurações',
    };
    
    // Handle dynamic routes
    if (pathname.match(/\/pacientes\/(.+)\/planejamento/)) {
      return 'Planejamento Facial do Paciente';
    }
    
    return routes[pathname] || 'Hubb Assist';
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center px-6 justify-between">
      <h1 className="page-title text-hubAssist-primary">{getPageTitle()}</h1>
      
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium">{user?.email}</p>
          <p className="text-xs text-gray-500">
            {user?.role === 'admin_clinic' ? 'Administrador' : 'Profissional'}
          </p>
        </div>
        <div className="h-10 w-10 rounded-full bg-hubAssist-primary text-white flex items-center justify-center font-medium">
          {user?.email.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};

export default Header;
