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
    const results = await StockRepository.findAll()
    const filtered = codigo
      ? results.filter(r =>
          r.codigo.includes(codigo) ||
          (r.codigoOriginal && r.codigoOriginal.includes(codigo)) ||
          r.descripcion.includes(codigo)
        )
      : results
    const final = proveedorId
      ? filtered.filter(r => r.proveedorId === proveedorId)
      : filtered

    const serialized = final.map(r => ({
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
