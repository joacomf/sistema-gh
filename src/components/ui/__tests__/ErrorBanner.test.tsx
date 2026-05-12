import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBanner } from '../ErrorBanner'

describe('ErrorBanner', () => {
  it('no renderiza nada cuando message es null', () => {
    const { container } = render(<ErrorBanner message={null} onDismiss={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('muestra el mensaje de error', () => {
    render(<ErrorBanner message="No se pudo guardar" onDismiss={() => {}} />)
    expect(screen.getByText('No se pudo guardar')).toBeInTheDocument()
  })

  it('llama onDismiss al hacer click en el botón cerrar', () => {
    const onDismiss = jest.fn()
    render(<ErrorBanner message="Error" onDismiss={onDismiss} />)
    fireEvent.click(screen.getByRole('button', { name: /cerrar/i }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
