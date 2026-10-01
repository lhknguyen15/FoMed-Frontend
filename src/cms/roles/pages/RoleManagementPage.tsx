import { ShieldCheck } from 'lucide-react'
import { Card } from '../../../components/ui'
import { authApi } from '../../../features/auth/api/auth-api'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { CMSEmpty, CMSError, CMSLoading } from '../../components/CMSDataTable'
import CMSPageHeader from '../../components/CMSPageHeader'

export default function RoleManagementPage() {
  const roles = useApiQuery('admin-roles', authApi.adminRoles)
  return <><CMSPageHeader title="Vai trò" description="Theo dõi các nhóm quyền và số tài khoản đang được phân công." />{roles.loading ? <CMSLoading /> : roles.error || !roles.data ? <CMSError message={roles.error} retry={roles.refresh} /> : <Card>{roles.data.length === 0 ? <CMSEmpty label="vai trò" /> : <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">{roles.data.map((role) => <article key={role.roleId} className="rounded-2xl border border-slate-200 p-5"><div className="flex justify-between"><span className="grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><ShieldCheck className="size-5" /></span><span className="text-xs font-bold text-slate-500">{role.userCount} tài khoản</span></div><h2 className="mt-4 font-display text-lg font-bold">{role.name}</h2></article>)}</div>}</Card>}</>
}
