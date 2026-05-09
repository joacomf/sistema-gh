import { render, screen, fireEvent } from '@testing-library/react'
import { ModalDetalleVenta } from '../components/ModalDetalleVenta'

const venta = {
  id: 'v1',
  descripcion: 'Tuerca M8, Perno A4 (2 art.)',
  importe: 495,
  metodoPago: 'EFECTIVO' as const,
  facturada: false,
  fecha: new Date('2026-05-08T10:30:00'),
  items: [
    { id: 'i1', ventaId: 'v1', stockId: 'a1', descripcion: 'Tuerca M8', cantidad: 2, precioUnitario: 120, subtotal: 240 },
    { id: 'i2', ventaId: 'v1', stockId: 'b2', descripcion: 'Perno A4',  cantidad: 3, precioUnitario: 85,  subtotal: 255 },
  ],
}

describe('ModalDetalleVenta', () => {
  it('muestra la descripción de la venta', () => {
    render(<ModalDetalleVenta venta={venta} onClose={() => {}} />)
    expect(screen.getByText('Tuerca M8, Perno A4 (2 art.)')).toBeInTheDocument()
  })

  it('muestra todos los artículos de la venta', () => {
    render(<ModalDetalleVenta venta={venta} onClose={() => {}} />)
    expect(screen.getByText('Tuerca M8')).toBeInTheDocument()
    expect(screen.getByText('Perno A4')).toBeInTheDocument()
  })

  it('llama a onClose al hacer click en el botón de cierre', () => {
    const onClose = jest.fn()
    render(<ModalDetalleVenta venta={venta} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onClose).toHaveBeenCalled()
  })
})
