// Conexión compartida con Google Sheets (usa las mismas variables de entorno del CRUD)
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Columnas de la hoja "Autos" (primera pestaña del documento)
export const COLUMNAS = ['ID', 'Marca', 'Modelo', 'Anio', 'Precio', 'Categoria', 'Transmision', 'Combustible', 'Kilometraje', 'Stock', 'Imagen'];

export async function abrirHoja() {
  const auth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n').replace(/"/g, ''),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, auth);
  await doc.loadInfo();
  return doc;
}

export const hojaAutos = (doc) => doc.sheetsByIndex[0];

export function filaAAuto(r) {
  return {
    id: r.get('ID') || '',
    marca: r.get('Marca') || '',
    modelo: r.get('Modelo') || '',
    anio: Number(r.get('Anio')) || '',
    precio: Number(String(r.get('Precio') || '').replace(/[^0-9.]/g, '')) || 0,
    categoria: r.get('Categoria') || '',
    transmision: r.get('Transmision') || '',
    combustible: r.get('Combustible') || '',
    kilometraje: Number(String(r.get('Kilometraje') || '').replace(/[^0-9.]/g, '')) || 0,
    stock: Number(r.get('Stock')) || 0,
    imagen: (r.get('Imagen') || '').trim(),
  };
}

// Agrega a la hoja las columnas que falten (por ejemplo, Imagen) sin borrar datos
export async function asegurarColumnas(hoja) {
  try {
    await hoja.loadHeaderRow();
  } catch {
    await hoja.setHeaderRow(COLUMNAS);
    return;
  }
  const faltan = COLUMNAS.filter((c) => !hoja.headerValues.includes(c));
  if (faltan.length) {
    const nuevas = [...hoja.headerValues, ...faltan];
    if (hoja.columnCount < nuevas.length) await hoja.resize({ rowCount: hoja.rowCount, columnCount: nuevas.length });
    await hoja.setHeaderRow(nuevas);
  }
}

export async function leerAutos(doc) {
  const filas = await hojaAutos(doc).getRows();
  return filas.map(filaAAuto).filter((a) => a.marca || a.modelo);
}

// Obtiene (o crea si no existe) la pestaña Historial
export async function hojaHistorial(doc) {
  let hoja = doc.sheetsByTitle['Historial'];
  if (!hoja) {
    hoja = await doc.addSheet({ title: 'Historial', headerValues: ['Fecha', 'Pregunta', 'Respuesta'] });
  }
  return hoja;
}

export const json = (status, data) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
