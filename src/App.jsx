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
import InventarioFarmacia from './pages/farmacia/InventarioFarmacia.jsx';
import DespachoRecetas from './pages/farmacia/DespachoRecetas.jsx';

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
            path="/farmacia/inventario"
            element={
              <ProtectedRoute ruta="/farmacia/inventario" element={<InventarioFarmacia />} />
            }
          />
          <Route 
            path="farmacia/despachos" 
            element={
              <DespachoRecetas ruta="/farmacia/despachos" element={<DespachoRecetas />} />
            } 
          />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
