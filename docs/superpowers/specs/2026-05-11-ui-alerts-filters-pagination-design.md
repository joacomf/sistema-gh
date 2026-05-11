# UI: Alerts, Filtros y Paginación — Diseño

**Fecha:** 2026-05-11

---

## Scope

Cuatro cambios independientes que mejoran la coherencia y escalabilidad de la UI:

1. Reemplazar `alert()` / `confirm()` del sistema con componentes propios
2. Rediseño de la página Pedidos: formulario inline + filtros client-side
3. Página Facturas: filtros server-side + paginación (20 por página)
4. Página Stock: filtros server-side + paginación (20 por página)

---

## 1. Componentes de feedback compartidos

### `ErrorBanner`
- **Ubicación:** `src/components/ui/ErrorBanner.tsx`
- **Props:** `message: string | null`, `onDismiss: () => void`
- **Comportamiento:** banner rojo visible cuando `message !== null`. Botón "×" llama `onDismiss`. Si `message` es null, no renderiza nada.
- **Uso:** estado local `const [error, setError] = useState<string|null>(null)` en el componente que llama la server action. Se muestra debajo del botón o formulario que originó el error.
- **Reemplaza:** todos los `alert(res.error)` / `alert("Ocurrió un error...")` en: `NuevoPedidoForm`, `RepuestosAPedir`, `RepuestosPedidos`, `StockForm`, `StockList`, `RecepcionPageClient`, `ProveedoresList`, `ProveedorForm`.

### `ConfirmDialog`
- **Ubicación:** `src/components/ui/ConfirmDialog.tsx`
- **Props:** `open: boolean`, `title: string`, `description: string`, `confirmLabel?: string` (default "Confirmar"), `onConfirm: () => void`, `onCancel: () => void`
- **Implementación:** Radix `Dialog.Root` siguiendo el estilo exacto de los modales existentes (overlay `bg-black/40`, content `rounded-2xl bg-white p-6 shadow-2xl`). Botón cancelar secundario, botón confirmar en rojo (`bg-red-600 hover:bg-red-700`).
- **Uso:** estado local `const [confirmOpen, setConfirmOpen] = useState(false)` en el componente. El botón destructivo abre el dialog; `onConfirm` dispara la action.
- **Reemplaza:** todos los `confirm("...")` en: `RepuestosAPedir`, `RepuestosPedidos`.

---

## 2. Página Pedidos — formulario inline + filtros client-side

### Layout
El modal "Agregar repuesto" desaparece. En su lugar, la página tiene:
- **Card de carga** arriba del listado "Artículos a pedir", con tres campos en fila: Proveedor (dropdown), Código (input con live-search contra `/api/stock/search`), Cantidad (número). Botón "Agregar" a la derecha.
- Cuando se selecciona un ítem del live-search, Cantidad se auto-completa con `cantidadSugerida`.
- Al hacer submit, llama `createRepuestoPedidoAction`. Éxito: resetea el formulario. Error: muestra `ErrorBanner` dentro de la card.

### Filtros del listado
Los valores de Proveedor y Código/Descripción en la card también filtran el listado "Artículos a pedir" en tiempo real (client-side, sobre los datos ya cargados por el Server Component).

- Filtro de proveedor: coincidencia exacta por `proveedorId`
- Filtro de código: substring case-insensitive sobre `stock.codigo`, `stock.codigoOriginal` y `stock.descripcion`
- Ambos filtros actúan con AND

### Datos
- Proveedores: cargados server-side en `PedidosPage` vía `getProveedoresAction()` (ya existe) y pasados como prop.
- Los datos de `aPedir` y `pedidos` siguen cargándose server-side (sin cambio).
- `NuevoPedidoForm.tsx` se elimina; la lógica se integra en `PedidosPageClient`.

---

## 3. Página Facturas — filtros server-side + paginación

### Repository
`FacturaRepository.findAll()` se reemplaza por:
```ts
findPaginated(params: {
  proveedorId?: string
  numero?: string
  page: number        // 1-indexed
  pageSize?: number   // default 20
}): Promise<{ data: FacturaWithItems[]; total: number }>
```
Usa `where` con `AND` condicional: `proveedorId` por igualdad, `numero` con `contains`. `skip = (page-1) * pageSize`, `take = pageSize`. `prisma.factura.count()` en paralelo para el total.

