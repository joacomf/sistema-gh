import { ConfiguracionRepository } from '@/repositories/configuracion.repository'
import VentasPageClient from './VentasPageClient'

export default async function VentasPage() {
  const recargoStr = await ConfiguracionRepository.findByKey('recargo_tarjeta')
  const parsed = parseFloat(recargoStr ?? '')
  const recargo = isNaN(parsed) ? 10 : parsed
  return <VentasPageClient recargo={recargo} />
}
