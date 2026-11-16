import tarmac from "../../assets/landing/tarmac.jpg";
import Icon from "../Icon.jsx";

const FUNCIONES = [
  {
    id: "vuelos",
    icono: "takeoff",
    titulo: "Encontrá el vuelo adecuado",
    texto:
      "Consultá rutas, horarios, disponibilidad y precio. Abrí cada vuelo para revisar el detalle antes de continuar.",
    meta: "Consulta de vuelos",
  },
  {
    id: "pasajeros",
    icono: "passenger",
    titulo: "Elegí asiento y registrá al pasajero",
    texto:
      "Seleccioná un asiento disponible y cargá los datos de quien viaja, o reutilizá un pasajero existente. Revisá la reserva antes de confirmarla.",
    meta: "Asientos y reservas",
  },
  {
    id: "panel",
    icono: "panel",
    titulo: "Mantené los vuelos al día",
    texto:
      "Las cuentas con rol administrador pueden crear, editar y eliminar vuelos desde el panel de gestión.",
    meta: "Administración",
  },
];

export default function Features() {
  return (
    <section
      id="plataforma"
      aria-labelledby="plataforma-titulo"
      className="bg-surface py-[clamp(72px,9vw,120px)] max-sm:py-16 min-[941px]:min-h-svh min-[941px]:py-0"
    >
      <div className="mx-auto grid w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))] items-start gap-11 min-[941px]:min-h-svh min-[941px]:items-stretch min-[941px]:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] min-[941px]:gap-[clamp(40px,6vw,88px)]">
        <figure className="m-0 max-w-[560px] min-[941px]:-ml-[var(--spacing-gutter)] min-[941px]:max-w-none">
          <img
            src={tarmac}
            alt="Avión estacionado en la plataforma de un aeropuerto junto a la puerta G5"
            width="1200"
            height="1500"
            loading="lazy"
            className="block aspect-4/5 w-full bg-surface-band object-cover object-[100%_50%] min-[941px]:aspect-auto min-[941px]:h-full min-[941px]:min-h-svh"
          />
        </figure>

        <div className="max-w-[720px] min-[941px]:pb-4 min-[941px]:pt-[var(--size-masthead)]">
          <h2 id="plataforma-titulo" className="m-0 max-w-[15ch] text-headline">
            Hecho para la operación diaria.
          </h2>
          <p className="m-0 mb-8 mt-4 max-w-[46ch] text-[15.5px] leading-[1.65] text-ink-muted">
            Encontrá la información del vuelo, elegí un asiento y confirmá la
            reserva con los datos a la vista.
          </p>

          <div className="border-t border-ink">
            {FUNCIONES.map((funcion) => (
              <article
                key={funcion.id}
                id={funcion.id}
                className="grid grid-cols-[44px_minmax(0,1fr)] items-start gap-4 border-b border-line py-5 sm:py-6 min-[941px]:py-3 tbl:grid-cols-[48px_minmax(0,1fr)_126px] tbl:gap-5"
              >
                <span
                  aria-hidden="true"
                  className="grid size-(--size-touch) place-items-center text-accent"
                >
                  <Icon name={funcion.icono} size={20} />
                </span>
                <div>
                  <h3 className="m-0 text-app-title">{funcion.titulo}</h3>
                  <p className="m-0 mt-2 max-w-[48ch] text-[14.5px] leading-[1.55] text-ink-muted">
                    {funcion.texto}
                  </p>
                </div>
                <span className="hidden justify-self-end pt-1 text-right font-mono text-app-label uppercase tracking-[0.08em] text-ink-faint tbl:block">
                  {funcion.meta}
                </span>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
