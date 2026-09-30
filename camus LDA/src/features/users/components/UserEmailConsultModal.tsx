import { Mail, User } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useUsersStore } from '@/store/useUsersStore'
import { getRoleName } from '@/data/mock/users'
import type { SystemUser } from '@/types'

/** RF70 — CU-238: Consultar usuario antes de gestionar correo */
export function UserEmailConsultModal({
  user,
  open,
  onClose,
}: {
  user: SystemUser | null
  open: boolean
  onClose: () => void
}) {
  const roles = useUsersStore((s) => s.roles)
  const openLinkEmailModal = useUsersStore((s) => s.openLinkEmailModal)
  const openUnlinkEmailModal = useUsersStore((s) => s.openUnlinkEmailModal)

  if (!user) return null

  const roleName = getRoleName(roles, user.roleId)
  const linked = user.emailLinked !== false && Boolean(user.email?.trim())

  const handleLink = () => {
    onClose()
    openLinkEmailModal(user)
  }

  const handleUnlink = () => {
    onClose()
    openUnlinkEmailModal(user)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Consulta de usuario"
      description="CU-238 — Revise el usuario y el estado del correo antes de vincular o desvincular."
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          {linked ? (
            <Button variant="outline" className="border-red-200 text-red-600" onClick={handleUnlink}>
              Desvincular correo
            </Button>
          ) : (
            <Button onClick={handleLink}>Vincular correo electrónico</Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
          <User className="mt-0.5 h-5 w-5 text-slate-400" />
          <div>
            <p className="font-semibold text-slate-900">{user.name}</p>
            <p className="text-sm text-slate-600">{roleName}</p>
            <Badge label={user.status} context="user" className="mt-2" />
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-slate-100 px-4 py-3">
          <Mail className="mt-0.5 h-5 w-5 text-slate-400" />
          <div className="text-sm">
            <p className="text-slate-500">Correo electrónico</p>
            <p className="font-medium text-slate-900">{user.email?.trim() || 'Sin correo vinculado'}</p>
            <p className="mt-2">
              Estado:{' '}
              <Badge
                label={linked ? 'Vinculado' : 'Sin vincular'}
                className={
                  linked
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                    : 'bg-slate-100 text-slate-600 ring-slate-500/20'
                }
              />
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
