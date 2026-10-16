import { useState, useEffect } from 'react';
import './App.css';
import Asistente from './Asistente';

function App() {
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  }, [darkMode]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (user === 'admin' && pass === '12345') {
      setIsLogged(true);
    } else {
      alert('❌ Credenciales incorrectas. Intenta con admin y 12345');
    }
  };

  if (!isLogged) {
    return (
      <div className="login-wrapper fade-in">
        <button className="theme-toggle top-right" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? '☀️ Modo Claro' : '🌙 Modo Oscuro'}
        </button>
        <div className="login-card">
          <div className="avatar-circle">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <span className="icon">👤</span>
              <input type="text" placeholder="Usuario" value={user} onChange={e => setUser(e.target.value)} required />
            </div>
            <div className="input-group">
              <span className="icon">🔒</span>
              <input type="password" placeholder="Contraseña" value={pass} onChange={e => setPass(e.target.value)} required />
            </div>
            <div className="login-options">
              <label><input type="checkbox" /> Recordarme</label>
              <a href="#/" className="forgot-pass">¿Olvidaste tu contraseña?</a>
            </div>
            <button type="submit" className="btn-login">INICIAR SESIÓN</button>
          </form>
        </div>
      </div>
    );
  }

  return <CrudSystem darkMode={darkMode} setDarkMode={setDarkMode} />;
}

