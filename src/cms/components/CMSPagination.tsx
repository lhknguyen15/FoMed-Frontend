import { Button } from '../../components/ui'

type Props = {
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  label?: string
}

export default function CMSPagination({ page, pageSize, totalItems, onPageChange, label = 'bản ghi' }: Props) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const first = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, totalItems)
  return <div className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center">
    <span>Hiển thị {first}–{last} / {totalItems} {label}</span>
    <span className="flex items-center gap-2">
      <Button variant="secondary" className="h-8 px-3 text-xs" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Trước</Button>
      <span>Trang {page} / {totalPages}</span>
      <Button variant="secondary" className="h-8 px-3 text-xs" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Sau</Button>
    </span>
  </div>
}
