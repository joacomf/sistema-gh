import { render, screen, fireEvent } from '@testing-library/react'
import { ConfirmDialog } from '../ConfirmDialog'

describe('ConfirmDialog', () => {
  it('no muestra contenido cuando está cerrado', () => {
    render(
      <ConfirmDialog
        open={false}
        title="¿Eliminar?"
        description="Esta acción no se puede deshacer."
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )
    expect(screen.queryByText('¿Eliminar?')).not.toBeInTheDocument()
  })

  it('muestra título y descripción cuando está abierto', () => {
    render(
      <ConfirmDialog
        open
        title="¿Eliminar?"
        description="Esta acción no se puede deshacer."
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )
    expect(screen.getByText('¿Eliminar?')).toBeInTheDocument()
    expect(screen.getByText('Esta acción no se puede deshacer.')).toBeInTheDocument()
  })

  it('llama onConfirm al hacer click en el botón de confirmación', () => {
    const onConfirm = jest.fn()
    render(
      <ConfirmDialog
        open
        title="¿Eliminar?"
        description="Desc"
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('llama onCancel al hacer click en Cancelar', () => {
    const onCancel = jest.fn()
    render(
      <ConfirmDialog
        open
        title="¿Eliminar?"
        description="Desc"
        onConfirm={() => {}}
        onCancel={onCancel}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('usa confirmLabel personalizado', () => {
    render(
      <ConfirmDialog
        open
        title="T"
        description="D"
        confirmLabel="Eliminar de todos modos"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )
    expect(screen.getByRole('button', { name: /eliminar de todos modos/i })).toBeInTheDocument()
  })
})
