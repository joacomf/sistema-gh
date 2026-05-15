import { render, screen, fireEvent, waitFor } from '@testing-library/react'

jest.mock('../actions', () => ({
  createStockAction: jest.fn(),
  updateStockAction: jest.fn(),
}))

import StockForm from '../components/StockForm'

const proveedores = [{ id: 'p1', nombre: 'Proveedor Test', descuentos: [] }]

describe('StockForm — campo imagen', () => {
  it('muestra el campo URL de imagen', () => {
    render(<StockForm proveedores={proveedores} onSuccess={() => {}} />)
    expect(screen.getByPlaceholderText(/https:\/\//i)).toBeInTheDocument()
  })

  it('pre-carga la imagen si el stock ya tiene una', () => {
    const stock = {
      id: 's1',
      proveedorId: 'p1',
      codigo: 'ABC',
      codigoOriginal: null,
      descripcion: 'Tuerca',
      cantidad: 5,
      cantidadCritica: 2,
      cantidadSugerida: 10,
      precioCosto: 100,
      precioLista: 150,
      precioVenta: 200,
      fechaPedido: null,
      fechaRecibido: null,
      imagen: 'https://example.com/imagen.jpg',
    }
    render(<StockForm stock={stock} proveedores={proveedores} onSuccess={() => {}} />)
    expect(screen.getByDisplayValue('https://example.com/imagen.jpg')).toBeInTheDocument()
  })

  it('envía null cuando se borra la imagen en un stock existente', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({ success: true })
    jest.mocked(require('../actions').updateStockAction).mockImplementation(mockUpdate)

    const stock = {
      id: 's1',
      proveedorId: 'p1',
      codigo: 'ABC',
      codigoOriginal: null,
      descripcion: 'Tuerca',
      cantidad: 5,
      cantidadCritica: 2,
      cantidadSugerida: 10,
      precioCosto: 100,
      precioLista: 150,
      precioVenta: 200,
      fechaPedido: null,
      fechaRecibido: null,
      imagen: 'https://example.com/imagen.jpg',
    }
    render(<StockForm stock={stock} proveedores={proveedores} onSuccess={() => {}} />)
    const imgInput = screen.getByDisplayValue('https://example.com/imagen.jpg')
    fireEvent.change(imgInput, { target: { value: '' } })
    fireEvent.submit(screen.getByRole('button', { name: /guardar/i }).closest('form')!)
    await waitFor(() => expect(mockUpdate).toHaveBeenCalled())
    const callArg = mockUpdate.mock.calls[0][1]
    expect(callArg.imagen).toBeNull()
  })
})
