import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Printer, RefreshCw } from 'lucide-react'
import { Button } from '../../../components/ui'
import { invoiceApi } from '../../../features/billing/api/billing-api'
import InvoicePrintSheet from '../../../features/billing/components/InvoicePrintSheet'
import { invoicePrintError } from '../../../features/billing/schemas/invoice-print-schema'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import '../../../features/billing/components/invoice-print.css'

export default function ReceptionInvoicePrintPage() {
  const { invoiceId } = useParams()
  const id = Number(invoiceId)
  const validId = /^\d+$/.test(invoiceId ?? '') && Number.isSafeInteger(id) && id > 0
  const navigate = useNavigate()
  const query = useApiQuery(`invoice-print-${id}`, async () => validId ? { invoice: await invoiceApi.getById(id), loadedAt: new Date().toISOString() } : null)
  const data = !query.loading && !query.error && query.data?.invoice.id === id ? query.data : null
  const validation = data ? invoicePrintError(data.invoice, id) : null
  const printable = data && !validation ? data : null
  useEffect(() => {
    const previous = document.title
    document.title = printable ? `Hóa đơn ${printable.invoice.invoiceNo} · FoMed` : 'Xem trước hóa đơn · FoMed'
    return () => { document.title = previous }
  }, [printable])
  const print = () => { if (!printable || query.loading || query.error) return; window.print() }
  return <main className="invoice-print-page">
    <div className="invoice-print-toolbar"><div><h2>Xem trước hóa đơn</h2><p>Chỉ nội dung hóa đơn được in. Có thể chọn “Lưu thành PDF” trong cửa sổ in của trình duyệt.</p></div><div className="invoice-print-actions"><Button variant="secondary" onClick={() => navigate(validId ? `/reception/cashier/${id}` : '/reception/cashier')}><ArrowLeft className="size-4" /> Về thu ngân</Button><Button variant="secondary" disabled={query.loading || !validId} onClick={query.refresh}><RefreshCw className="size-4" /> Tải lại</Button><Button disabled={!printable} onClick={print}><Printer className="size-4" /> In hóa đơn</Button></div></div>
    {!validId ? <p role="alert" className="invoice-print-feedback">Mã hóa đơn không hợp lệ.</p> : query.loading ? <p role="status" className="invoice-print-feedback">Đang tải thông tin hóa đơn để in…</p> : query.error || !data ? <p role="alert" className="invoice-print-feedback">{query.error || 'Không tải được hóa đơn đã chọn. Vui lòng thử tải lại.'}</p> : validation ? <p role="alert" className="invoice-print-feedback">{validation}</p> : printable && <InvoicePrintSheet invoice={printable.invoice} loadedAt={printable.loadedAt} />}
  </main>
}
