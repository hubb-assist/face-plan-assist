
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  Calendar,
  Image,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const Sidebar = () => {
  const [expanded, setExpanded] = useState(false);
  const [patientsExpanded, setPatientsExpanded] = useState(false);
  const location = useLocation();
  const { signOut, user } = useAuth();

  const toggleSidebar = () => {
    setExpanded(!expanded);
  };

  const togglePatientsMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setPatientsExpanded(!patientsExpanded);
  };

  // Verificar se estamos em alguma rota de paciente
  const isPatientRoute = location.pathname.includes('/pacientes');

  const links = [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Calendar, label: 'Agendamentos', path: '/agendamentos' },
    { icon: Image, label: 'Planejamento', path: '/planejamento' },
    { icon: Settings, label: 'Configurações', path: '/configuracoes' },
  ];

  const patientSubmenus = [
    { label: 'Todos os pacientes', path: '/pacientes' },
    { label: 'Novo paciente', path: '/pacientes/novo' },
  ];

  return (
    <aside 
      className={cn(
        "bg-hubAssist-primary min-h-screen h-full flex flex-col shadow-lg z-10",
        expanded ? "sidebar-expanded" : "sidebar-collapsed"
      )}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center">
          {expanded ? (
            <img 
              src="https://sq360.com.br/logo-hubb-novo/logo_hubb_assisit.png" 
              alt="Hubb Assist" 
              className="h-10 w-auto" 
            />
          ) : (
            <div className="w-8 h-8 flex items-center justify-center">
              <img 
                src="https://sq360.com.br/logo-hubb-novo/logo_hubb_assisit_favicon.png" 
                alt="Hubb Assist" 
                className="max-h-8 max-w-8 object-contain" 
              />
            </div>
          )}
        </div>
        <button onClick={toggleSidebar} className="text-white hover:text-sidebar-primary">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      <nav className="mt-6 flex flex-col gap-2 p-2 flex-1">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={cn(
              "sidebar-link",
              location.pathname === link.path && "sidebar-link-active"
            )}
          >
            <link.icon className="sidebar-icon" />
            {expanded && (
              <span className="whitespace-nowrap transition-opacity duration-300">
                {link.label}
              </span>
            )}
          </Link>
        ))}

        {/* Menu especial com submenu para Pacientes */}
        <div className="relative">
          <a 
            href="#" 
            onClick={togglePatientsMenu} 
            className={cn(
              "sidebar-link",
              isPatientRoute && "sidebar-link-active"
            )}
          >
            <Users className="sidebar-icon" />
            {expanded && (
              <div className="flex items-center justify-between w-full">
                <span className="whitespace-nowrap transition-opacity duration-300">
                  Pacientes
                </span>
                {patientsExpanded ? 
                  <ChevronDown className="h-4 w-4" /> : 
                  <ChevronRight className="h-4 w-4" />
                }
              </div>
            )}
          </a>
          
          {/* Submenu de pacientes */}
          {expanded && patientsExpanded && (
            <div className="ml-8 mt-1 space-y-1">
              {patientSubmenus.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "block py-2 px-3 text-sm rounded-md text-sidebar-foreground hover:bg-sidebar-hover",
                    location.pathname === item.path && "bg-sidebar-active text-sidebar-active-foreground"
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="p-2 border-t border-sidebar-border mt-auto">
        {user && (
          <div className={cn(
            "py-2 px-3 mb-2 text-sm text-sidebar-foreground",
            expanded ? "block" : "hidden"
          )}>
            <p className="truncate">{user.email}</p>
            <p className="text-xs text-gray-400 truncate">
              {user.role === 'admin_clinic' ? 'Administrador' : 'Profissional'}
            </p>
          </div>
        )}
        <button 
          onClick={() => signOut()}
          className="sidebar-link w-full justify-start"
        >
          <LogOut className="sidebar-icon" />
          {expanded && (
            <span className="whitespace-nowrap transition-opacity duration-300">
              Sair
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
