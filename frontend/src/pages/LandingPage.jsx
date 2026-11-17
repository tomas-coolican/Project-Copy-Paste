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
import useAuth from '../hooks/useAuth.js';
import { primeroOperativo, proximasSalidas, resumirVuelos } from '../utils/vuelos.js';

/**
 * Landing pública con los vuelos reales de la API (GET /api/vuelos es público).
 * El tablero muestra cada vuelo en "Salidas" y en "Llegadas"; el pase y la ficha destacan
 * la próxima salida programada. Sin datos ficticios: si la API falla, cada sección lo indica.
 */
export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const { hash } = useLocation();
  const { data: vuelos, error, loading, retrying, updatedAt, reload } = useAsync(vuelosApi.listar);
  const ahora = useMemo(() => updatedAt ?? new Date(), [updatedAt]);

  // Cada vuelo aparece en las dos pestañas del tablero (la pestaña filtra por `tipo`).
  const tablero = useMemo(
    () =>
      vuelos?.flatMap((vuelo) => [
        { ...vuelo, id: `salida-${vuelo.id}`, tipo: 'salidas' },
        { ...vuelo, id: `llegada-${vuelo.id}`, tipo: 'llegadas' },
      ]) ?? null,
    [vuelos],
  );

  const destacado = useMemo(
    () => (vuelos ? primeroOperativo(proximasSalidas(vuelos, ahora).filter((v) => v.estado === 'Programado')) : null),
    [vuelos, ahora],
  );

  const resumen = useMemo(() => (vuelos ? resumirVuelos(vuelos, ahora) : null), [vuelos, ahora]);

  // Al entrar con #seccion (recarga o enlace directo) el contenido aún no existía: ir a la ancla.
  useEffect(() => {
    if (!hash) return;
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  }, [hash]);

  return (
    <>
      <Hero destacado={destacado} isAuthenticated={isAuthenticated} />
      <StatsBand resumen={resumen} actualizado={updatedAt} />
      <DeparturesBoard
        vuelos={tablero}
        ahora={ahora}
        actualizado={updatedAt}
        loading={loading}
        error={error}
        retrying={retrying}
        onRetry={reload}
      />
      <TicketSection vuelo={destacado} loading={loading && !vuelos} />
      <Features />
      <Closing isAuthenticated={isAuthenticated} />
      <SiteFooter />
    </>
  );
}
