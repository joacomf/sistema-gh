import { render, screen, fireEvent } from '@testing-library/react'
import { ModalReposicion } from '../components/ModalReposicion'

const items = [
  { stockId: 'a1', descripcion: 'Tuerca M8', cantidadSugerida: 10 },
  { stockId: 'b2', descripcion: 'Perno A4',  cantidadSugerida: 5  },
]

describe('ModalReposicion', () => {
  it('muestra todos los artículos vendidos', () => {
    render(<ModalReposicion items={items} onConfirm={() => {}} onSkip={() => {}} loading={false} />)
    expect(screen.getByText('Tuerca M8')).toBeInTheDocument()
    expect(screen.getByText('Perno A4')).toBeInTheDocument()
  })

  it('todos los checkboxes están marcados por defecto', () => {
    render(<ModalReposicion items={items} onConfirm={() => {}} onSkip={() => {}} loading={false} />)
    const checkboxes = screen.getAllByRole('checkbox')
    checkboxes.forEach(cb => expect(cb).toBeChecked())
  })

  it('llama a onConfirm solo con los ítems chequeados', () => {
    const onConfirm = jest.fn()
    render(<ModalReposicion items={items} onConfirm={onConfirm} onSkip={() => {}} loading={false} />)

    // Desmarcar el primero
    const checkboxes = screen.getAllByRole('checkbox')
    fireEvent.click(checkboxes[0])

    fireEvent.click(screen.getByRole('button', { name: /agregar al pedido/i }))
    expect(onConfirm).toHaveBeenCalledWith([
      { stockId: 'b2', cantidad: 5 },
    ])
  })

  it('llama a onSkip al hacer click en Omitir', () => {
    const onSkip = jest.fn()
    render(<ModalReposicion items={items} onConfirm={() => {}} onSkip={onSkip} loading={false} />)
    fireEvent.click(screen.getByRole('button', { name: /omitir/i }))
    expect(onSkip).toHaveBeenCalled()
  })
})
