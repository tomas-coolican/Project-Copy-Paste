import { Link } from "react-router-dom";
import gate from "../../assets/landing/gate.jpg";
import { formatFecha, formatHora } from "../../utils/formatDate.js";
import BoardingPass from "../BoardingPass.jsx";
import Button from "../Button.jsx";
import RouteLine from "../RouteLine.jsx";
import TextLink from "../TextLink.jsx";
import SampleStatus from "./SampleStatus.jsx";

function PaseDestacado({ vuelo }) {
  return (
    <BoardingPass
      aria-label={`Resumen del vuelo ${vuelo.numeroVuelo}`}
      status={<SampleStatus estado={vuelo.estado} />}
      route={
        <RouteLine
          origen={vuelo.origen}
          destino={vuelo.destino}
          variant="pass"
        />
      }
      fields={[
        { label: "Vuelo", value: vuelo.numeroVuelo },
        { label: "Salida", value: formatHora(vuelo.fechaSalida) },
        { label: "Asientos", value: vuelo.asientosDisponibles },
      ]}
      serial={`${vuelo.numeroVuelo.replace(/\s+/g, "")} · ${formatFecha(
        vuelo.fechaSalida,
      )
        .replace(/\s+\d{4}$/, "")
        .toUpperCase()}`}
      className="relative mx-3 -mt-[46px] w-[calc(100%-24px)] animate-pass-in [animation-delay:400ms] sm:absolute sm:bottom-8 sm:left-4 sm:mx-0 sm:mt-0 sm:w-[min(340px,calc(100%-32px))] min-[941px]:bottom-[42px] min-[941px]:left-[clamp(-36px,-2.5vw,-18px)] min-[941px]:w-[min(342px,78%)]"
    />
  );
}

/**
 * Portada de producto con el pase de la próxima salida real (si hay); el CTA conserva el acceso
 * al registro y al tablero.
 */
export default function Hero({ destacado, isAuthenticated }) {
  return (
    <section
      id="inicio"
      aria-labelledby="hero-title"
      className="bg-surface pb-[clamp(64px,8vw,104px)] pt-10 min-[941px]:mt-[clamp(-104px,calc(100svh-820px),0px)] min-[941px]:pt-0"
    >
      <div className="mx-auto grid w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))] items-center gap-12 min-[941px]:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)] min-[941px]:gap-[clamp(40px,5vw,76px)]">
        <div className="max-w-[680px] min-[941px]:max-w-[640px]">
          <h1
            id="hero-title"
            className="m-0 text-display max-sm:text-[clamp(2.65rem,11.5vw,4.2rem)] max-[420px]:text-[clamp(2.45rem,11.6vw,3rem)]"
          >
            <span className="block animate-line-in">Cada vuelo,</span>
            <span className="block animate-line-in [animation-delay:90ms]">
              en su{" "}
              <span className="after:ml-[0.04em] after:inline-block after:size-[0.14em] after:bg-accent after:align-[0.02em] after:content-['']">
                lugar
              </span>
            </span>
          </h1>
          <p className="m-0 mt-7 max-w-[42ch] animate-rise text-[clamp(1rem,1.25vw,1.12rem)] leading-[1.6] text-ink-muted [animation-delay:160ms]">
            Consultá horarios y disponibilidad, reservá asientos y gestioná
            pasajeros desde un mismo lugar.
          </p>
          <div className="mt-8 flex animate-rise flex-wrap items-center gap-x-6 gap-y-[18px] [animation-delay:240ms] max-sm:items-stretch">
            <Button
              as={Link}
              to={isAuthenticated ? "/dashboard" : "/registro"}
              icon="arrow"
              className="max-sm:w-full"
            >
              {isAuthenticated ? "Ir a mi tablero" : "Crear cuenta"}
            </Button>
            <TextLink href="#plataforma" className="max-sm:self-start">
              Ver cómo funciona
            </TextLink>
          </div>
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
          </figure>

          {destacado && <PaseDestacado vuelo={destacado} />}
        </div>
      </div>
    </section>
  );
}
