// Visual-only fixture: synthetic data, no API/session/clinical writes.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import { History } from 'lucide-react'
import AppShell from '../../src/components/AppShell'
import { Button, Card, PageTitle } from '../../src/components/ui'
import { AuthContext, type AuthContextValue } from '../../src/features/auth/context/auth-context'
import type { PatientHistorySummary } from '../../src/features/appointments/types/appointment'
import DoctorHistoryEntries from '../../src/workspaces/doctor/components/DoctorHistoryEntries'
import '../../src/index.css'

const history: PatientHistorySummary[] = [106, 105, 104, 103, 102].map((id, index) => ({
  medicalRecordId: id, appointmentId: id, visitAt: `2026-10-0${5 - index}T13:30:00`,
  diagnosis: `Chẩn đoán tượng trưng DEMO ${id}`,
  note: 'Ghi chú minh họa lần khám trước, không có giá trị điều trị.',
}))
const unavailable = async (): Promise<never> => { throw new Error('Visual fixture only') }
const auth: AuthContextValue = { user: { id: 11, doctorId: 1, patientId: null, fullName: 'Bác sĩ DEMO', roles: ['Doctor'] }, isReady: true, isAuthenticated: true, login: unavailable, register: unavailable, forgotPassword: unavailable, logout() {}, updateFullName() {} }

function Preview() {
  const [mode, setMode] = useState<'ready' | 'empty' | 'error' | 'loading'>('ready')
  return <AppShell>
    <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Dữ liệu minh họa, không có giá trị điều trị.</p>
    <PageTitle eyebrow="Khám bệnh" title="Bệnh nhân DEMO" description="Bệnh án DEMO #1000 · Kiểm tra lịch sử khám và các trạng thái tải." />
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_360px]">
      <Card className="p-5"><h2 className="mb-3 text-lg font-bold text-slate-900">Bệnh án</h2><p className="text-sm text-slate-500">Lưu thông tin khám bệnh và xem lại các lần khám trước của bệnh nhân.</p><div className="mt-5 flex flex-wrap gap-2">{(['ready', 'empty', 'error', 'loading'] as const).map(value => <Button key={value} variant="secondary" onClick={() => setMode(value)}>{({ ready: 'Có dữ liệu DEMO', empty: 'Trạng thái trống', error: 'Lỗi DEMO', loading: 'Đang tải DEMO' })[value]}</Button>)}</div></Card>
      <Card className="min-w-0 p-5"><div className="mb-4 flex items-center justify-between gap-2"><div><h2 className="text-lg font-bold text-slate-900">Lịch sử khám</h2><p className="mt-1 text-sm text-slate-500">5 lần khám đã chốt trước lượt hiện tại.</p></div><History className="size-5 shrink-0 text-slate-400" /></div>
        <DoctorHistoryEntries history={mode === 'empty' ? [] : history} loading={mode === 'loading'} error={mode === 'error' ? 'DEMO: Không thể tải lịch sử khám. Hãy thử lại.' : ''} onRetry={() => setMode('ready')} />
      </Card>
    </div>
  </AppShell>
}
createRoot(document.getElementById('root')!).render(<AuthContext.Provider value={auth}><MemoryRouter initialEntries={['/doctor/exam/1000']}><Preview /></MemoryRouter></AuthContext.Provider>)
