'use client'

import { useState } from 'react'
import type { Project } from '@/lib/types'
import { ALL_MEMBERS } from '@/lib/data/members'
import { useProjectContext } from '@/lib/context/ProjectContext'
import MinutaModal from '@/components/modals/MinutaModal'
import AddMemberModal from '@/components/modals/AddMemberModal'
import ProfileModal from '@/components/modals/ProfileModal'

interface Props {
  project: Project
  projectId: string
}

export default function TopBar({ project, projectId }: Props) {
  const { getProject } = useProjectContext()
  const currentProject = getProject(projectId) ?? project
  const [minutaOpen, setMinutaOpen] = useState(false)
  const [memberOpen, setMemberOpen] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)

  return (
    <>
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-display text-[21px] font-black">{project.title}</h1>
          <div className="text-[11px] text-pv-gray mt-0.5">{project.sub}</div>
        </div>
        <div className="flex gap-1.5 items-center">
          {/* Team avatars */}
          <div className="flex items-center gap-1.5">
            {currentProject.members.map(id => {
              const m = ALL_MEMBERS[id]
              if (!m) return null
              return (
                <button
                  key={id}
                  onClick={() => setProfileId(id)}
                  title={m.name}
                  className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-pv-navy cursor-pointer transition-all hover:-translate-y-0.5 hover:border-white/40 relative flex-shrink-0"
                  style={{ background: m.color }}
                >
                  {m.initials}
                </button>
              )
            })}
            <button
              onClick={() => setMemberOpen(true)}
              className="w-[30px] h-[30px] rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-base text-pv-gray cursor-pointer transition-all bg-white/[0.03] hover:border-pv-accent hover:text-pv-accent hover:-translate-y-0.5"
            >
              +
            </button>
            <span className="text-[10px] text-pv-gray ml-0.5">
              {currentProject.members.length} persona{currentProject.members.length !== 1 ? 's' : ''}
            </span>
          </div>
          <button
            onClick={() => alert('Compartiendo estado con el cliente...')}
            className="bg-white/[0.06] border border-white/10 text-pv-white rounded-lg px-3 py-1.5 text-[11px] font-semibold cursor-pointer transition-all hover:bg-white/10"
          >
            Compartir
          </button>
          <button
            onClick={() => setMinutaOpen(true)}
            className="bg-pv-accent border-none text-white rounded-lg px-3.5 py-1.5 text-[11px] font-bold cursor-pointer transition-all hover:bg-[#3EA0D4]"
          >
            + Minuta
          </button>
        </div>
      </div>

      <MinutaModal open={minutaOpen} onClose={() => setMinutaOpen(false)} projectId={projectId} />
      <AddMemberModal open={memberOpen} onClose={() => setMemberOpen(false)} projectId={projectId} />
      {profileId && (
        <ProfileModal memberId={profileId} projectTitle={project.title} onClose={() => setProfileId(null)} />
      )}
    </>
  )
}
