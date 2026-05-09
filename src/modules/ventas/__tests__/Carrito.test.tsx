import { render, screen, fireEvent } from '@testing-library/react'
import { Carrito } from '../components/Carrito'

const items = [
  { stockId: 'a1', codigo: 'TRC-M8', descripcion: 'Tuerca M8', cantidad: 2, precioCosto: 80, precioUnitario: 120, subtotal: 240 },
  { stockId: 'b2', codigo: 'PRN-A4', descripcion: 'Perno A4',  cantidad: 3, precioCosto: 60, precioUnitario: 85,  subtotal: 255 },
]

const noop = () => {}

describe('Carrito', () => {
  it('muestra los ítems del carrito', () => {
    render(<Carrito items={items} onUpdateCantidad={noop} onUpdatePrecio={noop} onRemove={noop} />)
    expect(screen.getByText('Tuerca M8')).toBeInTheDocument()
    expect(screen.getByText('Perno A4')).toBeInTheDocument()
  })

  it('muestra la cantidad editable de cada ítem', () => {
    render(<Carrito items={items} onUpdateCantidad={noop} onUpdatePrecio={noop} onRemove={noop} />)
    expect(screen.getByDisplayValue('2')).toBeInTheDocument()
    expect(screen.getByDisplayValue('3')).toBeInTheDocument()
  })

  it('llama a onUpdateCantidad cuando cambia la cantidad', () => {
    const onUpdate = jest.fn()
    render(<Carrito items={items} onUpdateCantidad={onUpdate} onUpdatePrecio={noop} onRemove={noop} />)
    fireEvent.change(screen.getByDisplayValue('2'), { target: { value: '5' } })
    expect(onUpdate).toHaveBeenCalledWith('a1', 5)
  })

  it('llama a onRemove con el stockId correcto', () => {
    const onRemove = jest.fn()
    render(<Carrito items={items} onUpdateCantidad={noop} onUpdatePrecio={noop} onRemove={onRemove} />)
    const btns = screen.getAllByRole('button')
    fireEvent.click(btns[btns.length - 1])
    expect(onRemove).toHaveBeenCalledWith('b2')
  })

  it('muestra estado vacío cuando no hay ítems', () => {
    render(<Carrito items={[]} onUpdateCantidad={noop} onUpdatePrecio={noop} onRemove={noop} />)
    expect(screen.getByText(/no hay artículos/i)).toBeInTheDocument()
  })
})
