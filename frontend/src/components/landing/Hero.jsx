import { Link } from 'react-router-dom';
import gate from '../../assets/landing/gate.jpg';
import { formatFecha, formatHora } from '../../utils/formatDate.js';
import BoardingPass from '../BoardingPass.jsx';
import Button from '../Button.jsx';
import RouteLine from '../RouteLine.jsx';
import StatusIndicator from '../StatusIndicator.jsx';
import TextLink from '../TextLink.jsx';

const CAPTION = 'flex justify-between gap-4 pt-2.5 font-mono text-app-label uppercase tracking-[0.08em] text-ink-faint';

function PaseDestacado({ vuelo }) {
  return (
    <BoardingPass
      aria-label={`Resumen del vuelo ${vuelo.numeroVuelo}`}
      status={<StatusIndicator estado={vuelo.estado} />}
      route={<RouteLine origen={vuelo.origen} destino={vuelo.destino} variant="pass" />}
      fields={[
        { label: 'Vuelo', value: vuelo.numeroVuelo },
        { label: 'Salida', value: formatHora(vuelo.fechaSalida) },
        { label: 'Asientos', value: vuelo.asientosDisponibles },
      ]}
      serial={`${vuelo.numeroVuelo.replace(/\s+/g, '')} · ${formatFecha(vuelo.fechaSalida)}`}
      className="relative mx-3 -mt-[46px] w-[calc(100%-24px)] animate-pass-in [animation-delay:400ms] sm:absolute sm:bottom-8 sm:left-4 sm:mx-0 sm:mt-0 sm:w-[min(340px,calc(100%-32px))] min-[941px]:bottom-[42px] min-[941px]:left-[clamp(-36px,-2.5vw,-18px)] min-[941px]:w-[min(342px,78%)]"
    />
  );
}

/**
 * Portada. El titular, la foto y las acciones no dependen de la API: el pase y la línea de estado
 * aparecen solo cuando hay datos (`destacado`, `programados`, `actualizado`), sin mostrar errores.
 */
export default function Hero({ destacado, programados, actualizado }) {
  return (
    <section id="inicio" aria-labelledby="hero-title" className="bg-surface pb-[clamp(64px,8vw,104px)] pt-10 min-[941px]:mt-[clamp(-104px,calc(100svh-820px),0px)] min-[941px]:pt-0">
      <div className="mx-auto grid w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))] items-center gap-12 min-[941px]:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] min-[941px]:gap-[clamp(40px,5vw,76px)]">
        <div className="max-w-[680px] min-[941px]:max-w-[640px]">
          <h1
            id="hero-title"
            className="m-0 text-display max-sm:text-[clamp(2.65rem,11.5vw,4.2rem)] max-[420px]:text-[clamp(2.45rem,11.6vw,3rem)]"
          >
            <span className="block animate-line-in">Cada vuelo,</span>
            <span className="block animate-line-in [animation-delay:90ms]">
              en su{' '}
              <span className="after:ml-[0.04em] after:inline-block after:size-[0.14em] after:bg-accent after:align-[0.02em] after:content-['']">
                lugar
              </span>
            </span>
          </h1>
          <p className="m-0 mt-7 max-w-[42ch] animate-rise text-[clamp(1rem,1.25vw,1.12rem)] leading-[1.6] text-ink-muted [animation-delay:160ms]">
            Vuelos, pasajeros y administración en una sola pantalla. La operación diaria, clara y a tiempo.
          </p>
          <div className="mt-8 flex animate-rise flex-wrap items-center gap-x-6 gap-y-[18px] [animation-delay:240ms] max-sm:items-stretch">
            <Button as={Link} to="/dashboard" icon="arrow" className="max-sm:w-full">
              Abrir tablero
            </Button>
            <TextLink href="#plataforma" className="max-sm:self-start">
              Conocer la plataforma
            </TextLink>
          </div>

          {actualizado && (
            <div className="mt-10 flex animate-rise flex-wrap items-center gap-x-3.5 gap-y-2 border-t border-dashed border-line-strong pt-[18px] text-app-label text-ink-muted [animation-delay:320ms] max-[420px]:gap-x-2.5 max-[420px]:gap-y-[7px]">
              <span aria-hidden="true" className="size-(--size-status-dot-sm) rounded-full bg-accent" />
              <span>
                Actualizado hoy a las{' '}
                <time dateTime={actualizado.toISOString()} className="font-mono text-ink">
                  {formatHora(actualizado)}
                </time>
              </span>
              {programados !== null && (
                <>
                  <span aria-hidden="true" className="h-3 w-px bg-line-strong max-sm:hidden" />
                  <span className="max-sm:basis-full">
                    <strong className="font-semibold text-ink">{programados}</strong>{' '}
                    {programados === 1 ? 'vuelo programado' : 'vuelos programados'}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="relative mx-auto w-full max-w-[620px] min-w-0 min-[941px]:max-w-none">
          <figure className="m-0">
            <img
              src={gate}
              alt="Sillas de sala de embarque frente a una ventana de aeropuerto durante el atardecer"
              width="1200"
              height="1500"
              className="block aspect-4/5 w-full animate-settle bg-surface-band object-cover object-center sm:max-[940px]:aspect-5/4"
            />
            <figcaption className={`${CAPTION} max-sm:hidden`}>
              <span>Sala de embarque</span>
              <span>Foto: Unsplash</span>
            </figcaption>
          </figure>

          {destacado && <PaseDestacado vuelo={destacado} />}
        </div>
      </div>
    </section>
  );
}
