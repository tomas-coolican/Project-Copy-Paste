import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Closing from '../components/landing/Closing.jsx';
import DeparturesBoard from '../components/landing/DeparturesBoard.jsx';
import Features from '../components/landing/Features.jsx';
import Hero from '../components/landing/Hero.jsx';
import SiteFooter from '../components/landing/SiteFooter.jsx';
import StatsBand from '../components/landing/StatsBand.jsx';
import TicketSection from '../components/landing/TicketSection.jsx';
import useAuth from '../hooks/useAuth.js';
import { DEMO_FLIGHTS, DEMO_HERO_FLIGHT, DEMO_NOW, DEMO_UPDATED_AT } from '../components/landing/sampleFlights.js';

/**
 * Landing pública con cifras y vuelos ficticios del prototipo. La aplicación consume la API en
 * sus secciones operativas, fuera de esta página de presentación.
 */
export default function LandingPage() {
  const { isAuthenticated } = useAuth();
  const { hash } = useLocation();

  // Al entrar con #seccion (recarga o enlace directo) el contenido aún no existía: ir a la ancla.
  useEffect(() => {
    if (!hash) return;
    document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView();
  }, [hash]);

  return (
    <>
      <Hero destacado={DEMO_HERO_FLIGHT} isAuthenticated={isAuthenticated} />
      <StatsBand />
      <DeparturesBoard
        vuelos={DEMO_FLIGHTS}
        ahora={DEMO_NOW}
        actualizado={DEMO_UPDATED_AT}
      />
      <TicketSection vuelo={DEMO_HERO_FLIGHT} />
      <Features />
      <Closing isAuthenticated={isAuthenticated} />
      <SiteFooter />
    </>
  );
}
