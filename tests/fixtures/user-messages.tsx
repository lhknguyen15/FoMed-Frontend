// Isolated visual fixture, synthetic messages only. No authentication/API requests.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AlertCircle } from 'lucide-react'
import { Button, Card } from '../../src/components/ui'
import { getUserErrorMessage } from '../../src/shared/api/user-messages'
import '../../src/index.css'

const cases = [
  ['Khung giờ đã được đặt', 409, 'Bac si da co lich hen khac trong khung gio nay.'],
  ['Kết nối bị gián đoạn', 0, 'Failed to fetch'],
  ['Hệ thống tạm gián đoạn', 500, 'System.Data.SqlClient.SqlException DEMO_ONLY'],
  ['Chưa nhập chẩn đoán', 400, 'Can cap nhat chan doan truoc khi hoan tat lich hen.'],
] as const
function Preview() {
  const [selected, setSelected] = useState(0)
  const scenario = cases[selected]
  return <main className="mx-auto max-w-2xl p-5 sm:p-10"><p className="mb-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Các tình huống minh họa, không thực hiện thao tác trên hồ sơ thật.</p><Card className="p-5 sm:p-7"><h1 className="text-2xl font-bold text-slate-900">Thông báo trên FoMed</h1><p className="mt-2 text-sm leading-6 text-slate-500">Thông báo rõ lý do, hướng dẫn bước tiếp theo và sử dụng tiếng Việt có dấu.</p><div className="mt-5 flex flex-wrap gap-2">{cases.map(([label], index) => <Button key={label} variant={selected === index ? 'primary' : 'secondary'} onClick={() => setSelected(index)}>{label}</Button>)}</div><div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-700"><AlertCircle className="mt-1 size-5 shrink-0" /><p>{getUserErrorMessage({ message: scenario[2] }, scenario[1])}</p></div><p className="mt-4 text-xs leading-5 text-slate-500">Bạn có thể chọn một tình huống bên trên để xem thông báo tương ứng.</p></Card></main>
}
createRoot(document.getElementById('root')!).render(<Preview />)
