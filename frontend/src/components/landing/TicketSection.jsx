import { Link } from 'react-router-dom';
import EmptyState from '../EmptyState.jsx';
import FlightTicket from '../FlightTicket.jsx';
import Loading from '../Loading.jsx';
import TextLink from '../TextLink.jsx';

/**
 * Vuelo destacado: la próxima salida programada. Sin conexión o sin vuelos no abre un error aparte:
 * muestra un aviso neutro, porque el error de la API ya se explica en el tablero.
 */
export default function TicketSection({ vuelo, loading }) {
  return (
    <section id="operacion" aria-labelledby="operacion-titulo" className="bg-surface-band py-[clamp(72px,9vw,112px)] max-sm:py-16">
      <div className="mx-auto w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))]">
        <div className="mb-[clamp(36px,5vw,56px)] grid items-start gap-[18px] min-[941px]:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] min-[941px]:items-end min-[941px]:gap-[clamp(32px,5vw,72px)]">
          <h2 id="operacion-titulo" className="m-0 max-w-[14ch] text-headline">
            Un vuelo, toda la información.
          </h2>
          <p className="m-0 max-w-[58ch] text-[15.5px] leading-[1.65] text-ink-muted min-[941px]:max-w-[46ch]">
            Ruta, horarios, disponibilidad y precio base en una ficha que se lee de un vistazo.
          </p>
        </div>

        {vuelo ? (
          <FlightTicket
            vuelo={vuelo}
            reveal
            aria-label={`Detalle del vuelo ${vuelo.numeroVuelo}`}
            footer={
              <>
                <span className="font-mono">Próxima salida programada</span>
                <TextLink as={Link} to="/dashboard" size="sm">
                  Abrir tablero
                </TextLink>
              </>
            }
          />
        ) : loading ? (
          <Loading variant="panel" label="Cargando el vuelo destacado…" className="rounded-ticket bg-surface p-8" />
        ) : (
          <div className="rounded-ticket bg-surface px-[clamp(24px,3vw,36px)] pb-4 shadow-soft">
            <EmptyState title="Todavía no hay un vuelo para mostrar" className="border-t-0">
              Cuando haya una salida programada, su ficha aparece acá.
            </EmptyState>
          </div>
        )}
      </div>
    </section>
  );
}
