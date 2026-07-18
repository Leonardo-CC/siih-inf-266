import 'dotenv/config';
import { supabaseAdmin } from './lib/supabaseAdmin.js';

console.log('=== persona ilike nombre ===');
let result = await supabaseAdmin
  .from('persona')
  .select('persona_id, nombre, apellido')
  .ilike('nombre', '%patito%');
console.log(JSON.stringify(result, null, 2));

console.log('=== persona ilike apellido ===');
result = await supabaseAdmin
  .from('persona')
  .select('persona_id, nombre, apellido')
  .ilike('apellido', '%patito%');
console.log(JSON.stringify(result, null, 2));

console.log('=== paciente nested persona ====================================');
result = await supabaseAdmin
  .from('paciente')
  .select('id_paciente, persona:persona_id (persona_id, nombre, apellido)')
  .limit(10);
console.log(JSON.stringify(result, null, 2));

console.log('=== paciente nested persona search nombre ===');
result = await supabaseAdmin
  .from('paciente')
  .select('id_paciente, persona:persona_id (persona_id, nombre, apellido)')
  .filter('persona.nombre', 'ilike', '%patito%')
  .limit(10);
console.log(JSON.stringify(result, null, 2));

console.log('=== paciente nested persona search apellido ===');
result = await supabaseAdmin
  .from('paciente')
  .select('id_paciente, persona:persona_id (persona_id, nombre, apellido)')
  .filter('persona.apellido', 'ilike', '%patito%')
  .limit(10);
console.log(JSON.stringify(result, null, 2));

console.log('=== paciente nested persona or ===');
result = await supabaseAdmin
  .from('paciente')
  .select('id_paciente, persona:persona_id (persona_id, nombre, apellido)')
  .or('persona.nombre.ilike.%patito%,persona.apellido.ilike.%patito%')
  .limit(10);
console.log(JSON.stringify(result, null, 2));
