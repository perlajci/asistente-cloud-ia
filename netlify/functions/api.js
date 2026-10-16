import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export const handler = async (event, context) => {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/"/g, ''),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0]; 
    
    const method = event.httpMethod;

    if (method === 'GET') {
      const rows = await sheet.getRows();
      const data = rows.map(row => ({
        ID: row.get('ID'), 
        Nombre: row.get('Nombre'), 
        Precio: row.get('Precio'), 
        Categoria: row.get('Categoria'), 
        Stock: row.get('Stock')
      }));
      return { statusCode: 200, body: JSON.stringify(data) };
    }

    if (method === 'POST') {
      const data = JSON.parse(event.body);
      data.ID = Date.now().toString(); 
      await sheet.addRow(data);
      return { statusCode: 201, body: JSON.stringify({ message: "Creado" }) };
    }

    if (method === 'PUT') {
      const data = JSON.parse(event.body);
      const rows = await sheet.getRows();
      const rowToUpdate = rows.find(r => r.get('ID') === data.ID);
      if(rowToUpdate) {
        rowToUpdate.assign({
          Nombre: data.Nombre,
          Precio: data.Precio,
          Categoria: data.Categoria,
          Stock: data.Stock
        });
        await rowToUpdate.save();
        return { statusCode: 200, body: JSON.stringify({ message: "Actualizado" }) };
      }
    }

    if (method === 'DELETE') {
      const { ID } = JSON.parse(event.body);
      const rows = await sheet.getRows();
      const rowToDelete = rows.find(r => r.get('ID') === ID);
      if(rowToDelete) {
        await rowToDelete.delete();
        return { statusCode: 200, body: JSON.stringify({ message: "Eliminado" }) };
      }
    }

    return { statusCode: 400, body: "Método no soportado" };
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};