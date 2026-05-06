# Recepción de Mercadería — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separar el módulo de facturas en dos rutas independientes (listado y carga), asociar cada factura a un proveedor en la DB, y construir una página de recepción de mercadería con layout POS.

**Architecture:** Se agrega `proveedorId` al modelo `Factura` con migración. La ruta `/dashboard/recepcion` es la nueva página de carga con layout POS de dos columnas (buscador + tabla a la izquierda, formulario sticky a la derecha). La ruta `/dashboard/facturas` queda solo como listado. El sidebar gana un ítem extra en el grupo Gestión.

**Tech Stack:** Next.js 15 (App Router), Prisma + MySQL, Radix UI, Tailwind CSS, Playwright (E2E)

---

## File Map

| Archivo | Acción | Responsabilidad |
|---------|--------|-----------------|
| `prisma/schema.prisma` | Modificar | Agregar `proveedorId` + relación en `Factura` |
| `src/app/api/stock/search/route.ts` | Modificar | Serializar Decimals antes de devolver JSON |
| `src/repositories/factura.repository.ts` | Modificar | Incluir proveedor en tipo y queries |
| `src/modules/facturas/actions.ts` | Modificar | Agregar `proveedorId` a create, serializar proveedor |
| `src/components/layout/Sidebar.tsx` | Modificar | Dos ítems: Facturas + Recepción |
| `src/app/dashboard/facturas/FacturasPageClient.tsx` | Modificar | Quitar modal y botón "Nueva factura" |
| `src/modules/facturas/components/FacturasList.tsx` | Modificar | Agregar columna Proveedor |
| `src/modules/facturas/components/FacturaForm.tsx` | Eliminar | Reemplazado por RecepcionPageClient |
| `src/app/dashboard/recepcion/page.tsx` | Crear | Server component — carga proveedores |
| `src/app/dashboard/recepcion/RecepcionPageClient.tsx` | Crear | Client component — layout POS completo |
| `tests/e2e/pages/PageObjects.ts` | Modificar | Agregar métodos `goToRecepcion` y `registrarIngreso` |
| `tests/e2e/recepcion.spec.ts` | Crear | Test E2E happy path de recepción |

---

## Task 1: Serializar Decimals en API de búsqueda de stock

**Files:**
- Modify: `src/app/api/stock/search/route.ts`

- [ ] **Step 1: Actualizar el route handler para serializar Decimals**

Reemplazar el contenido de `src/app/api/stock/search/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { StockRepository } from "@/repositories/stock.repository"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = request.nextUrl
  const proveedorId = searchParams.get("proveedorId") || undefined
  const codigo = searchParams.get("codigo") || undefined

  try {
    const results = await StockRepository.search({ proveedorId, codigo })
    const serialized = results.map(r => ({
      ...r,
      precioCosto: r.precioCosto.toNumber(),
      precioLista: r.precioLista.toNumber(),
      precioVenta: r.precioVenta.toNumber(),
    }))
    return NextResponse.json(serialized)
  } catch (error) {
    console.error("Error en búsqueda de stock:", error)
    return NextResponse.json({ error: "Error al buscar" }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verificar manualmente**

Con el servidor corriendo (`npm run dev`), abrir en el navegador:
`http://localhost:3000/api/stock/search?codigo=a`

Verificar que la respuesta JSON tiene `precioCosto`, `precioLista`, `precioVenta` como números (ej. `1500.00`), no como objetos Decimal.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/stock/search/route.ts
git commit -m "fix: serializar Decimals en API de búsqueda de stock"
```

---

## Task 2: Migración — agregar proveedorId a Factura

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Actualizar el schema de Prisma**

En `prisma/schema.prisma`, reemplazar el modelo `Factura` por:

```prisma
model Factura {
  id          String   @id @default(uuid())
  proveedorId String
  numero      String   @db.VarChar(100)
  importe     Decimal  @db.Decimal(10, 2)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  proveedor Proveedor   @relation(fields: [proveedorId], references: [id])
  items     FacturaItem[]
}
```

Y agregar `facturas Factura[]` al modelo `Proveedor`, después de `stocks Stock[]`:

```prisma
model Proveedor {
  id        String   @id @default(uuid())
  nombre    String   @db.VarChar(255)
  notas     String?  @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  descuentos DescuentoProveedor[]
  stocks     Stock[]
  facturas   Factura[]
}
```

- [ ] **Step 2: Correr la migración**

Si hay registros de facturas existentes en la DB de desarrollo, truncarlos primero (el nuevo campo es requerido):

```bash
# Solo si hay facturas existentes:
npx prisma db execute --stdin <<< "TRUNCATE TABLE FacturaItem; TRUNCATE TABLE Factura;"
```

Luego correr la migración:

```bash
npx prisma migrate dev --name add-proveedor-to-factura
```

Salida esperada: `Your database is now in sync with your schema.`

- [ ] **Step 3: Regenerar el cliente de Prisma**

```bash
npx prisma generate
```

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: agregar proveedorId al modelo Factura"
```

