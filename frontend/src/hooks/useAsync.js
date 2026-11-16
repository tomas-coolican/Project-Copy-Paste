import { useCallback, useEffect, useRef, useState } from 'react';

const INICIAL = { status: 'loading', data: null, error: null, updatedAt: null };

/**
 * Ejecuta `fn` (una función que devuelve una promesa) al montar y ante `reload()`.
 * - `loading`: hay una petición en curso (también durante un reintento).
 * - `error`: el último error; se conserva mientras se reintenta para poder mostrar "Reintentando…".
 * - `updatedAt`: Date del último éxito.
 * Descarta respuestas de una petición vieja si el componente se desmonta o se reintenta.
 */
export default function useAsync(fn) {
  const fnRef = useRef(fn);
  const [state, setState] = useState(INICIAL);
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    let descartada = false;

    fnRef
      .current()
      .then((data) => {
        if (!descartada) setState({ status: 'success', data, error: null, updatedAt: new Date() });
      })
      .catch((error) => {
        if (!descartada) setState((previo) => ({ ...previo, status: 'error', error }));
      });

    return () => {
      descartada = true;
    };
  }, [intento]);

  const reload = useCallback(() => {
    setState((previo) => ({ ...previo, status: 'loading' }));
    setIntento((n) => n + 1);
  }, []);

  return {
    data: state.data,
    error: state.error,
    updatedAt: state.updatedAt,
    loading: state.status === 'loading',
    retrying: state.status === 'loading' && state.error !== null,
    reload,
  };
}
