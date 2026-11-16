import Alert from './Alert.jsx';
import Button from './Button.jsx';

/**
 * Región fallida: ocupa el lugar de los datos y nunca flota sobre la página.
 * - Sin conexión (error.isNetworkError): aviso ámbar con "Reintentar".
 * - HTTP: peligro con el mensaje de la API y el código en mono.
 * - 403 / 404: sin reintento; el llamador pasa `action` (p. ej. "Volver al listado").
 * No muestra stack traces, mensajes de Axios ni ProblemDetails crudos.
 */
export default function ErrorMessage({ error, title, onRetry, retrying = false, action, surface = 'light', className = '' }) {
  const status = error?.status ?? null;
  const isNetwork = Boolean(error?.isNetworkError);
  const canRetry = Boolean(onRetry) && status !== 403 && status !== 404;

  let tone = 'danger';
  let heading = title ?? 'No pudimos cargar los datos';
  let body = error?.message ?? 'Ocurrió un error inesperado.';

  if (isNetwork) {
    tone = 'warning';
    heading = 'Sin conexión';
    body = 'No pudimos contactar al servidor. Revisá tu conexión y volvé a intentar.';
  } else if (status === 403) {
    heading = 'No tenés permiso para ver esta sección';
  } else if (status === 404) {
    heading = title ?? 'No encontramos lo que buscabas';
  }

  const retryButton = canRetry ? (
    <Button variant="secondary" size="sm" icon="refresh" pending={retrying} pendingLabel="Reintentando…" onClick={onRetry}>
      Reintentar
    </Button>
  ) : null;

  return (
    <Alert
      tone={tone}
      surface={surface}
      role="alert"
      title={heading}
      meta={!isNetwork && status ? `HTTP ${status}` : undefined}
      action={retryButton ?? action}
      className={className}
    >
      {body}
    </Alert>
  );
}
