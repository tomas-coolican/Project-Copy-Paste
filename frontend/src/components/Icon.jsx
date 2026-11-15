const SIZES = {
  12: 'size-3',
  16: 'size-4',
  20: 'size-5',
  24: 'size-6',
};

// Dibujos de línea de 1.5 px, sin glifos unicode ni emoji. Heredan currentColor.
const PATHS = {
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5" />
      <path d="M12 7.5v.01" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.3 2.8 2.8L16.2 9.5" />
    </>
  ),
  warning: (
    <>
      <path d="M12 4 21 19.5H3z" />
      <path d="M12 10v4.5" />
      <path d="M12 17v.01" />
    </>
  ),
  danger: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 12a8 8 0 1 1-2.6-5.9" />
      <path d="M20 4v4.5h-4.5" />
    </>
  ),
  arrow: <path d="M4 12h15m-5.5-5.5L19 12l-5.5 5.5" />,
  empty: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12h7" />
    </>
  ),
  chevron: <path d="m6 9 6 6 6-6" />,
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  'eye-off': (
    <>
      <path d="M4 4l16 16" />
      <path d="M9.9 5.8A9.3 9.3 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3 3.8M6.4 7.6A16 16 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 3.6-.8" />
      <path d="M10 10a2.8 2.8 0 0 0 4 4" />
    </>
  ),
  spinner: <path d="M12 3a9 9 0 1 0 9 9" />,
};

export default function Icon({ name, size = 16, className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`${SIZES[size]} shrink-0 ${className}`}
    >
      {PATHS[name]}
    </svg>
  );
}
