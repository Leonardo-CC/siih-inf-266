import 'dotenv/config';
import { obtenerPacientes, buscarPacientesPorNombre } from './repositories/admisionRepository.js';
import { supabaseAdmin } from './lib/supabaseAdmin.js';

console.log('=== obtenerPacientes ===');
const pacientes = await obtenerPacientes();
console.log(JSON.stringify(pacientes.slice(0, 20), null, 2));
console.log('count:', pacientes.length);

console.log('=== buscarPacientesPorNombre("patito") ===');
const busqueda = await buscarPacientesPorNombre('patito');
console.log(JSON.stringify(busqueda, null, 2));
console.log('count:', busqueda.length);

console.log('=== supabase paciente raw ===');
const { data, error } = await supabaseAdmin
  .from('paciente')
  .select('id_paciente, persona:persona_id (persona_id, nombre, apellido)')
  .limit(20);
console.log('error:', error);
console.log('data:', JSON.stringify(data, null, 2));
