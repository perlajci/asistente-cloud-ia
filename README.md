# Asistente Cloud con IA: Ruta Motors

Práctica de Cloud Computing, Unidad 2 — ITS Puruándiro.

Agencia de autos con un asesor virtual: el cliente pregunta qué auto busca, la API lee el inventario guardado en **Google Sheets** y **Google Gemini** (API de IA) recomienda autos solo de ese inventario.

Hoja de cálculo, primera pestaña (puedes importar `autos-ejemplo.csv`):

`ID | Marca | Modelo | Anio | Precio | Categoria | Transmision | Combustible | Kilometraje | Stock`

## Arquitectura

```
Usuario → React (Vite) → Netlify Functions (API REST) → Google Sheets + API de Gemini → JSON → React
```

| Endpoint | Método | Función |
|---|---|---|
| `/.netlify/functions/productos` | GET | Inventario de autos + estadísticas (modelos, unidades, tipos, consultas) |
| `/.netlify/functions/asistente` | POST | Recibe `{pregunta, presupuesto, categoria, necesidad}`, consulta Sheets + IA, guarda historial |
| `/.netlify/functions/api` | GET/POST/PUT/DELETE | CRUD del inventario de autos (panel Administrar) |

## Variables de entorno (Netlify)

`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID`, `GEMINI_API_KEY` (opcional `GEMINI_MODEL`).
Ninguna credencial está en el código.

## Funcionalidades extra
Login, modo oscuro, indicadores, filtros del asesor (presupuesto, tipo, uso), búsqueda y orden del inventario, fotos de cada auto (columna Imagen) con dibujo de respaldo, vista de detalle, dashboard con gráficas, botón "Preguntar al asesor" en cada auto, historial en la hoja `Historial`, CRUD del inventario y diseño responsivo.
