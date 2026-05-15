"use client"

export function ReimprimirButton() {
  return (
    <button
      onClick={() => window.print()}
      style={{
        fontFamily: 'sans-serif',
        fontSize: 12,
        padding: '6px 16px',
        border: '1px solid #94a3b8',
        borderRadius: 6,
        cursor: 'pointer',
        background: '#f8fafc',
        color: '#475569',
      }}
    >
      Volver a imprimir
    </button>
  )
}
