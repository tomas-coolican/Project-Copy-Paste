import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import vuelosApi from '../api/vuelosApi.js';
import Closing from '../components/landing/Closing.jsx';
import DeparturesBoard from '../components/landing/DeparturesBoard.jsx';
import Features from '../components/landing/Features.jsx';
import Hero from '../components/landing/Hero.jsx';
import SiteFooter from '../components/landing/SiteFooter.jsx';
import StatsBand from '../components/landing/StatsBand.jsx';
import TicketSection from '../components/landing/TicketSection.jsx';
import useAsync from '../hooks/useAsync.js';
import { primeroOperativo, proximasSalidas, resumirVuelos } from '../utils/vuelos.js';

/**
 * Landing pública. Una sola lectura de GET /api/vuelos alimenta el hero, las cifras, el tablero
 * y el ticket destacado. Solo el tablero muestra error (con "Reintentar"); el resto se omite o
 * queda en "—" cuando no hay datos, así la página se ve completa con la API caída.
 */
export default function LandingPage() {
  const { data: vuelos, error, loading, retrying, updatedAt, reload } = useAsync(vuelosApi.listar);
  const { hash } = useLocation();

  // Al entrar con #seccion (recarga o enlace directo) el contenido aún no existía: ir a la ancla.
  useEffect(() => {
    if (!hash) return;
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  }, [hash]);

  const resumen = useMemo(() => (vuelos ? resumirVuelos(vuelos, updatedAt) : null), [vuelos, updatedAt]);
  const destacado = useMemo(
    () => (vuelos ? primeroOperativo(proximasSalidas(vuelos, updatedAt).filter((v) => v.estado === 'Programado')) : null),
    [vuelos, updatedAt],
  );

  return (
    <>
      <Hero destacado={destacado} programados={resumen?.programados ?? null} actualizado={updatedAt} />
      <StatsBand resumen={resumen} />
      <DeparturesBoard
        vuelos={vuelos}
        ahora={updatedAt}
        actualizado={updatedAt}
        loading={loading}
        error={error}
        retrying={retrying}
        onRetry={reload}
      />
      <TicketSection vuelo={destacado} loading={loading && !vuelos} />
      <Features />
      <Closing />
      <SiteFooter />
    </>
  );
}
