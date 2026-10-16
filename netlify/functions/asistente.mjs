// API REST: POST /.netlify/functions/asistente
// 1) Recibe la pregunta  2) Lee productos de Google Sheets  3) Arma el prompt
// 4) Consulta la IA (Google Gemini)  5) Guarda historial  6) Devuelve JSON
import { abrirHoja, leerProductos, hojaHistorial, json } from '../lib/sheets.mjs';

const MODELOS = [process.env.GEMINI_MODEL, 'gemini-flash-latest', 'gemini-2.5-flash'].filter(Boolean);

async function consultarIA(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Falta configurar GEMINI_API_KEY en Netlify.');

  let ultimoError = '';
  for (const modelo of MODELOS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 800 },
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const texto = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
      return { texto: texto.trim(), modelo };
    }
    ultimoError = data?.error?.message || `HTTP ${res.status}`;
    if (res.status !== 404) break; // solo probamos otro modelo si este no existe
  }
  throw new Error(ultimoError);
}

function construirPrompt({ pregunta, productos, presupuesto, categoria, necesidad }) {
  const catalogo = productos
    .map(
      (p) =>
        `- ID ${p.id} | ${p.nombre} | Categoría: ${p.categoria} | Precio: $${p.precio} MXN | Stock: ${p.stock}` +
        (p.ram ? ` | RAM: ${p.ram}` : '') +
        (p.almacenamiento ? ` | Almacenamiento: ${p.almacenamiento}` : '')
    )
    .join('\n');

  const filtros = [
    presupuesto ? `Presupuesto máximo: $${presupuesto} MXN` : null,
    categoria ? `Categoría deseada: ${categoria}` : null,
    necesidad ? `Necesidad / uso: ${necesidad}` : null,
  ].filter(Boolean);

  return `Eres "Asistente Cloud", un asistente especializado en productos tecnológicos de una tienda.

REGLAS:
1. Utiliza SOLAMENTE la información del CATÁLOGO. No inventes productos, precios ni características.
2. Si ningún producto cumple con la solicitud, indícalo claramente y sugiere la alternativa más cercana del catálogo.
3. Si hay presupuesto, nunca recomiendes productos que lo excedan (puedes mencionarlos solo como referencia, aclarando que lo exceden).
4. Si un producto tiene Stock 0, indica que está agotado.
5. Explica brevemente la razón de tu recomendación (máximo 5 líneas o una lista corta).
6. Si la pregunta no tiene relación con el catálogo, responde amablemente que solo puedes ayudar con los productos de la tienda.
7. Responde en español.

CATÁLOGO (obtenido de Google Sheets):
${catalogo || '(el catálogo está vacío)'}

${filtros.length ? 'FILTROS DEL USUARIO:\n' + filtros.join('\n') + '\n\n' : ''}PREGUNTA DEL USUARIO:
${pregunta}`;
}

export default async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Usa el método POST.' });

  let body;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'El cuerpo de la solicitud no es JSON válido.' });
  }

  const pregunta = (body.pregunta || '').trim();
  const { presupuesto, categoria, necesidad } = body;
  if (!pregunta && !necesidad) return json(400, { error: 'Escribe una pregunta antes de continuar.' });

  // Paso 2: Google Sheets
  let doc, productos;
  try {
    doc = await abrirHoja();
    productos = await leerProductos(doc);
  } catch (e) {
    return json(502, { error: 'No fue posible consultar Google Sheets.', detalle: e.message });
  }

  // Filtro previo opcional por categoría
  const enContexto = categoria
    ? productos.filter((p) => (p.categoria || '').toLowerCase() === String(categoria).toLowerCase())
    : productos;

  const preguntaFinal = pregunta || `Recomiéndame un producto para: ${necesidad}`;
  const prompt = construirPrompt({ pregunta: preguntaFinal, productos: enContexto, presupuesto, categoria, necesidad });

  // Pasos 4-5: IA
  let resultado;
  try {
    resultado = await consultarIA(prompt);
  } catch (e) {
    return json(502, { error: 'El asistente no pudo procesar la solicitud.', detalle: e.message });
  }
  if (!resultado.texto) return json(200, { respuesta: 'El asistente no encontró resultados para tu consulta.', productosConsultados: enContexto.length });

  // Historial (si falla no rompe la respuesta)
  let historialGuardado = false;
  try {
    const hoja = await hojaHistorial(doc);
    const fecha = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
    await hoja.addRow({ Fecha: fecha, Pregunta: preguntaFinal, Respuesta: resultado.texto.slice(0, 1000) });
    historialGuardado = true;
  } catch {
    historialGuardado = false;
  }

  return json(200, {
    respuesta: resultado.texto,
    modelo: resultado.modelo,
    productosConsultados: enContexto.length,
    historialGuardado,
  });
};
