# Cajas y Consulta de Artículo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar dos módulos independientes: Cajas (gestión de contenedores de almacenamiento con relación M2M a Stock) y Consulta de Artículo (búsqueda y detalle completo de artículos con cajas e imagen).

**Architecture:** Dos módulos siguiendo el patrón del proyecto: repository → server actions → components → page.tsx (server) + PageClient.tsx (client). Se agregan tres cambios al schema Prisma: modelo `Caja`, tabla de relación `StockCaja` (M2M), y campo `imagen` en `Stock`. El estado de la UI se mantiene en query params para SSR.

**Tech Stack:** Next.js 16 App Router, Prisma 6 + MySQL, React 19, Radix UI (Dialog), Tailwind CSS 4, Jest + Testing Library, Playwright.

**Spec:** `docs/superpowers/specs/2026-05-15-cajas-consulta-articulo-design.md`

---

## File Map

**Nuevos archivos:**
- `prisma/schema.prisma` (modify)
- `src/repositories/caja.repository.ts` (create)
- `src/repositories/stock.repository.ts` (modify — add `imagen`, `findByIdWithCajas`, `searchWithCajas`)
- `src/modules/stock/actions.ts` (modify — add `imagen` param)
- `src/modules/stock/components/StockForm.tsx` (modify — add imagen URL input)
- `src/modules/stock/__tests__/StockForm.test.tsx` (create)
- `src/modules/cajas/actions.ts` (create)
- `src/modules/cajas/components/CajaForm.tsx` (create)
- `src/modules/cajas/components/CajasList.tsx` (create)
- `src/modules/cajas/components/ArticulosDeCaja.tsx` (create)
- `src/modules/cajas/components/AsignarArticuloModal.tsx` (create)
- `src/modules/cajas/__tests__/CajaForm.test.tsx` (create)
- `src/modules/cajas/__tests__/CajasList.test.tsx` (create)
- `src/modules/cajas/__tests__/ArticulosDeCaja.test.tsx` (create)
- `src/app/dashboard/cajas/page.tsx` (create)
- `src/app/dashboard/cajas/CajasPageClient.tsx` (create)
- `src/modules/consulta-articulo/actions.ts` (create)
- `src/modules/consulta-articulo/components/DetalleArticulo.tsx` (create)
- `src/modules/consulta-articulo/components/ResultadosBusqueda.tsx` (create)
- `src/modules/consulta-articulo/__tests__/DetalleArticulo.test.tsx` (create)
- `src/modules/consulta-articulo/__tests__/ResultadosBusqueda.test.tsx` (create)
- `src/app/dashboard/consulta-articulo/page.tsx` (create)
- `src/app/dashboard/consulta-articulo/ConsultaArticuloPageClient.tsx` (create)
- `src/components/layout/Sidebar.tsx` (modify)
- `tests/e2e/cajas.spec.ts` (create)
- `tests/e2e/consulta-articulo.spec.ts` (create)
- `tests/e2e/pages/PageObjects.ts` (modify — add helpers)

---

## Task 1: Prisma schema — agregar Caja, StockCaja, imagen en Stock

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Paso 1: Agregar modelos al schema**

En `prisma/schema.prisma`, dentro del modelo `Stock` agregar después de `updatedAt`:

```prisma
  imagen  String?     @db.VarChar(500)
  cajas   StockCaja[]
```

Al final del archivo agregar:

```prisma
model Caja {
  id        String      @id @default(uuid())
  nombre    String      @db.VarChar(255)
  ubicacion String      @db.VarChar(255)
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  stocks    StockCaja[]
}

model StockCaja {
  stockId String
  cajaId  String
  stock   Stock  @relation(fields: [stockId], references: [id], onDelete: Cascade)
  caja    Caja   @relation(fields: [cajaId], references: [id], onDelete: Cascade)

  @@id([stockId, cajaId])
}
```

- [ ] **Paso 2: Correr la migración**

```bash
npx prisma migrate dev --name add_cajas_and_imagen
```

Expected: `✔ Generated Prisma Client` sin errores. Si hay error de tabla existente, leer `docs` de migrations y aplicar `prisma migrate resolve --applied` como indica la memoria del proyecto.

