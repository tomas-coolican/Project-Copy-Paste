import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import Alert from './components/Alert.jsx';
import Button from './components/Button.jsx';
import EmptyState from './components/EmptyState.jsx';
import ErrorMessage from './components/ErrorMessage.jsx';
import FormField from './components/FormField.jsx';
import Loading from './components/Loading.jsx';
import Masthead from './components/Masthead.jsx';
import StatusIndicator from './components/StatusIndicator.jsx';

const NAV = [
  { to: '/', label: 'Vuelos', end: true },
  { to: '/reservas', label: 'Reservas' },
];

const ESTADOS = ['Programado', 'En vuelo', 'Finalizado', 'Cancelado', 'Confirmada', 'Cancelada'];

function Section({ title, children }) {
  return (
    <section className="border-t border-line py-8">
      <h2 className="m-0 mb-4 text-app-section font-semibold">{title}</h2>
      <div className="flex flex-col items-start gap-4">{children}</div>
    </section>
  );
}

// Vista de verificación de S1: se reemplaza por el router real en S2.
export default function App() {
  const [retrying, setRetrying] = useState(false);

  return (
    <BrowserRouter>
      <Masthead
        nav={NAV}
        actions={
          <Button size="sm" icon="arrow">
            Abrir tablero
          </Button>
        }
      />
      <main id="contenido" className="mx-auto w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))] py-10">
        <p className="m-0 font-mono text-app-label uppercase text-ink-faint">Tablero / Fundaciones</p>
        <h1 className="m-0 mt-1.5 mb-8 text-app-page font-bold">Fundaciones visuales</h1>

        <Section title="Botones">
          <div className="flex flex-wrap gap-3">
            <Button icon="arrow">Primario</Button>
            <Button size="sm">Pequeño</Button>
            <Button variant="secondary">Secundario</Button>
            <Button variant="danger">Cancelar reserva</Button>
            <Button disabled>Deshabilitado</Button>
            <Button pending pendingLabel="Guardando…">Guardar</Button>
          </div>
        </Section>

        <Section title="Estados">
          <div className="flex flex-wrap gap-6">
            {ESTADOS.map((estado) => (
              <StatusIndicator key={estado} estado={estado} />
            ))}
          </div>
          <div data-surface="ink" className="flex flex-wrap gap-6 bg-surface-ink p-5">
            {ESTADOS.map((estado) => (
              <StatusIndicator key={estado} estado={estado} tone="ink" />
            ))}
          </div>
          <StatusIndicator estado="Confirmada" size="md" />
        </Section>

        <Section title="Avisos">
          <Alert tone="info" title="La selección de asientos todavía no está disponible">Podés ver el vuelo, pero aún no reservar.</Alert>
          <Alert tone="success" title="Reserva confirmada">Tu asiento quedó asignado.</Alert>
          <Alert tone="warning" title="Este vuelo ya salió">Elegí otro vuelo programado.</Alert>
          <Alert tone="danger" title="No se pudo guardar">Revisá los campos marcados.</Alert>
        </Section>

        <Section title="Cargando, vacío y errores">
          <Loading className="w-full max-w-[720px]" />
          <Loading variant="inline" />
          <EmptyState title="No hay vuelos para esta ruta" action={<Button variant="secondary" size="sm">Limpiar filtros</Button>}>
            Probá otra fecha o quitá el filtro de asientos.
          </EmptyState>
          <ErrorMessage
            error={{ isNetworkError: true }}
            retrying={retrying}
            onRetry={() => {
              setRetrying(true);
              setTimeout(() => setRetrying(false), 1200);
            }}
          />
          <ErrorMessage error={{ status: 500, message: 'El servidor respondió con un error.' }} title="No pudimos cargar los vuelos" onRetry={() => {}} />
        </Section>

        <Section title="Campos">
          <div className="grid w-full max-w-[520px] gap-4">
            <FormField label="Email" type="email" autoComplete="email" help="Usá el correo con el que te registraste." />
            <FormField label="Contraseña" type="password" autoComplete="current-password" />
            <FormField label="Teléfono" optional mono />
            <FormField label="DNI" mono error="ya existe un pasajero con ese DNI." defaultValue="30123456" />
            <FormField label="Estado" control="select" defaultValue="0">
              <option value="0">Programado</option>
              <option value="2">Cancelado</option>
            </FormField>
          </div>
        </Section>
      </main>
    </BrowserRouter>
  );
}