---

## Task 3: Actualizar FacturaRepository

**Files:**
- Modify: `src/repositories/factura.repository.ts`

- [ ] **Step 1: Actualizar el tipo y las queries**

Reemplazar el contenido completo de `src/repositories/factura.repository.ts`:

```typescript
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export type FacturaWithItems = Prisma.FacturaGetPayload<{
  include: {
    proveedor: true
    items: { include: { stock: { include: { proveedor: true } } } }
  }
}>

export const FacturaRepository = {
  async findAll(): Promise<FacturaWithItems[]> {
    return prisma.factura.findMany({
      include: {
        proveedor: true,
        items: {
          include: { stock: { include: { proveedor: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })
  },

  async create(data: {
    proveedorId: string
    numero: string
    importe: number
    items: { stockId: string; cantidad: number }[]
  }): Promise<FacturaWithItems> {
    return prisma.$transaction(async (tx) => {
      const factura = await tx.factura.create({
        data: {
          proveedorId: data.proveedorId,
          numero: data.numero,
          importe: new Prisma.Decimal(data.importe),
        },
      })

      await tx.facturaItem.createMany({
        data: data.items.map((item) => ({
          facturaId: factura.id,
          stockId: item.stockId,
          cantidad: item.cantidad,
        })),
      })

      for (const item of data.items) {
        await tx.stock.update({
          where: { id: item.stockId },
          data: { cantidad: { increment: item.cantidad } },
        })

        const pedidos = await tx.repuestoPedido.findMany({
          where: {
            stockId: item.stockId,
            fechaPedido: { not: null },
            fechaRecibido: null,
          },
          orderBy: { fechaPedido: "asc" },
        })

        let remaining = item.cantidad

        for (const pedido of pedidos) {
          if (remaining <= 0) break

          if (remaining >= pedido.cantidad) {
            await tx.repuestoPedido.update({
              where: { id: pedido.id },
              data: { fechaRecibido: new Date() },
            })
            remaining -= pedido.cantidad
          } else {
            await tx.repuestoPedido.update({
              where: { id: pedido.id },
              data: {
                cantidad: pedido.cantidad - remaining,
                fechaPedido: null,
                fechaRecibido: null,
              },
            })
            remaining = 0
          }
        }
      }

      return tx.factura.findUniqueOrThrow({
        where: { id: factura.id },
        include: {
          proveedor: true,
          items: {
            include: { stock: { include: { proveedor: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
      })
    })
  },
}
```

- [ ] **Step 2: Verificar que compila sin errores**

```bash
npx tsc --noEmit
```

Salida esperada: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/repositories/factura.repository.ts
git commit -m "feat: incluir proveedor en FacturaRepository"
```

---

## Task 4: Actualizar actions de facturas

**Files:**
- Modify: `src/modules/facturas/actions.ts`

- [ ] **Step 1: Actualizar el archivo completo**

Reemplazar el contenido de `src/modules/facturas/actions.ts`:

```typescript
"use server"

import { FacturaRepository, FacturaWithItems } from "@/repositories/factura.repository"
import { revalidatePath } from "next/cache"

function serializeStock(stock: FacturaWithItems["items"][number]["stock"]) {
  return {
    ...stock,
    precioCosto: stock.precioCosto.toNumber(),
    precioLista: stock.precioLista.toNumber(),
    precioVenta: stock.precioVenta.toNumber(),
  }
}

