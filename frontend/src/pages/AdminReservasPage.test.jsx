import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminReservasPage from './AdminReservasPage.jsx';
import reservasApi from '../api/reservasApi.js';

// La API se reemplaza por funciones falsas: se prueba la pantalla, no el backend.
vi.mock('../api/reservasApi.js', () => ({
  default: { buscar: vi.fn(), cancelar: vi.fn() },
}));
vi.mock('../api/vuelosApi.js', () => ({
  default: { listar: vi.fn(() => Promise.resolve([])) },
}));

const TOTAL = 25;

function reserva(id) {
  return {
    id,
    estado: 'Confirmada',
    fechaReserva: new Date(Date.UTC(2026, 10, 1, 12, id)),
    precioPagado: 48000,
    vueloId: 1,
    numeroVuelo: 'AR1100',
    numeroAsiento: String(id).padStart(2, '0'),
    nombrePasajero: `Pasajero ${id}`,
    origen: 'Buenos Aires',
    destino: 'Córdoba',
    fechaSalida: new Date(Date.UTC(2026, 11, 1, 10)),
  };
}

// Responde como el backend: la página pedida y el total sin paginar.
function buscarFalso({ pagina, tamanio }) {
  const desde = (pagina - 1) * tamanio;
  const ids = Array.from({ length: Math.max(0, Math.min(tamanio, TOTAL - desde)) }, (_, i) => TOTAL - desde - i);
  return Promise.resolve({ items: ids.map(reserva), total: TOTAL });
}

function renderizar() {
  return render(
    <MemoryRouter initialEntries={['/admin/reservas']}>
      <AdminReservasPage />
    </MemoryRouter>,
  );
}

describe('<AdminReservasPage /> (paginación en el servidor)', () => {
  beforeEach(() => {
    reservasApi.buscar.mockReset();
    reservasApi.buscar.mockImplementation(buscarFalso);
  });

  it('pide la primera página y muestra el total que informa el servidor', async () => {
    renderizar();

    expect(await screen.findByText('Mostrando 1–10 de 25')).toBeInTheDocument();
    expect(screen.getByText('25 reservas')).toBeInTheDocument();
    expect(reservasApi.buscar).toHaveBeenCalledWith({ pagina: 1, tamanio: 10, estado: '', vueloId: '' });
  });

  it('al cambiar de página pide esa página al servidor', async () => {
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText('Mostrando 1–10 de 25');

    await usuario.click(screen.getByRole('button', { name: 'Página 3' }));

    expect(await screen.findByText('Mostrando 21–25 de 25')).toBeInTheDocument();
    expect(reservasApi.buscar).toHaveBeenLastCalledWith({ pagina: 3, tamanio: 10, estado: '', vueloId: '' });
  });

  it('al filtrar vuelve a la primera página con el filtro aplicado', async () => {
    const usuario = userEvent.setup();
    renderizar();
    await screen.findByText('Mostrando 1–10 de 25');
    await usuario.click(screen.getByRole('button', { name: 'Página 2' }));
    await screen.findByText('Mostrando 11–20 de 25');

    await usuario.selectOptions(screen.getByLabelText('Estado'), 'Cancelada');

    expect(await screen.findByText('25 reservas con estos filtros')).toBeInTheDocument();
    expect(reservasApi.buscar).toHaveBeenLastCalledWith({ pagina: 1, tamanio: 10, estado: 'Cancelada', vueloId: '' });
  });
});
