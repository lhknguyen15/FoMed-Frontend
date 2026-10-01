import { Search, UserRound } from 'lucide-react'
import { useState } from 'react'
import { Card } from '../../../components/ui'
import { authApi } from '../../../features/auth/api/auth-api'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { formatDateTime } from '../../../shared/utils/format-date'
import { CMSEmpty, CMSError, CMSLoading, CMSStatusBadge } from '../../components/CMSDataTable'
import CMSPageHeader from '../../components/CMSPageHeader'

export default function UserManagementPage() {
  const [search, setSearch] = useState('')
  const users = useApiQuery(`admin-users-${search}`, () => authApi.adminUsers({ search, pageSize: 50 }))
  return <><CMSPageHeader title="Người dùng" description="Kiểm soát tài khoản, vai trò và trạng thái truy cập." /><Card className="overflow-hidden"><div className="border-b border-slate-100 p-4"><label className="relative block max-w-md"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên, tài khoản, email..." className="input-base pl-10" /></label></div>{users.loading ? <CMSLoading /> : users.error || !users.data ? <CMSError message={users.error} retry={users.refresh} /> : users.data.items.length === 0 ? <CMSEmpty label="người dùng" /> : <><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Người dùng</th><th>Liên hệ</th><th>Vai trò</th><th>Ngày tạo</th><th>Trạng thái</th></tr></thead><tbody>{users.data.items.map((user) => <tr key={user.userId}><td><span className="flex items-center gap-2"><UserRound className="size-4 text-sky-700" /><span><strong className="block">{user.fullName || user.username}</strong><small>@{user.username}</small></span></span></td><td>{user.email || user.phone || '—'}</td><td>{user.roles.join(', ')}</td><td>{formatDateTime(user.createdAt)}</td><td><CMSStatusBadge active={user.isActive} /></td></tr>)}</tbody></table></div><div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500">Tổng cộng {users.data.total} tài khoản</div></>}</Card></>
}
