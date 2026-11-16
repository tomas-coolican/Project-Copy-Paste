function Cifra({ label, value, note, summaryStart = false }) {
  return (
    <div className={`landing-stats-cell${summaryStart ? ' landing-stats-cell--summary-start' : ''}`}>
      <dt className="block font-mono text-app-label uppercase text-ink-muted">{label}</dt>
      <dd className="m-0 mt-1.5 block font-mono text-[1.9rem] font-medium leading-none tracking-[-0.04em] sm:text-[clamp(1.9rem,2.6vw,2.45rem)] max-sm:mt-0">
        {value}
        {note && <span className="mt-1.5 block font-sans text-app-label font-normal leading-snug tracking-normal text-ink-muted">{note}</span>}
      </dd>
    </div>
  );
}

/** Datos ficticios de ejemplo; nunca representan la operación en vivo. */
export default function StatsBand() {
  const valores = [
    ['Programados', '9'],
    ['En vuelo', '3'],
    ['Cancelados', '1'],
    ['Finalizados', '11'],
    ['Reservas', '3.014', '2.982 confirmadas · 32 canceladas', true],
    ['Ocupación', '78%'],
  ];

  return (
    <section aria-labelledby="landing-stats-title" className="bg-surface-band">
      <div className="landing-stats-grid mx-auto w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))]">
        <div className="landing-stats-intro">
          <h2 id="landing-stats-title" className="landing-stats-title m-0">Operación de hoy</h2>
          <span className="landing-stats-sample">Datos de ejemplo</span>
        </div>
        <dl className="contents m-0">
          {valores.map(([label, value, note, summaryStart]) => (
            <Cifra key={label} label={label} value={value} note={note} summaryStart={summaryStart} />
          ))}
        </dl>
      </div>
    </section>
  );
}
