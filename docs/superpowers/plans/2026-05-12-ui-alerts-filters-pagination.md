# UI: Alerts, Filtros y Paginación — Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar todos los `alert()`/`confirm()` del sistema por componentes propios; rediseñar la página de Pedidos con formulario inline y filtros client-side; agregar filtros server-side y paginación (20 registros) a Facturas y Stock.

**Architecture:** Dos componentes UI compartidos (`ErrorBanner`, `ConfirmDialog`) se crean primero y luego se adoptan en todos los módulos. Las páginas de Facturas y Stock migran a server-side filtering con `searchParams` en la URL como estado. Pedidos usa client-side filtering sobre datos ya cargados.

**Tech Stack:** Next.js 16 App Router, Radix UI Dialog, Prisma, React 19, Tailwind CSS, Jest + Testing Library.

---

## Mapa de archivos

| Archivo | Acción |
|---------|--------|
| `src/components/ui/ErrorBanner.tsx` | Crear |
| `src/components/ui/__tests__/ErrorBanner.test.tsx` | Crear |
| `src/components/ui/ConfirmDialog.tsx` | Crear |
| `src/components/ui/__tests__/ConfirmDialog.test.tsx` | Crear |
| `src/modules/pedidos/components/RepuestosAPedir.tsx` | Modificar |
| `src/modules/pedidos/components/RepuestosPedidos.tsx` | Modificar |
| `src/modules/pedidos/components/NuevoPedidoForm.tsx` | Eliminar |
| `src/app/dashboard/pedidos/PedidosPageClient.tsx` | Reescribir |
| `src/app/dashboard/pedidos/page.tsx` | Modificar |
| `src/modules/stock/components/StockList.tsx` | Modificar |
| `src/modules/stock/components/StockForm.tsx` | Modificar |
| `src/app/dashboard/recepcion/RecepcionPageClient.tsx` | Modificar |
| `src/modules/proveedores/components/ProveedoresList.tsx` | Modificar |
| `src/modules/proveedores/components/ProveedorForm.tsx` | Modificar |
| `src/repositories/factura.repository.ts` | Modificar |
| `src/modules/facturas/actions.ts` | Modificar |
| `src/app/dashboard/facturas/FacturasPageClient.tsx` | Reescribir |
| `src/app/dashboard/facturas/page.tsx` | Modificar |
| `src/repositories/stock.repository.ts` | Modificar |
| `src/modules/stock/actions.ts` | Modificar |
| `src/app/dashboard/stock/StockPageClient.tsx` | Modificar |
| `src/app/dashboard/stock/page.tsx` | Modificar |

---

## Task 1: Componente ErrorBanner

**Files:**
- Create: `src/components/ui/ErrorBanner.tsx`
- Create: `src/components/ui/__tests__/ErrorBanner.test.tsx`

- [ ] **Step 1: Escribir el test que falla**

Crear `src/components/ui/__tests__/ErrorBanner.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Verificar que el test falla**

```bash
npm test -- --testPathPattern="ErrorBanner" --no-coverage
```

Resultado esperado: FAIL — `Cannot find module '../ErrorBanner'`

- [ ] **Step 3: Implementar el componente**

Crear `src/components/ui/ErrorBanner.tsx`:

```tsx
"use client"

type Props = {
  message: string | null
  onDismiss: () => void
}

