import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import Paginacion from './Paginacion.jsx';

function renderizar(props = {}) {
  const onCambiar = vi.fn();
  render(<Paginacion pagina={1} totalPaginas={3} total={25} tamanio={10} onCambiar={onCambiar} {...props} />);
  return onCambiar;
}

describe('<Paginacion />', () => {
  it('no se muestra si todo entra en una página', () => {
    const { container } = render(
      <Paginacion pagina={1} totalPaginas={1} total={4} tamanio={10} onCambiar={() => {}} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('muestra el rango de elementos visibles', () => {
    renderizar({ pagina: 3 });

    expect(screen.getByText('Mostrando 21–25 de 25')).toBeInTheDocument();
  });

  it('marca la página actual', () => {
    renderizar({ pagina: 2 });

    expect(screen.getByRole('button', { name: 'Página 2' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Página 1' })).not.toHaveAttribute('aria-current');
  });

  it('en la primera página no deja ir hacia atrás', () => {
    renderizar({ pagina: 1 });

    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeEnabled();
  });

  it('en la última página no deja avanzar', () => {
    renderizar({ pagina: 3 });

    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled();
  });

  it('avisa la página elegida', async () => {
    const usuario = userEvent.setup();
    const onCambiar = renderizar({ pagina: 1 });

    await usuario.click(screen.getByRole('button', { name: 'Página siguiente' }));
    await usuario.click(screen.getByRole('button', { name: 'Página 3' }));

    expect(onCambiar).toHaveBeenNthCalledWith(1, 2);
    expect(onCambiar).toHaveBeenNthCalledWith(2, 3);
  });
});
