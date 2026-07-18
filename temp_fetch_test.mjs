import 'dotenv/config';

const url = 'http://localhost:3001/api/admisiones/buscar?q=patito';
console.log('Fetching', url);

const res = await fetch(url);
const json = await res.json();
console.log(JSON.stringify(json, null, 2));
