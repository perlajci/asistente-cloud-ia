import { useState, useEffect } from 'react';

// Siluetas laterales dibujadas a mano (viewBox 240 x 110), una por tipo de vehículo
const SILUETAS = {
  'Sedán': {
    cuerpo: 'M14 78 L16 62 Q20 56 40 54 L70 50 L92 34 Q98 30 110 30 L150 30 Q160 30 168 36 L188 52 L216 56 Q226 58 228 66 L228 78 Z',
    vidrio: 'M78 50 L96 36 Q100 33 108 33 L126 33 L126 50 Z M132 33 L148 33 Q156 33 162 38 L178 50 L132 50 Z',
    ruedas: [62, 184],
  },
  'Hatchback': {
    cuerpo: 'M22 78 L24 60 Q28 54 48 52 L74 48 L94 32 Q100 28 110 28 L172 28 Q182 28 188 38 L206 60 Q214 64 214 70 L214 78 Z',
    vidrio: 'M82 48 L98 34 Q102 31 110 31 L132 31 L132 48 Z M138 31 L170 31 Q178 31 182 38 L192 48 L138 48 Z',
    ruedas: [64, 176],
  },
  'SUV': {
    cuerpo: 'M14 80 L14 56 Q16 48 34 46 L58 44 L76 26 Q80 22 90 22 L196 22 Q206 22 210 30 L222 48 Q228 52 228 60 L228 80 Z',
    vidrio: 'M66 44 L80 28 Q83 25 90 25 L128 25 L128 44 Z M134 25 L170 25 L170 44 L134 44 Z M176 25 L198 25 Q204 25 207 31 L215 44 L176 44 Z',
    ruedas: [60, 186],
  },
  'Pickup': {
    cuerpo: 'M10 80 L10 58 Q12 50 28 48 L60 46 L78 26 Q82 22 92 22 L136 22 Q142 22 144 28 L144 50 L230 50 L230 80 Z',
    vidrio: 'M68 46 L82 28 Q85 25 92 25 L112 25 L112 46 Z M118 25 L134 25 Q139 25 139 30 L139 46 L118 46 Z',
    ruedas: [56, 192],
  },
  'Deportivo': {
    cuerpo: 'M10 80 L12 70 Q16 64 40 62 L80 56 L106 42 Q112 38 124 38 L154 40 Q166 42 176 50 L206 60 Q228 64 230 72 L230 80 Z',
    vidrio: 'M92 56 L110 44 Q115 41 124 41 L136 41 L136 56 Z M142 41 L152 42 Q162 44 170 52 L172 56 L142 56 Z',
    ruedas: [58, 190],
  },
  'Minivan': {
    cuerpo: 'M14 80 L14 52 Q16 44 30 40 L56 22 Q60 18 70 18 L206 18 Q220 18 222 30 L226 60 Q228 66 228 72 L228 80 Z',
    vidrio: 'M44 40 L60 24 Q63 21 70 21 L104 21 L104 40 Z M110 21 L156 21 L156 40 L110 40 Z M162 21 L208 21 Q216 21 217 30 L218 40 L162 40 Z',
    ruedas: [62, 188],
  },
};

export function Silueta({ categoria }) {
  const s = SILUETAS[categoria] || SILUETAS['Sedán'];
  return (
    <svg className="silueta" viewBox="0 0 240 110" role="img" aria-label={`Ilustración de ${categoria || 'auto'}`}>
      <ellipse cx="120" cy="96" rx="104" ry="5" className="sil-sombra" />
      <path d={s.cuerpo} className="sil-cuerpo" />
      <path d={s.vidrio} className="sil-vidrio" />
      {s.ruedas.map((x) => (
        <g key={x}>
          <circle cx={x} cy="80" r="16" className="sil-llanta" />
          <circle cx={x} cy="80" r="7" className="sil-rin" />
        </g>
      ))}
    </svg>
  );
}

// Muestra la foto del auto; si no hay URL o la imagen no carga, muestra la silueta
export default function FotoAuto({ auto, className = '' }) {
  const [fallo, setFallo] = useState(false);
  useEffect(() => setFallo(false), [auto.imagen]);

  const conFoto = auto.imagen && !fallo;
  return (
    <div className={`foto ${conFoto ? '' : 'foto-vacia'} ${className}`}>
      {conFoto ? (
        <img src={auto.imagen} alt={`${auto.marca} ${auto.modelo} ${auto.anio}`} loading="lazy" onError={() => setFallo(true)} />
      ) : (
        <Silueta categoria={auto.categoria} />
      )}
    </div>
  );
}
