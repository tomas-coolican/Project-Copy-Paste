import { useEffect, useRef, useState } from 'react';

/** Devuelve [ref, visible]: `visible` pasa a true una sola vez cuando el elemento entra en pantalla. */
export default function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    const elemento = ref.current;
    if (visible || !elemento) return undefined;

    const observer = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(elemento);
    return () => observer.disconnect();
  }, [visible]);

  return [ref, visible];
}
