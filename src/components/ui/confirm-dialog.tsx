'use client'

interface Props {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Eliminar',
  onConfirm,
  onCancel,
  loading,
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#1C3448] border border-white/[0.12] rounded-2xl w-full max-w-xs shadow-2xl p-5 animate-modalIn">
        <h2 className="font-display text-[15px] font-black text-white mb-1">{title}</h2>
        {description && (
          <p className="text-[12px] text-pv-gray mb-4">{description}</p>
        )}
        {!description && <div className="mb-4" />}
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-3 py-1.5 text-[11px] font-semibold text-pv-gray border border-white/[0.1] rounded-lg hover:bg-white/[0.06] transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-1.5 text-[11px] font-semibold text-white bg-pv-red hover:bg-pv-red/80 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Eliminando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
