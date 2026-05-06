# Diseño: Recepción de Mercadería y Separación de Facturas

**Fecha:** 2026-05-06  
**Estado:** Aprobado

---

## Contexto

El módulo de facturas actualmente mezcla listado y creación en una sola página con un modal. El proveedor no está asociado a la factura en la base de datos. Se necesita separar ambas funciones en rutas distintas y agregar el proveedor como campo requerido en la factura.

---

## Cambios

### 1. Migración de base de datos

Agregar `proveedorId` (requerido) al modelo `Factura` en `prisma/schema.prisma`:

```prisma
model Factura {
  id          String    @id @default(uuid())
  proveedorId String
  numero      String    @db.VarChar(100)
  importe     Decimal   @db.Decimal(10, 2)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  proveedor Proveedor   @relation(fields: [proveedorId], references: [id])
  items     FacturaItem[]
}
```

Correr `prisma migrate dev --name add-proveedor-to-factura`.

### 2. Sidebar

Reemplazar el ítem único `Facturas` por dos sub-ítems dentro del grupo `Gestión`:

| Nombre | Ruta |
|--------|------|
| Facturas | `/dashboard/facturas` |
| Recepción | `/dashboard/recepcion` |

### 3. Página `/dashboard/facturas` (listado)

- Server component que carga facturas con `getFacturasAction()`
- Eliminar el botón "Nueva factura" y el modal de creación
- Agregar columna **Proveedor** en `FacturasList` (usar `factura.proveedor.nombre`)
- El `FacturaRepository.findAll()` debe hacer `include: { proveedor: true, items: ... }`
- El serializador en `actions.ts` debe incluir el proveedor

### 4. Página `/dashboard/recepcion` (carga)

**Estructura de archivos:**
```
src/app/dashboard/recepcion/
  page.tsx                  ← server component, carga proveedores
  RecepcionPageClient.tsx   ← client component, layout POS
src/modules/facturas/components/
  RecepcionForm.tsx         ← lógica del formulario POS
```

**Layout:** `grid grid-cols-[1fr_340px] gap-6 items-start`

**Panel izquierdo (card):**
- Título "Ingreso de Repuestos"
- Buscador grande con ícono, placeholder "Escaneá o buscá por código / descripción..."
- Focus ring azul al activarse
- Dropdown de sugerencias con código + descripción + proveedor
- Búsqueda filtrada por el proveedor seleccionado (param `proveedorId`)
- Tabla de ítems: Código | Descripción | Cantidad (input editable) | Eliminar
- Estado vacío con ícono cuando no hay ítems

**Panel derecho (card sticky):**
- Título "Datos de Factura"
- Select **Proveedor** (requerido) — filtra también el buscador
- Input **Nro. Factura / Remito** (requerido)
- Input **Importe total** ($, font grande)
- Botón verde "Confirmar Ingreso" — llama a `createFacturaAction`
- Validaciones: proveedor seleccionado, al menos 1 ítem, importe > 0 (con confirm si es 0)

### 5. API `/api/stock/search`

El endpoint actualmente devuelve objetos `Decimal` en la respuesta JSON. Serializar `precioCosto`, `precioLista`, `precioVenta` a `number` antes de `NextResponse.json(results)`.

### 6. Actualización de `createFacturaAction` y `FacturaRepository`

- `createFacturaAction` recibe `proveedorId: string` adicional
- `FacturaRepository.create()` incluye `proveedorId` en el `data`
- El tipo `FacturaWithItems` agrega `proveedor: Proveedor` en el payload type
- El `serializeFactura` en actions incluye el proveedor (no tiene Decimal, no necesita conversión)

---

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `prisma/schema.prisma` | Agregar `proveedorId` + relación en `Factura` |
| `src/components/layout/Sidebar.tsx` | Separar ítem Facturas en dos |
| `src/repositories/factura.repository.ts` | Agregar proveedor a include y tipo |
| `src/modules/facturas/actions.ts` | Agregar `proveedorId` a create, serializar proveedor |
| `src/app/dashboard/facturas/page.tsx` | Simplificar (solo listado) |
| `src/app/dashboard/facturas/FacturasPageClient.tsx` | Quitar modal y botón |
| `src/modules/facturas/components/FacturasList.tsx` | Agregar columna Proveedor |
| `src/app/api/stock/search/route.ts` | Serializar Decimals en respuesta |
| `src/app/dashboard/recepcion/page.tsx` | **Nuevo** — server component |
| `src/app/dashboard/recepcion/RecepcionPageClient.tsx` | **Nuevo** — client layout POS |

---

## Lo que NO cambia

- `FacturaForm.tsx` puede eliminarse una vez migrada la lógica a `RecepcionPageClient`
- El modelo `FacturaItem` no cambia
- Las rutas de pedidos y stock no se tocan
