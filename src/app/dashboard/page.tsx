import { Package, Truck, Activity } from "lucide-react"

export default function DashboardHome() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-500">Bienvenido al sistema de Repuestos GH.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700 shrink-0">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Piezas en Stock</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">---</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
              <Truck size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Proveedores Activos</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">---</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 text-amber-700 shrink-0">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Alertas de Stock</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">---</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
