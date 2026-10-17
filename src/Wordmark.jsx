import { AGENCIA } from './config';

export default function Wordmark() {
  return (
    <span className="wordmark">
      <svg className="wordmark-simbolo" viewBox="0 0 32 32" aria-hidden="true">
        <rect width="32" height="32" rx="9" />
        <path d="M7 21 L13 11 L19 21 M14 21 L20 11 L26 21" />
      </svg>
      <span className="wordmark-texto">
        {AGENCIA.nombre} <span className="placa">{AGENCIA.placa}</span>
      </span>
    </span>
  );
}
