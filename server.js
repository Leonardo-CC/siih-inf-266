// server.js (VERSION MEJORADA)
// ============================================================
// Servidor Express para servir los endpoints de /api/
// Puerto: 3001
// ============================================================

// PASO 1: Cargar variables de entorno INMEDIATAMENTE
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envLocalPath = path.join(__dirname, '.env.local');
const envPath = path.join(__dirname, '.env');

dotenv.config({ path: envPath });
dotenv.config({
  path: envLocalPath,
  override: true,
});

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("X No se cargaron las variables de Supabase.");
  process.exit(1);
}
console.log('OK Variables de entorno cargadas correctamente');

import express from 'express';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor backend funcionando' });
});

async function setupRoutes() {
  try {
    const { default: loginHandler } = await import('./api/auth/login.js');
    app.post('/api/auth/login', async (req, res) => {
      req.method = 'POST';
      return loginHandler(req, res);
    });

    const { default: validarSeguroHandler } = await import('./api/pagos/validar-seguro.js');
    app.get('/api/pagos/validar-seguro', async (req, res) => {
      req.method = 'GET';
      return validarSeguroHandler(req, res);
    });

    const { default: procesarPagoHandler } = await import('./api/pagos/procesar-pago.js');
    app.post('/api/pagos/procesar-pago', async (req, res) => {
      req.method = 'POST';
      return procesarPagoHandler(req, res);
    });

    const { default: estadoPagoHandler } = await import('./api/pagos/estado-pago.js');
    app.get('/api/pagos/estado-pago', async (req, res) => {
      req.method = 'GET';
      return estadoPagoHandler(req, res);
    });

    const { default: diagnosticoPagoHandler } = await import('./api/pagos/diagnostico-pago.js');
    app.get('/api/pagos/diagnostico-pago', async (req, res) => {
      req.method = 'GET';
      return diagnosticoPagoHandler(req, res);
    });

    const { default: montoCitaHandler } = await import('./api/pagos/monto-cita.js');
    app.get('/api/pagos/monto-cita', async (req, res) => {
      req.method = 'GET';
      return montoCitaHandler(req, res);
    });

    const { default: especialidadesHandler } = await import('./api/citas/especialidades.js');
    app.get('/api/citas/especialidades', async (req, res) => {
      req.method = 'GET';
      return especialidadesHandler(req, res);
    });

    const { default: horariosHandler } = await import('./api/citas/horarios.js');
    app.get('/api/citas/horarios', async (req, res) => {
      req.method = 'GET';
      return horariosHandler(req, res);
    });

    const { default: medicosHandler } = await import('./api/citas/medicos.js');
    app.get('/api/citas/medicos', async (req, res) => {
      req.method = 'GET';
      return medicosHandler(req, res);
    });

    const { default: solicitarHandler } = await import('./api/citas/solicitar.js');
    app.post('/api/citas/solicitar', async (req, res) => {
      req.method = 'POST';
      return solicitarHandler(req, res);
    });

    const { default: opcionesAdmisionHandler } = await import('./api/admisiones/opciones.js');
    app.get('/api/admisiones/opciones', async (req, res) => {
      req.method = 'GET';
      return opcionesAdmisionHandler(req, res);
    });

    const { default: registrarAdmisionHandler } = await import('./api/admisiones/registrar.js');
    app.post('/api/admisiones/registrar', async (req, res) => {
      req.method = 'POST';
      return registrarAdmisionHandler(req, res);
    });

    const { default: listarAdmisionHandler } = await import('./api/admisiones/listar.js');
    app.get('/api/admisiones/listar', async (req, res) => {
      req.method = 'GET';
      return listarAdmisionHandler(req, res);
    });

    const { default: buscarAdmisionHandler } = await import('./api/admisiones/buscar.js');
    app.get('/api/admisiones/buscar', async (req, res) => {
      req.method = 'GET';
      return buscarAdmisionHandler(req, res);
    });

    const { default: actualizarAdmisionHandler } = await import('./api/admisiones/actualizar.js');
    app.put('/api/admisiones/actualizar', async (req, res) => {
      req.method = 'PUT';
      return actualizarAdmisionHandler(req, res);
    });

    const { default: eliminarAdmisionHandler } = await import('./api/admisiones/eliminar.js');
    app.post('/api/admisiones/eliminar', async (req, res) => {
      req.method = 'POST';
      return eliminarAdmisionHandler(req, res);
    });

    const { default: opcionesSignosHandler } = await import('./api/signos-vitales/opciones.js');
    app.get('/api/signos-vitales/opciones', async (req, res) => {
      req.method = 'GET';
      return opcionesSignosHandler(req, res);
    });

    const { default: registrarSignosHandler } = await import('./api/signos-vitales/registrar.js');
    app.post('/api/signos-vitales/registrar', async (req, res) => {
      req.method = 'POST';
      return registrarSignosHandler(req, res);
    });

    const { default: listarSignosHandler } = await import('./api/signos-vitales/listar.js');
    app.get('/api/signos-vitales/listar', async (req, res) => {
      req.method = 'GET';
      return listarSignosHandler(req, res);
    });

    const { default: actualizarSignosHandler } = await import('./api/signos-vitales/actualizar.js');
    app.put('/api/signos-vitales/actualizar', async (req, res) => {
      req.method = 'PUT';
      return actualizarSignosHandler(req, res);
    });

    const { default: eliminarSignosHandler } = await import('./api/signos-vitales/eliminar.js');
    app.post('/api/signos-vitales/eliminar', async (req, res) => {
      req.method = 'POST';
      return eliminarSignosHandler(req, res);
    });

    const { default: registroHandler } = await import('./api/pacientes/registro.js');
    app.post('/api/pacientes/registro', async (req, res) => {
      req.method = 'POST';
      return registroHandler(req, res);
    });

    const { default: miIdHandler } = await import('./api/pacientes/mi-id.js');
    app.post('/api/pacientes/mi-id', async (req, res) => {
      req.method = 'POST';
      return miIdHandler(req, res);
    });

    const { default: pacienteDashboardHandler } = await import('./api/paciente/dashboard.js');
    app.get('/api/paciente/dashboard', async (req, res) => {
      req.method = 'GET';
      return pacienteDashboardHandler(req, res);
    });

    const { default: pacientePerfilHandler } = await import('./api/paciente/perfil.js');
    app.get('/api/paciente/perfil', async (req, res) => {
      req.method = 'GET';
      return pacientePerfilHandler(req, res);
    });
    app.put('/api/paciente/perfil', async (req, res) => {
      req.method = 'PUT';
      return pacientePerfilHandler(req, res);
    });

    const { default: pacienteCitasHandler } = await import('./api/paciente/citas.js');
    app.get('/api/paciente/citas', async (req, res) => {
      req.method = 'GET';
      return pacienteCitasHandler(req, res);
    });

    const { default: historialPacienteHandler } = await import('./api/paciente/historial.js');
    app.get('/api/paciente/historial', async (req, res) => {
      req.method = 'GET';
      return historialPacienteHandler(req, res);
    });

    const { default: cancelarCitaHandler } = await import('./api/paciente/citas/cancelar.js');
    app.post('/api/paciente/citas/cancelar', async (req, res) => {
      req.method = 'POST';
      return cancelarCitaHandler(req, res);
    });

    const { default: recuperarHandler } = await import('./api/paciente/recuperar-contrasena.js');
    app.post('/api/paciente/recuperar-contrasena', async (req, res) => {
      req.method = 'POST';
      return recuperarHandler(req, res);
    });

    const { default: listarPacientesHandler } = await import('./api/pacientes/listar.js');
    app.get('/api/pacientes/listar', async (req, res) => {
      req.method = 'GET';
      return listarPacientesHandler(req, res);
    });

    const { default: eliminarPacienteHandler } = await import('./api/pacientes/eliminar.js');
    app.post('/api/pacientes/eliminar', async (req, res) => {
      req.method = 'POST';
      return eliminarPacienteHandler(req, res);
    });

    const { default: actualizarPacienteHandler } = await import('./api/pacientes/actualizar.js');
    app.put('/api/pacientes/actualizar', async (req, res) => {
      req.method = 'PUT';
      return actualizarPacienteHandler(req, res);
    });

    const { default: dashboardStatsHandler } = await import('./api/dashboard/stats.js');
    app.post('/api/dashboard/stats', async (req, res) => {
      req.method = 'POST';
      return dashboardStatsHandler(req, res);
    });

    const { default: dashboardEnfermeriaHandler } = await import('./api/dashboard/enfermeria.js');
    app.get('/api/dashboard/enfermeria', async (req, res) => {
      req.method = 'GET';
      return dashboardEnfermeriaHandler(req, res);
    });

    const { default: medicoDashboardHandler } = await import('./api/medico/dashboard.js');
    app.get('/api/medico/dashboard', async (req, res) => {
      req.method = 'GET';
      return medicoDashboardHandler(req, res);
    });

    const { default: medicoConsultasHandler } = await import('./api/medico/consultas.js');
    app.get('/api/medico/consultas', async (req, res) => {
      req.method = 'GET';
      return medicoConsultasHandler(req, res);
    });

    const { default: medicoActualizarHandler } = await import('./api/medico/actualizar-atencion.js');
    app.put('/api/medico/actualizar-atencion', async (req, res) => {
      req.method = 'PUT';
      return medicoActualizarHandler(req, res);
    });

    const { default: medicoSignosHandler } = await import('./api/medico/signos.js');
    app.get('/api/medico/signos', async (req, res) => {
      req.method = 'GET';
      return medicoSignosHandler(req, res);
    });

    const { default: laboratorioDashboardHandler } = await import('./api/tecnico-laboratorio/dashboard.js');
    app.get('/api/tecnico-laboratorio/dashboard', async (req, res) => {
      req.method = 'GET';
      return laboratorioDashboardHandler(req, res);
    });

    const { default: laboratorioAnalisisListarHandler } = await import('./api/tecnico-laboratorio/analisis/listar.js');
    app.get('/api/tecnico-laboratorio/analisis/listar', async (req, res) => {
      req.method = 'GET';
      return laboratorioAnalisisListarHandler(req, res);
    });

    const { default: laboratorioAnalisisRegistrarHandler } = await import('./api/tecnico-laboratorio/analisis/registrar.js');
    app.post('/api/tecnico-laboratorio/analisis/registrar', async (req, res) => {
      req.method = 'POST';
      return laboratorioAnalisisRegistrarHandler(req, res);
    });

    const { default: laboratorioAnalisisActualizarHandler } = await import('./api/tecnico-laboratorio/analisis/actualizar.js');
    app.put('/api/tecnico-laboratorio/analisis/actualizar', async (req, res) => {
      req.method = 'PUT';
      return laboratorioAnalisisActualizarHandler(req, res);
    });

    const { default: laboratorioAnalisisEliminarHandler } = await import('./api/tecnico-laboratorio/analisis/eliminar.js');
    app.post('/api/tecnico-laboratorio/analisis/eliminar', async (req, res) => {
      req.method = 'POST';
      return laboratorioAnalisisEliminarHandler(req, res);
    });

    const { default: laboratorioPacientesHandler } = await import('./api/tecnico-laboratorio/pacientes.js');
    app.get('/api/tecnico-laboratorio/pacientes', async (req, res) => {
      req.method = 'GET';
      return laboratorioPacientesHandler(req, res);
    });

    const { default: laboratorioMiIdHandler } = await import('./api/tecnico-laboratorio/mi-id.js');
    app.post('/api/tecnico-laboratorio/mi-id', async (req, res) => {
      req.method = 'POST';
      return laboratorioMiIdHandler(req, res);
    });

    const { default: laboratorioPerfilHandler } = await import('./api/tecnico-laboratorio/perfil.js');
    app.get('/api/tecnico-laboratorio/perfil', async (req, res) => {
      req.method = 'GET';
      return laboratorioPerfilHandler(req, res);
    });
    app.put('/api/tecnico-laboratorio/perfil', async (req, res) => {
      req.method = 'PUT';
      return laboratorioPerfilHandler(req, res);
    });

    const { default: laboratorioRecuperarHandler } = await import('./api/tecnico-laboratorio/recuperar-contrasena.js');
    app.post('/api/tecnico-laboratorio/recuperar-contrasena', async (req, res) => {
      req.method = 'POST';
      return laboratorioRecuperarHandler(req, res);
    });

    const { default: listarUsuariosHandler } = await import('./api/usuarios/listar.js');
    app.get('/api/usuarios/listar', async (req, res) => {
      req.method = 'GET';
      return listarUsuariosHandler(req, res);
    });

    const { default: registroUsuarioHandler } = await import('./api/usuarios/registro.js');
    app.post('/api/usuarios/registro', async (req, res) => {
      req.method = 'POST';
      return registroUsuarioHandler(req, res);
    });

    const { default: actualizarUsuarioHandler } = await import('./api/usuarios/actualizar.js');
    app.put('/api/usuarios/actualizar', async (req, res) => {
      req.method = 'PUT';
      return actualizarUsuarioHandler(req, res);
    });

    const { default: eliminarUsuarioHandler } = await import('./api/usuarios/eliminar.js');
    app.post('/api/usuarios/eliminar', async (req, res) => {
      req.method = 'POST';
      return eliminarUsuarioHandler(req, res);
    });

    const { default: adminPerfilHandler } = await import('./api/administrativo/perfil.js');
    app.get('/api/administrativo/perfil', async (req, res) => {
      req.method = 'GET';
      return adminPerfilHandler(req, res);
    });
    app.put('/api/administrativo/perfil', async (req, res) => {
      req.method = 'PUT';
      return adminPerfilHandler(req, res);
    });

    const { default: listarCitasHandler } = await import('./api/citas/listar.js');
    app.get('/api/citas/listar', async (req, res) => {
      req.method = 'GET';
      return listarCitasHandler(req, res);
    });

    const { default: actualizarCitaHandler } = await import('./api/citas/actualizar.js');
    app.put('/api/citas/actualizar', async (req, res) => {
      req.method = 'PUT';
      return actualizarCitaHandler(req, res);
    });

    const { default: eliminarCitaHandler } = await import('./api/citas/eliminar.js');
    app.post('/api/citas/eliminar', async (req, res) => {
      req.method = 'POST';
      return eliminarCitaHandler(req, res);
    });

    const { default: opcionesCitaHandler } = await import('./api/citas/opciones.js');
    app.get('/api/citas/opciones', async (req, res) => {
      req.method = 'GET';
      return opcionesCitaHandler(req, res);
    })
    // 1. Dashboard de Farmacia
    const { default: farmaciaDashboardHandler } = await import('./api/farmacia/dashboard.js');
    app.get('/api/farmacia/dashboard', async (req, res) => {
      req.method = 'GET';
      return farmaciaDashboardHandler(req, res);
    });

    // 2. Ingreso de Lotes (Inventario)
    const { default: farmaciaIngresoLoteHandler } = await import('./api/farmacia/ingreso-lote.js');
    app.post('/api/farmacia/ingreso-lote', async (req, res) => {
      req.method = 'POST';
      return farmaciaIngresoLoteHandler(req, res);
    });
    // 3. Obtener Catálogo de Inventario
    const { default: farmaciaInventarioDatosHandler } = await import('./api/farmacia/inventario-datos.js');
    app.get('/api/farmacia/inventario-datos', async (req, res) => {
      req.method = 'GET';
      return farmaciaInventarioDatosHandler(req, res);
    });
    // 4. Despachar Receta
    const { default: farmaciaDespachoHandler } = await import('./api/farmacia/despachar-receta.js');
    app.post('/api/farmacia/despachar-receta', async (req, res) => {
      req.method = 'POST';
      return farmaciaDespachoHandler(req, res);
    });
    // 5. Ver Recetas Pendientes
    const { default: farmaciaRecetasPendientesHandler } = await import('./api/farmacia/recetas-pendientes.js');
    app.get('/api/farmacia/recetas-pendientes', async (req, res) => {
      req.method = 'GET';
      return farmaciaRecetasPendientesHandler(req, res);
    });
    // 6. Estadísticas del Dashboard de Farmacia
    const { default: farmaciaStatsHandler } = await import('./api/farmacia/dashboard-stats.js');
    app.get('/api/farmacia/dashboard-stats', async (req, res) => {
      req.method = 'GET';
      return farmaciaStatsHandler(req, res);
    });

    console.log('OK Todos los endpoints cargados correctamente');
  } catch (error) {
    console.error('X Error al cargar los endpoints:', error.message);
    process.exit(1);
  }
}

await setupRoutes();

app.listen(PORT, () => {
  console.log(`OK Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`-> Frontend conecta a http://localhost:5173`);
  console.log(`-> Endpoints disponibles en http://localhost:${PORT}/api/`);
});
