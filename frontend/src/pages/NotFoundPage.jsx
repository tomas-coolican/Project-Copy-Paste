import { Link } from 'react-router-dom';
import Button from '../components/Button.jsx';
import PageHeader from '../components/PageHeader.jsx';

export default function NotFoundPage() {
  return (
    <div className="mx-auto w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))] py-16">
      <PageHeader
        breadcrumb="Sistema / 404"
        title="Página no encontrada"
        lead="La dirección que abriste no existe o cambió de lugar."
        actions={
          <>
            <Button as={Link} to="/" variant="secondary">
              Volver a la landing
            </Button>
            <Button as={Link} to="/dashboard" icon="arrow">
              Abrir tablero
            </Button>
          </>
        }
      />
    </div>
  );
}
