import Alert from '../components/Alert.jsx';
import PageHeader from '../components/PageHeader.jsx';

/** Punto de entrada de administración. La gestión de vuelos y reservas se implementa en S6. */
export default function AdminHomePage() {
  return (
    <div className="mx-auto w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))] pt-10">
      <PageHeader
        breadcrumb="Tablero / administración"
        title="Administración"
        lead="Gestión de vuelos y reservas del sistema."
      />

      <Alert tone="info" title="La administración se habilita en el próximo tramo" className="mt-8">
        Desde acá vas a poder crear, editar y eliminar vuelos, y consultar o cancelar reservas.
      </Alert>
    </div>
  );
}
