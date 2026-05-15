import { render, screen, fireEvent } from '@testing-library/react'
import ResultadosBusqueda from '../components/ResultadosBusqueda'

const resultados = [
  { id: 's1', codigo: 'TM8-30', descripcion: 'Tornillo M8 x 30', proveedor: { nombre: 'Ferretería Norte' }, cantidad: 45 },
  { id: 's2', codigo: 'PRN-A4', descripcion: 'Perno A4', proveedor: { nombre: 'Ferretería Sur' }, cantidad: 12 },
]

describe('ResultadosBusqueda', () => {
  it('renderiza todos los resultados', () => {
    render(<ResultadosBusqueda resultados={resultados} onSelect={() => {}} />)
    expect(screen.getByText('Tornillo M8 x 30')).toBeInTheDocument()
    expect(screen.getByText('Perno A4')).toBeInTheDocument()
  })

  it('llama onSelect con el id correcto al hacer click', () => {
    const onSelect = jest.fn()
    render(<ResultadosBusqueda resultados={resultados} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Tornillo M8 x 30'))
    expect(onSelect).toHaveBeenCalledWith('s1')
  })
})