### Server Action
`getFacturasAction(params)` pasa los parámetros al repositorio y devuelve `{ data, total, pages }` serializado.

### URL como estado
`FacturasPageClient` lee `searchParams` (Next.js) para los filtros y la página. Cambiar un filtro navega con `router.push` actualizando la URL (resetea a `page=1`). Esto hace la URL compartible.

### UI
- Barra de filtros encima de la tabla: dropdown Proveedor (todos los proveedores, opción "Todos") + input Número de factura.
- Los proveedores para el dropdown se cargan server-side junto con las facturas en `FacturasPage`.
- Controles de paginación debajo de la tabla: "Anterior" / "Siguiente" + indicador "Página X de Y (Z resultados)".
- `getProveedoresAction()` ya existe — se reutiliza.

---

## 4. Página Stock — filtros server-side + paginación

### Repository
`StockRepository.search()` ya acepta `proveedorId` y `codigo`. Se extiende con paginación:
```ts
search(params: {
  proveedorId?: string
  codigo?: string
  page?: number       // 1-indexed, default 1
  pageSize?: number   // default 20
}): Promise<{ data: StockWithProveedor[]; total: number }>
```
`StockRepository.findAll()` se mantiene para usos internos (ej: búsqueda en POS).

### Server Action
`getStockAction(params)` pasa parámetros al repositorio. Se agrega a `src/modules/stock/actions.ts`.

### URL como estado
`StockPage` (Server Component) lee `searchParams`. `StockPageClient` recibe los datos ya filtrados + paginados. Filtros y página como `router.push` en el client.

### UI
- Barra de filtros existente (proveedor dropdown + input código) se mantiene visualmente idéntica, pero ahora dispara navegación en lugar de fetch a la API.
- El `useEffect` con debounce + fetch a `/api/stock/search` en `StockPageClient` se elimina.
- Controles de paginación debajo de la tabla.
- El contador del header ("X piezas en inventario") muestra el total general, no solo la página actual.

---

## Archivos afectados

| Archivo | Cambio |
|---------|--------|
| `src/components/ui/ErrorBanner.tsx` | Nuevo |
| `src/components/ui/ConfirmDialog.tsx` | Nuevo |
| `src/modules/pedidos/components/NuevoPedidoForm.tsx` | Eliminado |
| `src/modules/pedidos/components/RepuestosAPedir.tsx` | alert → ErrorBanner, confirm → ConfirmDialog |
| `src/modules/pedidos/components/RepuestosPedidos.tsx` | alert → ErrorBanner, confirm → ConfirmDialog |
| `src/app/dashboard/pedidos/PedidosPageClient.tsx` | Reescrito: form inline, filtros, sin modal |
| `src/app/dashboard/pedidos/page.tsx` | Agrega carga de proveedores |
| `src/modules/stock/components/StockForm.tsx` | alert → ErrorBanner |
| `src/modules/stock/components/StockList.tsx` | alert → ErrorBanner |
| `src/app/dashboard/recepcion/RecepcionPageClient.tsx` | alert → ErrorBanner |
| `src/modules/proveedores/components/ProveedoresList.tsx` | alert → ErrorBanner |
| `src/modules/proveedores/components/ProveedorForm.tsx` | alert → ErrorBanner |
| `src/repositories/factura.repository.ts` | Agrega `findPaginated` |
| `src/modules/facturas/actions.ts` | Actualiza `getFacturasAction` para recibir params |
| `src/modules/facturas/components/FacturasList.tsx` | Sin cambio (recibe datos ya filtrados) |
| `src/app/dashboard/facturas/FacturasPageClient.tsx` | Agrega filtros + paginación + URL state |
| `src/app/dashboard/facturas/page.tsx` | Lee searchParams, carga proveedores |
| `src/repositories/stock.repository.ts` | Extiende `search` con paginación |
| `src/modules/stock/actions.ts` | Actualiza `getStockAction` para recibir params |
| `src/app/dashboard/stock/StockPageClient.tsx` | Elimina debounce/fetch, agrega paginación |
| `src/app/dashboard/stock/page.tsx` | Lee searchParams |
