import type { ReactNode } from 'react'
import { FlaskConical, RefreshCw } from 'lucide-react'
import { Badge, Button, Card } from '../../../components/ui'
import type { ServiceOrder } from '../types/clinical'

type Props = { orders: ServiceOrder[] | null; loading: boolean; error: string; updatedAt: number | null; onRefresh: () => void; renderAction?: (order: ServiceOrder) => ReactNode }
const statuses = {
  0: { label: 'Chờ thực hiện', tone: 'warning' },
  1: { label: 'Đã có kết quả', tone: 'success' },
  2: { label: 'Đã hủy', tone: 'danger' },
} as const

function resultTime(value: string) {
  // ResultAt is stored as UTC, including legacy timestamps serialized without an offset.
  const date = new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`)
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' }).format(date) : 'Chưa xác định thời gian'
}

export default function ServiceOrderResults({ orders, loading, error, updatedAt, onRefresh, renderAction }: Props) {
  const pending = orders?.filter(order => order.status === 0).length ?? 0
  const completed = orders?.filter(order => order.status === 1).length ?? 0
  const cancelled = orders?.filter(order => order.status === 2).length ?? 0
  return <Card className="overflow-hidden">
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-5"><div><h2 className="flex items-center gap-2 font-display text-lg font-bold text-slate-900"><FlaskConical className="size-5 text-sky-700" /> Chỉ định và kết quả</h2><p className="mt-1 text-sm text-slate-500">Kết quả do kỹ thuật viên ghi nhận. Khi còn chỉ định chờ, danh sách tự cập nhật mỗi 30 giây khi đang xem trang.</p>{updatedAt && !loading && !error && <p className="mt-1 text-xs text-slate-500">Cập nhật lúc {new Intl.DateTimeFormat('vi-VN', { timeStyle: 'short' }).format(updatedAt)}</p>}</div><Button type="button" variant="secondary" onClick={onRefresh} disabled={loading}><RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /> Cập nhật kết quả</Button></div>
    {loading ? <p role="status" className="p-5 text-sm text-slate-500">Đang tải chỉ định và kết quả...</p> : error ? <div role="alert" className="p-5 text-sm text-rose-700"><p>{error}</p><p className="mt-1">Chưa thể xác nhận trạng thái chỉ định. Vui lòng cập nhật lại kết quả.</p></div> : !orders?.length ? <p className="p-5 text-sm text-slate-500">Chưa có chỉ định trong lượt khám này.</p> : <>
      <div className="flex flex-wrap gap-2 p-5" aria-label="Tổng hợp chỉ định"><Badge tone="warning">Chờ thực hiện: {pending}</Badge><Badge tone="success">Đã có kết quả: {completed}</Badge>{cancelled > 0 && <Badge tone="neutral">Đã hủy: {cancelled}</Badge>}{pending > 0 && <p className="w-full text-sm text-amber-800">Còn {pending} chỉ định chưa có kết quả. Vui lòng kiểm tra trước khi kê đơn hoặc hoàn tất khám.</p>}</div>
      <div className="overflow-x-auto"><table className="data-table min-w-[720px]"><thead><tr><th>Dịch vụ</th><th>Trạng thái</th><th>Kết quả và kết luận</th>{renderAction && <><th>Đơn giá</th><th>Thao tác</th></>}</tr></thead><tbody>{orders.map(order => {
        const status = statuses[order.status as keyof typeof statuses] ?? { label: 'Chưa xác định', tone: 'neutral' as const }
        return <tr key={order.id}><td className="min-w-[160px]"><strong className="break-words">{order.serviceName}</strong><small className="mt-1 block text-slate-500">Chỉ định #{order.id} · Số lượng: {order.quantity}</small></td><td><Badge tone={status.tone}>{status.label}</Badge></td><td className="min-w-[280px] max-w-xl whitespace-normal break-words">{order.status === 1 ? <div className="space-y-2">{order.resultSummary && <p className="whitespace-pre-wrap"><strong>Kết quả: </strong>{order.resultSummary}</p>}{order.conclusion && <p className="whitespace-pre-wrap"><strong>Kết luận: </strong>{order.conclusion}</p>}{!order.resultSummary && !order.conclusion && <p>Chưa có nội dung kết quả.</p>}{order.referenceRange && <p className="whitespace-pre-wrap text-xs text-slate-500">Tham chiếu: {order.referenceRange}</p>}{order.resultAt && <p className="text-xs text-slate-500">Ghi nhận: {resultTime(order.resultAt)}</p>}</div> : order.status === 2 ? 'Chỉ định đã hủy.' : order.status === 0 ? 'Đang chờ kỹ thuật viên ghi nhận kết quả.' : 'Vui lòng cập nhật để kiểm tra trạng thái.'}</td>{renderAction && <><td>{order.unitPriceSnapshot.toLocaleString('vi-VN')} đ</td><td>{renderAction(order)}</td></>}</tr>
      })}</tbody></table></div>
    </>}
  </Card>
}