- [ ] **Paso 3: Verificar que el cliente está actualizado**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client (v6.x.x)`

- [ ] **Paso 4: Commit**

```bash
git add prisma/
git commit -m "feat: schema — agregar Caja, StockCaja y campo imagen en Stock"
```

---

## Task 2: Actualizar Stock repository — imagen + findByIdWithCajas + searchWithCajas

**Files:**
- Modify: `src/repositories/stock.repository.ts`

- [ ] **Paso 1: Agregar tipo StockWithCajas y actualizar métodos**

Al inicio de `src/repositories/stock.repository.ts`, después de la línea `export type StockWithProveedor = ...`, agregar:

```typescript
export type StockWithCajas = Prisma.StockGetPayload<{
  include: {
    proveedor: true
    cajas: { include: { caja: true } }
  }
}>
```

En el método `create`, agregar `imagen?: string` al tipo del parámetro `data`:

```typescript
async create(data: {
  proveedorId: string;
  codigo: string;
  codigoOriginal?: string;
  descripcion: string;
  cantidad: number;
  cantidadCritica: number;
  cantidadSugerida: number;
  fechaPedido?: Date;
  fechaRecibido?: Date;
  precioCosto: number;
  precioLista: number;
  precioVenta: number;
  imagen?: string;
}) {
```

En el método `update`, agregar `imagen?: string | null` al tipo del parámetro `data`:

```typescript
async update(id: string, data: {
  proveedorId?: string;
  codigo?: string;
  codigoOriginal?: string;
  descripcion?: string;
  cantidad?: number;
  cantidadCritica?: number;
  cantidadSugerida?: number;
  fechaPedido?: Date;
  fechaRecibido?: Date;
  precioCosto?: number;
  precioLista?: number;
  precioVenta?: number;
  imagen?: string | null;
}) {
```

Al final del objeto `StockRepository`, antes del cierre `}`, agregar:

```typescript
  async findByIdWithCajas(id: string): Promise<StockWithCajas | null> {
    return prisma.stock.findUnique({
      where: { id },
      include: {
        proveedor: true,
        cajas: { include: { caja: true } }
      }
    })
  },

  async searchWithCajas(q: string): Promise<StockWithCajas[]> {
    return prisma.stock.findMany({
      where: {
        OR: [
          { codigo: { contains: q } },
          { codigoOriginal: { contains: q } },
          { descripcion: { contains: q } },
        ]
      },
      include: {
        proveedor: true,
        cajas: { include: { caja: true } }
      },
      orderBy: { descripcion: 'asc' },
      take: 20,
    })
  },
```

- [ ] **Paso 2: Verificar tipos con TypeScript**

```bash
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Paso 3: Commit**

```bash
git add src/repositories/stock.repository.ts
git commit -m "feat: stock repository — agregar imagen, findByIdWithCajas y searchWithCajas"
```

---

## Task 3: Actualizar Stock actions — imagen

**Files:**
- Modify: `src/modules/stock/actions.ts`

- [ ] **Paso 1: Agregar imagen a createStockAction y updateStockAction**

En `createStockAction`, agregar `imagen?: string` al tipo del parámetro `data`:

```typescript
export async function createStockAction(data: {
  proveedorId: string;
  codigo: string;
  codigoOriginal?: string;
  descripcion: string;
  cantidad: number;
  cantidadCritica: number;
  cantidadSugerida: number;
  fechaPedido?: Date;
  fechaRecibido?: Date;
  precioCosto: number;
  precioLista: number;
  precioVenta: number;
  imagen?: string;
}) {
```

En `updateStockAction`, agregar `imagen?: string | null` al tipo del parámetro `data`:

```typescript
export async function updateStockAction(
  id: string,
  data: {
    proveedorId?: string;
    codigo?: string;
    codigoOriginal?: string;
    descripcion?: string;
    cantidad?: number;
    cantidadCritica?: number;
    cantidadSugerida?: number;
    fechaPedido?: Date;
    fechaRecibido?: Date;
    precioCosto?: number;
    precioLista?: number;
    precioVenta?: number;
    imagen?: string | null;
  }
) {
```

- [ ] **Paso 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Paso 3: Commit**

```bash
git add src/modules/stock/actions.ts
git commit -m "feat: stock actions — agregar campo imagen a create y update"
```

---

## Task 4: StockForm — campo URL de imagen

**Files:**
- Modify: `src/modules/stock/components/StockForm.tsx`
- Create: `src/modules/stock/__tests__/StockForm.test.tsx`

- [ ] **Paso 1: Escribir el test que falla**

Crear `src/modules/stock/__tests__/StockForm.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
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
})
```

- [ ] **Paso 2: Correr test para verificar que falla**

```bash
npx jest src/modules/stock/__tests__/StockForm.test.tsx --no-coverage
```

Expected: FAIL — `Unable to find an element with placeholder matching /https:\/\//i`

- [ ] **Paso 3: Agregar campo imagen a StockForm**

En `src/modules/stock/components/StockForm.tsx`:

En el estado inicial `useState`, agregar `imagen` al objeto:

```typescript
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
    imagen: stock?.imagen || "",
  })
```

En `handleSubmit`, dentro de `dataToSubmit`, incluir `imagen`:

```typescript
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
        imagen: formData.imagen || undefined,
      }
```

En el JSX, después del bloque de `fechaRecibido`, agregar:

```tsx
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">URL de Imagen</label>
          <input
            type="url"
            name="imagen"
            value={formData.imagen}
            onChange={handleChange}
            className={inputCls}
            placeholder="https://..."
          />
          {formData.imagen && (
            <img
              src={formData.imagen}
              alt="Preview"
              className="mt-2 h-24 w-auto rounded-md object-contain border border-slate-200 bg-slate-50"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          )}
        </div>
```

- [ ] **Paso 4: Correr tests para verificar que pasan**

```bash
npx jest src/modules/stock/__tests__/StockForm.test.tsx --no-coverage
```

Expected: PASS

- [ ] **Paso 5: Commit**

```bash
git add src/modules/stock/components/StockForm.tsx src/modules/stock/__tests__/StockForm.test.tsx
git commit -m "feat: StockForm — agregar campo URL de imagen con preview"
```

---

## Task 5: Caja repository

**Files:**
- Create: `src/repositories/caja.repository.ts`

- [ ] **Paso 1: Crear el archivo**

Crear `src/repositories/caja.repository.ts`:

```typescript
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export type CajaWithCount = Prisma.CajaGetPayload<{
  include: { _count: { select: { stocks: true } } }
}>

export type CajaWithStocks = Prisma.CajaGetPayload<{
  include: {
    stocks: {
      include: {
        stock: { include: { proveedor: true } }
      }
    }
  }
}>

export const CajaRepository = {
  async findAll(): Promise<CajaWithCount[]> {
    return prisma.caja.findMany({
      include: { _count: { select: { stocks: true } } },
      orderBy: { nombre: 'asc' },
    })
  },

  async findById(id: string): Promise<CajaWithStocks | null> {
    return prisma.caja.findUnique({
      where: { id },
      include: {
        stocks: {
          include: {
            stock: { include: { proveedor: true } }
          }
        }
      },
    })
  },

  async search(q: string): Promise<CajaWithCount[]> {
    return prisma.caja.findMany({
      where: q ? {
        OR: [
          { nombre: { contains: q } },
          { ubicacion: { contains: q } },
          {
            stocks: {
              some: {
                stock: {
                  OR: [
                    { descripcion: { contains: q } },
                    { codigo: { contains: q } },
                  ],
                },
              },
            },
          },
        ],
      } : {},
      include: { _count: { select: { stocks: true } } },
      orderBy: { nombre: 'asc' },
    })
  },

  async create(data: { nombre: string; ubicacion: string }): Promise<CajaWithCount> {
    return prisma.caja.create({
      data,
      include: { _count: { select: { stocks: true } } },
    })
  },

  async update(id: string, data: { nombre: string; ubicacion: string }): Promise<CajaWithCount> {
    return prisma.caja.update({
      where: { id },
      data,
      include: { _count: { select: { stocks: true } } },
    })
  },

  async delete(id: string) {
    return prisma.caja.delete({ where: { id } })
  },

  async addStock(cajaId: string, stockId: string) {
    return prisma.stockCaja.create({ data: { cajaId, stockId } })
  },

  async removeStock(cajaId: string, stockId: string) {
    return prisma.stockCaja.delete({
      where: { stockId_cajaId: { stockId, cajaId } },
    })
  },
}
```

- [ ] **Paso 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Paso 3: Commit**

```bash
git add src/repositories/caja.repository.ts
git commit -m "feat: caja repository — CRUD + addStock + removeStock + search cruzado"
```

---

## Task 6: Caja server actions

**Files:**
- Create: `src/modules/cajas/actions.ts`

- [ ] **Paso 1: Crear el archivo**

Crear `src/modules/cajas/actions.ts`:

```typescript
"use server"

import { CajaRepository } from "@/repositories/caja.repository"
import { StockRepository } from "@/repositories/stock.repository"
import { revalidatePath } from "next/cache"

function serializeCaja(caja: any) {
  return {
    ...caja,
    createdAt: caja.createdAt.toISOString(),
    updatedAt: caja.updatedAt.toISOString(),
  }
}

function serializeCajaWithStocks(caja: any) {
  return {
    ...serializeCaja(caja),
    stocks: caja.stocks.map((sc: any) => ({
      ...sc,
      stock: {
        ...sc.stock,
        precioCosto: sc.stock.precioCosto.toNumber(),
        precioLista: sc.stock.precioLista.toNumber(),
        precioVenta: sc.stock.precioVenta.toNumber(),
        fechaPedido: sc.stock.fechaPedido?.toISOString() ?? null,
        fechaRecibido: sc.stock.fechaRecibido?.toISOString() ?? null,
        createdAt: sc.stock.createdAt.toISOString(),
        updatedAt: sc.stock.updatedAt.toISOString(),
      },
    })),
  }
}

export async function getCajasAction(q?: string) {
  try {
    const cajas = await CajaRepository.search(q ?? "")
    return { success: true as const, data: cajas.map(serializeCaja) }
  } catch (error) {
    console.error("Error al obtener cajas:", error)
    return { success: false as const, error: "No se pudieron cargar las cajas" }
  }
}

export async function getCajaByIdAction(id: string) {
  try {
    const caja = await CajaRepository.findById(id)
    if (!caja) return { success: true as const, data: null }
    return { success: true as const, data: serializeCajaWithStocks(caja) }
  } catch (error) {
    console.error("Error al obtener caja:", error)
    return { success: false as const, error: "No se pudo cargar la caja" }
  }
}

export async function createCajaAction(data: { nombre: string; ubicacion: string }) {
  try {
    const caja = await CajaRepository.create(data)
    revalidatePath("/dashboard/cajas")
    return { success: true as const, data: serializeCaja(caja) }
  } catch (error) {
    console.error("Error al crear caja:", error)
    return { success: false as const, error: "No se pudo crear la caja" }
  }
}

export async function updateCajaAction(id: string, data: { nombre: string; ubicacion: string }) {
  try {
    const caja = await CajaRepository.update(id, data)
    revalidatePath("/dashboard/cajas")
    return { success: true as const, data: serializeCaja(caja) }
  } catch (error) {
    console.error("Error al actualizar caja:", error)
    return { success: false as const, error: "No se pudo actualizar la caja" }
  }
}

export async function deleteCajaAction(id: string) {
  try {
    await CajaRepository.delete(id)
    revalidatePath("/dashboard/cajas")
    return { success: true as const }
  } catch (error) {
    console.error("Error al eliminar caja:", error)
    return { success: false as const, error: "No se pudo eliminar la caja" }
  }
}

export async function addStockACajaAction(cajaId: string, stockId: string) {
  try {
    await CajaRepository.addStock(cajaId, stockId)
    revalidatePath("/dashboard/cajas")
    return { success: true as const }
  } catch (error) {
    console.error("Error al asignar artículo:", error)
    return { success: false as const, error: "No se pudo asignar el artículo a la caja" }
  }
}

export async function removeStockDeCajaAction(cajaId: string, stockId: string) {
  try {
    await CajaRepository.removeStock(cajaId, stockId)
    revalidatePath("/dashboard/cajas")
    return { success: true as const }
  } catch (error) {
    console.error("Error al quitar artículo:", error)
    return { success: false as const, error: "No se pudo quitar el artículo de la caja" }
  }
}

export async function buscarStockParaCajaAction(q: string, cajaId: string) {
  try {
    if (!q.trim()) return { success: true as const, data: [] }
    const { data: allResults } = await StockRepository.search({ codigo: q, pageSize: 15 })
    const caja = await CajaRepository.findById(cajaId)
    const assignedIds = new Set(caja?.stocks.map(s => s.stockId) ?? [])
    const filtered = allResults
      .filter(s => !assignedIds.has(s.id))
      .map(s => ({
        id: s.id,
        codigo: s.codigo,
        descripcion: s.descripcion,
        cantidad: s.cantidad,
        proveedor: s.proveedor.nombre,
      }))
    return { success: true as const, data: filtered }
  } catch (error) {
    console.error("Error al buscar stock para caja:", error)
    return { success: false as const, error: "No se pudo buscar el stock" }
  }
}
```

- [ ] **Paso 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Paso 3: Commit**

```bash
git add src/modules/cajas/actions.ts
git commit -m "feat: cajas actions — CRUD + asignar/quitar stock + búsqueda"
```

---

## Task 7: CajaForm component + test

**Files:**
- Create: `src/modules/cajas/components/CajaForm.tsx`
- Create: `src/modules/cajas/__tests__/CajaForm.test.tsx`

- [ ] **Paso 1: Escribir el test que falla**

Crear `src/modules/cajas/__tests__/CajaForm.test.tsx`:

```typescript
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
```

- [ ] **Paso 2: Correr test para verificar que falla**

```bash
npx jest src/modules/cajas/__tests__/CajaForm.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module '../components/CajaForm'`

- [ ] **Paso 3: Crear CajaForm**

Crear `src/modules/cajas/components/CajaForm.tsx`:

```typescript
"use client"

import { useState } from "react"
import { createCajaAction, updateCajaAction } from "../actions"
import { ErrorBanner } from "@/components/ui/ErrorBanner"

const inputCls = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"

export default function CajaForm({
  caja,
  onSuccess,
}: {
  caja?: { id: string; nombre: string; ubicacion: string } | null
  onSuccess: () => void
}) {
  const [nombre, setNombre] = useState(caja?.nombre ?? "")
  const [ubicacion, setUbicacion] = useState(caja?.ubicacion ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = caja?.id
      ? await updateCajaAction(caja.id, { nombre, ubicacion })
      : await createCajaAction({ nombre, ubicacion })
    setLoading(false)
    if (result.success) {
      onSuccess()
    } else {
      setError(result.error ?? "Error al guardar")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nombre</label>
        <input
          type="text"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          required
          className={inputCls}
          placeholder="Ej: Caja A-1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Ubicación</label>
        <input
          type="text"
          value={ubicacion}
          onChange={e => setUbicacion(e.target.value)}
          required
          className={inputCls}
          placeholder="Ej: Depósito Planta Baja"
        />
      </div>
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar Caja"}
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Paso 4: Correr tests para verificar que pasan**

```bash
npx jest src/modules/cajas/__tests__/CajaForm.test.tsx --no-coverage
```

Expected: PASS (4 tests)

- [ ] **Paso 5: Commit**

```bash
git add src/modules/cajas/components/CajaForm.tsx src/modules/cajas/__tests__/CajaForm.test.tsx
git commit -m "feat: CajaForm — formulario crear/editar caja con tests"
```

---

## Task 8: CajasList component + test

**Files:**
- Create: `src/modules/cajas/components/CajasList.tsx`
- Create: `src/modules/cajas/__tests__/CajasList.test.tsx`

- [ ] **Paso 1: Escribir el test que falla**

Crear `src/modules/cajas/__tests__/CajasList.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import CajasList from '../components/CajasList'

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
})
```

- [ ] **Paso 2: Correr test para verificar que falla**

```bash
npx jest src/modules/cajas/__tests__/CajasList.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module '../components/CajasList'`

- [ ] **Paso 3: Crear CajasList**

Crear `src/modules/cajas/components/CajasList.tsx`:

```typescript
"use client"

