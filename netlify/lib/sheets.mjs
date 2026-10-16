// Conexión compartida con Google Sheets (usa las mismas variables de entorno del CRUD)
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

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

// Lee la hoja de productos (primera pestaña). RAM y Almacenamiento son opcionales.
export async function leerProductos(doc) {
  const hoja = doc.sheetsByIndex[0];
  const filas = await hoja.getRows();
  const columnas = hoja.headerValues || [];
  const tiene = (c) => columnas.includes(c);
  return filas.map((r) => ({
    id: r.get('ID'),
    nombre: r.get('Nombre'),
    categoria: r.get('Categoria'),
    precio: Number(r.get('Precio')) || 0,
    stock: Number(r.get('Stock')) || 0,
    ram: tiene('RAM') ? r.get('RAM') || '' : '',
    almacenamiento: tiene('Almacenamiento') ? r.get('Almacenamiento') || '' : '',
  }));
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
