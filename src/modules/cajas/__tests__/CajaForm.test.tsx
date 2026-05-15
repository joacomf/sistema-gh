import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CajaForm from '../components/CajaForm'
import * as actions from '../actions'

jest.mock('../actions', () => ({
  createCajaAction: jest.fn(),
  updateCajaAction: jest.fn(),
}))

describe('CajaForm', () => {
  const onSuccess = jest.fn()

  beforeEach(() => jest.clearAllMocks())

  it('renderiza campos nombre y ubicación', () => {
    render(<CajaForm onSuccess={onSuccess} />)
    expect(screen.getByPlaceholderText('Ej: Caja A-1')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Ej: Depósito Planta Baja')).toBeInTheDocument()
  })

  it('llama createCajaAction al guardar caja nueva', async () => {
    ;(actions.createCajaAction as jest.Mock).mockResolvedValue({ success: true, data: {} })
    render(<CajaForm onSuccess={onSuccess} />)
    fireEvent.change(screen.getByPlaceholderText('Ej: Caja A-1'), { target: { value: 'Caja X' } })
    fireEvent.change(screen.getByPlaceholderText('Ej: Depósito Planta Baja'), { target: { value: 'Depósito' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    await waitFor(() =>
      expect(actions.createCajaAction).toHaveBeenCalledWith({ nombre: 'Caja X', ubicacion: 'Depósito' })
    )
    expect(onSuccess).toHaveBeenCalled()
  })

  it('muestra error si la acción falla', async () => {
    ;(actions.createCajaAction as jest.Mock).mockResolvedValue({ success: false, error: 'Error de red' })
    render(<CajaForm onSuccess={onSuccess} />)
    fireEvent.change(screen.getByPlaceholderText('Ej: Caja A-1'), { target: { value: 'X' } })
    fireEvent.change(screen.getByPlaceholderText('Ej: Depósito Planta Baja'), { target: { value: 'Y' } })
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    await waitFor(() => expect(screen.getByText('Error de red')).toBeInTheDocument())
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('llama updateCajaAction al editar caja existente', async () => {
    ;(actions.updateCajaAction as jest.Mock).mockResolvedValue({ success: true, data: {} })
    const caja = { id: 'abc', nombre: 'Caja A', ubicacion: 'Depósito' }
    render(<CajaForm caja={caja} onSuccess={onSuccess} />)
    expect(screen.getByDisplayValue('Caja A')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /guardar/i }))
    await waitFor(() =>
      expect(actions.updateCajaAction).toHaveBeenCalledWith('abc', { nombre: 'Caja A', ubicacion: 'Depósito' })
    )
  })
})
