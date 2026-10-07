import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PencilLine, Pill, Plus, RefreshCw } from 'lucide-react'
import { Badge, Button, Card } from '../../../components/ui'
import { medicineCatalogApi } from '../../../features/pharmacy/api/medicine-catalog-api'
import { medicineInput, type MedicineFormValues } from '../../../features/pharmacy/schemas/medicine-schema'
import type { MedicineCatalogFilters, MedicineCatalogRow } from '../../../features/pharmacy/types/medicine-catalog'
import { displayError } from '../../../shared/api/user-messages'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { notify } from '../../../shared/notifications/notify'
import { formatMoney } from '../../../shared/utils/format-money'
import { CMSError, CMSLoading } from '../../components/CMSDataTable'
import CMSPageHeader from '../../components/CMSPageHeader'
import CMSPagination from '../../components/CMSPagination'
import MedicineDialog from '../components/MedicineDialog'
import MedicineForm from '../components/MedicineForm'

export default function MedicineManagementPage() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status')
  const filters: MedicineCatalogFilters = { keyword: params.get('keyword') ?? '', status: status === 'active' || status === 'inactive' ? status : 'all' }
  const requestedPage = Number(params.get('page') ?? '1')
  const page = Number.isInteger(requestedPage) && requestedPage >= 1 && requestedPage <= 100000 ? requestedPage : 1
  const key = JSON.stringify({ ...filters, page })
  // Associate each response with its query: never show old rows under a new filter.
  const query = useApiQuery(`admin-medicines-${key}`, async () => ({ key, result: await medicineCatalogApi.list(filters, page) }))
  const result = query.data?.key === key ? query.data.result : null
  const loading = query.loading || (!query.error && !result)
  const [form, setForm] = useState<{ medicine: MedicineCatalogRow | null } | null>(null)
  const [statusTarget, setStatusTarget] = useState<MedicineCatalogRow | null>(null)
  const [busy, setBusy] = useState(false); const [error, setError] = useState('')
  const pending = useRef(false)
  const updateParams = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params)
    Object.entries(changes).forEach(([name, value]) => { if (value) next.set(name, value); else next.delete(name) })
    setParams(next)
  }
  const close = () => { if (!pending.current) { setForm(null); setStatusTarget(null); setError('') } }
  const save = async (values: MedicineFormValues) => {
    if (pending.current || !form) return
    pending.current = true; setBusy(true); setError('')
    try {
      const input = medicineInput(values)
      if (form.medicine) await medicineCatalogApi.update(form.medicine, input)
      else await medicineCatalogApi.create(input)
      notify.success(form.medicine ? 'Đã cập nhật thông tin thuốc.' : 'Đã thêm thuốc vào danh mục.')
      setForm(null); query.refresh()
    } catch (reason) { setError(displayError(reason, 'Không thể lưu thuốc. Vui lòng thử lại.')) }
    finally { pending.current = false; setBusy(false) }
  }
  const changeStatus = async () => {
    if (pending.current || !statusTarget) return
    pending.current = true; setBusy(true); setError('')
    try {
      await medicineCatalogApi.setStatus(statusTarget)
      notify.success(statusTarget.isActive ? 'Đã ngừng sử dụng thuốc.' : 'Đã cho phép sử dụng lại thuốc.')
      setStatusTarget(null); query.refresh()
    } catch (reason) { setError(displayError(reason, 'Không thể thay đổi trạng thái thuốc.')) }
    finally { pending.current = false; setBusy(false) }
  }
  return <>
    <CMSPageHeader title="Danh mục thuốc" description="Quản lý tên thuốc, đơn vị, giá bán và trạng thái sử dụng. Tồn kho lấy từ các lô thuốc." action={<div className="flex gap-2"><Button variant="secondary" disabled={busy} onClick={query.refresh}><RefreshCw className="size-4" />Làm mới</Button><Button disabled={busy} onClick={() => { setError(''); setForm({ medicine: null }) }}><Plus className="size-4" />Thêm thuốc</Button></div>} />
    <MedicineFilters key={JSON.stringify(filters)} initial={filters} busy={busy} onApply={value => updateParams({ ...value, page: '1' })} />
    {loading ? <CMSLoading /> : query.error || !result ? <CMSError message={query.error || 'Không thể tải danh mục thuốc.'} retry={query.refresh} /> : <Card className="overflow-hidden">
      {!result.items.length ? <div className="p-10 text-center"><Pill className="mx-auto size-10 text-teal-300" /><h2 className="mt-3 font-display text-lg font-bold">Không có thuốc phù hợp</h2><p className="mt-2 text-sm text-slate-500">Thử đổi bộ lọc hoặc quay về trang đầu.</p>{page > 1 && <Button className="mt-4" variant="secondary" onClick={() => updateParams({ page: '1' })}>Về trang đầu</Button>}</div> : <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>Thuốc</th><th>Đơn vị</th><th>Giá bán</th><th>Tồn kho</th><th>Có thể cấp</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{result.items.map(medicine => <tr key={medicine.id}>
        <td className="min-w-48 max-w-sm whitespace-normal break-words"><strong>{medicine.name}</strong>{medicine.description && <small className="mt-1 block text-slate-500">{medicine.description}</small>}</td><td>{medicine.unit || 'Chưa ghi nhận'}</td><td>{formatMoney(medicine.price)}</td><td>{medicine.stockQuantity.toLocaleString('vi-VN')}</td><td>{medicine.availableQuantity.toLocaleString('vi-VN')}</td><td><Badge tone={medicine.isActive ? 'success' : 'neutral'}>{medicine.isActive ? 'Đang sử dụng' : 'Ngừng sử dụng'}</Badge></td>
        <td><div className="flex gap-2"><Button variant="secondary" className="h-8 px-3 text-xs" disabled={busy} aria-label={`Sửa ${medicine.name}`} onClick={() => { setError(''); setForm({ medicine }) }}><PencilLine className="size-4" />Sửa</Button><Button variant={medicine.isActive ? 'danger' : 'secondary'} className="h-8 px-3 text-xs" disabled={busy} aria-label={`${medicine.isActive ? 'Ngừng sử dụng' : 'Sử dụng lại'} ${medicine.name}`} onClick={() => { setError(''); setStatusTarget(medicine) }}>{medicine.isActive ? 'Ngừng sử dụng' : 'Sử dụng lại'}</Button></div></td>
      </tr>)}</tbody></table></div>}
      {result.items.length > 0 && <CMSPagination page={result.page} pageSize={result.pageSize} totalItems={result.totalCount} onPageChange={next => updateParams({ page: String(next) })} label="thuốc phù hợp" />}
      <p className="border-t border-slate-100 p-4 text-xs leading-5 text-slate-500">Tồn kho bao gồm lô hết hạn. Có thể cấp chỉ tính lô còn hạn của thuốc đang sử dụng. Thay đổi danh mục không tự nhập hoặc xuất kho.</p>
    </Card>}
    {form && <MedicineForm medicine={form.medicine} busy={busy} error={error} onClose={close} onSubmit={save} />}
    {statusTarget && <MedicineDialog title={statusTarget.isActive ? 'Ngừng sử dụng thuốc' : 'Sử dụng lại thuốc'} busy={busy} onClose={close}>
      <p className="break-words text-sm leading-6 text-slate-700">{statusTarget.isActive ? 'Ngừng sử dụng' : 'Cho phép sử dụng lại'} <strong>{statusTarget.name}</strong>?</p>
      <p className="mt-3 text-sm leading-6 text-slate-500">{statusTarget.isActive ? 'Thuốc sẽ không được chọn cho đơn mới. Các đơn thuốc, hóa đơn và lô tồn kho đã lưu vẫn được giữ lại. Chỉ có thể ngừng khi không còn đơn đang khám hoặc chưa cấp phát đủ.' : 'Thuốc có thể được chọn lại khi kê đơn. Tồn có thể cấp vẫn phụ thuộc hạn dùng của từng lô.'}</p>
      {error && <p role="alert" className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="mt-6 flex justify-end gap-3"><Button variant="secondary" disabled={busy} onClick={close}>Hủy</Button><Button variant={statusTarget.isActive ? 'danger' : 'primary'} disabled={busy} onClick={() => void changeStatus()}>{busy ? 'Đang lưu...' : 'Xác nhận'}</Button></div>
    </MedicineDialog>}
  </>
}

function MedicineFilters({ initial, busy, onApply }: { initial: MedicineCatalogFilters; busy: boolean; onApply: (value: MedicineCatalogFilters) => void }) {
  const [draft, setDraft] = useState(initial)
  return <Card className="mb-5 p-4"><form onSubmit={event => { event.preventDefault(); if (!busy) onApply({ ...draft, keyword: draft.keyword.trim() }) }}><fieldset disabled={busy} className="grid gap-3 sm:grid-cols-[2fr_1fr_auto_auto]"><label><span className="field-label">Tìm thuốc</span><input value={draft.keyword} onChange={event => setDraft({ ...draft, keyword: event.target.value })} maxLength={100} placeholder="Tên thuốc, đơn vị hoặc mô tả" className="input-base" /></label><label><span className="field-label">Trạng thái</span><select value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value as MedicineCatalogFilters['status'] })} className="input-base"><option value="all">Tất cả</option><option value="active">Đang sử dụng</option><option value="inactive">Ngừng sử dụng</option></select></label><Button type="submit" className="self-end">Tìm kiếm</Button><Button type="button" variant="secondary" className="self-end" onClick={() => onApply({ keyword: '', status: 'all' })}>Xóa lọc</Button></fieldset></form></Card>
}
