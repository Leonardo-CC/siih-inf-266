# SIIH-INF-266
This is the repository that subject INF-266 "Taller de Tecnico Superior".
## ⚙️ Configuración de la Base de Datos (Supabase)

Este proyecto utiliza Supabase como backend. Para poder ejecutar el sistema localmente y conectarte a la base de datos, cada miembro del equipo debe configurar sus propias variables de entorno obteniendo las credenciales directamente desde la plataforma.

### Pasos para la configuración:

1. En la raíz del proyecto, crea un archivo nuevo llamado exactamente `.env.local`.
2. Ingresa a [Supabase](https://supabase.com) con tu cuenta y asegúrate de haber aceptado la invitación al proyecto del grupo.
3. Dentro del panel del proyecto, dirígete al menú lateral izquierdo y haz clic en **Project Settings** (el ícono de engranaje ⚙️).
4. En el submenú, selecciona la opción **API**.
5. Copia los valores de esa pantalla y pégalos en tu archivo `.env.local` usando la siguiente plantilla:

```env
# ============================================================
# Variables de entorno para desarrollo local (Supabase)
# ============================================================

# 1. Project URL (Lo encuentras en la sección: Configuration -> URL)
VITE_SUPABASE_URL=[https://mtdpdtxrlupcdszdexta.supabase.co](https://mtdpdtxrlupcdszdexta.supabase.co)
SUPABASE_URL=[https://mtdpdtxrlupcdszdexta.supabase.co](https://mtdpdtxrlupcdszdexta.supabase.co)

# 2. Anon Key (Lo encuentras en: Project API Keys -> anon / public)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10ZHBkdHhybHVwY2RzemRleHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxOTQ4MDQsImV4cCI6MjA5OTc3MDgwNH0.Ln4-ZSI-NBqyCbSZyxNKwMd_sZ6Fs239G0mAiBBWV-I

# 3. Service Role Key (Lo encuentras en: Project API Keys -> service_role / secret)
# ⚠️ IMPORTANTE: Esta clave da acceso total a la base de datos. 
# 🛑 ¡NUNCA HAGAS COMMIT DE ESTE ARCHIVO A GITHUB!
SUPABASE_SERVICE_ROLE_KEY=pega_aqui_la_clave_secreta_que_copiaste_del_panel


## Issue Nro xxx: 
Descripcion
Para quien es: Como ... puedo ... 

## Issue Nro 07: 
Como medico puedes verificar las consultas dependiendo la fecha puedes seleccionar estados para filtrar
entre Pendiente, En atencion, Atendida y Derivada, dependiendo de la especialidad y el medico cambia ya
que esta asignado a su id medico.
correo y contraseña de pruebas
medico@hospital.com
123456

## Issue Nro 12: 
Como farmaceutico puedo verificar el dashboard, verificar el inventario y ver que lotes estan proximos a 
vencer y tambien aplico FEFO para el despacho de medicamentos, los medicamentos se verifican mediante la
receta y el medico que la asigno, se pueden agregar nuevos lotes de medicamentos.
## Issue Nro 13: 
Como farmaceutico puedo dispensar medicamentos ver la cantidad, el medico que la receto, el 
paciente que la necesita, la fecha de emision y todo se comprueba antes de la dispensacion aplicando 
FEFO
farmacia@prueba.com
123456


## Issue Nro 09: 
Instalar la dependencia: npm install pdf-lib
ejecutar en terminal: npm install --global yarn
no olvidar ejecutar npm run server primero
ejecutar en terminal: vercel dev

**Como** médico, **quiero** generar un resumen exportable de la consulta
**para** entregarlo al paciente o guardarlo como archivo.

- **Issue:** [#12](https://github.com/Ayca19/SIIH-INF-266/issues/12)
- **Depende de:** HU-06 (Registrar historia clínica)
- **Criterio de aceptación:** Genera y exporta automáticamente un PDF con
  el resumen formal de diagnóstico y tratamiento.

### Flujo

1. El médico abre una consulta ya atendida desde **Mis Consultas** →
   botón **Editar**.
2. Si la consulta tiene diagnóstico guardado, se habilita el botón
   **📄 Descargar reporte PDF**.
3. El frontend pide `GET /api/medico/reporte-consulta?id_consulta=X&id_medico=Y`.
4. El backend valida (en este orden): que la consulta exista, que
   pertenezca al médico que la solicita, y que tenga diagnóstico
   registrado (si no, responde `409` pidiendo completar HU-06 primero).
5. Se arma el PDF con `pdf-lib` (sin fuentes externas, compatible con
   funciones serverless) y se devuelve como archivo adjunto
   (`application/pdf`).

### Arquitectura (3 capas)

| Capa | Archivo |
|---|---|
| Presentación | `src/pages/medico/GestionConsultasMedico.jsx` (botón + descarga), `src/styles/reporteConsulta.css` |
| Lógica y Seguridad | `api/medico/reporte-consulta.js` (endpoint), `services/reporteConsultaService.js` (validaciones + reglas de negocio), `services/reporteConsultaPdf.js` (armado del PDF) |
| Datos | `repositories/medicoRepository.js` → `obtenerConsultaParaReporte()`, `repositories/pacienteRepository.js` → `obtenerDetallePaciente()` |

### Notas técnicas

- El diagnóstico/tratamiento/receta no viven en columnas propias de
  `consulta`; se decodifican desde `observaciones` (bloque `[[MED]]`)
  vía `repositories/consultaMeta.js`.
- Dependencia nueva: `pdf-lib` (`npm install pdf-lib`).
- Requiere `vercel dev` para probarse en local (Vite solo no ejecuta `/api`).