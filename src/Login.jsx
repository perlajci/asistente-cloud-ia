import { useState } from 'react';
import { AGENCIA } from './config';
import Wordmark from './Wordmark';
import { Silueta } from './FotoAuto';

export default function Login({ onEntrar, botonTema }) {
  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');

  const entrar = (e) => {
    e.preventDefault();
    if (usuario === 'admin' && clave === '12345') {
      onEntrar();
    } else {
      setError('Usuario o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.');
    }
  };

  return (
    <div className="login">
      <section className="login-marca">
        <Wordmark />
        <div>
          <div className="carril" aria-hidden="true" />
          <h1>Tu próximo auto empieza con una pregunta.</h1>
          <p>
            Nuestro asesor con inteligencia artificial revisa el inventario de la agencia en tiempo real y te
            recomienda el auto que mejor se ajusta a tu presupuesto.
          </p>
        </div>
        <div className="login-silueta" aria-hidden="true"><Silueta categoria="Deportivo" /></div>
        <p className="login-ciudad">{AGENCIA.ciudad}</p>
      </section>

      <section className="login-form-lado">
        <form className="login-form" onSubmit={entrar}>
          <h2>Bienvenido</h2>
          <p className="pista">Inicia sesión para consultar el inventario. Acceso de demostración: admin / 12345</p>
          <div className="campo">
            <label htmlFor="usuario">Usuario</label>
            <input id="usuario" autoComplete="username" value={usuario} onChange={(e) => setUsuario(e.target.value)} required />
          </div>
          <div className="campo">
            <label htmlFor="clave">Contraseña</label>
            <input id="clave" type="password" autoComplete="current-password" value={clave} onChange={(e) => setClave(e.target.value)} required />
          </div>
          {error && <div className="aviso-error" role="alert">{error}</div>}
          <button className="btn btn-primary btn-grande" type="submit">Entrar</button>
          <div className="login-pie">{botonTema}</div>
        </form>
      </section>
    </div>
  );
}
