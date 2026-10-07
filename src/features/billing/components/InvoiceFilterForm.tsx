import { useState } from 'react'
import { Filter, RotateCcw } from 'lucide-react'
import { Button, Card } from '../../../components/ui'
import type { InvoiceFilters, InvoiceStatusFilter } from '../types/billing'
import { emptyInvoiceFilters, validateInvoiceFilters } from '../utils/invoice-filters'

export default function InvoiceFilterForm({ initialValue, onApply }: { initialValue: InvoiceFilters; onApply: (value: InvoiceFilters) => void }) {
  const [draft, setDraft] = useState(initialValue)
  const [error, setError] = useState('')
  const apply = (value: InvoiceFilters) => {
    const message = validateInvoiceFilters(value)
    setError(message)
    if (!message) onApply({ ...value, keyword: value.keyword.trim() })
  }
  return <Card className="mb-5 p-5"><form onSubmit={event => { event.preventDefault(); apply(draft) }}>
    <div className="grid items-end gap-3 md:grid-cols-2 xl:grid-cols-[2fr_1.3fr_1fr_1fr]"><label><span className="field-label">Tìm hóa đơn hoặc bệnh nhân</span><input className="input-base" value={draft.keyword} maxLength={100} placeholder="Mã hóa đơn, tên hoặc mã bệnh nhân" onChange={event => setDraft({ ...draft, keyword: event.target.value })} /></label><label><span className="field-label">Trạng thái thanh toán</span><select className="input-base" value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value as InvoiceStatusFilter })}><option value="all">Tất cả trạng thái</option><option value="outstanding">Còn phải thu</option><option value="unpaid">Chưa thanh toán</option><option value="partial">Thanh toán một phần</option><option value="paid">Đã thanh toán</option><option value="cancelled">Đã hủy</option></select></label><label><span className="field-label">Ngày lập từ</span><input className="input-base" type="date" min="1900-01-01" max="9998-12-31" value={draft.fromDate} onChange={event => setDraft({ ...draft, fromDate: event.target.value })} /></label><label><span className="field-label">Đến ngày</span><input className="input-base" type="date" min="1900-01-01" max="9998-12-31" value={draft.toDate} onChange={event => setDraft({ ...draft, toDate: event.target.value })} /></label></div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">Lọc toàn bộ hóa đơn đã lập; ngày tính theo giờ Việt Nam.</p><div className="flex gap-2"><Button type="button" variant="secondary" onClick={() => { setDraft(emptyInvoiceFilters); apply(emptyInvoiceFilters) }}><RotateCcw className="size-4" /> Xóa bộ lọc</Button><Button type="submit"><Filter className="size-4" /> Áp dụng</Button></div></div>{error && <p role="alert" className="mt-3 text-sm text-rose-700">{error}</p>}
  </form></Card>
}
