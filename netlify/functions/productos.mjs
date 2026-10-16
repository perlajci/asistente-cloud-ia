// API REST: GET /.netlify/functions/productos
// Devuelve el catálogo de Google Sheets y estadísticas para el dashboard.
import { abrirHoja, leerProductos, hojaHistorial, json } from '../lib/sheets.mjs';

export default async () => {
  try {
    const doc = await abrirHoja();
    const productos = await leerProductos(doc);

    let consultas = 0;
    try {
      const historial = await hojaHistorial(doc);
      consultas = (await historial.getRows()).length;
    } catch {
      consultas = 0;
    }

    const categorias = [...new Set(productos.map((p) => p.categoria).filter(Boolean))];

    return json(200, {
      conexion: 'OK',
      total: productos.length,
      categorias,
      consultas,
      productos,
    });
  } catch (error) {
    return json(500, { conexion: 'ERROR', error: 'No fue posible consultar Google Sheets: ' + error.message });
  }
};
