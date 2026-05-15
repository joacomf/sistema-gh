import { render, screen } from '@testing-library/react'
import DetalleArticulo from '../components/DetalleArticulo'

const articulo = {
  id: 's1',
  codigo: 'TM8-30',
  codigoOriginal: 'ORI-123',
  descripcion: 'Tornillo M8 x 30',
  cantidad: 45,
  cantidadCritica: 10,
  cantidadSugerida: 20,
  fechaPedido: '2026-03-01T00:00:00.000Z',
  fechaRecibido: '2026-03-15T00:00:00.000Z',
  precioCosto: 120,
  precioLista: 180,
  precioVenta: 200,
  imagen: null,
  proveedor: { nombre: 'Ferretería Norte' },
  cajas: [
    { cajaId: 'c1', caja: { id: 'c1', nombre: 'Caja A-1', ubicacion: 'Depósito Planta' } },
  ],
}

describe('DetalleArticulo', () => {
  it('muestra descripción, código y proveedor', () => {
    render(<DetalleArticulo articulo={articulo} />)
    expect(screen.getByText('Tornillo M8 x 30')).toBeInTheDocument()
    expect(screen.getByText(/TM8-30/)).toBeInTheDocument()
    expect(screen.getByText(/Ferretería Norte/)).toBeInTheDocument()
  })

  it('muestra las cantidades', () => {
    render(<DetalleArticulo articulo={articulo} />)
    expect(screen.getByText('45')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
  })

  it('muestra las cajas asignadas', () => {
    render(<DetalleArticulo articulo={articulo} />)
    expect(screen.getByText(/Caja A-1/)).toBeInTheDocument()
    expect(screen.getByText(/Depósito Planta/)).toBeInTheDocument()
  })

  it('muestra mensaje cuando no tiene cajas asignadas', () => {
    render(<DetalleArticulo articulo={{ ...articulo, cajas: [] }} />)
    expect(screen.getByText(/sin cajas asignadas/i)).toBeInTheDocument()
  })

  it('muestra placeholder cuando no hay imagen', () => {
    render(<DetalleArticulo articulo={articulo} />)
    expect(screen.queryByRole('img', { name: 'Tornillo M8 x 30' })).not.toBeInTheDocument()
  })
})
