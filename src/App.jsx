import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
  const [estado, setEstado] = useState('cargando');
  const [areas, setAreas] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function probarConexionReal() {
      // Consultamos la tabla "area_facultad" que ya tiene tus datos semilla
      const { data, error } = await supabase.from('area_facultad').select('*');

      if (error) {
        setEstado('error');
        setErrorMsg(error.message);
      } else {
        setEstado('conectado');
        setAreas(data || []);
      }
    }

    probarConexionReal();
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f0f9ff', /* Azul muy claro tipo médico */
      fontFamily: 'system-ui, -apple-system, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px'
    }}>
      
      {/* Tarjeta Principal */}
      <div style={{
        backgroundColor: '#ffffff',
        padding: '40px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(3, 105, 161, 0.1)',
        maxWidth: '600px',
        width: '100%',
        textAlign: 'center'
      }}>
        
        <h1 style={{ color: '#0369a1', margin: '0 0 10px 0', fontSize: '28px' }}>
          🏥 Sistema Integrado SIIH
        </h1>
        <p style={{ color: '#64748b', margin: '0 0 30px 0', fontSize: '16px' }}>
          Módulo de Administración Hospitalaria
        </p>

        {/* Estado de Conexión */}
        {estado === 'cargando' && (
          <div style={{ color: '#d97706', fontWeight: 'bold', fontSize: '18px' }}>
            ⏳ Conectando con la base de datos...
          </div>
        )}

        {estado === 'error' && (
          <div style={{ backgroundColor: '#fef2f2', color: '#ef4444', padding: '15px', borderRadius: '8px' }}>
            <strong>❌ Error de Conexión:</strong> {errorMsg}
          </div>
        )}

        {estado === 'conectado' && (
          <>
            <div style={{ 
              backgroundColor: '#ecfdf5', 
              color: '#059669', 
              padding: '12px', 
              borderRadius: '8px',
              fontWeight: 'bold',
              marginBottom: '30px'
            }}>
              ✅ ¡Base de datos conectada exitosamente!
            </div>

            <div style={{ textAlign: 'left' }}>
              <h3 style={{ color: '#334155', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
                Áreas Registradas en el Sistema:
              </h3>
              
              <ul style={{ listStyleType: 'none', padding: 0 }}>
                {areas.map((area) => (
                  <li key={area.id_area} style={{ 
                    backgroundColor: '#f8fafc',
                    padding: '12px 16px',
                    margin: '8px 0',
                    borderRadius: '6px',
                    borderLeft: '4px solid #0ea5e9',
                    color: '#334155',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <strong>{area.nombre_area}</strong>
                    <span style={{ fontSize: '14px', color: '#94a3b8' }}>{area.tipo_area}</span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
      
      <p style={{ color: '#94a3b8', marginTop: '30px', fontSize: '14px' }}>
        Desarrollado con React + Vite + Supabase
      </p>
    </div>
  );
}

export default App;
