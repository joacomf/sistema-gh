# Feature: Ventas — Punto de Venta y Libro Diario

**Date:** 2026-05-08  
**Status:** Approved

---

## Resumen

Dos pantallas nuevas bajo `/dashboard/ventas` y `/dashboard/libro-diario`:

- **Punto de Venta** — registrar una venta asociando artículos del stock, elegir método de pago, descontar stock y disparar reposición.
- **Libro Diario** — visualizar el resumen financiero del día: ventas por método de pago, egresos y caja neta.

---

## Nuevos modelos Prisma

### `Venta`
```
id            Int       PK autoincrement
descripcion   String    // generado: "Tuerca, Perno… (3 art.)"
importe       Decimal   // total con recargo ya incluido si corresponde
metodoPago    MetodoPago enum
facturada     Boolean   default false
fecha         DateTime  default now()
items         VentaItem[]
```

### `VentaItem`
```
id            Int       PK autoincrement
ventaId       Int       FK → Venta
stockId       Int       FK → Stock
descripcion   String    // snapshot al momento de la venta
cantidad      Int
precioUnitario Decimal
subtotal      Decimal
```

### `Gasto`
```
id            Int       PK autoincrement
descripcion   String
importe       Decimal
fecha         DateTime  default now()
```

### `Configuracion`
```
clave         String    PK   // e.g. "recargo_tarjeta"
valor         String         // e.g. "10"
```

Seed inicial: `recargo_tarjeta = "10"` (porcentaje).

### Enum `MetodoPago`
```
EFECTIVO | DEBITO | CREDITO | MERCADO_PAGO
```

---

## Punto de Venta — `/dashboard/ventas`

### Layout
Dos paneles dentro del contenido principal (mismo `dashboard/layout.tsx`):

- **Panel izquierdo (flex: 1):** buscador de artículos + tabla del carrito.
- **Panel derecho (ancho fijo ~280px):** selector de método de pago + total + acciones.

### Buscador de artículos
Reutiliza la lógica de búsqueda de `RecepcionPageClient`: input con debounce 300ms que consulta `/api/stock/search`. El dropdown de sugerencias muestra código, descripción y `precioVenta`. Al seleccionar un artículo se agrega al carrito (cantidad = 1) y se limpia el input.

### Carrito
Estado local en el cliente. Columnas: Código | Descripción | Cant. (input editable) | P. Venta | Subtotal | [Eliminar].

- Cantidad editable inline; subtotal recalcula al cambiar.
- La fila se puede eliminar.
- Si el carrito está vacío, muestra un estado vacío con mensaje.

### Selector de método de pago
4 botones toggle: Efectivo · Débito · Crédito · Mercado Pago.  
Solo uno activo a la vez. Al seleccionar Crédito aparece un aviso con el recargo (leído de `Configuracion.recargo_tarjeta`).

### Cálculo del total
- Base = suma de subtotales del carrito.
- Si método = CREDITO → total = base × (1 + recargo/100).
- El importe guardado en `Venta` es siempre el total final (con recargo).

### Checkbox "Facturada"
Checkbox simple debajo del total. Por defecto desmarcado. Se guarda como `Venta.facturada`. No impacta el cálculo del total (IVA/facturación electrónica queda fuera de scope).

### Finalizar venta
Server action `checkout`:
1. Crea `Venta` con sus `VentaItem[]`.
2. Para cada ítem, decrementa `Stock.cantidad` en `cantidad` vendida (`prisma.stock.update`).
3. Retorna los ítems para el modal de reposición.
4. Llama `revalidatePath('/dashboard/ventas')`.

### Modal de reposición (post-checkout)
Se abre automáticamente tras un checkout exitoso. Lista los artículos vendidos con:
- Checkbox (por defecto todos marcados).
- Input de cantidad sugerida (por defecto `Stock.cantidadSugerida` del artículo, si existe, sino 10).

Al confirmar → server action `crearPedidos` que crea entradas en `RepuestoPedido` (modelo ya existente) por cada ítem chequeado. Al omitir → cierra sin hacer nada. En ambos casos se limpia el carrito.

---

## Libro Diario — `/dashboard/libro-diario`

### Filtro de fecha
`?fecha=YYYY-MM-DD` en la URL. El `<input type="date">` del topbar hace `router.push` con la fecha seleccionada. Sin parámetro → fecha de hoy.

### Tarjetas de resumen (5)
Efectivo | Débito | Crédito | Mercado Pago | **Caja Neta**

- Cada tarjeta muestra suma del método + cantidad de ventas.
- Caja Neta = total ventas − total gastos.
- Calculado server-side en la page o en el repository.

### Tabla de ventas
Columnas: Hora | Productos (descripción truncada) | Pago (badge de color) | Importe | [Eliminar].  
Click en fila abre modal de detalle (fetcha `VentaItem[]` del id).  
Eliminar → server action `eliminarVenta` con confirmación dialog.

### Tabla de egresos
Columnas: Concepto | Importe | [Eliminar].  
Al pie, botón "+ Agregar egreso" abre un mini-form inline (descripción + importe).  
Eliminar → server action `eliminarGasto`.

### Modal de detalle de venta
Muestra: descripción, hora, método de pago, badge `F` si facturada, tabla de ítems (código, descripción, cant., precio, subtotal), total al pie.

---

## Arquitectura de archivos

```
src/
  app/dashboard/
    ventas/
      page.tsx                    // server: lee Configuracion.recargo_tarjeta
      VentasPageClient.tsx        // "use client" — carrito, buscador, modal reposición
    libro-diario/
      page.tsx                    // server: recibe ?fecha, fetcha ventas y gastos
      LibroDiarioPageClient.tsx   // "use client" — tabla, modal detalle, agregar gasto

  modules/ventas/
    actions.ts                    // checkout, crearPedidos, eliminarVenta, agregarGasto, eliminarGasto
    components/
      Carrito.tsx                 // tabla del carrito
      SelectorMetodoPago.tsx      // 4 botones toggle
      ModalReposicion.tsx         // modal post-checkout
      ModalDetalleVenta.tsx       // modal libro diario

  repositories/
    venta.repository.ts           // findByFecha, create, deleteById, findItemsByVentaId
    gasto.repository.ts           // findByFecha, create, deleteById
    configuracion.repository.ts   // findByKey

prisma/
  migrations/
    XXXX_add_ventas/              // Venta, VentaItem, Gasto, Configuracion, MetodoPago enum
```

---

## Navegación

Agregar sección "Ventas" al `Sidebar.tsx` con dos ítems:
- Punto de Venta → `/dashboard/ventas`
- Libro Diario → `/dashboard/libro-diario`

---

## Tests

### Unitarios / componente
- `SelectorMetodoPago`: selección exclusiva, muestra recargo solo con Crédito.
- `Carrito`: agregar ítem, editar cantidad, eliminar ítem, total recalculado.
- `actions.ts → checkout`: mock repository, verifica decremento de stock y creación de VentaItem.

### E2E (Playwright)
- **Happy path Punto de Venta:** buscar artículo → agregar → elegir efectivo → finalizar → modal reposición → confirmar pedido → carrito limpio.
- **Happy path Libro Diario:** navegar a `/dashboard/libro-diario` → verificar que aparece la venta recién creada → click en fila → modal con ítems correctos.
