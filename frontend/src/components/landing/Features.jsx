import tarmac from '../../assets/landing/tarmac.jpg';
import Icon from '../Icon.jsx';

const FUNCIONES = [
  {
    id: 'vuelos',
    icono: 'takeoff',
    titulo: 'Vuelos',
    texto: 'Listá todos los vuelos con su ruta, horarios, asientos disponibles y precio base. Abrí el detalle sin perder el contexto.',
    meta: 'Listado / detalle',
  },
  {
    id: 'pasajeros',
    icono: 'passenger',
    titulo: 'Pasajeros',
    texto: 'Registrá pasajeros con nombre, apellido, DNI, correo y teléfono. Los datos justos para la operación.',
    meta: 'Alta / registro',
  },
  {
    id: 'panel',
    icono: 'panel',
    titulo: 'Panel',
    texto: 'Creá, editá y eliminá vuelos desde un solo lugar, con confirmaciones claras antes de cada cambio.',
    meta: 'Administración',
  },
];

export default function Features() {
  return (
    <section id="plataforma" aria-labelledby="plataforma-titulo" className="bg-surface py-[clamp(72px,9vw,120px)] max-sm:py-16">
      <div className="mx-auto grid w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))] items-start gap-11 min-[941px]:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] min-[941px]:gap-[clamp(40px,6vw,88px)]">
        <figure className="m-0 max-w-[560px]">
          <img
            src={tarmac}
            alt="Avión estacionado en la plataforma de un aeropuerto junto a la puerta G5"
            width="1200"
            height="1500"
            loading="lazy"
            className="block aspect-4/5 w-full bg-surface-band object-cover object-[100%_50%]"
          />
          <figcaption className="flex justify-between gap-4 pt-2.5 font-mono text-app-label uppercase tracking-[0.08em] text-ink-faint">
            <span>Plataforma</span>
            <span>Foto: Unsplash</span>
          </figcaption>
        </figure>

        <div className="max-w-[720px]">
          <h2 id="plataforma-titulo" className="m-0 max-w-[15ch] text-headline">
            Hecho para la operación diaria.
          </h2>
          <p className="m-0 mb-8 mt-4 max-w-[46ch] text-[15.5px] leading-[1.65] text-ink-muted">
            Las tareas que el equipo repite todos los días, sin capas de más.
          </p>

          <div className="border-t border-ink">
            {FUNCIONES.map((funcion) => (
              <article
                key={funcion.id}
                id={funcion.id}
                className="grid grid-cols-[44px_minmax(0,1fr)] items-start gap-4 border-b border-line py-5 sm:py-6 tbl:grid-cols-[48px_minmax(0,1fr)_126px] tbl:gap-5"
              >
                <span aria-hidden="true" className="grid size-(--size-touch) place-items-center text-accent">
                  <Icon name={funcion.icono} size={20} />
                </span>
                <div>
                  <h3 className="m-0 text-app-title">{funcion.titulo}</h3>
                  <p className="m-0 mt-2 max-w-[48ch] text-[14.5px] leading-[1.55] text-ink-muted">{funcion.texto}</p>
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
