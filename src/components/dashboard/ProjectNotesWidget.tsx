'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface NoteTab {
  id: string
  title: string
  content: string
}

interface Props {
  projectId: string
}

type SaveStatus = 'idle' | 'saving' | 'saved'

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

export default function ProjectNotesWidget({ projectId }: Props) {
  const [tabs, setTabs]           = useState<NoteTab[]>([{ id: 'default', title: 'General', content: '' }])
  const [activeId, setActiveId]   = useState('default')
  const [status, setStatus]       = useState<SaveStatus>('idle')
  const [loaded, setLoaded]       = useState(false)
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const debounceRef               = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleInputRef             = useRef<HTMLInputElement>(null)

  // Load notes on mount
  useEffect(() => {
    fetch(`/api/projects/${projectId}/notes`)
      .then(r => r.ok ? r.json() : { notes: null })
      .then(({ notes }) => {
        if (notes && notes.length > 0) {
          setTabs(notes)
          setActiveId(notes[0].id)
        }
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [projectId])

  // Focus title input when editing
  useEffect(() => {
    if (editingTabId) titleInputRef.current?.focus()
  }, [editingTabId])

  const save = useCallback(async (updatedTabs: NoteTab[]) => {
    setStatus('saving')
    try {
      await fetch(`/api/projects/${projectId}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: updatedTabs }),
      })
      setStatus('saved')
      setTimeout(() => setStatus('idle'), 2000)
    } catch {
      setStatus('idle')
    }
  }, [projectId])

  function scheduleSave(updatedTabs: NoteTab[]) {
    setStatus('idle')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => save(updatedTabs), 800)
  }

  function handleContentChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const updated = tabs.map(t =>
      t.id === activeId ? { ...t, content: e.target.value } : t
    )
    setTabs(updated)
    scheduleSave(updated)
  }

  function addTab() {
    const newTab: NoteTab = { id: uid(), title: 'Nueva nota', content: '' }
    const updated = [...tabs, newTab]
    setTabs(updated)
    setActiveId(newTab.id)
    // Immediately enter rename mode for the new tab
    setEditingTabId(newTab.id)
    setEditingTitle('Nueva nota')
    scheduleSave(updated)
  }

  function removeTab(id: string) {
    if (tabs.length === 1) return
    const updated = tabs.filter(t => t.id !== id)
    setTabs(updated)
    if (activeId === id) setActiveId(updated[updated.length - 1].id)
    scheduleSave(updated)
  }

  function startRename(tab: NoteTab) {
    setEditingTabId(tab.id)
    setEditingTitle(tab.title)
  }

  function commitRename() {
    if (!editingTabId) return
    const title = editingTitle.trim() || 'Sin título'
    const updated = tabs.map(t => t.id === editingTabId ? { ...t, title } : t)
    setTabs(updated)
    setEditingTabId(null)
    scheduleSave(updated)
  }

  const activeTab = tabs.find(t => t.id === activeId) ?? tabs[0]

  return (
    <div className="bg-[#162637] border border-white/[0.08] rounded-2xl flex flex-col h-full min-h-[200px] overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center gap-0 border-b border-white/[0.08] px-2 pt-2 overflow-x-auto">
        <span className="text-[11px] mr-1.5 flex-shrink-0 select-none">📝</span>
        {tabs.map(tab => (
          <div
            key={tab.id}
            onClick={() => { setActiveId(tab.id); setEditingTabId(null) }}
            onDoubleClick={() => startRename(tab)}
            className={`group flex items-center gap-1 px-2.5 py-1 rounded-t-lg text-[10px] font-semibold cursor-pointer whitespace-nowrap flex-shrink-0 transition-colors select-none
              ${tab.id === activeId
                ? 'bg-[#162637] border border-b-0 border-white/[0.12] text-white'
                : 'text-pv-gray/70 hover:text-white hover:bg-white/[0.04]'
              }`}
          >
            {editingTabId === tab.id ? (
              <input
                ref={titleInputRef}
                value={editingTitle}
                onChange={e => setEditingTitle(e.target.value)}
                onBlur={commitRename}
                onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingTabId(null) }}
                onClick={e => e.stopPropagation()}
                className="bg-transparent border-b border-pv-accent outline-none text-[10px] w-[80px] text-white"
              />
            ) : (
              <span title="Doble clic para renombrar">{tab.title}</span>
            )}
            {tabs.length > 1 && (
              <button
                onClick={e => { e.stopPropagation(); removeTab(tab.id) }}
                className="opacity-0 group-hover:opacity-100 ml-0.5 text-pv-gray/60 hover:text-[#D94F4F] transition-all text-[11px] leading-none"
                title="Eliminar nota"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addTab}
          className="px-2 py-1 text-[12px] text-pv-gray/60 hover:text-white transition-colors flex-shrink-0 leading-none"
          title="Nueva nota"
        >
          +
        </button>
      </div>

      {/* Textarea */}
      <textarea
        className="flex-1 w-full bg-transparent border-none outline-none resize-none font-mono text-[11px] text-white/90 placeholder-pv-gray/40 leading-relaxed px-3.5 py-2.5"
        placeholder="Escribe tus notas aquí... (doble clic en la pestaña para renombrar)"
        value={activeTab?.content ?? ''}
        onChange={handleContentChange}
        disabled={!loaded}
      />

      {/* Footer */}
      <div className="flex justify-between items-center px-3 pb-2">
        <span className="text-[9px] text-pv-gray/40">{tabs.length} nota{tabs.length !== 1 ? 's' : ''} · privadas</span>
        <div className="text-[9px]">
          {status === 'saving' && <span className="text-pv-gray animate-pulse">Guardando...</span>}
          {status === 'saved'  && <span className="text-[#2A9B6F] font-semibold">Guardado ✓</span>}
        </div>
      </div>
    </div>
  )
}
