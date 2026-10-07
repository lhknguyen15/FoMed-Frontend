// Visual-only fixture. No API calls, session tokens, real accounts or clinical writes.
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, useNavigate, useLocation } from 'react-router-dom'
import AppShell from '../../src/components/AppShell'
import { Button, PageTitle } from '../../src/components/ui'
import { AuthContext, type AuthContextValue } from '../../src/features/auth/context/auth-context'
import type { DoctorInProgress } from '../../src/features/appointments/types/appointment'
import DoctorInProgressPanel from '../../src/workspaces/doctor/components/DoctorInProgressPanel'
import '../../src/index.css'

const visits: DoctorInProgress[] = [101, 102].map((id, index) => ({ medicalRecordId: id, startedAt: '2026-10-06T06:30:00Z', appointment: { id: index + 1, appointmentCode: `AP-DEMO-${index + 1}`, patientId: index + 1, patientName: index ? 'Bệnh nhân DEMO ngày trước' : 'Bệnh nhân DEMO đang khám', doctorId: 1, doctorName: 'Bác sĩ DEMO', doctorSpecialty: 'Chuyên khoa DEMO', startTime: index ? '2026-10-05T13:30:00' : '2026-10-06T13:30:00', endTime: '2026-10-06T14:00:00', status: 2, statusName: 'InProgress', createdAt: '2026-10-06T06:30:00Z', source: 0 } }))
const unavailable = async (): Promise<never> => { throw new Error('Visual fixture only') }
const auth: AuthContextValue = { user: { id: 11, doctorId: 1, patientId: null, fullName: 'Bác sĩ DEMO', roles: ['Doctor'] }, isReady: true, isAuthenticated: true, login: unavailable, register: unavailable, forgotPassword: unavailable, logout() {}, updateFullName() {} }

function Preview() {
  const navigate = useNavigate()
  const location = useLocation()
  const [mode, setMode] = useState<'ready' | 'empty' | 'error' | 'loading'>('ready')
  return <AppShell>
    <p className="mb-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Dữ liệu minh họa, không có giá trị điều trị.</p>
    <PageTitle eyebrow="Không gian bác sĩ" title="Hàng chờ & lượt đang khám" description="Tiếp tục bệnh án chưa hoàn tất hoặc bắt đầu khám cho bệnh nhân đã check-in." />
    <DoctorInProgressPanel visits={mode === 'empty' ? [] : visits} loading={mode === 'loading'} error={mode === 'error' ? 'DEMO: Không thể tải lượt đang khám.' : ''} onRefresh={() => setMode('ready')} onResume={visit => navigate(`/doctor/exam/${visit.medicalRecordId}`)} />
    {location.pathname !== '/doctor/queue' && <p role="status" className="mb-4 rounded-xl bg-teal-50 p-4 text-teal-800">Đường dẫn tiếp tục: {location.pathname} · chỉ minh họa điều hướng, không mở bệnh án thật.</p>}
    <h2 className="mb-3 text-lg font-bold text-slate-900">Bệnh nhân đang chờ</h2><p className="mb-6 text-sm text-slate-500">Không có bệnh nhân trong hàng chờ DEMO. Mục đang khám vẫn hoạt động độc lập.</p>
    <div className="flex flex-wrap gap-2">{(['ready', 'empty', 'error', 'loading'] as const).map(value => <Button key={value} variant="secondary" onClick={() => setMode(value)}>{({ ready: 'Có dữ liệu DEMO', empty: 'Trạng thái trống', error: 'Lỗi DEMO', loading: 'Đang tải DEMO' })[value]}</Button>)}</div>
  </AppShell>
}
createRoot(document.getElementById('root')!).render(<AuthContext.Provider value={auth}><MemoryRouter initialEntries={['/doctor/queue']}><Preview /></MemoryRouter></AuthContext.Provider>)
