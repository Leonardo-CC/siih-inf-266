import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
  const [datoBaseDatos, setDatoBaseDatos] = useState('Buscando datos...');
  const [color, setColor] = useState('#f59e0b'); // Naranja de espera

  useEffect(() => {
    async function obtenerDatos() {
      // Consultamos la tabla que acabas de crear
      const { data, error } = await supabase.from('tabla_falsa').select('*');

      if (error) {
        setDatoBaseDatos('❌ Error al leer: ' + error.message);
        setColor('#ef4444'); // Rojo
      } else if (data && data.length > 0) {
        // Extraemos el mensaje de la primera fila que insertaste
        setDatoBaseDatos('✅ ' + data[0].mensaje);
        setColor('#10b981'); // Verde
      } else {
        setDatoBaseDatos('⚠️ La tabla existe, pero está vacía.');
        setColor('#f59e0b'); // Naranja
      }
    }

    obtenerDatos();
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
      <h1>Panel de Control</h1>
      
      <div style={{ 
        marginTop: '20px', 
        padding: '20px', 
        borderRadius: '8px',
        backgroundColor: '#1e293b', 
        color: '#ffffff',
        display: 'inline-block'
      }}>
        <h2>Respuesta del Servidor:</h2>
        <h3 style={{ color: color }}>
          {datoBaseDatos}
        </h3>
      </div>
    </div>
  );
}

export default App;
