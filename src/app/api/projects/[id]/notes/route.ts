import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

interface NoteTab {
  id: string
  title: string
  content: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params

    const row = await db.projectNote.findUnique({
      where: { projectId_userId: { projectId: id, userId: session.user.id } },
    })

    let notes: NoteTab[] = [{ id: 'default', title: 'General', content: '' }]
    if (row?.content) {
      try {
        const parsed = JSON.parse(row.content)
        if (Array.isArray(parsed) && parsed.length > 0) notes = parsed
      } catch {
        // legacy plain text — migrate to tab format
        notes = [{ id: 'default', title: 'General', content: row.content }]
      }
    }

    return NextResponse.json({ notes })
  } catch (err) {
    console.error('[notes] Error:', err)
    return NextResponse.json({ notes: [{ id: 'default', title: 'General', content: '' }] }, { status: 200 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id } = await params

    const { notes } = await req.json() as { notes: NoteTab[] }
    const content = JSON.stringify(notes)

    await db.projectNote.upsert({
      where: { projectId_userId: { projectId: id, userId: session.user.id } },
      update: { content },
      create: { projectId: id, userId: session.user.id, content },
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[notes PUT] Error:', err)
    return NextResponse.json({ error: 'Error al guardar notas' }, { status: 500 })
  }
}
