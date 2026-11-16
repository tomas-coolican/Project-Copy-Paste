import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import Button from './components/Button.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import useAuth from './hooks/useAuth.js';
import AuthLayout from './layouts/AuthLayout.jsx';
import PublicLayout from './layouts/PublicLayout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegistroPage from './pages/RegistroPage.jsx';
import AdminRoute from './routes/AdminRoute.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';

// Provisorio: la landing (S3) y el dashboard (S4) reemplazan estas dos vistas.
function InicioProvisorio() {
  return (
    <section className="mx-auto w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))] py-16">
      <h1 className="m-0 text-app-page font-bold">Vuelos</h1>
      <p className="m-0 mt-2 text-ink-muted">La landing llega en el tramo S3.</p>
    </section>
  );
}

function TableroProvisorio() {
  const { user, logout } = useAuth();

  return (
    <section className="mx-auto w-[min(100%-(var(--spacing-gutter)*2),var(--container-shell))] py-16">
      <h1 className="m-0 text-app-page font-bold">Hola, {user.nombre}</h1>
      <p className="m-0 mt-2 text-ink-muted">Rol: {user.rol}. El dashboard llega en el tramo S4.</p>
      <div className="mt-6 flex gap-3">
        <Button variant="secondary" size="sm" onClick={logout}>
          Cerrar sesión
        </Button>
        <Button as={Link} to="/admin" variant="secondary" size="sm">
          Probar ruta de administración
        </Button>
      </div>
    </section>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<InicioProvisorio />} />
            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<TableroProvisorio />} />
              <Route element={<AdminRoute />}>
                <Route path="admin" element={<TableroProvisorio />} />
              </Route>
            </Route>
          </Route>
          <Route element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="registro" element={<RegistroPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
