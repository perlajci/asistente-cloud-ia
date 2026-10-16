# Asistente Cloud con IA

Práctica de Cloud Computing, Unidad 2 — ITS Puruándiro.

Aplicación que recibe preguntas, consulta un catálogo guardado en **Google Sheets** y usa **Google Gemini** (API de IA) para responder con base en esos datos.

## Arquitectura

```
Usuario → React (Vite) → Netlify Functions (API REST) → Google Sheets + API de Gemini → JSON → React
```

| Endpoint | Método | Función |
|---|---|---|
| `/.netlify/functions/productos` | GET | Catálogo + estadísticas (productos, categorías, consultas) |
| `/.netlify/functions/asistente` | POST | Recibe `{pregunta, presupuesto, categoria, necesidad}`, consulta Sheets + IA, guarda historial |
| `/.netlify/functions/api` | GET/POST/PUT/DELETE | CRUD del inventario (proyecto anterior) |

## Variables de entorno (Netlify)

`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID`, `GEMINI_API_KEY` (opcional `GEMINI_MODEL`).
Ninguna credencial está en el código.

## Funcionalidades extra
Login, modo oscuro, dashboard, filtros (presupuesto, categoría, necesidad), historial en la hoja `Historial`, CRUD del inventario.
