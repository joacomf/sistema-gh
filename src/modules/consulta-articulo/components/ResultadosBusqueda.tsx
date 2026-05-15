type Resultado = {
  id: string
  codigo: string
  descripcion: string
  proveedor: { nombre: string }
  cantidad: number
}

export default function ResultadosBusqueda({
  resultados,
  onSelect,
}: {
  resultados: Resultado[]
  onSelect: (id: string) => void
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Código</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Descripción</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Proveedor</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Cant.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {resultados.map(r => (
            <tr
              key={r.id}
              onClick={() => onSelect(r.id)}
              className="cursor-pointer hover:bg-blue-50 transition-colors"
            >
              <td className="px-4 py-3 text-sm font-semibold text-slate-900">{r.codigo}</td>
              <td className="px-4 py-3 text-sm text-slate-700">{r.descripcion}</td>
              <td className="px-4 py-3 text-sm text-slate-500">{r.proveedor.nombre}</td>
              <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">{r.cantidad}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
