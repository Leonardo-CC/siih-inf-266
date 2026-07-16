import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Inicializamos Supabase
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
  // Creamos estados para controlar el texto y el color en pantalla
  const [estadoConexion, setEstadoConexion] = useState('⏳ Probando conexión a Supabase...');
  const [colorEstado, setColorEstado] = useState('#f59e0b'); // Color naranja de espera

  useEffect(() => {
    async function probarConexion() {
      try {
        // Intentamos consultar la tabla falsa
        const { error } = await supabase.from('tabla_falsa').select('*').limit(1);
        
        // Evaluamos la respuesta
        if (error && error.code === '42P01') {
          // El "error bueno": llegamos a la base de datos pero la tabla no existe
          setEstadoConexion('✅ ¡Conexión exitosa a Supabase!');
          setColorEstado('#10b981'); // Verde
        } else if (error) {
          // Un error real de conexión
          setEstadoConexion('❌ Error de conexión: ' + error.message);
          setColorEstado('#ef4444'); // Rojo
        } else {
          // Conexión exitosa y la tabla casualmente existía
          setEstadoConexion('✅ ¡Conexión exitosa a Supabase!');
          setColorEstado('#10b981'); // Verde
        }
      } catch (err) {
        setEstadoConexion('❌ Error de red o configuración.');
        setColorEstado('#ef4444'); // Rojo
      }
    }

    probarConexion();
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
      <h1>Panel de Control</h1>
      
      <div style={{ 
        marginTop: '20px', 
        padding: '20px', 
        borderRadius: '8px',
        backgroundColor: '#1e293b', // Fondo oscuro
        color: '#ffffff',
        display: 'inline-block'
      }}>
        <h2>Estado de la Base de Datos:</h2>
        <h3 style={{ color: colorEstado }}>
          {estadoConexion}
        </h3>
      </div>
    </div>
  );
}

export default App;
