// API REST: GET /.netlify/functions/productos
// Devuelve el inventario de autos guardado en Google Sheets y estadísticas para el dashboard.
import { abrirHoja, leerAutos, hojaHistorial, json } from '../lib/sheets.mjs';

export default async () => {
  try {
    const doc = await abrirHoja();
    const productos = await leerAutos(doc);

    let consultas = 0;
    let ultimasConsultas = [];
    try {
      const historial = await hojaHistorial(doc);
      const filas = await historial.getRows();
      consultas = filas.length;
      ultimasConsultas = filas
        .slice(-5)
        .reverse()
        .map((r) => ({ fecha: r.get('Fecha'), pregunta: r.get('Pregunta') }));
    } catch {
      consultas = 0;
    }

    const categorias = [...new Set(productos.map((p) => p.categoria).filter(Boolean))];
    const marcas = [...new Set(productos.map((p) => p.marca).filter(Boolean))];

    return json(200, {
      conexion: 'OK',
      total: productos.length,
      unidades: productos.reduce((t, p) => t + p.stock, 0),
      categorias,
      marcas,
      consultas,
      ultimasConsultas,
      productos,
    });
  } catch (error) {
    return json(500, { conexion: 'ERROR', error: 'No fue posible consultar Google Sheets: ' + error.message });
  }
};
