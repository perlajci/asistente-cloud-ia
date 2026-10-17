import { pesos, km } from './config';
import FotoAuto from './FotoAuto';

// Tarjeta de auto: foto arriba, datos y precio abajo
export default function Etiqueta({ auto, onPreguntar, onVer }) {
  const nuevo = !auto.kilometraje;
  const agotado = auto.stock <= 0;

  return (
    <article className="etiqueta">
      <button className="etiqueta-foto" onClick={() => onVer?.(auto)} aria-label={`Ver detalles del ${auto.marca} ${auto.modelo}`}>
        <FotoAuto auto={auto} />
        <span className={`condicion ${nuevo ? '' : 'seminuevo'}`}>{nuevo ? 'Nuevo' : `Seminuevo, ${km(auto.kilometraje)}`}</span>
        {agotado && <span className="sello-agotado">Agotado</span>}
      </button>
      <div className="etiqueta-cuerpo">
        <div>
          <p className="etiqueta-marca">{auto.marca} {auto.anio}</p>
          <h3 className="etiqueta-modelo">{auto.modelo}</h3>
        </div>
        <ul className="specs">
          <li>{auto.categoria}</li>
          {auto.transmision && <li>{auto.transmision}</li>}
          {auto.combustible && <li>{auto.combustible}</li>}
        </ul>
        <div className="precio">
          <span>Precio de contado</span>
          <b>{pesos(auto.precio)}</b>
        </div>
        <div className="etiqueta-pie">
          <span className={`existencia ${agotado ? 'agotado' : ''}`}>
            {agotado ? 'Sin unidades en piso' : `${auto.stock} ${auto.stock === 1 ? 'unidad' : 'unidades'} en piso`}
          </span>
          {onPreguntar && (
            <button className="btn btn-ghost btn-sm" onClick={() => onPreguntar(auto)}>
              Preguntar al asesor
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

// Ventana de detalle con foto grande
export function DetalleAuto({ auto, onCerrar, onPreguntar }) {
  if (!auto) return null;
  const filas = [
    ['Tipo', auto.categoria],
    ['Año', auto.anio],
    ['Transmisión', auto.transmision],
    ['Combustible', auto.combustible],
    ['Condición', auto.kilometraje ? `Seminuevo, ${km(auto.kilometraje)}` : 'Nuevo'],
    ['Unidades en piso', auto.stock > 0 ? auto.stock : 'Agotado'],
  ];
  return (
    <div className="modal-fondo" onClick={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal modal-detalle" role="dialog" aria-modal="true" aria-labelledby="titulo-detalle">
        <FotoAuto auto={auto} className="foto-grande" />
        <div className="detalle-cuerpo">
          <p className="detalle-marca">{auto.marca}</p>
          <h2 id="titulo-detalle">{auto.modelo} {auto.anio}</h2>
          <dl className="detalle-datos">
            {filas.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
          <div className="detalle-precio">
            <span>Precio de contado</span>
            <b>{pesos(auto.precio)}</b>
          </div>
          <div className="modal-acciones">
            <button className="btn btn-ghost" onClick={onCerrar}>Cerrar</button>
            <button className="btn btn-primary" onClick={() => { onCerrar(); onPreguntar(auto); }}>Preguntar al asesor</button>
          </div>
        </div>
      </div>
    </div>
  );
}