function CrudSystem({ darkMode, setDarkMode }) {
  const [productos, setProductos] = useState([]);
  const [form, setForm] = useState({ ID: '', Nombre: '', Precio: '', Categoria: '', Stock: '' });
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState(''); // Nuevo estado para el filtro
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vista, setVista] = useState('asistente');

  const API_URL = '/.netlify/functions/api';

  const fetchProductos = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      if(res.ok) {
        const data = await res.json();
        setProductos(data);
      }
    } catch (error) {
      console.error("Error al cargar datos", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProductos();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(form.Precio <= 0 || form.Stock < 0) {
      alert("⚠️ El precio debe ser mayor a 0 y el stock no puede ser negativo.");
      return;
    }

    setLoading(true);
    if (form.ID) {
      await fetch(API_URL, { method: 'PUT', body: JSON.stringify(form) });
      setIsModalOpen(false);
    } else {
      await fetch(API_URL, { method: 'POST', body: JSON.stringify(form) });
    }
    setForm({ ID: '', Nombre: '', Precio: '', Categoria: '', Stock: '' });
    fetchProductos();
  };

  const handleEdit = (prod) => {
    setForm(prod);
    setIsModalOpen(true);
  };

  const handleDelete = async (ID) => {
    if (window.confirm("⚠️ ¿Estás seguro de que deseas eliminar este registro? Esta acción se reflejará en Google Sheets.")) {
      setLoading(true);
      await fetch(API_URL, { method: 'DELETE', body: JSON.stringify({ ID }) });
      fetchProductos();
    }
  };

  // Lógica de Dashboard y Filtros
  const categoriasUnicas = [...new Set(productos.map(p => p.Categoria))];
  
  const productosFiltrados = productos.filter(p => {
    const matchBusqueda = p.Nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                          p.Categoria.toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = categoriaFiltro === '' || p.Categoria === categoriaFiltro;
    return matchBusqueda && matchCategoria;
  });

  const totalProductos = productos.length;
  const productosPocoStock = productos.filter(p => p.Stock < 10).length;
  const valorTotal = productos.reduce((acc, p) => acc + (parseFloat(p.Precio) * parseInt(p.Stock)), 0);

  return (
    <div className="crud-container fade-in">
      <header className="crud-header">
        <div className="header-titles">
          <h2>Asistente Cloud con IA</h2>
        </div>
        <div className="header-actions">
          <button className="theme-toggle" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? '☀️ Claro' : '🌙 Oscuro'}
          </button>
          <button className="btn-logout" onClick={() => window.location.reload()}>Cerrar Sesión</button>
        </div>
      </header>
      
      <nav className="tabs">
        <button className={`tab ${vista === 'asistente' ? 'activo' : ''}`} onClick={() => setVista('asistente')}>🤖 Asistente IA</button>
        <button className={`tab ${vista === 'inventario' ? 'activo' : ''}`} onClick={() => { setVista('inventario'); fetchProductos(); }}>📦 Inventario (Google Sheets)</button>
      </nav>

      {vista === 'asistente' ? <Asistente /> : (<>
      {/* MINI DASHBOARD */}
      <div className="dashboard-cards">
        <div className="card">
          <span className="card-icon">📦</span>
          <div className="card-info">
            <h4>Total Registros</h4>
            <p>{totalProductos}</p>
          </div>
        </div>
        <div className="card alert-card">
          <span className="card-icon">⚠️</span>
          <div className="card-info">
            <h4>Poco Stock (&lt;10)</h4>
            <p className={productosPocoStock > 0 ? 'text-danger' : ''}>{productosPocoStock} artículos</p>
          </div>
        </div>
        <div className="card">
          <span className="card-icon">💰</span>
          <div className="card-info">
            <h4>Valor Inventario</h4>
            <p>${valorTotal.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="toolbar">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            className="search-bar"
            placeholder="Buscar por nombre..." 
            value={busqueda} 
            onChange={e => setBusqueda(e.target.value)} 
          />
        </div>
        {/* NUEVO FILTRO DE CATEGORÍAS */}
        <select 
          className="category-filter"
          value={categoriaFiltro}
          onChange={(e) => setCategoriaFiltro(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categoriasUnicas.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      
      <div className="main-content">
        {/* Formulario Lateral para Crear */}
        <div className="form-section">
          <h3>Registrar Nuevo</h3>
          <form onSubmit={handleSubmit} className="crud-form">
            <div className="form-group">
              <label>Nombre del Producto</label>
              <input type="text" name="Nombre" value={form.Nombre} onChange={handleChange} required disabled={isModalOpen}/>
            </div>
            <div className="form-group grid-2">
              <div>
                <label>Precio ($)</label>
                <input type="number" name="Precio" value={form.Precio} onChange={handleChange} required min="1" disabled={isModalOpen}/>
              </div>
              <div>
                <label>Stock</label>
                <input type="number" name="Stock" value={form.Stock} onChange={handleChange} required min="0" disabled={isModalOpen}/>
              </div>
            </div>
            <div className="form-group">
              <label>Categoría</label>
              <input type="text" name="Categoria" value={form.Categoria} onChange={handleChange} required disabled={isModalOpen}/>
            </div>
            <button type="submit" className="btn-submit" disabled={loading || isModalOpen}>
              {loading && !isModalOpen ? 'Sincronizando...' : 'Agregar a Google Sheets'}
            </button>
          </form>
        </div>

        {/* Tabla de Registros */}
        <div className="table-section">
          {loading && productos.length === 0 ? <div className="loading-spinner">Cargando base de datos...</div> : (
            <div className="table-responsive">
              <table className="tabla-productos">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Categoría</th>
                    <th>Stock</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productosFiltrados.length > 0 ? productosFiltrados.map((p, i) => (
                    <tr key={i}>
                      <td className="id-cell">{p.ID ? p.ID.substring(p.ID.length - 4) : '...'}</td>
                      <td className="font-semibold">{p.Nombre}</td>
                      <td className="price-cell">${p.Precio}</td>
                      <td><span className="badge">{p.Categoria}</span></td>
                      <td>
                        <span className={`stock-badge ${p.Stock < 10 ? 'low-stock' : ''}`}>
                          {p.Stock}
                        </span>
                      </td>
                      <td className="acciones text-right">
                        <button onClick={() => handleEdit(p)} className="btn-icon edit">Editar</button>
                        <button onClick={() => handleDelete(p.ID)} className="btn-icon delete">Eliminar</button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="6" className="empty-state">No hay registros coincidentes.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      </>)}

      {/* MODAL DE EDICIÓN */}
      {isModalOpen && (
        <div className="modal-overlay fade-in">
          <div className="modal-content slide-up">
            <h3>Modificar Registro</h3>
            <p className="modal-subtitle">Actualizando datos en la nube</p>
            <form onSubmit={handleSubmit} className="crud-form">
              <div className="form-group">
                <label>Nombre</label>
                <input type="text" name="Nombre" value={form.Nombre} onChange={handleChange} required />
              </div>
              <div className="form-group grid-2">
                <div>
                  <label>Precio ($)</label>
                  <input type="number" name="Precio" value={form.Precio} onChange={handleChange} required min="1" />
                </div>
                <div>
                  <label>Stock</label>
                  <input type="number" name="Stock" value={form.Stock} onChange={handleChange} required min="0" />
                </div>
              </div>
              <div className="form-group">
                <label>Categoría</label>
                <input type="text" name="Categoria" value={form.Categoria} onChange={handleChange} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => { setIsModalOpen(false); setForm({ ID: '', Nombre: '', Precio: '', Categoria: '', Stock: '' }); }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-update" disabled={loading}>
                  {loading ? 'Actualizando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;