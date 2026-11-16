import { useMemo, useState } from 'react';
import pasajerosApi from '../api/pasajerosApi.js';
import useAsync from '../hooks/useAsync.js';
import EmptyState from './EmptyState.jsx';
import ErrorMessage from './ErrorMessage.jsx';
import FormField from './FormField.jsx';
import Icon from './Icon.jsx';
import Loading from './Loading.jsx';

const MAX_RESULTADOS = 8;

function normalizar(texto) {
  return String(texto ?? '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
}

/**
 * Busca entre los pasajeros ya cargados (GET /pasajeros) por DNI, email o nombre.
 * Se monta recién cuando la persona elige "Pasajero existente", así no pide la lista antes de tiempo.
 */
export default function PasajeroSelector({ seleccionado, onSelect, consultaInicial = '' }) {
  const { data, error, loading, retrying, reload } = useAsync(() => pasajerosApi.listar());
  const [consulta, setConsulta] = useState(consultaInicial);

  const resultados = useMemo(() => {
    const termino = normalizar(consulta).trim();
    const lista = data ?? [];

    if (!termino) return lista;

    return lista.filter((p) =>
      [p.dni, p.email, p.nombreCompleto].some((campo) => normalizar(campo).includes(termino)),
    );
  }, [data, consulta]);

  const visibles = resultados.slice(0, MAX_RESULTADOS);

  return (
    <div className="flex flex-col gap-4">
      <FormField
        label="Buscar por DNI, email o nombre"
        type="search"
        value={consulta}
        onChange={(evento) => setConsulta(evento.target.value)}
        autoComplete="off"
      />

      {error ? (
        <ErrorMessage error={error} title="No pudimos cargar los pasajeros" onRetry={reload} retrying={retrying} />
      ) : loading && !data ? (
        <Loading variant="rows" rows={3} label="Cargando pasajeros…" />
      ) : visibles.length === 0 ? (
        <EmptyState announce title={consulta ? 'No encontramos pasajeros con ese dato' : 'Todavía no hay pasajeros'}>
          {consulta ? 'Revisá el DNI o el email, o cargá un pasajero nuevo.' : 'Cargá un pasajero nuevo para continuar.'}
        </EmptyState>
      ) : (
        <>
          <ul className="m-0 flex list-none flex-col border-t border-line p-0">
            {visibles.map((pasajero) => {
              const elegido = seleccionado?.id === pasajero.id;

              return (
                <li key={pasajero.id} className="border-b border-line">
                  <button
                    type="button"
                    aria-pressed={elegido}
                    onClick={() => onSelect(elegido ? null : pasajero)}
                    className={`flex min-h-14 w-full items-center justify-between gap-4 px-1 py-2 text-left transition-colors duration-(--duration-state) hover:bg-surface-tint ${elegido ? 'bg-surface-tint' : ''}`}
                  >
                    <span className="min-w-0">
                      <span className="block break-words font-semibold">{pasajero.nombreCompleto}</span>
                      <span className="block break-words font-mono text-app-data text-ink-muted">
                        DNI {pasajero.dni} · {pasajero.email}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 font-mono text-app-label uppercase text-ink">
                      {elegido && (
                        <>
                          <Icon name="tick" size={16} />
                          Elegido
                        </>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p aria-live="polite" className="m-0 font-mono text-app-label uppercase text-ink-faint">
            {resultados.length > MAX_RESULTADOS
              ? `Mostrando ${MAX_RESULTADOS} de ${resultados.length}. Acotá la búsqueda.`
              : `${resultados.length} ${resultados.length === 1 ? 'pasajero' : 'pasajeros'}`}
          </p>
        </>
      )}
    </div>
  );
}
