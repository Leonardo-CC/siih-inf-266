// src/App.jsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import ProtectedLayout from './components/ProtectedLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Login from './pages/Login.jsx';
import RegistroPaciente from './pages/paciente/RegistroPaciente.jsx';
import SolicitarCitaPage from './pages/paciente/SolicitarCitaPage.jsx';
import GestionAdmision from './pages/enfermeria/GestionAdmision.jsx';
import RegistroSignosVitales from './pages/enfermeria/RegistroSignosVitales.jsx';
import GestionPacientesEnfermeria from './pages/enfermeria/GestionPacientesEnfermeria.jsx';
import GestionConsultasMedico from './pages/medico/GestionConsultasMedico.jsx';
import SignosVitalesMedico from './pages/medico/SignosVitalesMedico.jsx';
import PacienteDashboard from './pages/paciente/PacienteDashboard.jsx';
import MiPerfil from './pages/paciente/MiPerfil.jsx';
import MisCitas from './pages/paciente/MisCitas.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminUsuarios from './pages/admin/AdminUsuarios.jsx';
import AdminPacientes from './pages/admin/AdminPacientes.jsx';
import AdminCitas from './pages/admin/AdminCitas.jsx';
import AdminAdmisiones from './pages/admin/AdminAdmisiones.jsx';
import AdminSignosVitales from './pages/admin/AdminSignosVitales.jsx';
import AdminConfiguracion from './pages/admin/AdminConfiguracion.jsx';
import TecnicoLaboratorioDashboard from './pages/laboratorio/TecnicoLaboratorioDashboard.jsx';
import GestionAnalisisLaboratorio from './pages/laboratorio/GestionAnalisisLaboratorio.jsx';
import PacientesLaboratorio from './pages/laboratorio/PacientesLaboratorio.jsx';
import MiPerfilTecnico from './pages/laboratorio/MiPerfilTecnico.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/paciente/registro" element={<RegistroPaciente />} />

        <Route element={<ProtectedLayout />}>
          <Route
            path="/"
            element={
              <ProtectedRoute ruta="/dashboard" element={<Dashboard />} />
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute ruta="/dashboard" element={<Dashboard />} />
            }
          />
          <Route
            path="/paciente/cita"
            element={
              <ProtectedRoute ruta="/paciente/cita" element={<SolicitarCitaPage />} />
            }
          />
          <Route
            path="/paciente/citas"
            element={
              <ProtectedRoute ruta="/paciente/citas" element={<MisCitas />} />
            }
          />
          <Route
            path="/paciente/perfil"
            element={
              <ProtectedRoute ruta="/paciente/perfil" element={<MiPerfil />} />
            }
          />
          <Route
            path="/enfermeria/admisiones"
            element={
              <ProtectedRoute ruta="/enfermeria/admisiones" element={<GestionAdmision />} />
            }
          />
          <Route
            path="/enfermeria/signos-vitales"
            element={
              <ProtectedRoute ruta="/enfermeria/signos-vitales" element={<RegistroSignosVitales />} />
            }
          />
          <Route
            path="/enfermeria/pacientes"
            element={
              <ProtectedRoute ruta="/enfermeria/pacientes" element={<GestionPacientesEnfermeria />} />
            }
          />
          <Route
            path="/laboratorio/analisis"
            element={
              <ProtectedRoute ruta="/laboratorio/analisis" element={<GestionAnalisisLaboratorio />} />
            }
          />
          <Route
            path="/laboratorio/pacientes"
            element={
              <ProtectedRoute ruta="/laboratorio/pacientes" element={<PacientesLaboratorio />} />
            }
          />
          <Route
            path="/laboratorio/perfil"
            element={
              <ProtectedRoute ruta="/laboratorio/perfil" element={<MiPerfilTecnico />} />
            }
          />
          <Route
            path="/medico/consultas"
            element={
              <ProtectedRoute ruta="/medico/consultas" element={<GestionConsultasMedico />} />
            }
          />
          <Route
            path="/medico/signos"
            element={
              <ProtectedRoute ruta="/medico/signos" element={<SignosVitalesMedico />} />
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute ruta="/admin" element={<AdminDashboard />} />
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <ProtectedRoute ruta="/admin/usuarios" element={<AdminUsuarios />} />
            }
          />
          <Route
            path="/admin/pacientes"
            element={
              <ProtectedRoute ruta="/admin/pacientes" element={<AdminPacientes />} />
            }
          />
          <Route
            path="/admin/citas"
            element={
              <ProtectedRoute ruta="/admin/citas" element={<AdminCitas />} />
            }
          />
          <Route
            path="/admin/admisiones"
            element={
              <ProtectedRoute ruta="/admin/admisiones" element={<AdminAdmisiones />} />
            }
          />
          <Route
            path="/admin/signos-vitales"
            element={
              <ProtectedRoute ruta="/admin/signos-vitales" element={<AdminSignosVitales />} />
            }
          />
          <Route
            path="/admin/configuracion"
            element={
              <ProtectedRoute ruta="/admin/configuracion" element={<AdminConfiguracion />} />
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
