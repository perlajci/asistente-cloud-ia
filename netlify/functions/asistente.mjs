// API REST: POST /.netlify/functions/asistente
// 1) Recibe la pregunta  2) Lee el inventario de autos de Google Sheets  3) Arma el prompt
// 4) Consulta la IA (Google Gemini)  5) Guarda historial  6) Devuelve JSON
import { abrirHoja, leerAutos, hojaHistorial, json } from '../lib/sheets.mjs';

// Modelos rápidos: Netlify corta las funciones a los 10 segundos en el plan gratuito
const MODELOS = [
  process.env.GEMINI_MODEL,
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
].filter(Boolean);
const LIMITE_MS = 9000; // margen de seguridad antes del límite de 10 s de Netlify

// Caché en memoria: si la función sigue "caliente", no vuelve a leer Google Sheets en 5 minutos
let cache = { doc: null, autos: null, hora: 0 };

// Respuesta directa y concisa para responder en menos de 2 segundos
function cuerpo(prompt) {
  return {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 300,
    },
  };
}

async function consultarIA(prompt, inicio) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Falta configurar GEMINI_API_KEY en Netlify.');

  let ultimoError = '';

  for (const modelo of MODELOS) {
    const tiempoTranscurrido = Date.now() - inicio;
    const restante = LIMITE_MS - tiempoTranscurrido;
    // Si queda menos de 1.5 s para el límite de Netlify, detenemos para responder con error controlado
    if (restante < 1500) break;

    // Máximo 3.5 segundos por intento de modelo para dar oportunidad a los fallbacks
    const tiempoParaEsteModelo = Math.min(restante - 500, 3500);
    const control = new AbortController();
    const reloj = setTimeout(() => control.abort(), tiempoParaEsteModelo);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(cuerpo(prompt)),
        signal: control.signal,
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const texto = data?.candidates?.[0]?.content?.parts?.filter((p) => !p.thought).map((p) => p.text || '').join('') || '';
        if (texto.trim()) {
          return { texto: texto.trim(), modelo };
        }
      }

      ultimoError = data?.error?.message || `HTTP ${res.status}`;
      // Si el modelo está saturado (503/high demand), sin cuota (429) o falló, continúa con el siguiente modelo
      console.warn(`[asistente] Modelo ${modelo} no disponible (${ultimoError}). Probando alternativa...`);
    } catch (e) {
      ultimoError = e.name === 'AbortError' ? `Tiempo de espera agotado en ${modelo}.` : e.message;
      console.warn(`[asistente] Error en ${modelo}:`, ultimoError);
    } finally {
      clearTimeout(reloj);
    }
  }

  throw new Error(ultimoError || 'El servicio de IA no respondió a tiempo.');
}

const pesos = (n) => '$' + Number(n).toLocaleString('es-MX') + ' MXN';

function construirPrompt({ pregunta, productos, presupuesto, categoria, necesidad }) {
  const catalogo = productos
    .map(
      (a) =>
        `- ID ${a.id} | ${a.marca} ${a.modelo} ${a.anio} | Tipo: ${a.categoria} | Precio: ${pesos(a.precio)} | ` +
        `Transmisión: ${a.transmision} | Combustible: ${a.combustible} | ` +
        `${a.kilometraje > 0 ? 'Seminuevo, ' + a.kilometraje.toLocaleString('es-MX') + ' km' : 'Nuevo (0 km)'} | ` +
        `Unidades disponibles: ${a.stock}`
    )
    .join('\n');

  const filtros = [
    presupuesto ? `Presupuesto máximo: ${pesos(presupuesto)}` : null,
    categoria ? `Tipo de vehículo: ${categoria}` : null,
    necesidad ? `Uso que le dará: ${necesidad}` : null,
  ].filter(Boolean);

  return `Eres el asesor de ventas virtual de una agencia de autos. Atiendes a clientes que buscan auto.

REGLAS:
1. Utiliza SOLAMENTE los autos del INVENTARIO. No inventes modelos, precios, versiones ni características.
2. Si ningún auto cumple con la solicitud, dilo claramente y sugiere la opción más cercana del inventario.
3. Si hay presupuesto, no recomiendes autos que lo excedan (puedes mencionarlos solo como referencia, aclarando cuánto lo exceden).
4. Si un auto tiene 0 unidades disponibles, indica que está agotado.
5. Recomienda máximo 3 autos. Para cada uno: marca, modelo, año y precio, y una razón breve ligada a lo que pidió el cliente.
6. Usa un tono cordial y profesional, como un buen vendedor, sin exagerar. Sé breve.
7. Si la pregunta no tiene relación con autos o con el inventario, responde amablemente que solo puedes ayudar con los vehículos de la agencia.
8. No uses formato Markdown (sin asteriscos ni almohadillas); usa guiones para listas.
9. Responde en español.

INVENTARIO (obtenido de Google Sheets):
${catalogo || '(el inventario está vacío)'}

${filtros.length ? 'PREFERENCIAS DEL CLIENTE:\n' + filtros.join('\n') + '\n\n' : ''}PREGUNTA DEL CLIENTE:
${pregunta}`;
}

export default async (req) => {
  const inicio = Date.now();
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

  // Paso 2: Google Sheets (caché de 5 minutos para responder al instante)
  let doc, productos;
  try {
    if (cache.autos && Date.now() - cache.hora < 300000) {
      ({ doc, autos: productos } = cache);
    } else {
      doc = await abrirHoja();
      productos = await leerAutos(doc);
      cache = { doc, autos: productos, hora: Date.now() };
    }
  } catch (e) {
    return json(502, { error: 'No fue posible consultar Google Sheets.', detalle: e.message });
  }

  // Filtro previo opcional por categoría y límite de 10 autos para máxima velocidad
  let enContexto = categoria
    ? productos.filter((p) => (p.categoria || '').toLowerCase() === String(categoria).toLowerCase())
    : productos;

  enContexto = enContexto.slice(0, 10);

  const preguntaFinal = pregunta || `Recomiéndame un auto para: ${necesidad}`;
  const prompt = construirPrompt({ pregunta: preguntaFinal, productos: enContexto, presupuesto, categoria, necesidad });

  // Pasos 4-5: IA
  let resultado;
  try {
    resultado = await consultarIA(prompt, inicio);
  } catch (e) {
    return json(502, { error: 'El asistente no pudo procesar la solicitud.', detalle: e.message });
  }
  if (!resultado.texto) return json(200, { respuesta: 'El asesor no encontró autos para tu consulta.', productosConsultados: enContexto.length });

  // Historial (máximo 800ms para no demorar la entrega de respuesta al usuario)
  let historialGuardado = false;
  const restante = LIMITE_MS - (Date.now() - inicio);
  if (restante > 1000) {
    try {
      const guardar = (async () => {
        const hoja = await hojaHistorial(doc);
        const fecha = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' });
        await hoja.addRow({ Fecha: fecha, Pregunta: preguntaFinal, Respuesta: resultado.texto.slice(0, 1000) });
        return true;
      })();
      const tiempo = new Promise((r) => setTimeout(() => r(false), Math.min(restante - 300, 800)));
      historialGuardado = await Promise.race([guardar, tiempo]);
    } catch {
      historialGuardado = false;
    }
  }

  return json(200, {
    respuesta: resultado.texto,
    modelo: resultado.modelo,
    productosConsultados: enContexto.length,
    historialGuardado,
    tiempoMs: Date.now() - inicio,
  });
};
