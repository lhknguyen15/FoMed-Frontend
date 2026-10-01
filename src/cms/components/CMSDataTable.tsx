import { AlertCircle, Database, RefreshCw } from 'lucide-react'
import { Button, Card } from '../../components/ui'

export function CMSLoading() {
  return <Card className="grid min-h-72 place-items-center p-8"><div className="text-center"><span className="mx-auto block size-9 animate-spin rounded-full border-4 border-teal-100 border-t-teal-700" /><p className="mt-4 text-sm font-semibold text-slate-500">Đang tải dữ liệu...</p></div></Card>
}

export function CMSError({ message, retry }: { message: string; retry: () => void }) {
  return <Card className="grid min-h-72 place-items-center p-8 text-center"><div><AlertCircle className="mx-auto size-10 text-rose-500" /><h2 className="mt-3 font-display text-lg font-bold text-slate-800">Không thể tải dữ liệu</h2><p className="mt-1 max-w-lg text-sm text-slate-500">{message}</p><Button className="mt-5" onClick={retry}><RefreshCw className="size-4" /> Thử lại</Button></div></Card>
}

export function CMSEmpty({ label }: { label: string }) {
  return <div className="grid min-h-60 place-items-center p-8 text-center"><div><Database className="mx-auto size-10 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-500">Chưa có {label}</p></div></div>
}

export function CMSStatusBadge({ active }: { active: boolean }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{active ? 'Hoạt động' : 'Ngừng hoạt động'}</span>
}
