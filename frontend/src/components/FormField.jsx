import { useId, useState } from 'react';
import Icon from './Icon.jsx';

const CONTROL =
  'block w-full min-h-12 rounded-control border border-line bg-surface px-3.5 font-sans text-app-body text-ink transition-colors duration-(--duration-state) placeholder:text-ink-faint hover:border-line-strong read-only:hover:border-line disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-tint disabled:text-ink-faint aria-invalid:border-danger';

/**
 * Campo de formulario como línea impresa. Compatible con react-hook-form:
 * `<FormField label="Email" type="email" error={errors.email?.message} {...register('email')} />`
 * `control`: 'input' | 'select' | 'textarea'. Para select, las <option> van como children.
 * `mono` fija la voz mono con números tabulares (valores numéricos y monetarios).
 * El error nombra el campo y anuncia con aria-live; valida en blur/submit desde el formulario.
 */
export default function FormField({
  label,
  control = 'input',
  type = 'text',
  id,
  help,
  error,
  optional = false,
  mono = false,
  className = '',
  children,
  ref,
  ...rest
}) {
  const autoId = useId();
  const [revealed, setRevealed] = useState(false);
  const fieldId = id ?? autoId;
  const helpId = help ? `${fieldId}-help` : undefined;
  const errorId = `${fieldId}-error`;
  const describedBy = [helpId, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  const isPassword = control === 'input' && type === 'password';
  const common = {
    id: fieldId,
    ref,
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': describedBy,
    ...rest,
  };
  const classes = `${CONTROL} ${mono ? 'font-mono' : ''}`;

  let field;
  if (control === 'select') {
    field = (
      <div className="relative">
        <select {...common} className={`${classes} appearance-none pr-11`}>
          {children}
        </select>
        <Icon name="chevron" size={16} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink" />
      </div>
    );
  } else if (control === 'textarea') {
    field = <textarea {...common} className={`${classes} min-h-30 resize-y py-3`} />;
  } else if (isPassword) {
    field = (
      <div className="relative">
        <input {...common} type={revealed ? 'text' : 'password'} className={`${classes} pr-12`} />
        <button
          type="button"
          onClick={() => setRevealed((value) => !value)}
          aria-pressed={revealed}
          aria-label={revealed ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute right-0 top-1/2 grid size-(--size-touch) -translate-y-1/2 place-items-center rounded-control text-ink"
        >
          <Icon name={revealed ? 'eye-off' : 'eye'} size={20} />
        </button>
      </div>
    );
  } else {
    field = <input {...common} type={type} className={classes} />;
  }

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={fieldId} className="text-app-label font-mono uppercase text-ink-faint">
        {label}
        {optional && ' (opcional)'}
      </label>
      {field}
      {help && (
        <p id={helpId} className="m-0 text-app-body-sm text-ink-faint">
          {help}
        </p>
      )}
      <p id={errorId} aria-live="polite" className={error ? 'm-0 flex items-start gap-2 text-app-body-sm text-danger' : 'sr-only'}>
        {error && (
          <>
            <Icon name="danger" size={16} className="mt-0.5" />
            <span>Error: {error}</span>
          </>
        )}
      </p>
    </div>
  );
}
