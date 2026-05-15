# Diseño: Cajas y Consulta de Artículo

**Fecha:** 2026-05-15  
**Estado:** Aprobado

---

## Resumen

Dos nuevos módulos independientes que se agregan bajo la sección **Gestión** del sidebar:

1. **Cajas** — Pantalla para gestionar cajas de almacenamiento y ver qué artículos de stock contiene cada una.
2. **Consulta de Artículo** — Página de búsqueda y detalle completo de un artículo de stock, incluyendo imagen y cajas donde está almacenado.

Ambos módulos siguen el patrón establecido en el proyecto: repository → server actions → components → page (server) + PageClient (client).

---

## 1. Modelo de datos

### 1.1 Nuevo modelo `Caja`

```prisma
model Caja {
  id        Int         @id @default(autoincrement())
  nombre    String
  ubicacion String
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  stocks    StockCaja[]
}
```

### 1.2 Tabla de relación `StockCaja` (muchos-a-muchos)

```prisma
model StockCaja {
  stockId Int
  cajaId  Int
  stock   Stock @relation(fields: [stockId], references: [id], onDelete: Cascade)
  caja    Caja  @relation(fields: [cajaId], references: [id], onDelete: Cascade)

  @@id([stockId, cajaId])
}
```

Un artículo puede estar en múltiples cajas (caso raro pero válido). `onDelete: Cascade` asegura limpieza automática de la relación si se elimina un artículo o caja.

### 1.3 Campo `imagen` en `Stock`

```prisma
model Stock {
  // ...campos existentes...
  imagen  String?     // URL de imagen del artículo
  cajas   StockCaja[]
}
```

Se almacena como URL (string). El campo es opcional.

---

## 2. Módulo Cajas

### 2.1 Estructura de archivos

```
src/
  repositories/
    caja.repository.ts
  modules/cajas/
    actions.ts
    components/
      CajasList.tsx
      CajaForm.tsx
      ArticulosDeCaja.tsx
      AsignarArticuloModal.tsx
  app/dashboard/cajas/
    page.tsx
    CajasPageClient.tsx
```

### 2.2 Repository (`caja.repository.ts`)

Métodos:
- `findAll()` — todas las cajas con conteo de artículos
- `findById(id)` — caja con sus artículos (StockCaja → Stock)
- `search(query)` — busca por nombre de caja o descripción/código de artículo contenido
- `create(data)` — crea caja
- `update(id, data)` — actualiza nombre/ubicación
- `delete(id)` — elimina caja (las relaciones se limpian por cascade)
- `addStock(cajaId, stockId)` — crea entrada en StockCaja
- `removeStock(cajaId, stockId)` — elimina entrada de StockCaja

### 2.3 Server Actions (`actions.ts`)

```typescript
createCaja(data: { nombre: string; ubicacion: string })
updateCaja(id: number, data: { nombre: string; ubicacion: string })
deleteCaja(id: number)
addStockACaja(cajaId: number, stockId: number)
removeStockDeCaja(cajaId: number, stockId: number)
```

Todas retornan `{ success: boolean, data?: T, error?: string }` y llaman `revalidatePath('/dashboard/cajas')`.

### 2.4 Layout de página

Split panel horizontal con estado de caja seleccionada en query param `?cajaId=X`:

```
┌──────────────────────┬─────────────────────────────┐
│  Cajas               │  Artículos de la caja        │
│  [Buscar caja/art...]│  seleccionada                │
│  ┌──────────────────┐│                              │
│  │ Caja A-1         ││  [Buscar artículo...]        │
│  │ Depósito Planta  ││                              │
│  ├──────────────────┤│  Tabla: código, descripción, │
│  │ Caja B-3  ←sel.  ││  cantidad, proveedor         │
│  │ Estante Oficina  ││                              │
│  └──────────────────┘│  [Asignar artículo]          │
│  [+ Nueva Caja]      │  [Quitar] por artículo       │
└──────────────────────┴─────────────────────────────┘
```

**Panel izquierdo (Cajas):**
- Buscador que filtra por nombre de caja **o** por artículo contenido (busca en ambos)
- Lista de cajas, cada ítem muestra nombre + ubicación + cantidad de artículos
- Caja seleccionada se resalta visualmente
- Botón "+ Nueva Caja" abre `CajaForm` en modal
- Cada caja tiene acciones de editar y eliminar (con `ConfirmDialog`)

