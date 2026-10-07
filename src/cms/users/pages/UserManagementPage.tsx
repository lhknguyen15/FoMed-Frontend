import { notify } from '../../../shared/notifications/notify'
import { KeyRound, LockKeyhole, Search, ShieldCheck, UnlockKeyhole, UserRound } from 'lucide-react'
import { useRef, useState } from 'react'
import { Button, Card } from '../../../components/ui'
import { authApi } from '../../../features/auth/api/auth-api'
import { useAdminUserMutations } from '../../../features/auth/hooks/useAdminUserMutations'
import type { AdminUser } from '../../../features/auth/types/auth'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatDateTime } from '../../../shared/utils/format-date'
import { CMSEmpty, CMSError, CMSLoading, CMSStatusBadge } from '../../components/CMSDataTable'
import CMSPageHeader from '../../components/CMSPageHeader'
import ResetPasswordForm from '../components/ResetPasswordForm'
import UserRoleForm from '../components/UserRoleForm'
import UserStatusForm from '../components/UserStatusForm'

const PAGE_SIZE = 10

export default function UserManagementPage() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [activeFilter, setActiveFilter] = useState('')
  const [page, setPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [action, setAction] = useState<'status' | 'roles' | 'password' | null>(null)
  const mutations = useAdminUserMutations()
  const pending = useRef(false)
  const roles = useApiQuery('admin-roles-for-users', authApi.adminRoles)
  const users = useApiQuery(`admin-users-${search}-${role}-${activeFilter}-${page}`, () => authApi.adminUsers({ search, role, isActive: activeFilter === '' ? undefined : activeFilter === 'active', page, pageSize: PAGE_SIZE }))

  const closeAction = () => { if (pending.current) return; setAction(null); setSelectedUser(null); mutations.clearError() }
  const runAction = async (operation: () => Promise<unknown>, message: string) => {
    if (pending.current) return
    pending.current = true
    try {
      await operation()
      setAction(null); setSelectedUser(null); mutations.clearError()
      notify.success(message); users.refresh(); roles.refresh()
    } catch { /* lỗi API giữ trong biểu mẫu; không báo thành công */ }
    finally { pending.current = false }
  }
  const openAction = (user: AdminUser, nextAction: 'status' | 'roles' | 'password') => { mutations.clearError(); setSelectedUser(user); setAction(nextAction) }
  const totalPages = users.data ? Math.max(1, Math.ceil(users.data.total / users.data.pageSize)) : 1

  return <>
    <CMSPageHeader title="Người dùng" description="Kiểm soát tài khoản, vai trò và trạng thái truy cập." />

    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center"><label className="relative block min-w-0 flex-1"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input type="search" name="user-search" autoComplete="off" spellCheck={false} value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Tìm tên, tài khoản, email..." className="input-base admin-search-input" /></label><select value={role} onChange={(event) => { setRole(event.target.value); setPage(1) }} className="input-base admin-filter-select"><option value="">Tất cả vai trò</option>{roles.data?.map((item) => <option key={item.roleId} value={item.name}>{item.name}</option>)}</select><select value={activeFilter} onChange={(event) => { setActiveFilter(event.target.value); setPage(1) }} className="input-base admin-filter-select"><option value="">Mọi trạng thái</option><option value="active">Đang hoạt động</option><option value="inactive">Đã khóa</option></select></div>
      {users.loading ? <CMSLoading /> : users.error || !users.data ? <CMSError message={users.error} retry={users.refresh} /> : users.data.items.length === 0 ? <CMSEmpty label="người dùng" /> : <>
        <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Người dùng</th><th>Liên hệ</th><th>Vai trò</th><th>Ngày tạo</th><th>Trạng thái</th><th className="sticky right-0 z-20 bg-slate-50 shadow-[-8px_0_14px_-12px_rgba(15,23,42,.4)]">Thao tác</th></tr></thead><tbody>{users.data.items.map((user) => <tr key={user.userId}>
          <td><span className="flex items-center gap-2"><UserRound className="size-4 text-sky-700" /><span><strong className="block">{user.fullName || user.username}</strong><small>@{user.username}</small></span></span></td>
          <td className="admin-contact-cell">{user.email || user.phone || '—'}</td><td><span className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-violet-600" />{user.roles.join(', ')}</span></td><td>{formatDateTime(user.createdAt)}</td><td className="admin-status-cell"><CMSStatusBadge active={user.isActive} /></td>
          <td className="sticky right-0 bg-white shadow-[-8px_0_14px_-12px_rgba(15,23,42,.4)]"><span className="flex min-w-max items-center gap-2"><Button variant="secondary" className="h-8 px-2.5 text-xs" onClick={() => openAction(user, 'roles')}><ShieldCheck className="size-3.5 text-violet-600" /> Gán vai trò</Button><Button variant="secondary" className="h-8 px-2.5 text-xs" onClick={() => openAction(user, 'password')}><KeyRound className="size-3.5 text-amber-600" /> Đặt lại mật khẩu</Button><Button variant={user.isActive ? 'danger' : 'secondary'} className="h-8 px-2.5 text-xs" onClick={() => openAction(user, 'status')}><>{user.isActive ? <LockKeyhole className="size-3.5" /> : <UnlockKeyhole className="size-3.5" />}</> {user.isActive ? 'Khóa tài khoản' : 'Mở khóa'}</Button></span></td>
        </tr>)}</tbody></table></div>
        <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center"><span>Hiển thị {users.data.items.length} / {users.data.total} tài khoản</span><span className="flex items-center gap-2"><Button variant="secondary" className="h-8 px-3 text-xs" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Trước</Button><span>Trang {page} / {totalPages}</span><Button variant="secondary" className="h-8 px-3 text-xs" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Sau</Button></span></div>
      </>}
    </Card>
    {selectedUser && action === 'status' && <UserStatusForm user={selectedUser} submitting={mutations.submitting} apiError={mutations.error} onCancel={closeAction} onSubmit={() => runAction(() => mutations.updateStatus(selectedUser.userId, !selectedUser.isActive), selectedUser.isActive ? 'Đã khóa tài khoản người dùng.' : 'Đã mở khóa tài khoản người dùng.')} />}
    {selectedUser && action === 'roles' && roles.data && <UserRoleForm user={selectedUser} roles={roles.data} submitting={mutations.submitting} apiError={mutations.error} onCancel={closeAction} onSubmit={(nextRoles) => runAction(() => mutations.updateRoles(selectedUser.userId, nextRoles), 'Đã cập nhật vai trò người dùng.')} />}
    {selectedUser && action === 'password' && <ResetPasswordForm user={selectedUser} submitting={mutations.submitting} apiError={mutations.error} onCancel={closeAction} onSubmit={(password) => runAction(() => mutations.resetPassword(selectedUser.userId, password), 'Đã đặt lại mật khẩu và thu hồi các phiên đăng nhập cũ.')} />}
  </>
}
