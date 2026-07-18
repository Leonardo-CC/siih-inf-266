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


## Issue Nro XX: 
Descripcion
Para quien es: para medico puede hacer, registrar.






