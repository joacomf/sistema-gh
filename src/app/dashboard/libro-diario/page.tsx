import { VentaRepository } from '@/repositories/venta.repository'
import { GastoRepository } from '@/repositories/gasto.repository'
import LibroDiarioPageClient from './LibroDiarioPageClient'

type SearchParams = Promise<{ fecha?: string }>

export default async function LibroDiarioPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const fechaStr = params.fecha ?? new Date().toISOString().split('T')[0]
  const fecha = new Date(`${fechaStr}T00:00:00`)

  const [ventasRaw, gastosRaw] = await Promise.all([
    VentaRepository.findByFecha(fecha),
    GastoRepository.findByFecha(fecha),
  ])

  const ventas = ventasRaw.map(v => ({
    ...v,
    importe: v.importe.toNumber(),
    items: v.items.map(i => ({
      ...i,
      precioUnitario: i.precioUnitario.toNumber(),
      subtotal: i.subtotal.toNumber(),
      stock: {
        ...i.stock,
        precioCosto: i.stock.precioCosto.toNumber(),
        precioLista: i.stock.precioLista.toNumber(),
        precioVenta: i.stock.precioVenta.toNumber(),
      },
    })),
  }))

  const gastos = gastosRaw.map(g => ({
    ...g,
    importe: g.importe.toNumber(),
  }))

  return <LibroDiarioPageClient ventas={ventas} gastos={gastos} fecha={fechaStr} />
}
