// api/pagos/diagnostico-pago.js
// ============================================================
// Endpoint: GET /api/pagos/diagnostico-pago
// Diagnostica qué valores son válidos para metodo_pago
// ============================================================

import { supabaseAdmin } from '../../lib/supabaseAdmin.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Intentar insertar cada método para ver cuál funciona
    const metodosAProbar = [
      'efectivo',
      'transferencia',
      'tarjeta',
      'cash',
      'transfer',
      'card',
      'cash_payment',
      'bank_transfer',
      'credit_card',
      'tarjeta_credito',
      'transferencia_bancaria',
    ];

    const resultados = {};

    for (const metodo of metodosAProbar) {
      try {
        // Intentar insertar un registro de prueba
        const { error } = await supabaseAdmin
          .from('pago')
          .insert([
            {
              id_consulta: 999999, // ID ficticio
              monto: 0.01,
              metodo_pago: metodo,
              comprobante: `TEST-${metodo}`,
            },
          ])
          .select('id_pago')
          .single();

        if (error) {
          resultados[metodo] = `NO VÁLIDO: ${error.message}`;
        } else {
          resultados[metodo] = 'VÁLIDO ✓';
          // Eliminar el registro de prueba
          await supabaseAdmin
            .from('pago')
            .delete()
            .eq('comprobante', `TEST-${metodo}`);
        }
      } catch (err) {
        resultados[metodo] = `ERROR: ${err.message}`;
      }
    }

    return res.status(200).json({
      diagnostico: 'Valores probados para metodo_pago',
      resultados: resultados,
      instrucciones: 'Busca las entradas con "VÁLIDO ✓" para saber qué valores funcionan',
    });
  } catch (error) {
    console.error('[/api/pagos/diagnostico-pago] Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}
