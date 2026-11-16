import Icon from './Icon.jsx';

const TONES = {
  light: 'border-line-strong text-ink',
  ink: 'border-line-inverse-strong text-ink-inverse',
};

const SIZES = {
  md: 'text-app-body-sm',
  sm: 'text-app-label normal-case tracking-normal',
};

/** Enlace de texto con subrayado de 1 px; al pasar el mouse el borde pasa a naranja y la flecha avanza. */
export default function TextLink({ as: Component = 'a', tone = 'light', size = 'md', icon = 'arrow', className = '', children, ...rest }) {
  return (
    <Component
      {...rest}
      className={`group inline-flex items-center gap-2 border-b pb-1 font-sans font-medium no-underline transition-colors duration-(--duration-state) hover:border-accent ${TONES[tone]} ${SIZES[size]} ${className}`}
    >
      {children}
      {icon && (
        <Icon
          name={icon}
          size={size === 'sm' ? 12 : 16}
          className="transition-transform duration-(--duration-state) group-hover:translate-x-[3px]"
        />
      )}
    </Component>
  );
}
