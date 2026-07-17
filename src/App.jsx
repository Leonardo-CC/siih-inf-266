// src/App.jsx
// ============================================================
// CAPA DE PRESENTACIÓN — Enrutador principal de la SPA.
// Reemplaza el panel de prueba de conexión (esa validación ya
// quedó cubierta por /api/test-bd.js). Cada nueva HU agrega
// su propia ruta aquí.
// ============================================================
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import RegistroPaciente from './pages/paciente/RegistroPaciente.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/paciente/registro" element={<RegistroPaciente />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;