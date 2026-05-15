import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CajasList from '../components/CajasList'

const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

jest.mock('../actions', () => ({
  deleteCajaAction: jest.fn(),
}))

const cajas = [
  { id: 'c1', nombre: 'Caja A-1', ubicacion: 'Depósito', _count: { stocks: 3 } },
  { id: 'c2', nombre: 'Caja B-2', ubicacion: 'Estante', _count: { stocks: 0 } },
]

describe('CajasList', () => {
  it('renderiza las cajas', () => {
    render(<CajasList cajas={cajas} selectedId={null} onSelect={() => {}} onEdit={() => {}} />)
    expect(screen.getByText('Caja A-1')).toBeInTheDocument()
    expect(screen.getByText('Caja B-2')).toBeInTheDocument()
    expect(screen.getByText('Depósito')).toBeInTheDocument()
  })

  it('muestra el conteo de artículos', () => {
    render(<CajasList cajas={cajas} selectedId={null} onSelect={() => {}} onEdit={() => {}} />)
    expect(screen.getByText('3 art.')).toBeInTheDocument()
  })

  it('llama onSelect al hacer click en una caja', () => {
    const onSelect = jest.fn()
    render(<CajasList cajas={cajas} selectedId={null} onSelect={onSelect} onEdit={() => {}} />)
    fireEvent.click(screen.getByText('Caja A-1'))
    expect(onSelect).toHaveBeenCalledWith('c1')
  })

  it('llama onEdit al hacer click en el botón editar', () => {
    const onEdit = jest.fn()
    render(<CajasList cajas={cajas} selectedId={null} onSelect={() => {}} onEdit={onEdit} />)
    fireEvent.click(screen.getByLabelText('Editar Caja A-1'))
    expect(onEdit).toHaveBeenCalledWith(cajas[0])
  })

  it('muestra estado vacío cuando no hay cajas', () => {
    render(<CajasList cajas={[]} selectedId={null} onSelect={() => {}} onEdit={() => {}} />)
    expect(screen.getByText(/no se encontraron cajas/i)).toBeInTheDocument()
  })

  it('llama deleteCajaAction al confirmar eliminación', async () => {
    const { deleteCajaAction } = require('../actions')
    ;(deleteCajaAction as jest.Mock).mockResolvedValue({ success: true })
    render(<CajasList cajas={cajas} selectedId={null} onSelect={() => {}} onEdit={() => {}} />)
    fireEvent.click(screen.getByLabelText('Eliminar Caja A-1'))
    // ConfirmDialog should be visible
    const confirmBtn = await screen.findByRole('button', { name: /eliminar/i })
    fireEvent.click(confirmBtn)
    await waitFor(() => expect(deleteCajaAction).toHaveBeenCalledWith('c1'))
  })
})
