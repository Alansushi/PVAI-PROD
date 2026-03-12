'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NewProjectModal from './NewProjectModal'

interface Props {
  onCreated?: () => void
}

export default function NewProjectButton({ onCreated }: Props = {}) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  function handleCreated() {
    router.refresh()
    onCreated?.()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-white bg-pv-accent hover:bg-pv-accent/80 rounded-lg transition-colors"
      >
        <span className="text-[13px] leading-none">+</span>
        Nuevo proyecto
      </button>
      <NewProjectModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={handleCreated}
      />
    </>
  )
}
