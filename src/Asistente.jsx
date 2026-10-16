import { useState, useEffect } from 'react';
import './Asistente.css';

const EJEMPLOS = [
  'Necesito una laptop para programación con un presupuesto de 20000 pesos.',
  '¿Qué producto tiene mayor capacidad de almacenamiento?',
  '¿Qué laptop cuesta menos de 15000 pesos?',
  '¿Qué producto recomiendas para programación?',
];

export default function Asistente() {
  const [pregunta, setPregunta] = useState('');
  const [presupuesto, setPresupuesto] = useState('');
  const [categoria, setCategoria] = useState('');
  const [necesidad, setNecesidad] = useState('');
  const [respuesta, setRespuesta] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [stats, setStats] = useState(null);
  const [historial, setHistorial] = useState([]);

  const cargarStats = async () => {
    try {
      const res = await fetch('/.netlify/functions/productos');
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch {
      setStats(null);
    }
  };

  useEffect(() => {
    cargarStats();
  }, []);

  const consultar = async (e) => {
    e?.preventDefault();
    setError('');
    setRespuesta('');

    if (!pregunta.trim() && !necesidad.trim()) {
      setError('Escribe una pregunta antes de continuar.');
      return;
    }

    setCargando(true);
    try {
      const res = await fetch('/.netlify/functions/asistente', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pregunta,
          presupuesto: presupuesto ? Number(presupuesto) : null,
          categoria,
          necesidad,
        }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch {
        throw new Error('No fue posible consultar el servicio Cloud.');
      }

      if (!res.ok) {
        setError(data.error || 'El asistente no pudo procesar la solicitud.');
      } else if (!data.respuesta) {
        setError('El asistente no encontró resultados para tu consulta.');
      } else {
        setRespuesta(data.respuesta);
        setHistorial((h) => [{ pregunta: pregunta || necesidad, respuesta: data.respuesta }, ...h].slice(0, 5));
        cargarStats();
      }
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'No fue posible consultar el servicio Cloud.' : err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="asistente fade-in">
      {/* Dashboard */}
      <div className="dashboard-cards">
        <div className="card">
          <span className="card-icon">💬</span>
          <div className="card-info">
            <h4>Consultas realizadas</h4>
            <p>{stats ? stats.consultas : '—'}</p>
          </div>
        </div>
        <div className="card">
          <span className="card-icon">📦</span>
          <div className="card-info">
            <h4>Productos disponibles</h4>
            <p>{stats ? stats.total : '—'}</p>
          </div>
        </div>
        <div className="card">
          <span className="card-icon">🏷️</span>
          <div className="card-info">
            <h4>Categorías</h4>
            <p>{stats ? stats.categorias.length : '—'}</p>
          </div>
        </div>
      </div>

      <div className="asistente-grid">
        <form className="asistente-panel" onSubmit={consultar}>
          <h3>🤖 Asistente Cloud con IA</h3>
          <label htmlFor="pregunta">¿Qué deseas consultar?</label>
          <textarea
            id="pregunta"
            rows="3"
            placeholder="Ej. Necesito una laptop para programación…"
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
          />

          <div className="ejemplos">
            {EJEMPLOS.map((ej) => (
              <button type="button" key={ej} className="chip" onClick={() => setPregunta(ej)}>
                {ej}
              </button>
            ))}
          </div>

          <div className="filtros">
            <div>
              <label>Presupuesto máximo</label>
              <input type="number" min="0" placeholder="20000" value={presupuesto} onChange={(e) => setPresupuesto(e.target.value)} />
            </div>
            <div>
              <label>Categoría</label>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                <option value="">Todas</option>
                {stats?.categorias.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Necesidad</label>
              <input type="text" placeholder="Programación" value={necesidad} onChange={(e) => setNecesidad(e.target.value)} />
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={cargando}>
            {cargando ? 'Consultando…' : 'CONSULTAR'}
          </button>
        </form>

        <div className="asistente-panel respuesta-panel">
          <h3>Respuesta del asistente</h3>
          {cargando && (
            <div className="cargando">
              <span className="spinner" /> Analizando información…
            </div>
          )}
          {error && <div className="error-box">⚠️ {error}</div>}
          {!cargando && !error && respuesta && <div className="respuesta-texto">{respuesta}</div>}
          {!cargando && !error && !respuesta && (
            <p className="vacio">Escribe una pregunta y presiona Consultar. La IA responderá usando el catálogo guardado en Google Sheets.</p>
          )}

          {historial.length > 0 && (
            <div className="historial">
              <h4>Consultas de esta sesión</h4>
              {historial.map((h, i) => (
                <details key={i}>
                  <summary>{h.pregunta}</summary>
                  <p>{h.respuesta}</p>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
