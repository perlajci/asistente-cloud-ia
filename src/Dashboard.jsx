import { useMemo } from 'react';
import { pesos } from './config';
import FotoAuto from './FotoAuto';

const millones = (n) =>
  n >= 1_000_000
    ? '$' + (n / 1_000_000).toLocaleString('es-MX', { maximumFractionDigits: 2 }) + ' M'
    : pesos(n);

// Gráfica de barras horizontales de una sola serie, con etiqueta de valor y tooltip al pasar el cursor
function BarrasH({ titulo, descripcion, datos, formato = (v) => v }) {
  const max = Math.max(1, ...datos.map((d) => d.valor));
  return (
    <section className="panel">
      <h3>{titulo}</h3>
      {descripcion && <p className="panel-desc">{descripcion}</p>}
      {datos.length === 0 ? (
        <p className="panel-desc">Sin datos todavía.</p>
      ) : (
        <ul className="barras" role="list">
          {datos.map((d) => (
            <li key={d.etiqueta} className="barra-fila" tabIndex={0}>
              <span className="barra-etiqueta">{d.etiqueta}</span>
              <span className="barra-pista">
                <span className="barra-relleno" style={{ width: `${Math.max(2, (d.valor / max) * 100)}%` }} />
                <span className="barra-tooltip" role="tooltip">
                  <b>{d.etiqueta}</b> {formato(d.valor)}{d.extra ? `, ${d.extra}` : ''}
                </span>
              </span>
              <span className="barra-valor">{formato(d.valor)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Dashboard({ datos, errorDatos, irAInventario }) {
  const autos = datos?.productos ?? [];

  const m = useMemo(() => {
    const porTipo = {};
    for (const a of autos) {
      const t = a.categoria || 'Sin tipo';
      porTipo[t] ??= { unidades: 0, modelos: 0, sumaPrecio: 0 };
      porTipo[t].unidades += a.stock;
      porTipo[t].modelos += 1;
      porTipo[t].sumaPrecio += a.precio;
    }
    const tipos = Object.entries(porTipo);
    const unidades = autos.reduce((t, a) => t + a.stock, 0);
    const valor = autos.reduce((t, a) => t + a.precio * a.stock, 0);
    const nuevos = autos.filter((a) => !a.kilometraje).reduce((t, a) => t + a.stock, 0);
    return {
      unidades,
      valor,
      promedio: autos.length ? autos.reduce((t, a) => t + a.precio, 0) / autos.length : 0,
      nuevos,
      seminuevos: unidades - nuevos,
      unidadesPorTipo: tipos
        .map(([k, v]) => ({ etiqueta: k, valor: v.unidades, extra: `${v.modelos} ${v.modelos === 1 ? 'modelo' : 'modelos'}` }))
        .sort((a, b) => b.valor - a.valor),
      precioPorTipo: tipos
        .map(([k, v]) => ({ etiqueta: k, valor: Math.round(v.sumaPrecio / v.modelos) }))
        .sort((a, b) => b.valor - a.valor),
      reabastecer: autos.filter((a) => a.stock <= 1).sort((a, b) => a.stock - b.stock),
      masCaro: [...autos].sort((a, b) => b.precio - a.precio)[0],
      masBarato: [...autos].sort((a, b) => a.precio - b.precio)[0],
    };
  }, [autos]);

  if (errorDatos) return <div className="aviso-error" role="alert">{errorDatos}</div>;
  if (!datos) return <p className="panel-desc">Cargando datos desde Google Sheets…</p>;

  const pctNuevos = m.unidades ? Math.round((m.nuevos / m.unidades) * 100) : 0;

  return (
    <div className="dashboard">
      <div className="admin-cabeza">
        <div>
          <h1>Dashboard de la agencia</h1>
          <p>Calculado en tiempo real con los datos de Google Sheets.</p>
        </div>
      </div>

      <div className="kpis">
        <div className="kpi kpi-destacado">
          <span>Valor del inventario en piso</span>
          <b>{millones(m.valor)}</b>
          <small>{m.unidades} unidades de {datos.total} modelos</small>
        </div>
        <div className="kpi">
          <span>Precio promedio</span>
          <b>{millones(m.promedio)}</b>
          <small>por modelo</small>
        </div>
        <div className="kpi">
          <span>Consultas al asesor IA</span>
          <b>{datos.consultas}</b>
          <small>guardadas en la hoja Historial</small>
        </div>
        <div className="kpi">
          <span>Por reabastecer</span>
          <b className={m.reabastecer.length ? 'texto-alerta' : ''}>{m.reabastecer.length}</b>
          <small>modelos con 1 unidad o menos</small>
        </div>
      </div>

      <div className="paneles-2">
        <BarrasH titulo="Unidades en piso por tipo" descripcion="Cuántos autos hay de cada tipo." datos={m.unidadesPorTipo} formato={(v) => `${v} u.`} />
        <BarrasH titulo="Precio promedio por tipo" descripcion="Promedio del precio de contado de los modelos." datos={m.precioPorTipo} formato={millones} />
      </div>

      <div className="paneles-3">
        <section className="panel">
          <h3>Nuevos y seminuevos</h3>
          <p className="panel-desc">Unidades en piso según su condición.</p>
          <div className="split" role="img" aria-label={`${m.nuevos} nuevos y ${m.seminuevos} seminuevos`}>
            <span className="split-nuevo" style={{ width: `${pctNuevos}%` }} />
            <span className="split-semi" style={{ width: `${100 - pctNuevos}%` }} />
          </div>
          <div className="split-leyenda">
            <div><i className="muestra muestra-nuevo" /> Nuevos <b>{m.nuevos}</b> <small>{pctNuevos}%</small></div>
            <div><i className="muestra muestra-semi" /> Seminuevos <b>{m.seminuevos}</b> <small>{100 - pctNuevos}%</small></div>
          </div>
          {m.masCaro && (
            <dl className="extremos">
              <div><dt>Más accesible</dt><dd>{m.masBarato.marca} {m.masBarato.modelo}, {pesos(m.masBarato.precio)}</dd></div>
              <div><dt>Más exclusivo</dt><dd>{m.masCaro.marca} {m.masCaro.modelo}, {pesos(m.masCaro.precio)}</dd></div>
            </dl>
          )}
        </section>

        <section className="panel">
          <h3>Por reabastecer</h3>
          <p className="panel-desc">Modelos con una unidad o agotados.</p>
          {m.reabastecer.length === 0 ? (
            <p className="panel-desc">Todo el inventario tiene al menos 2 unidades.</p>
          ) : (
            <ul className="lista-mini">
              {m.reabastecer.map((a) => (
                <li key={a.id}>
                  <FotoAuto auto={a} className="miniatura" />
                  <span className="lista-mini-texto"><b>{a.marca} {a.modelo}</b><small>{a.anio}</small></span>
                  <span className={`estado ${a.stock === 0 ? 'estado-critico' : 'estado-aviso'}`}>
                    {a.stock === 0 ? '✕ Agotado' : '! Última unidad'}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <button className="btn btn-ghost btn-sm" onClick={irAInventario}>Ir al inventario</button>
        </section>

        <section className="panel">
          <h3>Últimas consultas al asesor</h3>
          <p className="panel-desc">Lo que preguntan los clientes.</p>
          {datos.ultimasConsultas?.length ? (
            <ul className="consultas">
              {datos.ultimasConsultas.map((c, i) => (
                <li key={i}><p>{c.pregunta}</p><small>{c.fecha}</small></li>
              ))}
            </ul>
          ) : (
            <p className="panel-desc">Aún no hay consultas. Haz una pregunta en Asesor IA para verla aquí.</p>
          )}
        </section>
      </div>
    </div>
  );
}
