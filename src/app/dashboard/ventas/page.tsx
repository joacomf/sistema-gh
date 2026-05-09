// src/app/dashboard/ventas/page.tsx
import { ConfiguracionRepository } from '@/repositories/configuracion.repository'
import VentasPageClient from './VentasPageClient'

export default async function VentasPage() {
  const recargoStr = await ConfiguracionRepository.findByKey('recargo_tarjeta')
  const recargo = Number(recargoStr ?? '10')
  return <VentasPageClient recargo={recargo} />
}
