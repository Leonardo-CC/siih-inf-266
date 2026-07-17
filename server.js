// server.js (VERSIÓN MEJORADA)
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

const envPath = path.join(__dirname, '.env.local');
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.warn(`⚠️ No se pudo cargar .env.local: ${result.error.message}`);
}

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ ERROR: Faltan variables SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  console.error('   Asegúrate de que el archivo .env.local existe en la raíz del proyecto');
  console.error('   con las credenciales de Supabase correctas.');
  process.exit(1);
}

console.log('✅ Variables de entorno cargadas correctamente');

// PASO 2: Importar Express y crear la app
import express from 'express';

const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ============================================================
// Health Check
// ============================================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Servidor backend funcionando' });
});

// PASO 3: DESPUÉS de todo, cargar handlers dinámicamente
async function setupRoutes() {
  try {
    // ============================================================
    // Cargar endpoints de /api/pagos/
    // ============================================================
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

    // ============================================================
    // Cargar endpoints de /api/citas/
    // ============================================================
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

    // ============================================================
    // Cargar endpoints de /api/pacientes/
    // ============================================================
    const { default: registroHandler } = await import('./api/pacientes/registro.js');
    app.post('/api/pacientes/registro', async (req, res) => {
      req.method = 'POST';
      return registroHandler(req, res);
    });

    console.log('✅ Todos los endpoints cargados correctamente');
  } catch (error) {
    console.error('❌ Error al cargar los endpoints:', error.message);
    process.exit(1);
  }
}

// ============================================================
// Iniciar servidor
// ============================================================
await setupRoutes();

app.listen(PORT, () => {
  console.log(`✅ Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`📡 Frontend conecta a http://localhost:5173`);
  console.log(`🔗 Endpoints disponibles en http://localhost:${PORT}/api/`);
});