export function ErrorBanner({ message, onDismiss }: Props) {
  if (!message) return null
  return (
    <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar"
        className="text-red-400 hover:text-red-600 transition-colors font-bold leading-none"
      >
        ×
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Verificar que el test pasa**

```bash
npm test -- --testPathPattern="ErrorBanner" --no-coverage
```

Resultado esperado: PASS — 3 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/ErrorBanner.tsx src/components/ui/__tests__/ErrorBanner.test.tsx
git commit -m "feat: componente ErrorBanner para reemplazar alert() de error"
```

---

## Task 2: Componente ConfirmDialog

**Files:**
- Create: `src/components/ui/ConfirmDialog.tsx`
- Create: `src/components/ui/__tests__/ConfirmDialog.test.tsx`

- [ ] **Step 1: Escribir el test que falla**

Crear `src/components/ui/__tests__/ConfirmDialog.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Verificar que el test falla**

```bash
npm test -- --testPathPattern="ConfirmDialog" --no-coverage
```

Resultado esperado: FAIL — `Cannot find module '../ConfirmDialog'`

- [ ] **Step 3: Implementar el componente**

Crear `src/components/ui/ConfirmDialog.tsx`:

```tsx
"use client"

import * as Dialog from "@radix-ui/react-dialog"

type Props = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={isOpen => { if (!isOpen) onCancel() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl">
          <Dialog.Title className="text-base font-bold text-slate-900">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-slate-500">
            {description}
          </Dialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition-colors"
            >
              {confirmLabel}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

- [ ] **Step 4: Verificar que el test pasa**

```bash
npm test -- --testPathPattern="ConfirmDialog" --no-coverage
```

Resultado esperado: PASS — 5 tests

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/ConfirmDialog.tsx src/components/ui/__tests__/ConfirmDialog.test.tsx
git commit -m "feat: componente ConfirmDialog (Radix) para reemplazar confirm()"
```

---

## Task 3: Reemplazar alert/confirm en componentes de Pedidos

**Files:**
- Modify: `src/modules/pedidos/components/RepuestosAPedir.tsx`
- Modify: `src/modules/pedidos/components/RepuestosPedidos.tsx`

- [ ] **Step 1: Actualizar RepuestosAPedir**

Reemplazar el contenido completo de `src/modules/pedidos/components/RepuestosAPedir.tsx`:

```tsx
"use client"

import { useState } from "react"
import { marcarComoPedidoAction, deleteRepuestoPedidoAction } from "../actions"
import { CheckCircle, Trash2 } from "lucide-react"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

export default function RepuestosAPedir({ items }: { items: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const handleMarcar = async (id: string) => {
    setLoadingId(id)
    setError(null)
    try {
      const res = await marcarComoPedidoAction(id)
      if (!res.success) setError(res.error ?? "Error al marcar como pedido")
    } finally {
      setLoadingId(null)
    }
  }

  const handleEliminar = async () => {
    if (!confirmId) return
    const id = confirmId
    setConfirmId(null)
    setLoadingId(id)
    setError(null)
    try {
      const res = await deleteRepuestoPedidoAction(id)
      if (!res.success) setError(res.error ?? "Error al eliminar")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <>
      {error && (
        <div className="mb-3">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}
      <ConfirmDialog
        open={confirmId !== null}
        title="¿Eliminar repuesto?"
        description="Se quitará este artículo de la lista de pedidos pendientes."
        confirmLabel="Eliminar"
        onConfirm={handleEliminar}
        onCancel={() => setConfirmId(null)}
      />
      <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="py-3.5 pl-6 pr-3 text-right text-sm font-semibold text-slate-700 w-20">Cant.</th>
              <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">Proveedor</th>
              <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">Código</th>
              <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">Descripción</th>
              <th className="py-3.5 pl-3 pr-6 text-right text-sm font-semibold text-slate-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 pl-6 pr-3 text-right">
                  <span className="inline-flex items-center justify-center rounded-md bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-700">
                    {item.cantidad}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                  {item.stock.proveedor?.nombre}
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm font-semibold text-slate-900">{item.stock.codigo}</span>
                  {item.stock.codigoOriginal && (
                    <div className="text-xs text-slate-400 mt-0.5">Orig: {item.stock.codigoOriginal}</div>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-slate-700">{item.stock.descripcion}</td>
                <td className="py-4 pl-3 pr-6">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleMarcar(item.id)}
                      disabled={loadingId === item.id}
                      className="flex items-center gap-1.5 rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle size={14} />
                      Marcar como pedido
                    </button>
                    <button
                      onClick={() => setConfirmId(item.id)}
                      disabled={loadingId === item.id}
                      className="flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="py-12 text-center text-slate-400">
                  No hay repuestos pendientes de pedir.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Actualizar RepuestosPedidos**

Reemplazar el contenido completo de `src/modules/pedidos/components/RepuestosPedidos.tsx`:

```tsx
"use client"

import { useState } from "react"
import { cancelarPedidoAction } from "../actions"
import { XCircle } from "lucide-react"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

export default function RepuestosPedidos({ items }: { items: any[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const handleCancelar = async () => {
    if (!confirmId) return
    const id = confirmId
    setConfirmId(null)
    setLoadingId(id)
    setError(null)
    try {
      const res = await cancelarPedidoAction(id)
      if (!res.success) setError(res.error ?? "Error al cancelar pedido")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <>
      {error && (
        <div className="mb-3">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}
      <ConfirmDialog
        open={confirmId !== null}
        title="¿Cancelar pedido?"
        description="El artículo volverá a la lista de 'a pedir'."
        confirmLabel="Cancelar pedido"
        onConfirm={handleCancelar}
        onCancel={() => setConfirmId(null)}
      />
      <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="py-3.5 pl-6 pr-3 text-right text-sm font-semibold text-slate-700 w-20">Cant.</th>
              <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">Proveedor</th>
              <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">Código</th>
              <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">Descripción</th>
              <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">Fecha pedido</th>
              <th className="py-3.5 pl-3 pr-6 text-right text-sm font-semibold text-slate-700">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 pl-6 pr-3 text-right">
                  <span className="inline-flex items-center justify-center rounded-md bg-blue-50 px-2.5 py-1 text-sm font-semibold text-blue-700 ring-1 ring-inset ring-blue-200">
                    {item.cantidad}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-slate-600 whitespace-nowrap">
                  {item.stock.proveedor?.nombre}
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm font-semibold text-slate-900">{item.stock.codigo}</span>
                  {item.stock.codigoOriginal && (
                    <div className="text-xs text-slate-400 mt-0.5">Orig: {item.stock.codigoOriginal}</div>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-slate-700">{item.stock.descripcion}</td>
                <td className="px-4 py-4 text-sm text-slate-500 whitespace-nowrap">
                  {item.fechaPedido
                    ? new Date(item.fechaPedido).toLocaleDateString("es-AR")
                    : "—"}
                </td>
                <td className="py-4 pl-3 pr-6">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setConfirmId(item.id)}
                      disabled={loadingId === item.id}
                      className="flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <XCircle size={14} />
                      {loadingId === item.id ? "Cancelando..." : "Cancelar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  No hay repuestos pedidos pendientes de recibir.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
```

- [ ] **Step 3: Verificar que no hay errores de TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -E "pedidos|RepuestosA|RepuestosP" | head -20
```

Resultado esperado: sin errores en esos archivos.

- [ ] **Step 4: Commit**

```bash
git add src/modules/pedidos/components/RepuestosAPedir.tsx src/modules/pedidos/components/RepuestosPedidos.tsx
git commit -m "refactor: reemplazar alert/confirm en componentes de pedidos"
```

---

## Task 4: Reemplazar alert/confirm en stock, recepción y proveedores

**Files:**
- Modify: `src/modules/stock/components/StockList.tsx`
- Modify: `src/modules/stock/components/StockForm.tsx`
- Modify: `src/app/dashboard/recepcion/RecepcionPageClient.tsx`
- Modify: `src/modules/proveedores/components/ProveedoresList.tsx`
- Modify: `src/modules/proveedores/components/ProveedorForm.tsx`

- [ ] **Step 1: Reemplazar StockList completo**

Reemplazar el contenido completo de `src/modules/stock/components/StockList.tsx`:

```tsx
"use client"

import { useState } from "react"
import { deleteStockAction } from "../actions"
import { Pencil, Trash2 } from "lucide-react"
import { Importe } from "@/components/ui/ImporteInput"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

export default function StockList({ stock, onEdit }: {
  stock: any[],
  onEdit: (s: any) => void
}) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!confirmId) return
    const id = confirmId
    setConfirmId(null)
    setIsDeleting(id)
    setError(null)
    try {
      await deleteStockAction(id)
    } catch {
      setError("Error al eliminar la pieza")
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <>
      {error && (
        <div className="mb-3">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}
      <ConfirmDialog
        open={confirmId !== null}
        title="¿Eliminar pieza?"
        description="Se eliminará esta pieza del inventario. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
      <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="py-3.5 pl-6 pr-3 text-right text-sm font-semibold text-slate-700 w-20">
                Cant.
              </th>
              <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">
                Proveedor
              </th>
              <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">
                Código
              </th>
              <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">
                Descripción
              </th>
              <th className="px-4 py-3.5 text-right text-sm font-semibold text-slate-700">
                Precio venta
              </th>
              <th className="py-3.5 pl-3 pr-6 text-right text-sm font-semibold text-slate-700">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stock.map((item) => {
              const lowStock = item.cantidad <= item.cantidadCritica
              return (
                <tr
                  key={item.id}
                  className={`transition-colors ${lowStock ? "bg-red-50/40 hover:bg-red-50/60" : "hover:bg-slate-50"}`}
                >
                  <td className="py-4 pl-6 pr-3 text-right">
                    <span className={`inline-flex items-center justify-center rounded-md px-2.5 py-1 text-sm font-semibold ring-1 ring-inset ${
                      lowStock
                        ? "bg-red-50 text-red-700 ring-red-200"
                        : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    }`}>
                      {item.cantidad}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm font-medium text-slate-700 whitespace-nowrap">
                    {item.proveedor?.nombre}
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-semibold text-slate-900">{item.codigo}</span>
                    {item.codigoOriginal && (
                      <div className="text-xs text-slate-400 mt-0.5">Orig: {item.codigoOriginal}</div>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-700">
                    {item.descripcion}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-900 text-right whitespace-nowrap">
                    <Importe value={Number(item.precioVenta)} />
                  </td>
                  <td className="py-4 pl-3 pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEdit(item)}
                        className="flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        <Pencil size={14} />
                        Editar
                      </button>
                      <button
                        onClick={() => setConfirmId(item.id)}
                        disabled={isDeleting === item.id}
                        className="flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={14} />
                        {isDeleting === item.id ? "Eliminando..." : "Eliminar"}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {stock.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  No se encontraron piezas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
```

- [ ] **Step 2: Reemplazar StockForm completo**

Reemplazar el contenido completo de `src/modules/stock/components/StockForm.tsx`:

```tsx
"use client"

import { useState, useEffect } from "react"
import { createStockAction, updateStockAction } from "../actions"
import ImporteInput from "@/components/ui/ImporteInput"
import { ErrorBanner } from "@/components/ui/ErrorBanner"

const inputCls = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"

export default function StockForm({
  stock,
  proveedores,
  onSuccess,
}: {
  stock?: any
  proveedores: any[]
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    proveedorId: stock?.proveedorId || (proveedores.length > 0 ? proveedores[0].id : ""),
    codigo: stock?.codigo || "",
    codigoOriginal: stock?.codigoOriginal || "",
    descripcion: stock?.descripcion || "",
    cantidad: stock?.cantidad || 0,
    cantidadCritica: stock?.cantidadCritica || 0,
    cantidadSugerida: stock?.cantidadSugerida || 0,
    precioLista: stock?.precioLista ? Number(stock.precioLista) : 0,
    precioCosto: stock?.precioCosto ? Number(stock.precioCosto) : 0,
    precioVenta: stock?.precioVenta ? Number(stock.precioVenta) : 0,
    fechaPedido: stock?.fechaPedido ? new Date(stock.fechaPedido).toISOString().split("T")[0] : "",
    fechaRecibido: stock?.fechaRecibido ? new Date(stock.fechaRecibido).toISOString().split("T")[0] : "",
  })
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (formData.precioLista > 0 && formData.proveedorId) {
      const selectedProv = proveedores.find(p => p.id === formData.proveedorId)
      if (selectedProv?.descuentos) {
        let costo = formData.precioLista
        selectedProv.descuentos.forEach((d: any) => {
          costo = costo * (1 - Number(d.porcentaje) / 100)
        })
        setFormData(prev => ({ ...prev, precioCosto: Number(costo.toFixed(2)) }))
      }
    }
  }, [formData.precioLista, formData.proveedorId, proveedores])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePrecio = (field: "precioLista" | "precioCosto" | "precioVenta") => (value: number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSubmitError(null)
    try {
      const dataToSubmit = {
        ...formData,
        cantidad: Number(formData.cantidad),
        cantidadCritica: Number(formData.cantidadCritica),
        cantidadSugerida: Number(formData.cantidadSugerida),
        precioLista: Number(formData.precioLista),
        precioCosto: Number(formData.precioCosto),
        precioVenta: Number(formData.precioVenta),
        fechaPedido: formData.fechaPedido ? new Date(formData.fechaPedido) : undefined,
        fechaRecibido: formData.fechaRecibido ? new Date(formData.fechaRecibido) : undefined,
      }
      if (stock?.id) {
        await updateStockAction(stock.id, dataToSubmit)
      } else {
        await createStockAction(dataToSubmit as any)
      }
      onSuccess()
    } catch (error) {
      console.error(error)
      setSubmitError("Ocurrió un error al guardar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Proveedor</label>
          <select
            name="proveedorId"
            value={formData.proveedorId}
            onChange={handleChange}
            required
            className={inputCls + " bg-white"}
          >
            <option value="" disabled>Seleccione un proveedor</option>
            {proveedores.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Código interno</label>
          <input type="text" name="codigo" required value={formData.codigo} onChange={handleChange} className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Código Original</label>
          <input type="text" name="codigoOriginal" value={formData.codigoOriginal} onChange={handleChange} className={inputCls} />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Descripción</label>
          <input type="text" name="descripcion" required value={formData.descripcion} onChange={handleChange} className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Cantidad Actual</label>
          <input type="number" name="cantidad" required min="0" value={formData.cantidad} onChange={handleChange} className={inputCls} />
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Cant. Crítica</label>
            <input type="number" name="cantidadCritica" min="0" value={formData.cantidadCritica} onChange={handleChange} className={inputCls} />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Cant. Sugerida</label>
            <input type="number" name="cantidadSugerida" min="0" value={formData.cantidadSugerida} onChange={handleChange} className={inputCls} />
          </div>
        </div>

        <div className="md:col-span-2 grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Precio Lista</label>
            <ImporteInput value={formData.precioLista} onChange={handlePrecio("precioLista")} required className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Precio Costo</label>
            <ImporteInput value={formData.precioCosto} onChange={handlePrecio("precioCosto")} required className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Precio Venta</label>
            <ImporteInput value={formData.precioVenta} onChange={handlePrecio("precioVenta")} required className={inputCls} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha Pedido</label>
          <input type="date" name="fechaPedido" value={formData.fechaPedido} onChange={handleChange} className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Fecha Recibido</label>
          <input type="date" name="fechaRecibido" value={formData.fechaRecibido} onChange={handleChange} className={inputCls} />
        </div>
      </div>

      {submitError && (
        <ErrorBanner message={submitError} onDismiss={() => setSubmitError(null)} />
      )}

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar Pieza"}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 3: Reemplazar ProveedoresList completo**

Reemplazar el contenido completo de `src/modules/proveedores/components/ProveedoresList.tsx`:

```tsx
"use client"

import { useState } from "react"
import { deleteProveedorAction } from "../actions"
import { Pencil, Trash2 } from "lucide-react"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

export default function ProveedoresList({ proveedores, onEdit }: {
  proveedores: any[],
  onEdit: (p: any) => void
}) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!confirmId) return
    const id = confirmId
    setConfirmId(null)
    setIsDeleting(id)
    setError(null)
    try {
      const res = await deleteProveedorAction(id)
      if (!res.success) setError(res.error ?? "Error al eliminar el proveedor")
    } catch {
      setError("Error al eliminar el proveedor")
    } finally {
      setIsDeleting(null)
    }
  }

  return (
    <>
      {error && (
        <div className="mb-3">
          <ErrorBanner message={error} onDismiss={() => setError(null)} />
        </div>
      )}
      <ConfirmDialog
        open={confirmId !== null}
        title="¿Eliminar proveedor?"
        description="Se eliminará el proveedor y todos sus datos asociados."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
      <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-slate-700">
                Nombre
              </th>
              <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">
                Descuentos
              </th>
              <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">
                Notas
              </th>
              <th className="py-3.5 pl-3 pr-6 text-right text-sm font-semibold text-slate-700">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {proveedores.map((proveedor) => (
              <tr key={proveedor.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 pl-6 pr-3 text-base font-semibold text-slate-900">
                  {proveedor.nombre}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  <div className="flex flex-wrap gap-1.5">
                    {proveedor.descuentos?.map((d: any) => (
                      <span
                        key={d.id}
                        className="inline-flex items-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200"
                      >
                        {d.descripcion}: {d.porcentaje}%
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-slate-500 max-w-xs truncate">
                  {proveedor.notas}
                </td>
                <td className="py-4 pl-3 pr-6">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(proveedor)}
                      className="flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                    >
                      <Pencil size={14} />
                      Editar
                    </button>
                    <button
                      onClick={() => setConfirmId(proveedor.id)}
                      disabled={isDeleting === proveedor.id}
                      className="flex items-center gap-1.5 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      {isDeleting === proveedor.id ? "Eliminando..." : "Eliminar"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {proveedores.length === 0 && (
              <tr>
                <td colSpan={4} className="py-12 text-center text-slate-400">
                  No hay proveedores registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
```

- [ ] **Step 4: Reemplazar ProveedorForm completo**

Reemplazar el contenido completo de `src/modules/proveedores/components/ProveedorForm.tsx`:

```tsx
"use client"

import { useState } from "react"
import { createProveedorAction, updateProveedorAction } from "../actions"
import { X, Plus } from "lucide-react"
import { ErrorBanner } from "@/components/ui/ErrorBanner"

type Descuento = { id?: string; descripcion: string; porcentaje: number }

export default function ProveedorForm({
  proveedor,
  onSuccess
}: {
  proveedor?: { id: string, nombre: string, notas: string | null, descuentos: Descuento[] },
  onSuccess: () => void
}) {
  const [nombre, setNombre] = useState(proveedor?.nombre || "")
  const [notas, setNotas] = useState(proveedor?.notas || "")
  const [descuentos, setDescuentos] = useState<Descuento[]>(proveedor?.descuentos || [])
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const handleAddDescuento = () => {
    setDescuentos([...descuentos, { descripcion: "", porcentaje: 0 }])
  }

  const handleDescuentoChange = (index: number, field: keyof Descuento, value: string | number) => {
    const updated = [...descuentos]
    updated[index] = { ...updated[index], [field]: value }
    setDescuentos(updated)
  }

  const handleRemoveDescuento = (index: number) => {
    setDescuentos(descuentos.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setSubmitError(null)
    try {
      const data = { nombre, notas, descuentos }
      if (proveedor?.id) {
        await updateProveedorAction(proveedor.id, data)
      } else {
        await createProveedorAction(data)
      }
      onSuccess()
    } catch (error) {
      console.error(error)
      setSubmitError("Ocurrió un error al guardar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          placeholder="Nombre del proveedor"
          className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">Notas</label>
        <textarea
          value={notas}
          onChange={e => setNotas(e.target.value)}
          rows={3}
          placeholder="Observaciones opcionales"
          className="block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition resize-none"
        />
      </div>

      <div className="border-t border-slate-100 pt-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-700">Descuentos</span>
          <button
            type="button"
            onClick={handleAddDescuento}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 transition-colors"
          >
            <Plus size={15} />
            Agregar descuento
          </button>
        </div>

        <div className="space-y-2">
          {descuentos.map((desc, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Descripción (ej: Pago contado)"
                value={desc.descripcion}
                onChange={e => handleDescuentoChange(i, "descripcion", e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                required
              />
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="%"
                value={desc.porcentaje}
                onChange={e => handleDescuentoChange(i, "porcentaje", parseFloat(e.target.value))}
                className="w-24 rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                required
              />
              <button
                type="button"
                onClick={() => handleRemoveDescuento(i)}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          {descuentos.length === 0 && (
            <p className="text-sm text-slate-400 py-1">Sin descuentos cargados.</p>
          )}
        </div>
      </div>

      {submitError && (
        <ErrorBanner message={submitError} onDismiss={() => setSubmitError(null)} />
      )}

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
        >
          {loading ? "Guardando..." : "Guardar proveedor"}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 5: Actualizar RecepcionPageClient**

En `src/app/dashboard/recepcion/RecepcionPageClient.tsx`:

Agregar a los imports existentes:
```tsx
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
```

Agregar a los estados existentes del componente (junto a `loading`, `items`, etc.):
```tsx
const [formError, setFormError] = useState<string | null>(null)
const [confirmZeroImporte, setConfirmZeroImporte] = useState(false)
```

Reemplazar la función `handleSubmit` existente por estas dos funciones:
```tsx
const doSubmit = async () => {
  setLoading(true)
  try {
    const result = await createFacturaAction({
      proveedorId,
      numero,
      importe: Number(importe) || 0,
      items: items.map(i => ({ stockId: i.stockId, cantidad: i.cantidad })),
    })
    if (result.success) {
      router.push("/dashboard/facturas")
    } else {
      setFormError(result.error ?? "No se pudo registrar la recepción")
    }
  } finally {
    setLoading(false)
  }
}

const handleSubmit = async () => {
  setFormError(null)
  if (!proveedorId) { setFormError("Seleccioná un proveedor"); return }
  if (!numero.trim()) { setFormError("Ingresá el número de factura o remito"); return }
  if (items.length === 0) { setFormError("Agregá al menos un artículo"); return }
  if (!importe || Number(importe) <= 0) { setConfirmZeroImporte(true); return }
  await doSubmit()
}
```

Agregar justo antes del botón "Confirmar ingreso" en el JSX (o al pie del formulario):
```tsx
{formError && (
  <ErrorBanner message={formError} onDismiss={() => setFormError(null)} />
)}
<ConfirmDialog
  open={confirmZeroImporte}
  title="¿Confirmar sin importe?"
  description="El importe es $0. ¿Confirmar el ingreso de mercadería de todas formas?"
  confirmLabel="Confirmar igual"
  onConfirm={async () => { setConfirmZeroImporte(false); await doSubmit() }}
  onCancel={() => setConfirmZeroImporte(false)}
/>
```

- [ ] **Step 6: Verificar compilación**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Resultado esperado: sin errores.

- [ ] **Step 7: Commit**

```bash
git add \
  src/modules/stock/components/StockList.tsx \
  src/modules/stock/components/StockForm.tsx \
  src/app/dashboard/recepcion/RecepcionPageClient.tsx \
  src/modules/proveedores/components/ProveedoresList.tsx \
  src/modules/proveedores/components/ProveedorForm.tsx
git commit -m "refactor: reemplazar alert/confirm en stock, recepcion y proveedores"
```

---

## Task 5: Pedidos — formulario inline + filtros client-side

**Files:**
- Delete: `src/modules/pedidos/components/NuevoPedidoForm.tsx`
- Rewrite: `src/app/dashboard/pedidos/PedidosPageClient.tsx`
- Modify: `src/app/dashboard/pedidos/page.tsx`

- [ ] **Step 1: Actualizar page.tsx para cargar proveedores**

Reemplazar `src/app/dashboard/pedidos/page.tsx`:

```tsx
import { getRepuestosAPedirAction, getRepuestosPedidosAction } from "@/modules/pedidos/actions"
import { getProveedoresAction } from "@/modules/proveedores/actions"
import PedidosPageClient from "./PedidosPageClient"

export default async function PedidosPage() {
  const [aPedir, pedidos, proveedores] = await Promise.all([
    getRepuestosAPedirAction(),
    getRepuestosPedidosAction(),
    getProveedoresAction(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pedidos</h1>
        <p className="mt-1 text-slate-500">Administrá los repuestos a pedir y los pedidos en curso.</p>
      </div>
      <PedidosPageClient aPedir={aPedir} pedidos={pedidos} proveedores={proveedores} />
    </div>
  )
}
```

- [ ] **Step 2: Reescribir PedidosPageClient**

Reemplazar `src/app/dashboard/pedidos/PedidosPageClient.tsx` completo:

```tsx
"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { createRepuestoPedidoAction } from "@/modules/pedidos/actions"
import RepuestosAPedir from "@/modules/pedidos/components/RepuestosAPedir"
import RepuestosPedidos from "@/modules/pedidos/components/RepuestosPedidos"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { Search, Loader2, Plus } from "lucide-react"

export default function PedidosPageClient({
  aPedir,
  pedidos,
  proveedores,
}: {
  aPedir: any[]
  pedidos: any[]
  proveedores: any[]
}) {
  const [searchProveedorId, setSearchProveedorId] = useState("")
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [selectedStock, setSelectedStock] = useState<any>(null)
  const [cantidad, setCantidad] = useState(1)
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!query.trim() || selectedStock) {
      setResults([])
      return
    }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const params = new URLSearchParams({ codigo: query })
        if (searchProveedorId) params.set("proveedorId", searchProveedorId)
        const res = await fetch(`/api/stock/search?${params}`)
        if (res.ok) setResults(await res.json())
      } finally {
        setSearching(false)
      }
    }, 400)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query, selectedStock, searchProveedorId])

  const handleSelect = (item: any) => {
    setSelectedStock(item)
    setQuery(item.codigo)
    setCantidad(item.cantidadSugerida > 0 ? item.cantidadSugerida : 1)
    setResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStock) return
    setLoading(true)
    setError(null)
    try {
      const result = await createRepuestoPedidoAction({ stockId: selectedStock.id, cantidad })
      if (result.success) {
        setSelectedStock(null)
        setQuery("")
        setCantidad(1)
      } else {
        setError(result.error ?? "Error al agregar el repuesto")
      }
    } finally {
      setLoading(false)
    }
  }

  const filterCodigo = selectedStock ? selectedStock.codigo : query
  const filteredAPedir = useMemo(() =>
    aPedir.filter(item => {
      const matchProveedor = !searchProveedorId || item.stock.proveedorId === searchProveedorId
      const q = filterCodigo.toLowerCase()
      const matchCodigo = !q ||
        item.stock.codigo.toLowerCase().includes(q) ||
        item.stock.descripcion.toLowerCase().includes(q)
      return matchProveedor && matchCodigo
    }), [aPedir, searchProveedorId, filterCodigo])

  return (
    <div className="space-y-10">
      {/* Formulario inline */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Agregar repuesto</h2>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Proveedor</label>
            <select
              value={searchProveedorId}
              onChange={e => { setSearchProveedorId(e.target.value); setSelectedStock(null) }}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition w-48"
            >
              <option value="">Todos los proveedores</option>
              {proveedores.map((p: any) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 relative">
            <label className="text-xs font-medium text-slate-600">Código / Descripción</label>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedStock(null) }}
                placeholder="Buscar..."
                className="rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition w-64"
              />
              {searching && (
                <Loader2 size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
              )}
            </div>
            {results.length > 0 && (
              <div className="absolute top-full left-0 mt-1 z-10 w-full min-w-[320px] rounded-lg border border-slate-200 bg-white shadow-lg max-h-52 overflow-y-auto">
                {results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0"
                  >
                    <span className="font-semibold text-slate-900">{item.codigo}</span>
                    <span className="text-slate-500 ml-2">— {item.descripcion}</span>
                    <span className="text-slate-400 ml-2 text-xs">{item.proveedor?.nombre}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600">Cantidad</label>
            <input
              type="number"
              min={1}
              value={cantidad}
              onChange={e => setCantidad(Math.max(1, Number(e.target.value)))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition w-24"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !selectedStock}
            className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 shadow-sm disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            Agregar
          </button>
        </form>
        {error && (
          <div className="mt-3">
            <ErrorBanner message={error} onDismiss={() => setError(null)} />
          </div>
        )}
      </div>

      {/* Artículos a pedir */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Artículos a pedir</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {filteredAPedir.length === 0
              ? "Sin repuestos pendientes"
              : `${filteredAPedir.length} repuesto${filteredAPedir.length !== 1 ? "s" : ""} por pedir`}
          </p>
        </div>
        <RepuestosAPedir items={filteredAPedir} />
      </div>

      {/* Pedidos en curso */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Pedidos en curso</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {pedidos.length === 0
              ? "Sin pedidos en curso"
              : `${pedidos.length} pedido${pedidos.length !== 1 ? "s" : ""} en curso`}
          </p>
        </div>
        <RepuestosPedidos items={pedidos} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Eliminar NuevoPedidoForm**

```bash
rm src/modules/pedidos/components/NuevoPedidoForm.tsx
```

- [ ] **Step 4: Verificar compilación**

```bash
npx tsc --noEmit 2>&1 | grep -E "pedidos|Pedidos" | head -20
```

Resultado esperado: sin errores.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/pedidos/page.tsx src/app/dashboard/pedidos/PedidosPageClient.tsx
git rm src/modules/pedidos/components/NuevoPedidoForm.tsx
git commit -m "feat: pedidos con formulario inline y filtros client-side"
```

---

## Task 6: Facturas — repository con paginación + action

**Files:**
- Modify: `src/repositories/factura.repository.ts`
- Modify: `src/modules/facturas/actions.ts`

- [ ] **Step 1: Agregar `findPaginated` al repositorio**

En `src/repositories/factura.repository.ts`, agregar el método `findPaginated` junto al existente `findAll`. No eliminar `findAll` (puede usarse internamente):

```typescript
async findPaginated(params: {
  proveedorId?: string
  numero?: string
  page: number
  pageSize?: number
}): Promise<{ data: FacturaWithItems[]; total: number }> {
  const pageSize = params.pageSize ?? 20
  const skip = (params.page - 1) * pageSize

  const where: Prisma.FacturaWhereInput = {}
  if (params.proveedorId) where.proveedorId = params.proveedorId
  if (params.numero) where.numero = { contains: params.numero }

  const [data, total] = await Promise.all([
    prisma.factura.findMany({
      where,
      include: {
        proveedor: true,
        items: {
          include: { stock: { include: { proveedor: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.factura.count({ where }),
  ])

  return { data, total }
},
```

- [ ] **Step 2: Actualizar `getFacturasAction`**

En `src/modules/facturas/actions.ts`, reemplazar `getFacturasAction`:

```typescript
export async function getFacturasAction(params: {
  page?: number
  proveedorId?: string
  numero?: string
} = {}) {
  try {
    const { data, total } = await FacturaRepository.findPaginated({
      page: params.page ?? 1,
      proveedorId: params.proveedorId || undefined,
      numero: params.numero || undefined,
    })
    const pageSize = 20
    return {
      data: data.map(serializeFactura),
      total,
      pages: Math.max(1, Math.ceil(total / pageSize)),
    }
  } catch (error) {
    console.error("Error al obtener facturas:", error)
    throw new Error("No se pudieron cargar las facturas")
  }
}
```

- [ ] **Step 3: Verificar compilación**

```bash
npx tsc --noEmit 2>&1 | grep -E "factura|Factura" | head -20
```

Resultado esperado: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/repositories/factura.repository.ts src/modules/facturas/actions.ts
git commit -m "feat: facturas repository con paginación y filtros server-side"
```

---

## Task 7: Facturas — página con filtros y paginación

**Files:**
- Modify: `src/app/dashboard/facturas/page.tsx`
- Rewrite: `src/app/dashboard/facturas/FacturasPageClient.tsx`

- [ ] **Step 1: Actualizar page.tsx**

Reemplazar `src/app/dashboard/facturas/page.tsx`:

```tsx
import { getFacturasAction } from "@/modules/facturas/actions"
import { getProveedoresAction } from "@/modules/proveedores/actions"
import FacturasPageClient from "./FacturasPageClient"

type SearchParams = Promise<{
  page?: string
  proveedorId?: string
  numero?: string
}>

export default async function FacturasPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const proveedorId = params.proveedorId ?? ""
  const numero = params.numero ?? ""

  const [{ data: facturas, total, pages }, proveedores] = await Promise.all([
    getFacturasAction({
      page,
      proveedorId: proveedorId || undefined,
      numero: numero || undefined,
    }),
    getProveedoresAction(),
  ])

  return (
    <FacturasPageClient
      facturas={facturas}
      total={total}
      pages={pages}
      currentPage={page}
      proveedores={proveedores}
      initialProveedorId={proveedorId}
      initialNumero={numero}
    />
  )
}
```

- [ ] **Step 2: Reescribir FacturasPageClient**

Reemplazar `src/app/dashboard/facturas/FacturasPageClient.tsx` completo:

```tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import FacturasList from "@/modules/facturas/components/FacturasList"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"

export default function FacturasPageClient({
  facturas,
  total,
  pages,
  currentPage,
  proveedores,
  initialProveedorId,
  initialNumero,
}: {
  facturas: any[]
  total: number
  pages: number
  currentPage: number
  proveedores: any[]
  initialProveedorId: string
  initialNumero: string
}) {
  const router = useRouter()
  const [proveedorId, setProveedorId] = useState(initialProveedorId)
  const [numero, setNumero] = useState(initialNumero)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => { setProveedorId(initialProveedorId) }, [initialProveedorId])
  useEffect(() => { setNumero(initialNumero) }, [initialNumero])

  function navigate(updates: { proveedorId?: string; numero?: string; page?: string }) {
    const params = new URLSearchParams()
    const nextProveedorId = updates.proveedorId !== undefined ? updates.proveedorId : proveedorId
    const nextNumero = updates.numero !== undefined ? updates.numero : numero
    const nextPage = updates.page ?? "1"

    if (nextProveedorId) params.set("proveedorId", nextProveedorId)
    if (nextNumero) params.set("numero", nextNumero)
    if (Number(nextPage) > 1) params.set("page", nextPage)

    router.push(`/dashboard/facturas?${params.toString()}`)
  }

  const handleNumeroChange = (value: string) => {
    setNumero(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      navigate({ numero: value, page: "1" })
    }, 400)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Facturas</h1>
        <p className="mt-1 text-slate-500">
          {total === 0
            ? "Sin facturas registradas"
            : `${total} factura${total !== 1 ? "s" : ""} registrada${total !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={proveedorId}
          onChange={e => {
            setProveedorId(e.target.value)
            navigate({ proveedorId: e.target.value, page: "1" })
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
        >
          <option value="">Todos los proveedores</option>
          {proveedores.map((p: any) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>

        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Número de factura..."
            value={numero}
            onChange={e => handleNumeroChange(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition w-56"
          />
        </div>
      </div>

      <FacturasList facturas={facturas} />

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Página {currentPage} de {pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate({ page: String(currentPage - 1) })}
              disabled={currentPage <= 1}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={15} />
              Anterior
            </button>
            <button
              onClick={() => navigate({ page: String(currentPage + 1) })}
              disabled={currentPage >= pages}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Siguiente
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verificar compilación**

```bash
npx tsc --noEmit 2>&1 | grep -E "facturas|Facturas" | head -20
```

Resultado esperado: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/facturas/page.tsx src/app/dashboard/facturas/FacturasPageClient.tsx
git commit -m "feat: facturas con filtros server-side y paginación por URL"
```

---

## Task 8: Stock — repository con paginación + action

**Files:**
- Modify: `src/repositories/stock.repository.ts`
- Modify: `src/modules/stock/actions.ts`

- [ ] **Step 1: Actualizar `search` en el repositorio**

En `src/repositories/stock.repository.ts`, reemplazar el método `search`:

```typescript
async search(params: {
  proveedorId?: string
  codigo?: string
  page?: number
  pageSize?: number
}): Promise<{ data: StockWithProveedor[]; total: number }> {
  const pageSize = params.pageSize ?? 20
  const page = params.page ?? 1
  const skip = (page - 1) * pageSize

  const conditions: Prisma.StockWhereInput[] = []
  if (params.proveedorId) {
    conditions.push({ proveedorId: params.proveedorId })
  }
  if (params.codigo) {
    conditions.push({
      OR: [
        { codigo: { contains: params.codigo } },
        { codigoOriginal: { contains: params.codigo } },
        { descripcion: { contains: params.codigo } },
      ],
    })
  }

  const where: Prisma.StockWhereInput =
    conditions.length > 0 ? { AND: conditions } : {}

  const [data, total] = await Promise.all([
    prisma.stock.findMany({
      where,
      include: { proveedor: true },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.stock.count({ where }),
  ])

  return { data, total }
},
```

Nota: `findAll` se mantiene sin cambios — lo usa la API de búsqueda de ventas/recepción.

- [ ] **Step 2: Actualizar `getStockAction`**

En `src/modules/stock/actions.ts`, reemplazar solo `getStockAction`:

```typescript
export async function getStockAction(params: {
  page?: number
  proveedorId?: string
  codigo?: string
} = {}) {
  try {
    const { data, total } = await StockRepository.search({
      page: params.page ?? 1,
      proveedorId: params.proveedorId || undefined,
      codigo: params.codigo || undefined,
    })
    const pageSize = 20
    return {
      data: data.map(serializeStock),
      total,
      pages: Math.max(1, Math.ceil(total / pageSize)),
    }
  } catch (error) {
    console.error("Error al obtener stock:", error)
    throw new Error("No se pudo cargar el stock")
  }
}
```

- [ ] **Step 3: Verificar compilación**

```bash
npx tsc --noEmit 2>&1 | grep -E "stock.repository|stock/actions" | head -20
```

Resultado esperado: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/repositories/stock.repository.ts src/modules/stock/actions.ts
git commit -m "feat: stock repository con paginación server-side"
```

---

## Task 9: Stock — página con filtros server-side y paginación

**Files:**
- Modify: `src/app/dashboard/stock/page.tsx`
- Modify: `src/app/dashboard/stock/StockPageClient.tsx`

- [ ] **Step 1: Actualizar page.tsx**

Reemplazar `src/app/dashboard/stock/page.tsx`:

```tsx
import { getStockAction } from "@/modules/stock/actions"
import { getProveedoresAction } from "@/modules/proveedores/actions"
import StockPageClient from "./StockPageClient"

type SearchParams = Promise<{
  page?: string
  proveedorId?: string
  codigo?: string
}>

export default async function StockPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const proveedorId = params.proveedorId ?? ""
  const codigo = params.codigo ?? ""

  const [{ data: stock, total, pages }, proveedores] = await Promise.all([
    getStockAction({
      page,
      proveedorId: proveedorId || undefined,
      codigo: codigo || undefined,
    }),
    getProveedoresAction(),
  ])

  return (
    <StockPageClient
      stock={stock}
      total={total}
      pages={pages}
      currentPage={page}
      proveedores={proveedores}
      initialProveedorId={proveedorId}
      initialCodigo={codigo}
    />
  )
}
```

- [ ] **Step 2: Actualizar StockPageClient**

Reemplazar `src/app/dashboard/stock/StockPageClient.tsx` completo:

```tsx
"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import StockList from "@/modules/stock/components/StockList"
import StockForm from "@/modules/stock/components/StockForm"
import * as Dialog from "@radix-ui/react-dialog"
import { Plus, X, Search, ChevronLeft, ChevronRight } from "lucide-react"

export default function StockPageClient({
  stock,
  total,
  pages,
  currentPage,
  proveedores,
  initialProveedorId,
  initialCodigo,
}: {
  stock: any[]
  total: number
  pages: number
  currentPage: number
  proveedores: any[]
  initialProveedorId: string
  initialCodigo: string
}) {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStock, setSelectedStock] = useState<any>(null)
  const [proveedorId, setProveedorId] = useState(initialProveedorId)
  const [codigo, setCodigo] = useState(initialCodigo)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => { setProveedorId(initialProveedorId) }, [initialProveedorId])
  useEffect(() => { setCodigo(initialCodigo) }, [initialCodigo])

  function navigate(updates: { proveedorId?: string; codigo?: string; page?: string }) {
    const params = new URLSearchParams()
    const nextProveedorId = updates.proveedorId !== undefined ? updates.proveedorId : proveedorId
    const nextCodigo = updates.codigo !== undefined ? updates.codigo : codigo
    const nextPage = updates.page ?? "1"

    if (nextProveedorId) params.set("proveedorId", nextProveedorId)
    if (nextCodigo) params.set("codigo", nextCodigo)
    if (Number(nextPage) > 1) params.set("page", nextPage)

    router.push(`/dashboard/stock?${params.toString()}`)
  }

  const handleCodigoChange = (value: string) => {
    setCodigo(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      navigate({ codigo: value, page: "1" })
    }, 400)
  }

  const handleOpenNew = () => {
    setSelectedStock(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (stockItem: any) => {
    setSelectedStock(stockItem)
    setIsModalOpen(true)
  }

  const handleClose = () => {
    setIsModalOpen(false)
    setSelectedStock(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock</h1>
          <p className="mt-1 text-slate-500">
            {total === 0
              ? "Sin piezas registradas"
              : `${total} pieza${total !== 1 ? "s" : ""} en inventario`}
          </p>
        </div>
        <button
          onClick={handleOpenNew}
          className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          <Plus size={18} />
          Nueva pieza
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={proveedorId}
          onChange={e => {
            setProveedorId(e.target.value)
            navigate({ proveedorId: e.target.value, page: "1" })
          }}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-base text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
        >
          <option value="">Todos los proveedores</option>
          {proveedores.map((p: any) => (
            <option key={p.id} value={p.id}>{p.nombre}</option>
          ))}
        </select>

        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Código..."
            value={codigo}
            onChange={e => handleCodigoChange(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition w-72"
          />
        </div>
      </div>

      <StockList stock={stock} onEdit={handleOpenEdit} />

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Página {currentPage} de {pages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate({ page: String(currentPage - 1) })}
              disabled={currentPage <= 1}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              <ChevronLeft size={15} />
              Anterior
            </button>
            <button
              onClick={() => navigate({ page: String(currentPage + 1) })}
              disabled={currentPage >= pages}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
            >
              Siguiente
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}

      <Dialog.Root open={isModalOpen} onOpenChange={setIsModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <Dialog.Title className="text-lg font-semibold text-slate-900">
                {selectedStock ? "Editar pieza" : "Nueva pieza"}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <X size={18} />
                </button>
              </Dialog.Close>
            </div>
            <div className="px-6 py-5">
              <StockForm
                stock={selectedStock}
                proveedores={proveedores}
                onSuccess={handleClose}
              />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
```

- [ ] **Step 3: Verificar compilación completa**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Resultado esperado: 0 errores.

- [ ] **Step 4: Correr todos los tests**

```bash
npm test -- --no-coverage
```

Resultado esperado: todos los tests pasan (incluidos los nuevos de ErrorBanner y ConfirmDialog).

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/stock/page.tsx src/app/dashboard/stock/StockPageClient.tsx
git commit -m "feat: stock con filtros server-side y paginación por URL"
```
