import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import PublicLayout from './layouts/PublicLayout.jsx';
import AdminHomePage from './pages/AdminHomePage.jsx';
import DashboardHomePage from './pages/DashboardHomePage.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MisReservasPage from './pages/MisReservasPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';
import RegistroPage from './pages/RegistroPage.jsx';
import VueloDetallePage from './pages/VueloDetallePage.jsx';
import VuelosPage from './pages/VuelosPage.jsx';
import AdminRoute from './routes/AdminRoute.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route index element={<LandingPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          <Route element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="registro" element={<RegistroPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="dashboard" element={<DashboardHomePage />} />
              <Route path="dashboard/vuelos" element={<VuelosPage />} />
              <Route path="dashboard/vuelos/:id" element={<VueloDetallePage />} />
              <Route path="dashboard/reservas" element={<MisReservasPage />} />
              <Route path="*" element={<NotFoundPage />} />
              <Route element={<AdminRoute />}>
                <Route path="admin" element={<AdminHomePage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