function serializeFactura(factura: FacturaWithItems) {
  return {
    ...factura,
    importe: factura.importe.toNumber(),
    items: factura.items.map((item) => ({
      ...item,
      stock: serializeStock(item.stock),
    })),
  }
}

export async function getFacturasAction() {
  try {
    const data = await FacturaRepository.findAll()
    return data.map(serializeFactura)
  } catch (error) {
    console.error("Error al obtener facturas:", error)
    throw new Error("No se pudieron cargar las facturas")
  }
}

export async function createFacturaAction(data: {
  proveedorId: string
  numero: string
  importe: number
  items: { stockId: string; cantidad: number }[]
}) {
  try {
    const factura = await FacturaRepository.create(data)
    revalidatePath("/dashboard/facturas")
    revalidatePath("/dashboard/pedidos")
    revalidatePath("/dashboard/stock")
    return { success: true, data: serializeFactura(factura) }
  } catch (error) {
    console.error("Error al crear factura:", error)
    return { success: false, error: "No se pudo registrar la factura" }
  }
}
```

- [ ] **Step 2: Verificar compilación**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/modules/facturas/actions.ts
git commit -m "feat: agregar proveedorId a createFacturaAction y serializar proveedor"
```

---

## Task 5: Actualizar el Sidebar

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Reemplazar el ítem "Facturas" por dos sub-ítems**

En `src/components/layout/Sidebar.tsx`, reemplazar el array `subItems` del grupo "Gestión":

```typescript
const menu = [
  { name: "Inicio", icon: Home, href: "/dashboard" },
  {
    name: "Gestión",
    icon: Package,
    subItems: [
      { name: "Stock", href: "/dashboard/stock" },
      { name: "Proveedores", href: "/dashboard/proveedores" },
      { name: "Pedidos", href: "/dashboard/pedidos" },
      { name: "Facturas", href: "/dashboard/facturas" },
      { name: "Recepción", href: "/dashboard/recepcion" },
    ]
  },
  { name: "Configuración", icon: Settings, href: "/dashboard/configuracion" },
]
```

- [ ] **Step 2: Verificar en el navegador**

Con `npm run dev`, navegar al dashboard y verificar que el menú Gestión muestra ambos ítems: "Facturas" y "Recepción". Ambos links deben marcar su ítem como activo al estar en la ruta correspondiente.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: agregar ítem Recepción al sidebar"
```

---

## Task 6: Actualizar FacturasList y FacturasPageClient

**Files:**
- Modify: `src/modules/facturas/components/FacturasList.tsx`
- Modify: `src/app/dashboard/facturas/FacturasPageClient.tsx`
- Delete: `src/modules/facturas/components/FacturaForm.tsx`

- [ ] **Step 1: Agregar columna Proveedor a FacturasList**

Reemplazar el contenido de `src/modules/facturas/components/FacturasList.tsx`:

```typescript
"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight } from "lucide-react"
import React from "react"

