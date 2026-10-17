// API REST del panel de administración (CRUD del inventario de autos en Google Sheets)
import { abrirHoja, hojaAutos, filaAAuto, asegurarColumnas } from '../lib/sheets.mjs';

const respuesta = (statusCode, data) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify(data),
});

// Convierte el objeto del frontend (minúsculas) a las columnas de la hoja
function aFila(a) {
  return {
    Marca: a.marca ?? '',
    Modelo: a.modelo ?? '',
    Anio: a.anio ?? '',
    Precio: a.precio ?? '',
    Categoria: a.categoria ?? '',
    Transmision: a.transmision ?? '',
    Combustible: a.combustible ?? '',
    Kilometraje: a.kilometraje ?? 0,
    Stock: a.stock ?? 0,
    Imagen: a.imagen ?? '',
  };
}

export const handler = async (event) => {
  try {
    const doc = await abrirHoja();
    const hoja = hojaAutos(doc);
    await asegurarColumnas(hoja); // crea encabezados o agrega la columna Imagen si falta

    const metodo = event.httpMethod;

    if (metodo === 'GET') {
      const filas = await hoja.getRows();
      return respuesta(200, filas.map(filaAAuto));
    }

    const datos = JSON.parse(event.body || '{}');

    if (metodo === 'POST') {
      await hoja.addRow({ ID: Date.now().toString(), ...aFila(datos) });
      return respuesta(201, { mensaje: 'Auto registrado' });
    }

    const filas = await hoja.getRows();
    const fila = filas.find((r) => r.get('ID') === String(datos.id));
    if (!fila) return respuesta(404, { error: 'No se encontró el auto con ese ID.' });

    if (metodo === 'PUT') {
      fila.assign(aFila(datos));
      await fila.save();
      return respuesta(200, { mensaje: 'Auto actualizado' });
    }

    if (metodo === 'DELETE') {
      await fila.delete();
      return respuesta(200, { mensaje: 'Auto eliminado' });
    }

    return respuesta(405, { error: 'Método no soportado' });
  } catch (error) {
    return respuesta(500, { error: error.message });
  }
};
