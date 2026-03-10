'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAgent } from '@/lib/hooks/useAgent'

interface Props {
  open: boolean
  onClose: () => void
  projectId: string
}

export default function MinutaModal({ open, onClose, projectId }: Props) {
  const { processMinuta } = useAgent(projectId)
  const [text, setText] = useState('')
  const [processing, setProcessing] = useState(false)

  function handleProcess() {
    if (!text.trim()) return
    setProcessing(true)
    processMinuta(text, () => {
      setProcessing(false)
      setText('')
      onClose()
    })
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-[#0F2A45] border border-pv-accent/30 rounded-xl w-[500px] max-w-[92vw] p-0 gap-0">
        <DialogHeader className="px-4 py-3.5 border-b border-white/[0.08]">
          <DialogTitle className="text-sm font-bold text-pv-white">📋 Procesar minuta de reunión</DialogTitle>
        </DialogHeader>
        <div className="px-4 py-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.8px] text-pv-gray mb-1.5">Escribe o pega la minuta</div>
          <textarea
            className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-3 py-2.5 text-xs text-pv-white font-mono outline-none leading-relaxed resize-none transition-colors focus:border-pv-purple/50 focus:bg-pv-purple/6"
            rows={6}
            placeholder="Ej: Reunión 9 mar. Cliente aprobó ampliar cocina a 14m². Pide agregar medio baño en PB..."
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <div className="text-[10px] text-pv-gray mt-1.5 leading-relaxed">
            💡 Escribe tal como tomarías notas. No necesitas formato especial.
          </div>
        </div>
        <div className="px-4 py-3 border-t border-white/[0.07] flex justify-end gap-1.5">
          <button
            onClick={onClose}
            className="bg-white/[0.07] border border-white/10 text-pv-white rounded-lg px-3.5 py-2 text-xs font-semibold cursor-pointer hover:bg-white/12 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleProcess}
            disabled={processing}
            className="bg-gradient-to-br from-pv-purple to-[#5A3F9E] border-none text-white rounded-lg px-4 py-2 text-xs font-bold cursor-pointer hover:brightness-115 hover:-translate-y-px transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {processing ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Procesando...
              </>
            ) : (
              <><span>✦</span> Procesar con el agente</>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
