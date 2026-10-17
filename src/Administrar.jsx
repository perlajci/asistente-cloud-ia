import { useState } from 'react';
import { CATEGORIAS, TRANSMISIONES, COMBUSTIBLES, pesos, km } from './config';
import FotoAuto from './FotoAuto';

const API = '/.netlify/functions/api';
const VACIO = { id: '', marca: '', modelo: '', anio: new Date().getFullYear(), precio: '', categoria: 'Sedán', transmision: 'Automática', combustible: 'Gasolina', kilometraje: 0, stock: 1, imagen: '' };

export default function Administrar({ datos, errorDatos, recargar }) {
  const [form, setForm] = useState(null); // null = modal cerrado
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const autos = datos?.productos ?? [];
  const cambiar = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const enviar = async (metodo, cuerpo) => {
    const res = await fetch(API, { method: metodo, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'No fue posible guardar en Google Sheets.');
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (Number(form.precio) <= 0) return setError('El precio debe ser mayor a 0.');
    if (Number(form.stock) < 0 || Number(form.kilometraje) < 0) return setError('Las unidades y el kilometraje no pueden ser negativos.');
    setGuardando(true);
    setError('');
    try {
      await enviar(form.id ? 'PUT' : 'POST', {
        ...form,
        anio: Number(form.anio),
        precio: Number(form.precio),
        kilometraje: Number(form.kilometraje),
        stock: Number(form.stock),
      });
      setForm(null);
      await recargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (auto) => {
    if (!window.confirm(`¿Eliminar ${auto.marca} ${auto.modelo} ${auto.anio}? También se borrará de Google Sheets.`)) return;
    try {
      await enviar('DELETE', { id: auto.id });
      await recargar();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <>
      <div className="admin-cabeza">
        <div>
          <h1>Administrar inventario</h1>
          <p>Registra, edita o elimina autos. Los cambios se guardan directamente en Google Sheets.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setError(''); setForm({ ...VACIO }); }}>
          Registrar auto
        </button>
      </div>

      {errorDatos && <div className="aviso-error" role="alert">{errorDatos}</div>}

      <div className="tabla-envoltura">
        <table>
          <thead>
            <tr>
              <th><span className="sr-only">Foto</span></th>
              <th>Auto</th>
              <th>Tipo</th>
              <th>Transmisión</th>
              <th className="num">Kilometraje</th>
              <th className="num">Precio</th>
              <th className="num">Unidades</th>
              <th><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {!datos && !errorDatos && (
              <tr><td colSpan="8">Cargando inventario…</td></tr>
            )}
            {datos && autos.length === 0 && (
              <tr><td colSpan="8">Aún no hay autos. Usa "Registrar auto" para agregar el primero.</td></tr>
            )}
            {autos.map((a) => (
              <tr key={a.id}>
                <td className="celda-foto"><FotoAuto auto={a} className="miniatura" /></td>
                <td><strong>{a.marca} {a.modelo}</strong> {a.anio}</td>
                <td>{a.categoria}</td>
                <td>{a.transmision}</td>
                <td className="num">{a.kilometraje ? km(a.kilometraje) : 'Nuevo'}</td>
                <td className="num">{pesos(a.precio)}</td>
                <td className={`num ${a.stock < 2 ? 'stock-bajo' : ''}`}>{a.stock}</td>
                <td className="acciones">
                  <button className="btn btn-ghost btn-sm" onClick={() => { setError(''); setForm({ ...a }); }}>Editar</button>
                  <button className="btn btn-danger btn-sm" onClick={() => eliminar(a)}>Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="modal-fondo" onClick={(e) => e.target === e.currentTarget && setForm(null)}>
          <form className="modal" onSubmit={guardar} role="dialog" aria-modal="true" aria-labelledby="titulo-modal">
            <h2 id="titulo-modal">{form.id ? 'Editar auto' : 'Registrar auto'}</h2>
            <div className="modal-rejilla">
              <div className="campo"><label htmlFor="marca">Marca</label><input id="marca" name="marca" value={form.marca} onChange={cambiar} required /></div>
              <div className="campo"><label htmlFor="modelo">Modelo</label><input id="modelo" name="modelo" value={form.modelo} onChange={cambiar} required /></div>
              <div className="campo"><label htmlFor="anio">Año</label><input id="anio" name="anio" type="number" min="1990" max="2030" value={form.anio} onChange={cambiar} required /></div>
              <div className="campo"><label htmlFor="precio">Precio (MXN)</label><input id="precio" name="precio" type="number" min="1" step="1000" value={form.precio} onChange={cambiar} required /></div>
              <div className="campo">
                <label htmlFor="cat">Tipo</label>
                <select id="cat" name="categoria" value={form.categoria} onChange={cambiar}>
                  {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="trans">Transmisión</label>
                <select id="trans" name="transmision" value={form.transmision} onChange={cambiar}>
                  {TRANSMISIONES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="comb">Combustible</label>
                <select id="comb" name="combustible" value={form.combustible} onChange={cambiar}>
                  {COMBUSTIBLES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="campo"><label htmlFor="kmf">Kilometraje (0 = nuevo)</label><input id="kmf" name="kilometraje" type="number" min="0" value={form.kilometraje} onChange={cambiar} required /></div>
              <div className="campo"><label htmlFor="stock">Unidades en piso</label><input id="stock" name="stock" type="number" min="0" value={form.stock} onChange={cambiar} required /></div>
            </div>
            <div className="campo-imagen">
              <FotoAuto auto={form} className="vista-imagen" />
              <div className="campo">
                <label htmlFor="imagen">Foto (dirección de la imagen)</label>
                <input id="imagen" name="imagen" type="text" inputMode="url" placeholder="https://… o /autos/versa.jpg" value={form.imagen || ''} onChange={cambiar} />
                <small className="ayuda">Pega el enlace directo a una imagen .jpg, .png o .webp. Si lo dejas vacío se muestra un dibujo del tipo de auto.</small>
              </div>
            </div>
            {error && <div className="aviso-error" role="alert" style={{ marginTop: 16 }}>{error}</div>}
            <div className="modal-acciones">
              <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={guardando}>
                {guardando ? 'Guardando…' : form.id ? 'Guardar cambios' : 'Registrar auto'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