export default function FacturasList({ facturas }: { facturas: any[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="py-3.5 pl-4 pr-2 w-8" />
            <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">Número</th>
            <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">Proveedor</th>
            <th className="px-4 py-3.5 text-right text-sm font-semibold text-slate-700">Importe</th>
            <th className="px-4 py-3.5 text-left text-sm font-semibold text-slate-700">Fecha</th>
            <th className="px-4 py-3.5 text-right text-sm font-semibold text-slate-700 pr-6">Ítems</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {facturas.map(factura => {
            const isOpen = expanded.has(factura.id)
            return (
              <React.Fragment key={factura.id}>
                <tr
                  onClick={() => toggle(factura.id)}
                  className="cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <td className="py-4 pl-4 pr-2 text-slate-400">
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </td>
                  <td className="px-4 py-4 text-base font-semibold text-slate-900">
                    {factura.numero}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">
                    {factura.proveedor?.nombre ?? "—"}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-900 text-right">
                    ${Number(factura.importe).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500">
                    {new Date(factura.createdAt).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-4 py-4 pr-6 text-right">
                    <span className="inline-flex items-center justify-center rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
                      {factura.items.length}
                    </span>
                  </td>
                </tr>

                {isOpen && (
                  <tr className="bg-slate-50/60">
                    <td colSpan={6} className="px-10 py-4">
                      <table className="min-w-full">
                        <thead>
                          <tr>
                            <th className="pb-2 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Código</th>
                            <th className="pb-2 pl-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Descripción</th>
                            <th className="pb-2 pl-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Proveedor</th>
                            <th className="pb-2 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide">Cantidad</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {factura.items.map((item: any) => (
                            <tr key={item.id}>
                              <td className="py-2 text-sm font-semibold text-slate-900">{item.stock.codigo}</td>
                              <td className="py-2 pl-4 text-sm text-slate-600">{item.stock.descripcion}</td>
                              <td className="py-2 pl-4 text-sm text-slate-400">{item.stock.proveedor?.nombre}</td>
                              <td className="py-2 text-right text-sm font-semibold text-slate-900">{item.cantidad}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            )
          })}
          {facturas.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-slate-400">
                No hay facturas registradas.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 2: Simplificar FacturasPageClient (quitar modal)**

Reemplazar el contenido de `src/app/dashboard/facturas/FacturasPageClient.tsx`:

```typescript
"use client"

import FacturasList from "@/modules/facturas/components/FacturasList"

export default function FacturasPageClient({ initialFacturas }: { initialFacturas: any[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Facturas</h1>
        <p className="mt-1 text-slate-500">
          {initialFacturas.length === 0
            ? "Sin facturas registradas"
            : `${initialFacturas.length} factura${initialFacturas.length !== 1 ? "s" : ""} registrada${initialFacturas.length !== 1 ? "s" : ""}`}
        </p>
      </div>
      <FacturasList facturas={initialFacturas} />
    </div>
  )
}
```

- [ ] **Step 3: Eliminar FacturaForm.tsx**

```bash
rm src/modules/facturas/components/FacturaForm.tsx
```

- [ ] **Step 4: Verificar compilación**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/modules/facturas/components/FacturasList.tsx
git add src/app/dashboard/facturas/FacturasPageClient.tsx
git rm src/modules/facturas/components/FacturaForm.tsx
git commit -m "feat: columna proveedor en facturas, quitar modal de creación"
```

---

## Task 7: Crear la página de Recepción

**Files:**
- Create: `src/app/dashboard/recepcion/page.tsx`
- Create: `src/app/dashboard/recepcion/RecepcionPageClient.tsx`

- [ ] **Step 1: Crear el server component**

Crear `src/app/dashboard/recepcion/page.tsx`:

```typescript
import { getProveedoresAction } from "@/modules/proveedores/actions"
import RecepcionPageClient from "./RecepcionPageClient"

export default async function RecepcionPage() {
  const proveedores = await getProveedoresAction()
  return <RecepcionPageClient proveedores={proveedores} />
}
```

- [ ] **Step 2: Crear el client component con layout POS**

Crear `src/app/dashboard/recepcion/RecepcionPageClient.tsx`:

```typescript
"use client"

import { useState, useRef, useCallback } from "react"
import { Barcode, Loader2, Trash2, PackageOpen, Check } from "lucide-react"
import { createFacturaAction } from "@/modules/facturas/actions"
import { useRouter } from "next/navigation"

type StockResult = {
  id: string
  codigo: string
  descripcion: string
  proveedor: { nombre: string }
}

type ItemRow = {
  stockId: string
  codigo: string
  descripcion: string
  cantidad: number
}

type Proveedor = {
  id: string
  nombre: string
}

export default function RecepcionPageClient({ proveedores }: { proveedores: Proveedor[] }) {
  const router = useRouter()
  const [proveedorId, setProveedorId] = useState("")
  const [numero, setNumero] = useState("")
  const [importe, setImporte] = useState<number | "">("")
  const [items, setItems] = useState<ItemRow[]>([])
  const [query, setQuery] = useState("")
  const [suggestions, setSuggestions] = useState<StockResult[]>([])
  const [searching, setSearching] = useState(false)
  const [loading, setLoading] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout>>()

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
    setSuggestions([])
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!value.trim() || value.length < 2) return
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ codigo: value })
        if (proveedorId) params.set("proveedorId", proveedorId)
        const res = await fetch(`/api/stock/search?${params}`)
        const data = res.ok ? await res.json() : []
        setSuggestions(data)
      } finally {
        setSearching(false)
      }
    }, 300)
  }, [proveedorId])

  const addItem = (stock: StockResult) => {
    setItems(prev => {
      const existing = prev.find(i => i.stockId === stock.id)
      if (existing) {
        return prev.map(i =>
          i.stockId === stock.id ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      }
      return [...prev, {
        stockId: stock.id,
        codigo: stock.codigo,
        descripcion: stock.descripcion,
        cantidad: 1,
      }]
    })
    setQuery("")
    setSuggestions([])
  }

  const updateCantidad = (stockId: string, cantidad: number) => {
    setItems(prev =>
      prev.map(i => i.stockId === stockId ? { ...i, cantidad: Math.max(1, cantidad) } : i)
    )
  }

  const removeItem = (stockId: string) => {
    setItems(prev => prev.filter(i => i.stockId !== stockId))
  }

  const handleSubmit = async () => {
    if (!proveedorId) { alert("Seleccioná un proveedor"); return }
    if (!numero.trim()) { alert("Ingresá el número de factura o remito"); return }
    if (items.length === 0) { alert("Agregá al menos un artículo"); return }
    if (!importe || Number(importe) <= 0) {
      if (!confirm("El importe es $0. ¿Confirmar el ingreso de todas formas?")) return
    }

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
        alert(result.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Recepción de mercadería</h1>
        <p className="mt-1 text-slate-500">Registrá el ingreso de repuestos de un proveedor.</p>
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-6 items-start">
        {/* Panel izquierdo */}
        <div className="rounded-2xl border-[1.5px] border-slate-200 bg-white shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-5">Ingreso de Repuestos</h2>

          {/* Buscador */}
          <div className="relative mb-6">
            <div className="flex items-center gap-3 bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3.5 focus-within:bg-white focus-within:border-blue-500 focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.1)] transition-all">
              <Barcode size={20} className="text-slate-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={e => handleQueryChange(e.target.value)}
                placeholder="Escaneá o buscá por código / descripción..."
                className="flex-1 bg-transparent border-none outline-none text-base font-medium text-slate-900 placeholder:text-slate-400"
                autoComplete="off"
              />
              {searching && (
                <Loader2 size={16} className="animate-spin text-slate-400 shrink-0" />
              )}
            </div>

            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-2 rounded-xl border border-slate-200 bg-white shadow-xl z-20 overflow-hidden">
                {suggestions.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addItem(item)}
                    className="w-full flex items-center justify-between px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-blue-50 transition-colors text-left"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{item.descripcion}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{item.codigo}</p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0 ml-4">
                      {item.proveedor?.nombre}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tabla de ítems / estado vacío */}
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-300">
              <PackageOpen size={48} className="mb-4 opacity-50" />
              <p className="text-sm">No hay artículos cargados en este ingreso.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 w-1/5">Código</th>
                  <th className="pb-3 pl-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Descripción</th>
                  <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400 w-1/5">Cantidad</th>
                  <th className="pb-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map(item => (
                  <tr key={item.stockId}>
                    <td className="py-4 font-mono font-semibold text-sm text-slate-900">
                      {item.codigo}
                    </td>
                    <td className="py-4 pl-4 text-sm text-slate-600">{item.descripcion}</td>
                    <td className="py-4 text-center">
                      <input
                        type="number"
                        min={1}
                        value={item.cantidad}
                        onChange={e => updateCantidad(item.stockId, Number(e.target.value))}
                        className="w-16 text-center font-bold text-sm border border-slate-200 rounded-lg py-1.5 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </td>
                    <td className="py-4 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(item.stockId)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Panel derecho — sticky */}
        <div className="sticky top-6 rounded-2xl border-[1.5px] border-slate-200 bg-white shadow-sm p-6">
          <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-3 mb-5">
            Datos de Factura
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                Proveedor
              </label>
              <select
                value={proveedorId}
                onChange={e => setProveedorId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              >
                <option value="">Seleccionar...</option>
                {proveedores.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                Nro. Factura / Remito
              </label>
              <input
                type="text"
                value={numero}
                onChange={e => setNumero(e.target.value)}
                placeholder="Ej: 0001-000432"
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                Total Facturado ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={importe}
                onChange={e => setImporte(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-xl font-bold text-slate-900 placeholder:text-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Monto final que figura en la factura.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="mt-6 w-full flex items-center justify-center gap-2.5 rounded-xl bg-emerald-500 px-4 py-4 text-base font-bold text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)] hover:bg-emerald-600 hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-50"
          >
            {loading
              ? <Loader2 size={18} className="animate-spin" />
              : <Check size={18} />}
            {loading ? "Guardando..." : "Confirmar Ingreso"}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verificar compilación**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Verificar en el navegador**

Con `npm run dev`, navegar a `http://localhost:3000/dashboard/recepcion`.
Verificar:
- Layout de dos columnas visible
- El selector de proveedor lista los proveedores de la DB
- Buscando en el input aparecen sugerencias con código, descripción y nombre de proveedor
- Al hacer click en una sugerencia se agrega a la tabla
- La cantidad es editable en la tabla
- El botón "×" elimina el ítem
- Elegir proveedor + numero + importe + ítems → "Confirmar Ingreso" redirige a `/dashboard/facturas`
- En `/dashboard/facturas` aparece la nueva factura con el proveedor en la columna correspondiente

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/recepcion/
git commit -m "feat: página de recepción de mercadería con layout POS"
```

---

## Task 8: Test E2E — happy path recepción

**Files:**
- Modify: `tests/e2e/pages/PageObjects.ts`
- Create: `tests/e2e/recepcion.spec.ts`

- [ ] **Step 1: Agregar métodos al PageObjects**

En `tests/e2e/pages/PageObjects.ts`, agregar al final de la clase `DashboardPage`:

```typescript
  async goToRecepcion() {
    await this.page.getByText('Gestión').click();
    await this.page.getByRole('link', { name: 'Recepción' }).click();
    await expect(this.page.getByRole('heading', { name: 'Recepción de mercadería' })).toBeVisible();
  }

  async registrarIngreso(provName: string, nroFactura: string, stockCodigo: string, importe: string) {
    // Seleccionar proveedor
    await this.page.selectOption('select', { label: provName });

    // Llenar número de factura
    await this.page.fill('input[placeholder*="0001"]', nroFactura);

    // Buscar artículo
    await this.page.fill('input[placeholder*="código"]', stockCodigo);
    await this.page.waitForSelector('button:has-text("' + stockCodigo + '")', { timeout: 3000 });
    await this.page.click('button:has-text("' + stockCodigo + '")');

    // Verificar que aparece en la tabla
    await expect(this.page.locator('td.font-mono', { hasText: stockCodigo })).toBeVisible();

    // Llenar importe
    await this.page.fill('input[placeholder="0.00"]', importe);

    // Confirmar
    await this.page.getByRole('button', { name: 'Confirmar Ingreso' }).click();

    // Debe redirigir a /facturas
    await this.page.waitForURL('**/dashboard/facturas');
  }
```

- [ ] **Step 2: Crear el spec**

Crear `tests/e2e/recepcion.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';
import { LoginPage, DashboardPage } from './pages/PageObjects';

test.describe('Recepción de Mercadería', () => {
  test('registra un ingreso completo y aparece en el listado de facturas', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.loginAsTestUser();

    // 1. Crear proveedor
    const provName = `ProvRecepcion ${Date.now()}`;
    await dashboardPage.goToProveedores();
    await dashboardPage.createProveedor(provName, 'Descuento Test', '5');

    // 2. Crear artículo de stock para ese proveedor
    const stockCode = `RCP-${Date.now()}`;
    await dashboardPage.goToStock();
    await dashboardPage.createStock(provName, stockCode, 'Repuesto Recepción Test', '500');

    // 3. Registrar ingreso en recepción
    const nroFactura = `REM-${Date.now()}`;
    await dashboardPage.goToRecepcion();
    await dashboardPage.registrarIngreso(provName, nroFactura, stockCode, '500');

    // 4. Verificar que la factura aparece en el listado con el proveedor correcto
    await expect(page.getByRole('cell', { name: nroFactura })).toBeVisible();
    await expect(page.getByRole('cell', { name: provName })).toBeVisible();
  });
});
```

- [ ] **Step 3: Correr el test**

```bash
npx playwright test tests/e2e/recepcion.spec.ts --headed
```

Salida esperada: `1 passed`

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/pages/PageObjects.ts tests/e2e/recepcion.spec.ts
git commit -m "test: E2E para recepción de mercadería"
```
