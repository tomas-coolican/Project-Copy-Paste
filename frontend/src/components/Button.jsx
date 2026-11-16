import Icon from './Icon.jsx';

const BASE =
  'inline-flex items-center justify-center gap-2.5 rounded-control border font-sans text-app-body-sm font-semibold leading-none tracking-[-0.01em] no-underline transition-colors duration-(--duration-state) ease-out disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-tint disabled:text-ink-faint aria-disabled:cursor-not-allowed aria-disabled:border-line aria-disabled:bg-surface-tint aria-disabled:text-ink-faint';

const VARIANTS = {
  // Texto ink sobre naranja (4,86:1). Hover: fondo ink, texto blanco.
  primary:
    'border-accent bg-accent text-accent-ink hover:border-ink hover:bg-ink hover:text-surface',
  // Sobre banda ink el hover a ink desaparecería: invierte a blanco.
  'primary-inverse':
    'border-accent bg-accent text-accent-ink hover:border-surface hover:bg-surface hover:text-ink',
  secondary: 'border-line-strong bg-surface text-ink hover:border-ink',
  // Destructivo: nunca un bloque rojo sólido.
  danger: 'border-danger bg-surface text-danger hover:bg-danger-surface',
};

const SIZES = {
  md: 'min-h-(--size-control) px-control-x',
  sm: 'min-h-(--size-control-sm) px-control-x-sm',
};

/**
 * `as` permite renderizar un <Link> de react-router u otro elemento.
 * `pending` deshabilita y muestra `pendingLabel` ("Guardando…", "Cancelando…").
 */
export default function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  icon,
  pending = false,
  pendingLabel,
  className = '',
  children,
  ...rest
}) {
  const isNativeButton = Component === 'button';
  const disabled = pending || rest.disabled;
  const props = isNativeButton
    ? { type: 'button', ...rest, disabled }
    : { ...rest, 'aria-disabled': disabled || undefined };

  return (
    <Component
      {...props}
      className={`group ${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {pending && pendingLabel ? pendingLabel : children}
      {icon && !pending && (
        <Icon
          name={icon}
          size={16}
          className="transition-transform duration-(--duration-state) group-hover:translate-x-[3px]"
        />
      )}
    </Component>
  );
}
