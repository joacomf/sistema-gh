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
    return NextResponse.json(results)
  } catch (error) {
    console.error("Error en búsqueda de stock:", error)
    return NextResponse.json({ error: "Error al buscar" }, { status: 500 })
  }
}
