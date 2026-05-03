interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  hint?: string
  action?: { label: string; onClick: () => void }
  compact?: boolean
}

export function EmptyState({ icon, title, hint, action, compact = false }: EmptyStateProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-2 py-1.5">
        {icon && <span className="text-pv-gray/60 flex-shrink-0 text-[13px]">{icon}</span>}
        <span className="text-[11px] text-pv-gray/60">{title}</span>
        {action && (
          <button
            onClick={action.onClick}
            className="text-[11px] text-pv-accent hover:underline ml-1 focus-visible:ring-2 focus-visible:ring-pv-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pv-navy focus-visible:outline-none rounded"
          >
            {action.label}
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
      {icon && <div className="mb-3 text-pv-gray/40">{icon}</div>}
      <div className="text-[13px] font-semibold text-pv-gray/80 mb-1">{title}</div>
      {hint && <div className="text-[11px] text-pv-gray/50 max-w-xs mb-4">{hint}</div>}
      {action && (
        <button
          onClick={action.onClick}
          className="text-[11px] px-3 py-1.5 rounded-lg bg-pv-accent/10 border border-pv-accent/20 text-pv-accent hover:bg-pv-accent/20 transition-colors focus-visible:ring-2 focus-visible:ring-pv-accent focus-visible:ring-offset-2 focus-visible:ring-offset-pv-navy focus-visible:outline-none"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