import { useState } from "react"
import { Pencil, Trash2, Box } from "lucide-react"
import { deleteCajaAction } from "../actions"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

type Caja = {
  id: string
  nombre: string
  ubicacion: string
  _count: { stocks: number }
}

export default function CajasList({
  cajas,
  selectedId,
  onSelect,
  onEdit,
}: {
  cajas: Caja[]
  selectedId: string | null
  onSelect: (id: string) => void
  onEdit: (caja: Caja) => void
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!confirmId) return
    const id = confirmId
    setConfirmId(null)
    setDeleting(id)
    const result = await deleteCajaAction(id)
    setDeleting(null)
    if (!result.success) setError(result.error ?? "Error al eliminar")
  }

  return (
    <>
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      <ConfirmDialog
        open={confirmId !== null}
        title="¿Eliminar caja?"
        description="Se eliminará la caja. Los artículos de stock no se eliminarán. Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        onConfirm={handleDelete}
        onCancel={() => setConfirmId(null)}
      />
      <div className="space-y-1">
        {cajas.map(caja => (
          <div
            key={caja.id}
            onClick={() => onSelect(caja.id)}
            className={`cursor-pointer rounded-lg border p-3 transition-colors ${
              selectedId === caja.id
                ? "border-blue-500 bg-blue-50"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Box size={16} className="text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{caja.nombre}</p>
                  <p className="text-xs text-slate-500 truncate">{caja.ubicacion}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs text-slate-400">{caja._count.stocks} art.</span>
                <button
                  onClick={e => { e.stopPropagation(); onEdit(caja) }}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-blue-600 transition-colors"
                  aria-label={`Editar ${caja.nombre}`}
                >
                  <Pencil size={13} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setConfirmId(caja.id) }}
                  disabled={deleting === caja.id}
                  className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                  aria-label={`Eliminar ${caja.nombre}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {cajas.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-400">No se encontraron cajas.</p>
        )}
      </div>
    </>
  )
}
```

- [ ] **Paso 4: Correr tests para verificar que pasan**

```bash
npx jest src/modules/cajas/__tests__/CajasList.test.tsx --no-coverage
```

Expected: PASS (5 tests)

- [ ] **Paso 5: Commit**

```bash
git add src/modules/cajas/components/CajasList.tsx src/modules/cajas/__tests__/CajasList.test.tsx
git commit -m "feat: CajasList — lista de cajas con selección, editar, eliminar y tests"
```

---

## Task 9: ArticulosDeCaja component + test

**Files:**
- Create: `src/modules/cajas/components/ArticulosDeCaja.tsx`
- Create: `src/modules/cajas/__tests__/ArticulosDeCaja.test.tsx`

- [ ] **Paso 1: Escribir el test que falla**

Crear `src/modules/cajas/__tests__/ArticulosDeCaja.test.tsx`:

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import ArticulosDeCaja from '../components/ArticulosDeCaja'

const articulos = [
  {
    stockId: 's1',
    stock: { id: 's1', codigo: 'TM8-30', descripcion: 'Tornillo M8', cantidad: 10, proveedor: { nombre: 'Ferretería Norte' } },
  },
  {
    stockId: 's2',
    stock: { id: 's2', codigo: 'PRN-A4', descripcion: 'Perno A4', cantidad: 5, proveedor: { nombre: 'Ferretería Norte' } },
  },
]

describe('ArticulosDeCaja', () => {
  it('renderiza los artículos de la caja', () => {
    render(<ArticulosDeCaja cajaId="c1" articulos={articulos} onAsignar={() => {}} />)
    expect(screen.getByText('Tornillo M8')).toBeInTheDocument()
    expect(screen.getByText('Perno A4')).toBeInTheDocument()
    expect(screen.getByText('TM8-30')).toBeInTheDocument()
  })

  it('filtra artículos por búsqueda de texto', () => {
    render(<ArticulosDeCaja cajaId="c1" articulos={articulos} onAsignar={() => {}} />)
    fireEvent.change(screen.getByPlaceholderText('Buscar artículo...'), { target: { value: 'Tornillo' } })
    expect(screen.getByText('Tornillo M8')).toBeInTheDocument()
    expect(screen.queryByText('Perno A4')).not.toBeInTheDocument()
  })

  it('muestra estado vacío cuando no hay artículos', () => {
    render(<ArticulosDeCaja cajaId="c1" articulos={[]} onAsignar={() => {}} />)
    expect(screen.getByText(/no tiene artículos asignados/i)).toBeInTheDocument()
  })

  it('llama onAsignar al hacer click en el botón Asignar', () => {
    const onAsignar = jest.fn()
    render(<ArticulosDeCaja cajaId="c1" articulos={articulos} onAsignar={onAsignar} />)
    fireEvent.click(screen.getByRole('button', { name: /asignar/i }))
    expect(onAsignar).toHaveBeenCalled()
  })
})
```

- [ ] **Paso 2: Correr test para verificar que falla**

```bash
npx jest src/modules/cajas/__tests__/ArticulosDeCaja.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module '../components/ArticulosDeCaja'`

- [ ] **Paso 3: Crear ArticulosDeCaja**

Crear `src/modules/cajas/components/ArticulosDeCaja.tsx`:

```typescript
"use client"

import { useState, useMemo } from "react"
import { Search, Trash2 } from "lucide-react"
import { removeStockDeCajaAction } from "../actions"
import { ErrorBanner } from "@/components/ui/ErrorBanner"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"

type StockItem = {
  stockId: string
  stock: {
    id: string
    codigo: string
    descripcion: string
    cantidad: number
    proveedor: { nombre: string }
  }
}

export default function ArticulosDeCaja({
  cajaId,
  articulos,
  onAsignar,
}: {
  cajaId: string
  articulos: StockItem[]
  onAsignar: () => void
}) {
  const [q, setQ] = useState("")
  const [confirmStockId, setConfirmStockId] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(
    () => articulos.filter(a =>
      a.stock.codigo.toLowerCase().includes(q.toLowerCase()) ||
      a.stock.descripcion.toLowerCase().includes(q.toLowerCase())
    ),
    [articulos, q]
  )

  const handleRemove = async () => {
    if (!confirmStockId) return
    const id = confirmStockId
    setConfirmStockId(null)
    setRemoving(id)
    const result = await removeStockDeCajaAction(cajaId, id)
    setRemoving(null)
    if (!result.success) setError(result.error ?? "Error al quitar artículo")
  }

  return (
    <div className="space-y-4">
      <ConfirmDialog
        open={confirmStockId !== null}
        title="¿Quitar artículo de la caja?"
        description="El artículo se quitará de esta caja pero no se eliminará del stock."
        confirmLabel="Quitar"
        onConfirm={handleRemove}
        onCancel={() => setConfirmStockId(null)}
      />
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar artículo..."
            value={q}
            onChange={e => setQ(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <button
          onClick={onAsignar}
          className="flex items-center gap-1.5 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 transition-colors"
        >
          + Asignar
        </button>
      </div>
      <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Código</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Descripción</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Proveedor</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Cant.</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(a => (
              <tr key={a.stockId} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-semibold text-slate-900">{a.stock.codigo}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{a.stock.descripcion}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{a.stock.proveedor.nombre}</td>
                <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">{a.stock.cantidad}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setConfirmStockId(a.stockId)}
                    disabled={removing === a.stockId}
                    className="rounded p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    aria-label={`Quitar ${a.stock.descripcion}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-slate-400">
                  {articulos.length === 0
                    ? "Esta caja no tiene artículos asignados."
                    : "No se encontraron artículos."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Paso 4: Correr tests para verificar que pasan**

```bash
npx jest src/modules/cajas/__tests__/ArticulosDeCaja.test.tsx --no-coverage
```

Expected: PASS (4 tests)

- [ ] **Paso 5: Commit**

```bash
git add src/modules/cajas/components/ArticulosDeCaja.tsx src/modules/cajas/__tests__/ArticulosDeCaja.test.tsx
git commit -m "feat: ArticulosDeCaja — tabla con búsqueda client-side y quitar artículo"
```

---

## Task 10: AsignarArticuloModal

**Files:**
- Create: `src/modules/cajas/components/AsignarArticuloModal.tsx`

- [ ] **Paso 1: Crear el componente**

Crear `src/modules/cajas/components/AsignarArticuloModal.tsx`:

```typescript
"use client"

import { useState, useRef } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Search, X } from "lucide-react"
import { addStockACajaAction, buscarStockParaCajaAction } from "../actions"
import { ErrorBanner } from "@/components/ui/ErrorBanner"

type StockResult = {
  id: string
  codigo: string
  descripcion: string
  cantidad: number
  proveedor: string
}

export default function AsignarArticuloModal({
  cajaId,
  open,
  onClose,
}: {
  cajaId: string
  open: boolean
  onClose: () => void
}) {
  const [q, setQ] = useState("")
  const [results, setResults] = useState<StockResult[]>([])
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleSearch = (value: string) => {
    setQ(value)
    clearTimeout(debounceRef.current)
    if (!value.trim()) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const res = await buscarStockParaCajaAction(value, cajaId)
      setLoading(false)
      if (res.success) setResults(res.data ?? [])
    }, 400)
  }

  const handleAssign = async (stockId: string) => {
    setAssigning(stockId)
    setError(null)
    const res = await addStockACajaAction(cajaId, stockId)
    setAssigning(null)
    if (res.success) {
      setResults(prev => prev.filter(r => r.id !== stockId))
    } else {
      setError(res.error ?? "Error al asignar")
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) { setQ(""); setResults([]); setError(null); onClose() }
  }

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
            <Dialog.Title className="text-lg font-semibold text-slate-900">
              Asignar artículo a la caja
            </Dialog.Title>
            <Dialog.Close className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <X size={18} />
            </Dialog.Close>
          </div>
          <div className="px-6 py-4 space-y-4 overflow-y-auto">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por código o descripción..."
                value={q}
                onChange={e => handleSearch(e.target.value)}
                autoFocus
                className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2.5 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
            {loading && <p className="text-center text-sm text-slate-400 py-4">Buscando...</p>}
            {!loading && results.length > 0 && (
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 overflow-hidden">
                {results.map(r => (
                  <div key={r.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{r.codigo}</p>
                      <p className="text-xs text-slate-500 truncate">{r.descripcion} · {r.proveedor}</p>
                    </div>
                    <button
                      onClick={() => handleAssign(r.id)}
                      disabled={assigning === r.id}
                      className="shrink-0 rounded-lg bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:opacity-50 transition-colors"
                    >
                      {assigning === r.id ? "Asignando..." : "Asignar"}
                    </button>
                  </div>
                ))}
              </div>
            )}
            {!loading && q.trim() && results.length === 0 && (
              <p className="text-center text-sm text-slate-400 py-4">Sin resultados para "{q}"</p>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

- [ ] **Paso 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Paso 3: Commit**

```bash
git add src/modules/cajas/components/AsignarArticuloModal.tsx
git commit -m "feat: AsignarArticuloModal — búsqueda y asignación de artículos a caja"
```

---

## Task 11: Cajas page

**Files:**
- Create: `src/app/dashboard/cajas/page.tsx`
- Create: `src/app/dashboard/cajas/CajasPageClient.tsx`

- [ ] **Paso 1: Crear page.tsx (server component)**

Crear `src/app/dashboard/cajas/page.tsx`:

```typescript
import { getCajasAction, getCajaByIdAction } from "@/modules/cajas/actions"
import CajasPageClient from "./CajasPageClient"

type SearchParams = Promise<{ q?: string; cajaId?: string }>

export default async function CajasPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const q = params.q ?? ""
  const cajaId = params.cajaId ?? null

  const cajasResult = await getCajasAction(q)
  const cajas = cajasResult.success ? cajasResult.data ?? [] : []

  const cajaResult = cajaId ? await getCajaByIdAction(cajaId) : null
  const cajaSeleccionada = cajaResult?.success ? cajaResult.data ?? null : null

  return (
    <CajasPageClient
      cajas={cajas}
      cajaSeleccionada={cajaSeleccionada}
      initialQ={q}
      initialCajaId={cajaId}
    />
  )
}
```

- [ ] **Paso 2: Crear CajasPageClient.tsx (client component)**

Crear `src/app/dashboard/cajas/CajasPageClient.tsx`:

```typescript
"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import * as Dialog from "@radix-ui/react-dialog"
import { Plus, Search, X, Box } from "lucide-react"
import CajasList from "@/modules/cajas/components/CajasList"
import CajaForm from "@/modules/cajas/components/CajaForm"
import ArticulosDeCaja from "@/modules/cajas/components/ArticulosDeCaja"
import AsignarArticuloModal from "@/modules/cajas/components/AsignarArticuloModal"

type Caja = {
  id: string
  nombre: string
  ubicacion: string
  _count: { stocks: number }
}

type StockItem = {
  stockId: string
  stock: {
    id: string
    codigo: string
    descripcion: string
    cantidad: number
    proveedor: { nombre: string }
  }
}

type CajaWithStocks = {
  id: string
  nombre: string
  ubicacion: string
  stocks: StockItem[]
}

export default function CajasPageClient({
  cajas,
  cajaSeleccionada,
  initialQ,
  initialCajaId,
}: {
  cajas: Caja[]
  cajaSeleccionada: CajaWithStocks | null
  initialQ: string
  initialCajaId: string | null
}) {
  const router = useRouter()
  const [q, setQ] = useState(initialQ)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCaja, setEditingCaja] = useState<Caja | null>(null)
  const [isAsignarOpen, setIsAsignarOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => { setQ(initialQ) }, [initialQ])

  function navigate(updates: { q?: string; cajaId?: string | null }) {
    const params = new URLSearchParams()
    const nextQ = updates.q !== undefined ? updates.q : q
    const nextCajaId = updates.cajaId !== undefined ? updates.cajaId : initialCajaId
    if (nextQ) params.set("q", nextQ)
    if (nextCajaId) params.set("cajaId", nextCajaId)
    router.push(`/dashboard/cajas?${params.toString()}`)
  }

  const handleQChange = (value: string) => {
    setQ(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => navigate({ q: value }), 400)
  }

  const handleOpenNew = () => { setEditingCaja(null); setIsFormOpen(true) }
  const handleOpenEdit = (caja: Caja) => { setEditingCaja(caja); setIsFormOpen(true) }
  const handleFormClose = () => { setIsFormOpen(false); setEditingCaja(null) }

  return (
    <div className="flex h-full gap-0 -m-6 min-h-[calc(100vh-4rem)]">
      {/* Panel izquierdo: lista de cajas */}
      <div className="w-72 shrink-0 flex flex-col border-r border-slate-200 bg-white">
        <div className="p-4 border-b border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Cajas</h2>
            <button
              onClick={handleOpenNew}
              className="flex items-center gap-1 rounded-lg bg-blue-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 transition-colors"
            >
              <Plus size={13} />
              Nueva
            </button>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar caja o artículo..."
              value={q}
              onChange={e => handleQChange(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white pl-8 pr-3 py-2 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <CajasList
            cajas={cajas}
            selectedId={initialCajaId}
            onSelect={id => navigate({ cajaId: id })}
            onEdit={handleOpenEdit}
          />
        </div>
      </div>

      {/* Panel derecho: artículos de la caja seleccionada */}
      <div className="flex-1 overflow-y-auto p-6">
        {cajaSeleccionada ? (
          <>
            <div className="mb-5">
              <h2 className="text-xl font-bold text-slate-900">{cajaSeleccionada.nombre}</h2>
              <p className="text-sm text-slate-500">{cajaSeleccionada.ubicacion}</p>
            </div>
            <ArticulosDeCaja
              cajaId={cajaSeleccionada.id}
              articulos={cajaSeleccionada.stocks}
              onAsignar={() => setIsAsignarOpen(true)}
            />
          </>
        ) : (
          <div className="flex h-full min-h-64 items-center justify-center">
            <div className="text-center">
              <Box size={48} className="mx-auto mb-3 text-slate-200" />
              <p className="text-slate-400">Seleccioná una caja para ver sus artículos</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal crear/editar caja */}
      <Dialog.Root open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <Dialog.Title className="text-lg font-semibold text-slate-900">
                {editingCaja ? "Editar caja" : "Nueva caja"}
              </Dialog.Title>
              <Dialog.Close className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                <X size={18} />
              </Dialog.Close>
            </div>
            <div className="px-6 py-5">
              <CajaForm caja={editingCaja} onSuccess={handleFormClose} />
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Modal asignar artículo */}
      {cajaSeleccionada && (
        <AsignarArticuloModal
          cajaId={cajaSeleccionada.id}
          open={isAsignarOpen}
          onClose={() => setIsAsignarOpen(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Paso 3: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Paso 4: Commit**

```bash
git add src/app/dashboard/cajas/
git commit -m "feat: página Cajas — split panel con lista de cajas y artículos"
```

---

## Task 12: Consulta Artículo — actions

**Files:**
- Create: `src/modules/consulta-articulo/actions.ts`

- [ ] **Paso 1: Crear el archivo**

Crear `src/modules/consulta-articulo/actions.ts`:

```typescript
"use server"

import { StockRepository } from "@/repositories/stock.repository"

function serializeStockWithCajas(stock: any) {
  return {
    ...stock,
    precioCosto: Number(stock.precioCosto),
    precioLista: Number(stock.precioLista),
    precioVenta: Number(stock.precioVenta),
    fechaPedido: stock.fechaPedido ? stock.fechaPedido.toISOString() : null,
    fechaRecibido: stock.fechaRecibido ? stock.fechaRecibido.toISOString() : null,
    createdAt: stock.createdAt.toISOString(),
    updatedAt: stock.updatedAt.toISOString(),
  }
}

export async function searchStockConCajasAction(q: string) {
  if (!q.trim()) return { success: true as const, data: [] }
  try {
    const results = await StockRepository.searchWithCajas(q)
    return { success: true as const, data: results.map(serializeStockWithCajas) }
  } catch (error) {
    console.error("Error al buscar stock:", error)
    return { success: false as const, error: "No se pudo buscar el artículo" }
  }
}

export async function getStockConCajasAction(id: string) {
  try {
    const stock = await StockRepository.findByIdWithCajas(id)
    if (!stock) return { success: false as const, error: "Artículo no encontrado" }
    return { success: true as const, data: serializeStockWithCajas(stock) }
  } catch (error) {
    console.error("Error al obtener stock:", error)
    return { success: false as const, error: "No se pudo cargar el artículo" }
  }
}
```

- [ ] **Paso 2: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Paso 3: Commit**

```bash
git add src/modules/consulta-articulo/actions.ts
git commit -m "feat: consulta-articulo actions — searchStockConCajas y getStockConCajas"
```

---

## Task 13: DetalleArticulo component + test

**Files:**
- Create: `src/modules/consulta-articulo/components/DetalleArticulo.tsx`
- Create: `src/modules/consulta-articulo/__tests__/DetalleArticulo.test.tsx`

- [ ] **Paso 1: Escribir el test que falla**

Crear `src/modules/consulta-articulo/__tests__/DetalleArticulo.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import DetalleArticulo from '../components/DetalleArticulo'

const articulo = {
  id: 's1',
  codigo: 'TM8-30',
  codigoOriginal: 'ORI-123',
  descripcion: 'Tornillo M8 x 30',
  cantidad: 45,
  cantidadCritica: 10,
  cantidadSugerida: 20,
  fechaPedido: '2026-03-01T00:00:00.000Z',
  fechaRecibido: '2026-03-15T00:00:00.000Z',
  precioCosto: 120,
  precioLista: 180,
  precioVenta: 200,
  imagen: null,
  proveedor: { nombre: 'Ferretería Norte' },
  cajas: [
    { cajaId: 'c1', caja: { id: 'c1', nombre: 'Caja A-1', ubicacion: 'Depósito Planta' } },
  ],
}

describe('DetalleArticulo', () => {
  it('muestra descripción, código y proveedor', () => {
    render(<DetalleArticulo articulo={articulo} />)
    expect(screen.getByText('Tornillo M8 x 30')).toBeInTheDocument()
    expect(screen.getByText(/TM8-30/)).toBeInTheDocument()
    expect(screen.getByText(/Ferretería Norte/)).toBeInTheDocument()
  })

  it('muestra las cantidades', () => {
    render(<DetalleArticulo articulo={articulo} />)
    expect(screen.getByText('45')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
  })

  it('muestra las cajas asignadas', () => {
    render(<DetalleArticulo articulo={articulo} />)
    expect(screen.getByText(/Caja A-1/)).toBeInTheDocument()
    expect(screen.getByText(/Depósito Planta/)).toBeInTheDocument()
  })

  it('muestra mensaje cuando no tiene cajas asignadas', () => {
    render(<DetalleArticulo articulo={{ ...articulo, cajas: [] }} />)
    expect(screen.getByText(/sin cajas asignadas/i)).toBeInTheDocument()
  })

  it('muestra placeholder cuando no hay imagen', () => {
    render(<DetalleArticulo articulo={articulo} />)
    expect(screen.queryByRole('img', { name: 'Tornillo M8 x 30' })).not.toBeInTheDocument()
  })
})
```

- [ ] **Paso 2: Correr test para verificar que falla**

```bash
npx jest src/modules/consulta-articulo/__tests__/DetalleArticulo.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module '../components/DetalleArticulo'`

- [ ] **Paso 3: Crear DetalleArticulo**

Crear `src/modules/consulta-articulo/components/DetalleArticulo.tsx`:

```typescript
"use client"

import { useState } from "react"
import { Package } from "lucide-react"
import { Importe } from "@/components/ui/ImporteInput"

type Caja = { id: string; nombre: string; ubicacion: string }

type Articulo = {
  id: string
  codigo: string
  codigoOriginal: string | null
  descripcion: string
  cantidad: number
  cantidadCritica: number
  cantidadSugerida: number
  fechaPedido: string | null
  fechaRecibido: string | null
  precioCosto: number
  precioLista: number
  precioVenta: number
  imagen: string | null
  proveedor: { nombre: string }
  cajas: Array<{ cajaId: string; caja: Caja }>
}

export default function DetalleArticulo({ articulo }: { articulo: Articulo }) {
  const [imgError, setImgError] = useState(false)
  const lowStock = articulo.cantidad <= articulo.cantidadCritica

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex gap-6 p-6">
        {/* Imagen */}
        <div className="shrink-0">
          {articulo.imagen && !imgError ? (
            <img
              src={articulo.imagen}
              alt={articulo.descripcion}
              onError={() => setImgError(true)}
              className="h-32 w-32 rounded-lg object-contain border border-slate-100 bg-slate-50"
            />
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-slate-100 bg-slate-50">
              <Package size={40} className="text-slate-200" />
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{articulo.descripcion}</h2>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
              <span>Código: <span className="font-semibold text-slate-700">{articulo.codigo}</span></span>
              {articulo.codigoOriginal && (
                <span>Código original: <span className="font-semibold text-slate-700">{articulo.codigoOriginal}</span></span>
              )}
              <span>Proveedor: <span className="font-semibold text-slate-700">{articulo.proveedor.nombre}</span></span>
            </div>
          </div>

          {/* Stock badges */}
          <div className="flex gap-3">
            <div className={`rounded-lg px-4 py-2 text-center ring-1 ring-inset ${
              lowStock ? "bg-red-50 ring-red-200" : "bg-emerald-50 ring-emerald-200"
            }`}>
              <p className="text-xs text-slate-500">Stock actual</p>
              <p className={`text-2xl font-bold ${lowStock ? "text-red-700" : "text-emerald-700"}`}>{articulo.cantidad}</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-4 py-2 text-center ring-1 ring-inset ring-slate-200">
              <p className="text-xs text-slate-500">Crítico</p>
              <p className="text-2xl font-bold text-slate-700">{articulo.cantidadCritica}</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-4 py-2 text-center ring-1 ring-inset ring-slate-200">
              <p className="text-xs text-slate-500">Sugerido</p>
              <p className="text-2xl font-bold text-slate-700">{articulo.cantidadSugerida}</p>
            </div>
          </div>

          {/* Precios */}
          <div className="grid grid-cols-3 gap-3 rounded-lg bg-slate-50 p-3 border border-slate-100">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Costo</p>
              <p className="text-base font-bold text-slate-900"><Importe value={articulo.precioCosto} /></p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lista</p>
              <p className="text-base font-bold text-slate-900"><Importe value={articulo.precioLista} /></p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Venta</p>
              <p className="text-base font-bold text-blue-700"><Importe value={articulo.precioVenta} /></p>
            </div>
          </div>

          {/* Fechas */}
          {(articulo.fechaPedido || articulo.fechaRecibido) && (
            <div className="flex gap-6 text-sm text-slate-500">
              {articulo.fechaPedido && (
                <span>Fecha pedido: <span className="text-slate-700">{new Date(articulo.fechaPedido).toLocaleDateString('es-AR')}</span></span>
              )}
              {articulo.fechaRecibido && (
                <span>Fecha recibido: <span className="text-slate-700">{new Date(articulo.fechaRecibido).toLocaleDateString('es-AR')}</span></span>
              )}
            </div>
          )}

          {/* Cajas */}
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-700">
              {articulo.cajas.length === 0 ? "Sin cajas asignadas" : "Cajas:"}
            </p>
            <div className="flex flex-wrap gap-2">
              {articulo.cajas.map(sc => (
                <span
                  key={sc.cajaId}
                  className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200"
                >
                  {sc.caja.nombre} · {sc.caja.ubicacion}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Paso 4: Correr tests para verificar que pasan**

```bash
npx jest src/modules/consulta-articulo/__tests__/DetalleArticulo.test.tsx --no-coverage
```

Expected: PASS (5 tests)

- [ ] **Paso 5: Commit**

```bash
git add src/modules/consulta-articulo/components/DetalleArticulo.tsx src/modules/consulta-articulo/__tests__/DetalleArticulo.test.tsx
git commit -m "feat: DetalleArticulo — card de detalle completo con imagen, stocks y cajas"
```

---

## Task 14: ResultadosBusqueda component + test

**Files:**
- Create: `src/modules/consulta-articulo/components/ResultadosBusqueda.tsx`
- Create: `src/modules/consulta-articulo/__tests__/ResultadosBusqueda.test.tsx`

- [ ] **Paso 1: Escribir el test que falla**

Crear `src/modules/consulta-articulo/__tests__/ResultadosBusqueda.test.tsx`:

```typescript
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
```

- [ ] **Paso 2: Correr test para verificar que falla**

```bash
npx jest src/modules/consulta-articulo/__tests__/ResultadosBusqueda.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module '../components/ResultadosBusqueda'`

- [ ] **Paso 3: Crear ResultadosBusqueda**

Crear `src/modules/consulta-articulo/components/ResultadosBusqueda.tsx`:

```typescript
type Resultado = {
  id: string
  codigo: string
  descripcion: string
  proveedor: { nombre: string }
  cantidad: number
}

export default function ResultadosBusqueda({
  resultados,
  onSelect,
}: {
  resultados: Resultado[]
  onSelect: (id: string) => void
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Código</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Descripción</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Proveedor</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Cant.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {resultados.map(r => (
            <tr
              key={r.id}
              onClick={() => onSelect(r.id)}
              className="cursor-pointer hover:bg-blue-50 transition-colors"
            >
              <td className="px-4 py-3 text-sm font-semibold text-slate-900">{r.codigo}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{r.descripcion}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{r.proveedor.nombre}</td>
              <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">{r.cantidad}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Paso 4: Correr tests para verificar que pasan**

```bash
npx jest src/modules/consulta-articulo/__tests__/ResultadosBusqueda.test.tsx --no-coverage
```

Expected: PASS (2 tests)

- [ ] **Paso 5: Commit**

```bash
git add src/modules/consulta-articulo/components/ResultadosBusqueda.tsx src/modules/consulta-articulo/__tests__/ResultadosBusqueda.test.tsx
git commit -m "feat: ResultadosBusqueda — tabla de resultados clicable"
```

---

## Task 15: Consulta Artículo page

**Files:**
- Create: `src/app/dashboard/consulta-articulo/page.tsx`
- Create: `src/app/dashboard/consulta-articulo/ConsultaArticuloPageClient.tsx`

- [ ] **Paso 1: Crear page.tsx (server component)**

Crear `src/app/dashboard/consulta-articulo/page.tsx`:

```typescript
import { searchStockConCajasAction, getStockConCajasAction } from "@/modules/consulta-articulo/actions"
import ConsultaArticuloPageClient from "./ConsultaArticuloPageClient"

type SearchParams = Promise<{ q?: string; id?: string }>

export default async function ConsultaArticuloPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const q = params.q ?? ""
  const id = params.id ?? ""

  const [searchResult, detailResult] = await Promise.all([
    q ? searchStockConCajasAction(q) : Promise.resolve({ success: true as const, data: [] }),
    id ? getStockConCajasAction(id) : Promise.resolve({ success: true as const, data: null }),
  ])

  const resultados = searchResult.success ? searchResult.data ?? [] : []
  const articulo = detailResult.success ? detailResult.data ?? null : null

  return (
    <ConsultaArticuloPageClient
      resultados={resultados}
      articulo={articulo}
      initialQ={q}
      initialId={id}
    />
  )
}
```

- [ ] **Paso 2: Crear ConsultaArticuloPageClient.tsx**

Crear `src/app/dashboard/consulta-articulo/ConsultaArticuloPageClient.tsx`:

```typescript
"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Package } from "lucide-react"
import DetalleArticulo from "@/modules/consulta-articulo/components/DetalleArticulo"
import ResultadosBusqueda from "@/modules/consulta-articulo/components/ResultadosBusqueda"

export default function ConsultaArticuloPageClient({
  resultados,
  articulo,
  initialQ,
  initialId,
}: {
  resultados: any[]
  articulo: any | null
  initialQ: string
  initialId: string
}) {
  const router = useRouter()
  const [q, setQ] = useState(initialQ)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => { setQ(initialQ) }, [initialQ])

  function navigate(updates: { q?: string; id?: string }) {
    const params = new URLSearchParams()
    const nextQ = updates.q !== undefined ? updates.q : q
    const nextId = updates.id !== undefined ? updates.id : initialId
    if (nextQ) params.set("q", nextQ)
    if (nextId) params.set("id", nextId)
    router.push(`/dashboard/consulta-articulo?${params.toString()}`)
  }

  const handleQChange = (value: string) => {
    setQ(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => navigate({ q: value, id: "" }), 400)
  }

  const displayedArticulo = articulo ?? (resultados.length === 1 ? resultados[0] : null)
  const showResults = !initialId && resultados.length > 1

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Consulta de Artículo</h1>
        <p className="mt-1 text-slate-500">Buscá un artículo para ver su detalle completo</p>
      </div>

      <div className="relative max-w-xl">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar por código o descripción..."
          value={q}
          onChange={e => handleQChange(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-3 text-base placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm"
        />
      </div>

      {showResults && (
        <div>
          <p className="mb-3 text-sm text-slate-500">{resultados.length} resultados para &ldquo;{initialQ}&rdquo;</p>
          <ResultadosBusqueda resultados={resultados} onSelect={id => navigate({ id })} />
        </div>
      )}

      {displayedArticulo && <DetalleArticulo articulo={displayedArticulo} />}

      {!displayedArticulo && !showResults && initialQ && (
        <div className="py-16 text-center">
          <Package size={48} className="mx-auto mb-3 text-slate-200" />
          <p className="text-slate-400">Sin resultados para &ldquo;{initialQ}&rdquo;</p>
        </div>
      )}

      {!initialQ && (
        <div className="py-16 text-center">
          <Package size={48} className="mx-auto mb-3 text-slate-200" />
          <p className="text-slate-400">Ingresá un código o descripción para buscar</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Paso 3: Verificar tipos**

```bash
npx tsc --noEmit
```

Expected: sin errores.

- [ ] **Paso 4: Commit**

```bash
git add src/app/dashboard/consulta-articulo/
git commit -m "feat: página Consulta de Artículo — búsqueda, lista y detalle completo"
```

---

## Task 16: Navegación — agregar Cajas y Consulta Artículo al sidebar

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Paso 1: Agregar las dos entradas al array de subItems de Gestión**

En `src/components/layout/Sidebar.tsx`, dentro del objeto `Gestión`, agregar al final de `subItems`:

```typescript
    subItems: [
      { name: "Stock", href: "/dashboard/stock" },
      { name: "Proveedores", href: "/dashboard/proveedores" },
      { name: "Pedidos", href: "/dashboard/pedidos" },
      { name: "Facturas", href: "/dashboard/facturas" },
      { name: "Recepción", href: "/dashboard/recepcion" },
      { name: "Cajas", href: "/dashboard/cajas" },
      { name: "Consulta Artículo", href: "/dashboard/consulta-articulo" },
    ]
```

- [ ] **Paso 2: Verificar en el navegador**

Arrancar el servidor de desarrollo:

```bash
npm run dev
```

Navegar a `http://localhost:3000/dashboard` y verificar que:
1. El menú Gestión muestra "Cajas" y "Consulta Artículo"
2. Los links navegan correctamente a `/dashboard/cajas` y `/dashboard/consulta-articulo`
3. Las páginas cargan sin errores
4. El split panel de Cajas funciona: crear caja → aparece en la lista → hacer click la selecciona → panel derecho muestra "Asignar"
5. Consulta Artículo: buscar un código existente → muestra resultados o detalle

- [ ] **Paso 3: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: sidebar — agregar Cajas y Consulta Artículo en Gestión"
```

---

## Task 17: E2E tests — Cajas

**Files:**
- Create: `tests/e2e/cajas.spec.ts`
- Modify: `tests/e2e/pages/PageObjects.ts`

- [ ] **Paso 1: Agregar helpers de Cajas a PageObjects**

En `tests/e2e/pages/PageObjects.ts`, dentro de la clase `DashboardPage`, agregar los siguientes métodos:

```typescript
  async goToCajas() {
    await this.page.getByText('Gestión').click();
    await this.page.getByRole('link', { name: 'Cajas' }).click();
    await expect(this.page.getByRole('heading', { name: 'Cajas', level: 2 })).toBeVisible();
  }

  async createCaja(nombre: string, ubicacion: string) {
    await this.page.getByRole('button', { name: /nueva/i }).click();
    await this.page.getByPlaceholder('Ej: Caja A-1').fill(nombre);
    await this.page.getByPlaceholder('Ej: Depósito Planta Baja').fill(ubicacion);
    await this.page.getByRole('button', { name: /guardar caja/i }).click();
    await expect(this.page.getByRole('dialog')).not.toBeVisible();
    await expect(this.page.getByText(nombre)).toBeVisible();
  }
```

- [ ] **Paso 2: Crear el spec de Cajas**

Crear `tests/e2e/cajas.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from './pages/PageObjects';

test.describe('Cajas', () => {
  test('Debería crear una caja, asignarle un artículo y luego quitarlo', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.loginAsTestUser();

    // 1. Crear proveedor y artículo de stock para la prueba
    const provName = `Prov-Cajas-${Date.now()}`;
    await dashboardPage.goToProveedores();
    await dashboardPage.createProveedor(provName, 'Descuento', '0');

    const stockCode = `BOX-${Date.now()}`;
    await dashboardPage.goToStock();
    await dashboardPage.createStock(provName, stockCode, 'Artículo para Caja Test', '500');

    // 2. Crear caja
    const cajaNombre = `Caja-Test-${Date.now()}`;
    await dashboardPage.goToCajas();
    await dashboardPage.createCaja(cajaNombre, 'Depósito Test');

    // 3. Seleccionar caja y asignar artículo
    await page.getByText(cajaNombre).click();
    await expect(page.getByRole('heading', { name: cajaNombre })).toBeVisible();
    await page.getByRole('button', { name: /asignar/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByPlaceholder('Buscar por código o descripción...').fill(stockCode);
    await page.waitForTimeout(600); // esperar debounce
    await expect(page.getByText(stockCode)).toBeVisible();
    await page.getByRole('button', { name: /^asignar$/i }).click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();

    // 4. Verificar que el artículo aparece en la tabla
    await expect(page.getByRole('cell', { name: stockCode })).toBeVisible();

    // 5. Quitar artículo de la caja
    await page.getByRole('button', { name: /quitar artículo para caja test/i }).click();
    await page.getByRole('button', { name: /^quitar$/i }).click();
    await expect(page.getByRole('cell', { name: stockCode })).not.toBeVisible();
  });
});
```

- [ ] **Paso 3: Commit**

```bash
git add tests/e2e/cajas.spec.ts tests/e2e/pages/PageObjects.ts
git commit -m "test(e2e): cajas — happy path crear, asignar y quitar artículo"
```

---

## Task 18: E2E tests — Consulta Artículo

**Files:**
- Create: `tests/e2e/consulta-articulo.spec.ts`
- Modify: `tests/e2e/pages/PageObjects.ts`

- [ ] **Paso 1: Agregar helper goToConsultaArticulo a PageObjects**

En `tests/e2e/pages/PageObjects.ts`, dentro de la clase `DashboardPage`, agregar:

```typescript
  async goToConsultaArticulo() {
    await this.page.getByText('Gestión').click();
    await this.page.getByRole('link', { name: 'Consulta Artículo' }).click();
    await expect(this.page.getByRole('heading', { name: 'Consulta de Artículo' })).toBeVisible();
  }
```

- [ ] **Paso 2: Crear el spec de Consulta Artículo**

Crear `tests/e2e/consulta-articulo.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from './pages/PageObjects';

test.describe('Consulta de Artículo', () => {
  test('Debería buscar un artículo y mostrar su detalle completo', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.loginAsTestUser();

    // 1. Crear proveedor y artículo con imagen para la prueba
    const provName = `Prov-Consulta-${Date.now()}`;
    await dashboardPage.goToProveedores();
    await dashboardPage.createProveedor(provName, 'Dto', '0');

    const stockCode = `CONS-${Date.now()}`;
    await dashboardPage.goToStock();
    await dashboardPage.createStock(provName, stockCode, 'Pieza de Consulta Test', '300');

    // 2. Ir a Consulta de Artículo y buscar
    await dashboardPage.goToConsultaArticulo();
    await page.getByPlaceholder('Buscar por código o descripción...').fill(stockCode);
    await page.waitForTimeout(600); // esperar debounce

    // 3. Verificar que aparece el detalle del artículo
    await expect(page.getByText('Pieza de Consulta Test')).toBeVisible();
    await expect(page.getByText(new RegExp(stockCode))).toBeVisible();
    await expect(page.getByText(new RegExp(provName))).toBeVisible();

    // 4. Verificar secciones de stock y precios
    await expect(page.getByText('Stock actual')).toBeVisible();
    await expect(page.getByText('Costo')).toBeVisible();
    await expect(page.getByText('Venta')).toBeVisible();

    // 5. Verificar sección cajas (sin cajas asignadas)
    await expect(page.getByText(/sin cajas asignadas/i)).toBeVisible();
  });
});
```

- [ ] **Paso 3: Commit**

```bash
git add tests/e2e/consulta-articulo.spec.ts tests/e2e/pages/PageObjects.ts
git commit -m "test(e2e): consulta-articulo — happy path búsqueda y detalle de artículo"
```

---

## Task 19: Correr todos los tests unitarios

- [ ] **Paso 1: Correr suite completa de unit tests**

```bash
npm test -- --no-coverage
```

Expected: todos los tests pasan, incluyendo los nuevos de CajaForm, CajasList, ArticulosDeCaja, DetalleArticulo, ResultadosBusqueda y StockForm.

- [ ] **Paso 2: Si hay fallos, revisar y corregir**

Si algún test falla, leer el mensaje de error, corregir el componente o el test según corresponda, y re-correr.

- [ ] **Paso 3: Commit final si hay correcciones**

```bash
git add -p
git commit -m "fix: corregir tests tras integración completa"
```