**Panel derecho (Artículos de la caja seleccionada):**
- Estado vacío cuando no hay caja seleccionada
- Buscador por código o descripción de artículo (filtra client-side sobre los artículos ya cargados)
- Tabla con: código, descripción, cantidad, proveedor
- Botón "Asignar artículo" abre `AsignarArticuloModal`
- Botón "Quitar" por fila para remover artículo de la caja

**`AsignarArticuloModal`:**
- Buscador de artículos de stock (server-side)
- Lista de resultados para seleccionar
- Excluye artículos ya asignados a la caja actual

### 2.5 Comportamiento de búsqueda del panel izquierdo

El buscador de cajas usa el query param `?q=` (server-side). La query busca en:
- `Caja.nombre`
- `Caja.ubicacion`
- `Stock.descripcion` de artículos contenidos
- `Stock.codigo` de artículos contenidos

Si hay match por artículo, la caja aparece en los resultados aunque su nombre no coincida.

---

## 3. Módulo Consulta de Artículo

### 3.1 Estructura de archivos

```
src/
  modules/consulta-articulo/
    components/
      BuscadorArticulo.tsx
      DetalleArticulo.tsx
      ResultadosBusqueda.tsx
  app/dashboard/consulta-articulo/
    page.tsx
    ConsultaArticuloPageClient.tsx
```

### 3.2 Datos que muestra el detalle

El artículo se carga con todas sus relaciones:
- `Stock` completo (todos los campos)
- `Proveedor` (nombre)
- `Cajas` → via `StockCaja` → `Caja` (nombre + ubicación)

### 3.3 Layout de página

```
┌─────────────────────────────────────────────────────┐
│  Consulta de Artículo                               │
│  [Buscar por código o descripción...    ]           │
├─────────────────────────────────────────────────────┤
│  (si múltiples resultados)                          │
│  Lista de artículos → hacer click para ver detalle  │
├─────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────┐     │
│  │  [img placeholder / imagen]                │     │
│  │                                            │     │
│  │  Tornillo M8 x 30   Código: TM8-30        │     │
│  │  Proveedor: Ferretería Norte               │     │
│  │                                            │     │
│  │  Precio costo: $120  Lista: $180  V: $200  │     │
│  │                                            │     │
│  │  Stock: 45u  Crítico: 10u  Sugerido: 20u  │     │
│  │  Fecha pedido: 01/03/2026                  │     │
│  │  Fecha recibido: 15/03/2026                │     │
│  │                                            │     │
│  │  Cajas:                                    │     │
│  │    [Caja A-1 · Depósito Planta]            │     │
│  │    [Caja B-3 · Estante Oficina]            │     │
│  └────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────┘
```

**Comportamiento:**
- Búsqueda via query param `?q=` (server-side), mismo patrón que el módulo Stock
- Si la búsqueda retorna un único resultado, se muestra el detalle directamente
- Si retorna varios, se muestra `ResultadosBusqueda` con lista clicable; el artículo seleccionado se guarda en `?id=X`
- Si no hay búsqueda activa, se muestra estado vacío con prompt para buscar
- Imagen: si existe URL se renderiza con `<img>`, sino se muestra placeholder con ícono
- Cajas: chips/tags con formato `nombre · ubicación`, sin link (solo informativo)
- La URL del artículo en el formulario de edición de Stock se puede cargar desde esta página (no hace falta UI extra en esta pantalla)

---

## 4. Imagen en Stock (edición)

El campo `imagen` (URL) se agrega al formulario existente `StockForm.tsx`:
- Input de texto simple con label "URL de imagen"
- No requiere subida de archivos
- Preview de la imagen si se ingresa una URL válida (usando `<img>` con `onError` para ocultar si falla)

---

## 5. Navegación

Dos entradas nuevas bajo **Gestión** en `Sidebar.tsx`:

```
Gestión
  ├── Stock
  ├── Proveedores
  ├── Pedidos
  ├── Facturas
  ├── Recepción
  ├── Cajas              ← nuevo  /dashboard/cajas
  └── Consulta Artículo  ← nuevo  /dashboard/consulta-articulo
```

---

## 6. Testing

### Unit / Component
- `CajasList.tsx`: render, selección de caja, filtrado
- `ArticulosDeCaja.tsx`: render con artículos, búsqueda client-side, quitar artículo
- `DetalleArticulo.tsx`: render con/sin imagen, con/sin cajas
- `caja.repository.ts`: búsqueda cruzada caja/artículo

### E2E (Playwright)
- **Happy path Cajas**: crear caja → asignar artículo → verificar aparece en lista → quitar artículo → eliminar caja
- **Happy path Consulta Artículo**: buscar artículo → seleccionar de lista → verificar detalle completo con cajas
