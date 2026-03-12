import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import UserProfileEditForm from '@/components/dashboard/UserProfileEditForm'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any

interface UserData {
  id: string
  name: string | null
  email: string | null
  image: string | null
  profession: string | null
  profDetail: string | null
  firmName: string | null
  firmUrl: string | null
  phone: string | null
}

export default async function PerfilPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      profession: true,
      profDetail: true,
      firmName: true,
      firmUrl: true,
      phone: true,
    },
  }) as UserData | null

  if (!user) redirect('/login')

  return (
    <div className="p-5 max-w-[480px]">
      <h1 className="font-display text-[21px] font-black mb-1">Mi perfil</h1>
      <p className="text-[11px] text-pv-gray mb-5">Actualiza tu información personal.</p>
      <UserProfileEditForm user={user} />
    </div>
  )
}
