import { render, screen, fireEvent } from '@testing-library/react'
import ArticulosDeCaja from '../components/ArticulosDeCaja'

jest.mock('../actions', () => ({
  removeStockDeCajaAction: jest.fn(),
}))

const articulos = [
  {
    stockId: 's1',
    stock: { id: 's1', codigo: 'TM8-30', descripcion: 'Tornillo M8', cantidad: 10, proveedor: { nombre: 'Ferretería Norte' } },
  },
  {
    stockId: 's2',
    stock: { id: 's2', codigo: 'PRN-A4', descripcion: 'Perno A4', cantidad: 5, proveedor: { nombre: 'Ferretería Norte' } },
  },
]

describe('ArticulosDeCaja', () => {
  it('renderiza los artículos de la caja', () => {
    render(<ArticulosDeCaja cajaId="c1" articulos={articulos} onAsignar={() => {}} />)
    expect(screen.getByText('Tornillo M8')).toBeInTheDocument()
    expect(screen.getByText('Perno A4')).toBeInTheDocument()
    expect(screen.getByText('TM8-30')).toBeInTheDocument()
  })

  it('filtra artículos por búsqueda de texto', () => {
    render(<ArticulosDeCaja cajaId="c1" articulos={articulos} onAsignar={() => {}} />)
    fireEvent.change(screen.getByPlaceholderText('Buscar artículo...'), { target: { value: 'Tornillo' } })
    expect(screen.getByText('Tornillo M8')).toBeInTheDocument()
    expect(screen.queryByText('Perno A4')).not.toBeInTheDocument()
  })

  it('muestra estado vacío cuando no hay artículos', () => {
    render(<ArticulosDeCaja cajaId="c1" articulos={[]} onAsignar={() => {}} />)
    expect(screen.getByText(/no tiene artículos asignados/i)).toBeInTheDocument()
  })

  it('llama onAsignar al hacer click en el botón Asignar', () => {
    const onAsignar = jest.fn()
    render(<ArticulosDeCaja cajaId="c1" articulos={articulos} onAsignar={onAsignar} />)
    fireEvent.click(screen.getByRole('button', { name: /asignar/i }))
    expect(onAsignar).toHaveBeenCalled()
  })
})
