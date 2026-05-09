import { render, screen, fireEvent } from '@testing-library/react'
import { SelectorMetodoPago } from '../components/SelectorMetodoPago'

describe('SelectorMetodoPago', () => {
  const noop = () => {}

  it('renderiza los 4 métodos de pago', () => {
    render(<SelectorMetodoPago value="EFECTIVO" onChange={noop} recargo={10} />)
    expect(screen.getByText('Efectivo')).toBeInTheDocument()
    expect(screen.getByText('Débito')).toBeInTheDocument()
    expect(screen.getByText('Crédito')).toBeInTheDocument()
    expect(screen.getByText('Mercado Pago')).toBeInTheDocument()
  })

  it('llama a onChange con el valor correcto al hacer click', () => {
    const onChange = jest.fn()
    render(<SelectorMetodoPago value="EFECTIVO" onChange={onChange} recargo={10} />)
    fireEvent.click(screen.getByText('Débito'))
    expect(onChange).toHaveBeenCalledWith('DEBITO')
  })

  it('no llama a onChange si el método ya está activo', () => {
    const onChange = jest.fn()
    render(<SelectorMetodoPago value="EFECTIVO" onChange={onChange} recargo={10} />)
    fireEvent.click(screen.getByText('Efectivo'))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('muestra el aviso de recargo solo cuando CREDITO está activo', () => {
    const { rerender } = render(
      <SelectorMetodoPago value="EFECTIVO" onChange={noop} recargo={10} />
    )
    expect(screen.queryByText(/recargo/i)).not.toBeInTheDocument()

    rerender(<SelectorMetodoPago value="CREDITO" onChange={noop} recargo={10} />)
    expect(screen.getByText(/recargo/i)).toBeInTheDocument()
    expect(screen.getByText(/10%/)).toBeInTheDocument()
  })
})
