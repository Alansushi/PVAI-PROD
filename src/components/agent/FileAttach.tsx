'use client'

import { useRef } from 'react'
import { useAgentContext } from '@/lib/context/AgentContext'

export default function FileAttach() {
  const { attachedFiles, addFile, removeFile } = useAgentContext()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    Array.from(e.target.files ?? []).forEach(f => addFile(f.name))
    e.target.value = ''
  }

  if (attachedFiles.length === 0) return (
    <input
      ref={inputRef}
      type="file"
      className="hidden"
      multiple
      accept=".pdf,.dwg,.xlsx,.docx,.jpg,.png"
      onChange={handleChange}
    />
  )

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        multiple
        accept=".pdf,.dwg,.xlsx,.docx,.jpg,.png"
        onChange={handleChange}
      />
      <div className="flex flex-wrap gap-1 px-2.5 pt-1">
        {attachedFiles.map((f, i) => (
          <div
            key={i}
            className="flex items-center gap-1 bg-pv-accent/12 border border-pv-accent/30 rounded-md px-1.5 py-0.5 text-[9px] text-pv-accent"
          >
            📎 {f}
            <button
              onClick={() => removeFile(i)}
              className="bg-none border-none text-pv-gray cursor-pointer text-[11px] leading-none ml-0.5 hover:text-pv-red"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </>
  )
}
