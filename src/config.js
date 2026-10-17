// Cambia aquí el nombre de tu agencia
export const AGENCIA = {
  nombre: 'Ruta',
  placa: 'Motors',
  ciudad: 'Puruándiro, Mich.',
};

export const CATEGORIAS = ['Sedán', 'Hatchback', 'SUV', 'Pickup', 'Deportivo', 'Minivan'];
export const TRANSMISIONES = ['Automática', 'Manual', 'CVT'];
export const COMBUSTIBLES = ['Gasolina', 'Híbrido', 'Eléctrico', 'Diésel'];

export const pesos = (n) =>
  Number(n || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

export const km = (n) => Number(n || 0).toLocaleString('es-MX') + ' km';
