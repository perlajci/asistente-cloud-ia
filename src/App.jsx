import { useState, useEffect, useCallback } from 'react';
import './App.css';
import Wordmark from './Wordmark';
import Login from './Login';
import Asesor from './Asesor';
import Administrar from './Administrar';
import Dashboard from './Dashboard';

function temaInicial() {
  try {
    const guardado = localStorage.getItem('tema');
    if (guardado) return guardado;
  } catch { /* sin almacenamiento */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [sesion, setSesion] = useState(false);
  const [tema, setTema] = useState(temaInicial);
  const [vista, setVista] = useState('asesor');
  const [datos, setDatos] = useState(null); // respuesta de /productos
  const [errorDatos, setErrorDatos] = useState('');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema);
    try { localStorage.setItem('tema', tema); } catch { /* sin almacenamiento */ }
  }, [tema]);

  const cargarInventario = useCallback(async () => {
    setErrorDatos('');
    try {
      const res = await fetch('/.netlify/functions/productos');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No fue posible cargar el inventario.');
      setDatos(data);
    } catch (e) {
      setErrorDatos(e.message === 'Failed to fetch' ? 'No fue posible conectar con el servicio Cloud.' : e.message);
    }
  }, []);

  useEffect(() => {
    if (sesion) cargarInventario();
  }, [sesion, cargarInventario]);

  const botonTema = (
    <button className="btn btn-ghost btn-sm" onClick={() => setTema(tema === 'dark' ? 'light' : 'dark')}>
      {tema === 'dark' ? 'Modo claro' : 'Modo oscuro'}
    </button>
  );

  if (!sesion) return <Login onEntrar={() => setSesion(true)} botonTema={botonTema} />;

  return (
    <>
      <header className="barra">
        <div className="barra-interior">
          <Wordmark />
          <nav className="pestanas" aria-label="Secciones">
            <button className="pestana" aria-current={vista === 'asesor' ? 'page' : undefined} onClick={() => setVista('asesor')}>
              Asesor IA
            </button>
            <button className="pestana" aria-current={vista === 'dashboard' ? 'page' : undefined} onClick={() => setVista('dashboard')}>
              Dashboard
            </button>
            <button className="pestana" aria-current={vista === 'admin' ? 'page' : undefined} onClick={() => setVista('admin')}>
              Inventario
            </button>
          </nav>
          <div className="barra-acciones">
            {botonTema}
            <button className="btn btn-ghost btn-sm" onClick={() => setSesion(false)}>Cerrar sesión</button>
          </div>
        </div>
      </header>

      <main className="contenido">
        {vista === 'asesor' && <Asesor datos={datos} errorDatos={errorDatos} alConsultar={cargarInventario} />}
        {vista === 'dashboard' && <Dashboard datos={datos} errorDatos={errorDatos} irAInventario={() => setVista('admin')} />}
        {vista === 'admin' && <Administrar datos={datos} errorDatos={errorDatos} recargar={cargarInventario} />}
      </main>
    </>
  );
}
