import { Link } from 'react-router-dom';
import runway from '../../assets/landing/runway.jpg';
import Button from '../Button.jsx';

export default function Closing() {
  return (
    <section
      id="acceso"
      data-surface="ink"
      aria-labelledby="cierre-titulo"
      className="relative flex items-end overflow-hidden bg-surface-ink text-ink-inverse sm:min-h-[clamp(480px,40vw,620px)]"
    >
      <img
        src={runway}
        alt="Plataforma de aeropuerto con torre de control y pasarelas de embarque"
        width="1600"
        height="900"
        loading="lazy"
        className="absolute inset-0 size-full object-cover object-[center_55%] grayscale contrast-[1.04]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-r from-surface-ink/92 via-surface-ink/76 via-60% to-surface-ink/58 min-[941px]:from-surface-ink/94 min-[941px]:via-surface-ink/74 min-[941px]:via-48% min-[941px]:to-surface-ink/24"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-surface-ink/72 to-transparent to-68% min-[941px]:to-62%" />

      <div className="relative z-10 mx-auto grid w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))] items-start gap-[30px] pb-8 pt-[72px] sm:pb-[clamp(32px,5vw,52px)] sm:pt-[clamp(64px,9vw,110px)] min-[941px]:grid-cols-[minmax(0,1.2fr)_auto] min-[941px]:items-end min-[941px]:gap-x-[clamp(36px,6vw,80px)] min-[941px]:gap-y-8">
        <div>
          <h2 id="cierre-titulo" className="m-0 max-w-[15ch] text-[clamp(2.5rem,10.5vw,3.4rem)] font-semibold leading-[0.96] tracking-[-0.04em] sm:text-[clamp(2.6rem,4.8vw,4.6rem)]">
            La próxima salida empieza acá.
          </h2>
          <p className="m-0 mt-[18px] max-w-[40ch] text-[15.5px] leading-[1.6] text-surface-band">
            Abrí el tablero y encontrá el próximo vuelo en segundos.
          </p>
        </div>

        <div className="flex w-full flex-col items-stretch gap-4 min-[941px]:w-auto min-[941px]:items-end">
          <Button as={Link} to="/dashboard" variant="primary-inverse" icon="arrow" className="min-w-49 max-sm:w-full">
            Abrir tablero
          </Button>
          <a
            href="#plataforma"
            className="self-start border-b border-ink-inverse/40 pb-[3px] text-app-label font-normal normal-case tracking-normal text-ink-inverse no-underline transition-colors duration-(--duration-state) hover:border-accent min-[941px]:self-auto"
          >
            Ver funciones
          </a>
        </div>

        <span className="mt-[26px] border-t border-line-inverse-strong pt-3 text-left font-mono text-app-label uppercase tracking-[0.12em] text-surface-band/70 min-[941px]:col-span-full min-[941px]:text-right">
          Plataforma de embarque
        </span>
      </div>
    </section>
  );
}
