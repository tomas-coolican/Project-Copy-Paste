const TONE = {
  light: {
    Embarcando: 'text-success',
    Programado: 'text-ink-muted',
    Demorado: 'text-danger',
    Aterrizó: 'text-success',
    'En aproximación': 'text-info',
  },
  ink: {
    Embarcando: 'text-success-inverse',
    Programado: 'text-ink-inverse-muted',
    Demorado: 'text-danger-inverse',
    Aterrizó: 'text-success-inverse',
    'En aproximación': 'text-info-inverse',
  },
};

export default function SampleStatus({ estado, tone = 'light', className = '' }) {
  const color = TONE[tone][estado] ?? TONE[tone].Programado;
  const anillo = estado === 'Programado';

  return (
    <span className={`inline-flex items-center gap-2 whitespace-nowrap font-mono text-app-label ${color} ${className}`}>
      <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${anillo ? 'border border-current bg-transparent' : 'bg-current'}`} />
      {estado}
    </span>
  );
}
