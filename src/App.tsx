
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

// Layouts
import AppLayout from "./components/layout/AppLayout";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import PatientsList from "./pages/PatientsList";
import PatientForm from "./pages/PatientForm";
import EditPatient from "./pages/EditPatient";
import PatientPlanning from "./pages/PatientPlanning";
import PatientDetail from "./pages/PatientDetail";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Patient routes */}
          <Route path="/pacientes" element={<PatientsList />} />
          <Route path="/pacientes/novo" element={<PatientForm />} />
          <Route path="/pacientes/:id" element={<PatientDetail />} />
          <Route path="/pacientes/:id/edit" element={<EditPatient />} />
          <Route path="/pacientes/:id/planejamento" element={<PatientPlanning />} />
          
          {/* Placeholder routes */}
          <Route path="/agendamentos" element={
            <PlaceholderPage
              title="Agendamentos"
              description="Funcionalidade de agendamentos em desenvolvimento."
              backLink="/dashboard"
              backText="Voltar para Dashboard"
            />
          } />
          <Route path="/planejamento" element={
            <PlaceholderPage
              title="Planejamentos"
              description="Lista de planejamentos em desenvolvimento."
              backLink="/pacientes"
              backText="Ver pacientes"
            />
          } />
          <Route path="/configuracoes" element={
            <PlaceholderPage
              title="Configurações"
              description="Funcionalidade de configurações em desenvolvimento."
              backLink="/dashboard"
              backText="Voltar para Dashboard"
            />
          } />
        </Route>
        
        {/* 404 route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
