import 'dotenv/config';
import { buscarPacientesPorNombre } from './repositories/admisionRepository.js';

const results = await buscarPacientesPorNombre('patito');
console.log(JSON.stringify(results, null, 2));
