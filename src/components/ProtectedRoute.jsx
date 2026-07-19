import { Navigate } from 'react-router-dom';
import { obtenerUsuario } from '../lib/authSession.js';

const rolesPermitidos = {
  '/dashboard': ['paciente', 'enfermero', 'medico', 'administrativo', 'farmaceutico', 'tecnico_laboratorio'],
  '/paciente/cita': ['paciente', 'administrativo'],
  '/paciente/citas': ['paciente'],
  '/paciente/perfil': ['paciente'],
  '/paciente/historial': ['paciente', 'medico'],
  '/enfermeria/admisiones': ['enfermero', 'administrativo', 'medico'],
  '/enfermeria/signos-vitales': ['enfermero', 'administrativo'],
  '/enfermeria/pacientes': ['enfermero', 'administrativo'],
  '/laboratorio/analisis': ['tecnico_laboratorio', 'administrativo'],
  '/laboratorio/pacientes': ['tecnico_laboratorio', 'administrativo'],
  '/laboratorio/perfil': ['tecnico_laboratorio'],
  '/medico/consultas': ['medico'],
  '/medico/signos': ['medico'],
  '/admin': ['administrativo'],
  '/admin/usuarios': ['administrativo'],
  '/admin/pacientes': ['administrativo'],
  '/admin/citas': ['administrativo'],
  '/admin/admisiones': ['administrativo'],
  '/admin/signos-vitales': ['administrativo'],
  '/admin/configuracion': ['administrativo'],
  '/admin/catalogo': ['administrativo'],
  '/admin/stock': ['administrativo'],
  '/farmacia/inventario': ['farmaceutico'],
};

export default function ProtectedRoute({ element, ruta }) {
  const usuario = obtenerUsuario();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  const permitidos = rolesPermitidos[ruta] || Object.keys(rolesPermitidos);
  if (!permitidos.includes(usuario.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return element;
}
