# SIIH-INF-266
This is the repository that subject INF-266 "Taller de Tecnico Superior".
## ⚙️ Configuración de la Base de Datos (Supabase)

Este proyecto utiliza Supabase como backend y base de datos. Para ejecutar el sistema en tu entorno local, necesitas configurar las variables de entorno. 

Sigue estos pasos cuidadosamente:

1. En la raíz del proyecto, duplica el archivo `.env.example` (si existe) o crea un archivo nuevo llamado exactamente `.env.local`.
2. Copia y pega el siguiente bloque de variables dentro de ese archivo.
3. Las variables de URLs y la clave pública (`ANON_KEY`) ya están configuradas. **Deberás solicitar la clave secreta (`SERVICE_ROLE_KEY`) a los administradores del repositorio por interno.**

```env
# ============================================================
# Variables de entorno para desarrollo local (Supabase)
# ============================================================

# URLs de nuestro proyecto Supabase
VITE_SUPABASE_URL=[https://mtdpdtxrlupcdszdexta.supabase.co](https://mtdpdtxrlupcdszdexta.supabase.co)
SUPABASE_URL=[https://mtdpdtxrlupcdszdexta.supabase.co](https://mtdpdtxrlupcdszdexta.supabase.co)

# Anon Key (Para el cliente frontend, es seguro compartirla)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10ZHBkdHhybHVwY2RzemRleHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQxOTQ4MDQsImV4cCI6MjA5OTc3MDgwNH0.Ln4-ZSI-NBqyCbSZyxNKwMd_sZ6Fs239G0mAiBBWV-I

# Service Role Key (SECRETO - Da acceso total, saltando RLS)
# ⚠️ IMPORTANTE: Solicita esta clave por el grupo de WhatsApp/Discord. 
# 🛑 ¡NUNCA HAGAS COMMIT DE ESTA CLAVE A GITHUB!
SUPABASE_SERVICE_ROLE_KEY=pega_aqui_la_clave_secreta_que_te_pasen_por_interno
