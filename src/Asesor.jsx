import { useState, useRef, useMemo } from 'react';
import Etiqueta, { DetalleAuto } from './Etiqueta';
import { pesos } from './config';

const SUGERENCIAS = [
  'Busco un auto para ir a la universidad, tengo 300 mil pesos',
  '¿Qué SUV me recomiendas para una familia de cinco?',
  '¿Cuál es el auto más económico que tienen?',
  'Quiero algo que gaste poca gasolina',
];

export default function Asesor({ datos, errorDatos, alConsultar }) {
  const [pregunta, setPregunta] = useState('');
  const [presupuesto, setPresupuesto] = useState('');
  const [categoria, setCategoria] = useState('');
  const [necesidad, setNecesidad] = useState('');
  const [respuesta, setRespuesta] = useState(null); // { pregunta, texto, consultados }
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [historial, setHistorial] = useState([]);

  const [busqueda, setBusqueda] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [orden, setOrden] = useState('precio-asc');
  const [detalle, setDetalle] = useState(null);
  const cajaRef = useRef(null);

  const autos = datos?.productos ?? [];

  const autosVisibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const lista = autos.filter(
      (a) =>
        (!filtroTipo || a.categoria === filtroTipo) &&
        (!q || `${a.marca} ${a.modelo} ${a.anio}`.toLowerCase().includes(q))
    );
    const [campo, dir] = orden.split('-');
    return [...lista].sort((x, y) => (dir === 'asc' ? 1 : -1) * ((x[campo] || 0) - (y[campo] || 0)));
  }, [autos, busqueda, filtroTipo, orden]);

  const consultar = async (e, textoForzado) => {
    e?.preventDefault();
    const texto = (textoForzado ?? pregunta).trim();
    setError('');

    if (!texto && !necesidad.trim()) {
      setError('Escribe una pregunta antes de continuar.');
      return;
    }

    setCargando(true);
    try {
      const res = await fetch('/.netlify/functions/asistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pregunta: texto,
          presupuesto: presupuesto ? Number(presupuesto) : null,
          categoria,
          necesidad,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error('No fue posible consultar el servicio Cloud.');
      }

      if (!res.ok) throw new Error(data.error || 'El asesor no pudo procesar la solicitud.');
      if (!data.respuesta) throw new Error('El asesor no encontró autos para tu consulta.');

      const nueva = { pregunta: texto || necesidad, texto: data.respuesta, consultados: data.productosConsultados };
      setRespuesta(nueva);
      setHistorial((h) => [nueva, ...h].slice(0, 5));
      alConsultar?.();
    } catch (err) {
      setRespuesta(null);
      setError(err.message === 'Failed to fetch' ? 'No fue posible consultar el servicio Cloud. Revisa tu conexión a Internet.' : err.message);
    } finally {
      setCargando(false);
    }
  };

  const preguntarPorAuto = (auto) => {
    const texto = `Cuéntame más del ${auto.marca} ${auto.modelo} ${auto.anio}. ¿Para quién es buena opción y qué alternativas tienen?`;
    setPregunta(texto);
    cajaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    consultar(null, texto);
  };

  return (
    <>
      <section className="asesor">
        <div ref={cajaRef}>
          <h1>¿Qué auto estás buscando?</h1>
          <p className="bajada">
            Cuéntale al asesor qué necesitas. Revisa el inventario de la agencia, guardado en Google Sheets, y te
            recomienda solo autos que tenemos en piso.
          </p>

          <form className="pregunta-caja" onSubmit={consultar}>
            <textarea
              aria-label="Tu pregunta"
              placeholder="Ej. Necesito un auto automático para ciudad, mi presupuesto es de 350 mil pesos"
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) consultar(e);
              }}
            />
            <div className="sugerencias">
              {SUGERENCIAS.map((s) => (
                <button type="button" key={s} className="sugerencia" onClick={() => setPregunta(s)}>
                  {s}
                </button>
              ))}
            </div>
            <div className="filtros">
              <div className="campo">
                <label htmlFor="presupuesto">Presupuesto máximo</label>
                <input id="presupuesto" type="number" min="0" step="1000" placeholder="350000" value={presupuesto} onChange={(e) => setPresupuesto(e.target.value)} />
              </div>
              <div className="campo">
                <label htmlFor="categoria">Tipo de auto</label>
                <select id="categoria" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                  <option value="">Cualquiera</option>
                  {datos?.categorias.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="necesidad">Uso principal</label>
                <input id="necesidad" placeholder="Familia, trabajo, ciudad…" value={necesidad} onChange={(e) => setNecesidad(e.target.value)} />
              </div>
            </div>
            <div className="pregunta-pie">
              <small>{presupuesto ? `Buscando autos de hasta ${pesos(presupuesto)}` : 'Enter para enviar, Shift + Enter para salto de línea'}</small>
              <button className="btn btn-primary" type="submit" disabled={cargando}>
                {cargando ? 'Consultando…' : 'Preguntar al asesor'}
              </button>
            </div>
          </form>
        </div>

        <aside>
          <div className="nota" aria-live="polite">
            <div className="nota-cabeza">
              <span className="nota-avatar" aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="2.5" />
                  <path d="M3.5 10.5 9.6 11.4M14.4 11.4l6.1-.9M12 14.5V21" />
                </svg>
              </span>
              <div>
                <strong>Asesor virtual</strong>
                <span>Responde con el inventario actual</span>
              </div>
            </div>

            {cargando && (
              <div className="cargando">
                <span className="volante" aria-hidden="true" /> Analizando el inventario…
              </div>
            )}
            {!cargando && error && <div className="aviso-error" role="alert">{error}</div>}
            {!cargando && !error && respuesta && (
              <>
                <p className="nota-pregunta">{respuesta.pregunta}</p>
                <p className="nota-texto">{respuesta.texto}</p>
                <p className="nota-meta">Respuesta generada con IA a partir de {respuesta.consultados} autos del inventario.</p>
              </>
            )}
            {!cargando && !error && !respuesta && (
              <p className="nota-vacia">
                Aquí aparecerá la recomendación. Puedes escribir tu propia pregunta, elegir una sugerencia o tocar
                "Preguntar al asesor" en cualquier auto del inventario.
              </p>
            )}
          </div>

          {historial.length > 1 && (
            <div className="historial">
              <h3>Consultas anteriores</h3>
              {historial.slice(1).map((h, i) => (
                <details key={i}>
                  <summary>{h.pregunta}</summary>
                  <p>{h.texto}</p>
                </details>
              ))}
            </div>
          )}
        </aside>
      </section>

      <div className="indicadores">
        <div className="indicador"><b>{datos ? datos.total : '–'}</b><span>modelos en inventario</span></div>
        <div className="indicador"><b>{datos ? datos.unidades : '–'}</b><span>unidades en piso</span></div>
        <div className="indicador"><b>{datos ? datos.categorias.length : '–'}</b><span>tipos de vehículo</span></div>
        <div className="indicador"><b>{datos ? datos.consultas : '–'}</b><span>consultas al asesor</span></div>
      </div>

      <section>
        <div className="inventario-cabeza">
          <h2>Inventario disponible</h2>
          <div className="inventario-controles">
            <input aria-label="Buscar auto" placeholder="Buscar marca o modelo" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            <select aria-label="Filtrar por tipo" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              <option value="">Todos los tipos</option>
              {datos?.categorias.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select aria-label="Ordenar" value={orden} onChange={(e) => setOrden(e.target.value)}>
              <option value="precio-asc">Precio: menor a mayor</option>
              <option value="precio-desc">Precio: mayor a menor</option>
              <option value="anio-desc">Año: más reciente</option>
              <option value="kilometraje-asc">Menor kilometraje</option>
            </select>
          </div>
        </div>

        {errorDatos && <div className="aviso-error" role="alert">{errorDatos}</div>}

        <div className="rejilla">
          {!datos && !errorDatos && <p className="vacio-inventario">Cargando inventario desde Google Sheets…</p>}
          {datos && autosVisibles.length === 0 && (
            <p className="vacio-inventario">
              {autos.length === 0 ? 'El inventario está vacío. Agrega autos desde Administrar inventario.' : 'Ningún auto coincide con la búsqueda. Prueba con otra marca o tipo.'}
            </p>
          )}
          {autosVisibles.map((a) => (
            <Etiqueta key={a.id || `${a.marca}-${a.modelo}`} auto={a} onPreguntar={preguntarPorAuto} onVer={setDetalle} />
          ))}
        </div>
      </section>

      <DetalleAuto auto={detalle} onCerrar={() => setDetalle(null)} onPreguntar={preguntarPorAuto} />
    </>
  );
}
