import { notFound } from 'next/navigation'
import { VentaRepository } from '@/repositories/venta.repository'
import { PrintOnMount } from './PrintOnMount'
import { ReimprimirButton } from './ReimprimirButton'

const METODO: Record<string, string> = {
  EFECTIVO: 'Efectivo',
  DEBITO: 'Débito',
  CREDITO: 'Tarjeta',
  MERCADO_PAGO: 'Mercado Pago',
}

function formatARS(value: number) {
  return value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default async function TicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const venta = await VentaRepository.findById(id)
  if (!venta) notFound()

  const fecha = new Date(venta.fecha)
  const tz = 'America/Argentina/Buenos_Aires'
  const dia = fecha.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: tz })
  const hora = fecha.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: tz })

  const total = Number(venta.importe)
  const ticketNum = venta.id.slice(-8).toUpperCase()

  return (
    <>
      <PrintOnMount />
      <style dangerouslySetInnerHTML={{
        __html: `
          @page { margin: 0; size: 80mm auto; }
          body {
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 12px;
            line-height: 1.3;
            color: #000;
            background: #f3f4f6;
            display: flex !important;
            justify-content: center;
            padding: 24px 0;
          }
          @media print {
            body { background: white; padding: 0; display: block !important; }
            .no-print { display: none !important; }
          }
          .ticket-shell {
            background: white;
            width: 80mm;
            padding: 10px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.12);
          }
          @media print { .ticket-shell { box-shadow: none; padding: 0; } }
          .tc { text-align: center; }
          .tr { text-align: right; }
          .bold { font-weight: bold; }
          .divider { border: none; border-top: 1px dashed #000; margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; }
          td, th { padding: 2px 0; vertical-align: top; }
          .c-cant { width: 12%; text-align: center; }
          .c-desc { width: 58%; }
          .c-subt { width: 30%; text-align: right; }
          .th-line { border-bottom: 1px dashed #000; padding-bottom: 3px; }
        `
      }} />
      <div className="ticket-shell">
        <div className="tc bold" style={{ fontSize: 16, marginBottom: 4 }}>REPUESTOS G.H.</div>
        <div className="tc" style={{ fontSize: 10, marginBottom: 10 }}>Ticket de Venta</div>

        <div style={{ fontSize: 11 }}>
          Fecha: {dia} {hora}<br />
          Ticket #: {ticketNum}<br />
          Medio: {METODO[venta.metodoPago] ?? venta.metodoPago}
        </div>

        <hr className="divider" />

        <table>
          <thead>
            <tr>
              <th className="c-cant th-line tc">C.</th>
              <th className="c-desc th-line" style={{ textAlign: 'left' }}>Artículo</th>
              <th className="c-subt th-line tr">Subt.</th>
            </tr>
          </thead>
          <tbody>
            {venta.items.map(item => (
              <tr key={item.id}>
                <td className="c-cant">{item.cantidad}</td>
                <td className="c-desc">
                  {item.descripcion}
                  <br />
                  <span style={{ fontSize: 9 }}>${formatARS(Number(item.precioUnitario))} c/u</span>
                </td>
                <td className="c-subt">${formatARS(Number(item.subtotal))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr className="divider" />

        <table style={{ fontSize: 14 }}>
          <tbody>
            <tr>
              <td className="bold">TOTAL</td>
              <td className="tr bold">${formatARS(total)}</td>
            </tr>
          </tbody>
        </table>

        <hr className="divider" />

        <div className="tc" style={{ marginTop: 8, fontSize: 11 }}>¡Gracias por su compra!</div>

        <div className="no-print tc" style={{ marginTop: 16 }}>
          <ReimprimirButton />
        </div>
      </div>
    </>
  )
}
