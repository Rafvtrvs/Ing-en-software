import { Plus } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { KpiCard } from '@/components/ui/KpiCard'
import { Tabs } from '@/components/ui/Tabs'
import { ToastContainerView } from '@/components/ui/ToastContainer'
import { useUsersStore } from '@/store/useUsersStore'
import { getUsersKpis } from '@/data/mock/users'
import type { UsersTab } from '@/types'
import { UsersTable } from './components/UsersTable'
import { RolesPanel } from './components/RolesPanel'
import { UsersByRoleChart } from './components/UsersByRoleChart'
import { UserFormModal } from './components/UserFormModal'
import { UserViewModal } from './components/UserViewModal'
import { DeleteUserModal } from './components/DeleteUserModal'
import { RoleFormModal } from './components/RoleFormModal'
import { RoleViewModal } from './components/RoleViewModal'
import { DeleteRoleModal } from './components/DeleteRoleModal'

const USERS_TABS: { id: UsersTab; label: string }[] = [
  { id: 'usuarios', label: 'Usuarios' },
  { id: 'roles', label: 'Roles y Permisos' },
]

export function UsersPage() {
  const users = useUsersStore((s) => s.users)
  const roles = useUsersStore((s) => s.roles)
  const activeTab = useUsersStore((s) => s.activeTab)
  const setActiveTab = useUsersStore((s) => s.setActiveTab)
  const userModalMode = useUsersStore((s) => s.userModalMode)
  const roleModalMode = useUsersStore((s) => s.roleModalMode)
  const selectedUser = useUsersStore((s) => s.selectedUser)
  const selectedRole = useUsersStore((s) => s.selectedRole)
  const openUserCreateModal = useUsersStore((s) => s.openUserCreateModal)
  const openRoleCreateModal = useUsersStore((s) => s.openRoleCreateModal)
  const closeUserModal = useUsersStore((s) => s.closeUserModal)
  const closeRoleModal = useUsersStore((s) => s.closeRoleModal)
  const toasts = useUsersStore((s) => s.toasts)
  const removeToast = useUsersStore((s) => s.removeToast)

  const kpis = getUsersKpis(users, roles)

  const handleNew = () => {
    if (activeTab === 'usuarios') openUserCreateModal()
    else openRoleCreateModal()
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          title="Usuarios y Roles"
          subtitle="Administra usuarios, permisos y roles del sistema."
          action={
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={handleNew}>
              {activeTab === 'usuarios' ? 'Nuevo Usuario' : 'Nuevo Rol'}
            </Button>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.title} data={kpi} />
          ))}
        </div>

        <Tabs tabs={USERS_TABS} active={activeTab} onChange={setActiveTab} />

        {activeTab === 'usuarios' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <UsersTable onCreateClick={openUserCreateModal} />
            </div>
            <UsersByRoleChart />
          </div>
        )}

        {activeTab === 'roles' && <RolesPanel onCreateClick={openRoleCreateModal} />}
      </div>

      <UserFormModal mode="create" open={userModalMode === 'create'} onClose={closeUserModal} />
      <UserFormModal
        mode="edit"
        user={selectedUser}
        open={userModalMode === 'edit'}
        onClose={closeUserModal}
      />
      <UserViewModal user={selectedUser} open={userModalMode === 'view'} onClose={closeUserModal} />
      <DeleteUserModal
        user={selectedUser}
        open={userModalMode === 'delete'}
        onClose={closeUserModal}
      />

      <RoleFormModal mode="create" open={roleModalMode === 'create'} onClose={closeRoleModal} />
      <RoleFormModal
        mode="edit"
        role={selectedRole}
        open={roleModalMode === 'edit'}
        onClose={closeRoleModal}
      />
      <RoleViewModal role={selectedRole} open={roleModalMode === 'view'} onClose={closeRoleModal} />
      <DeleteRoleModal
        role={selectedRole}
        open={roleModalMode === 'delete'}
        onClose={closeRoleModal}
      />

      <ToastContainerView toasts={toasts} onRemove={removeToast} />
    </>
  )
}
