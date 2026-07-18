import 'dotenv/config';
import { supabaseAdmin } from './lib/supabaseAdmin.js';

const termino = '%patito%';
const result = await supabaseAdmin
  .from('persona')
  .select('persona_id, nombre, apellido, paciente:paciente (id_paciente)')
  .ilike('nombre', termino)
  .limit(10);
console.log(JSON.stringify(result, null, 2));
