"use client"

import { CreditCard, Banknote, Landmark, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MetodoPago = 'EFECTIVO' | 'DEBITO' | 'CREDITO' | 'MERCADO_PAGO'

type Props = {
  value: MetodoPago
  onChange: (value: MetodoPago) => void
  recargo: number
}

const METODOS: { value: MetodoPago; label: string; Icon: React.ElementType }[] = [
  { value: 'EFECTIVO',     label: 'Efectivo',     Icon: Banknote },
  { value: 'DEBITO',       label: 'Débito',       Icon: CreditCard },
  { value: 'CREDITO',      label: 'Crédito',      Icon: Landmark },
  { value: 'MERCADO_PAGO', label: 'Mercado Pago', Icon: Smartphone },
]

export function SelectorMetodoPago({ value, onChange, recargo }: Props) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Método de pago
      </p>
      <div className="grid grid-cols-2 gap-2">
        {METODOS.map(({ value: v, label, Icon }) => {
          const isActive = value === v
          return (
            <button
              key={v}
              type="button"
              onClick={() => { if (!isActive) onChange(v) }}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-xs font-semibold transition-all',
                isActive
                  ? 'border-blue-600 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50'
              )}
            >
              <Icon size={18} />
              {label}
            </button>
          )
        })}
      </div>

      {value === 'CREDITO' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <span className="font-medium">Recargo tarjeta crédito:</span>{' '}
          <span className="font-bold">{recargo}%</span> aplicado al total
        </div>
      )}
    </div>
  )
}
