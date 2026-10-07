// Real patient/recovery pages. No registration/password form submission in browser.
import { StrictMode, useState, useSyncExternalStore } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { AuthContext, type AuthContextValue } from '../../src/features/auth/context/auth-context'
import { authApi } from '../../src/features/auth/api/auth-api'
import { patientStaffApi } from '../../src/features/patients/api/patient-api'
import type { Patient } from '../../src/features/patients/types/patient'
import AppToaster from '../../src/shared/notifications/AppToaster'
import ReceptionPatientsPage from '../../src/workspaces/reception/pages/ReceptionPatientsPage'
import ForgotPasswordPage from '../../src/workspaces/auth/pages/ForgotPasswordPage'
import '../../src/index.css'

const blocked = async (): Promise<never> => { throw new Error('DEMO: Chặn kết nối ngoài phạm vi.') }
window.fetch = blocked
for (const api of [authApi, patientStaffApi]) for (const key of Object.keys(api)) Object.assign(api, { [key]: blocked })
const initialPatients = (): Patient[] => [{ patientId: 1, patientCode: 'BN-DEMO', fullName: 'Người dùng DEMO', phone: '0000000000', isActive: true }]
let patients = initialPatients()
let mode = 'success', attempts = 0, saved = 0, reloadFails = false
let release: (() => void) | null = null
let snapshot = 'Lần gửi DEMO: 0; hồ sơ đã lưu: 0.'
const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
const publish = () => { snapshot = `Lần gửi DEMO: ${attempts}; hồ sơ đã lưu: ${saved}.`; listeners.forEach(fn => fn()) }
async function mutation() {
  const outcome = mode
  attempts++; publish()
  if (outcome === 'pending') await new Promise<void>(resolve => { release = resolve })
  if (outcome === 'error') throw new Error('SqlClient exception: secret=DEMO')
  return outcome
}
patientStaffApi.search = async () => {
  if (reloadFails) throw new Error('SqlClient exception: secret=DEMO')
  return patients.map(row => ({ ...row }))
}
patientStaffApi.history = async () => []
patientStaffApi.create = async request => {
  const outcome = await mutation()
  const row = { patientId: patients.length + 1, patientCode: `BN-DEMO-${patients.length + 1}`, ...request, isActive: true } as Patient
  patients = [...patients, row]; saved++; reloadFails = outcome === 'reload-error'; publish(); return { ...row }
}
patientStaffApi.update = async (id, request) => {
  const outcome = await mutation()
  const row = { ...patients.find(item => item.patientId === id)!, ...request } as Patient
  patients = patients.map(item => item.patientId === id ? row : item); saved++; reloadFails = outcome === 'reload-error'; publish(); return { ...row }
}
const user = { id: 1, doctorId: null, patientId: null, fullName: 'Người dùng DEMO', roles: ['Receptionist'] }
const auth: AuthContextValue = { user, isReady: true, isAuthenticated: true, login: blocked, register: blocked,
  forgotPassword: async () => { await mutation(); return 'SqlClient secret=DEMO — this raw response must not appear' }, logout() {}, updateFullName() {} }
function Controls({ reset }: { reset: () => void }) {
  const navigate = useNavigate()
  const stats = useSyncExternalStore(subscribe, () => snapshot)
  return <aside className="relative z-10 space-y-2 border-b border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 lg:ml-[264px]">
    <p>DEMO — không tạo tài khoản, đổi mật khẩu hay lưu hồ sơ thật.</p><p>{stats}</p>
    <label>Kết quả DEMO <select aria-label="Kết quả DEMO" defaultValue={mode} onChange={event => { mode = event.target.value; if (mode === 'success') reloadFails = false }}>
      <option value="success">Thành công</option><option value="pending">Chờ phản hồi</option><option value="error">Lỗi nội bộ</option><option value="reload-error">Lưu được, tải lại lỗi</option>
    </select></label>
    <div className="flex flex-wrap gap-3"><button onClick={() => { toast.dismiss(); navigate('/reception/patients') }}>Hồ sơ DEMO</button><button onClick={() => { toast.dismiss(); navigate('/forgot-password') }}>Quên mật khẩu DEMO</button>
      <button onClick={() => { release?.(); release = null }}>Trả phản hồi DEMO</button><button onClick={reset}>Làm lại DEMO</button></div>
  </aside>
}
export default function Preview() {
  const [revision, setRevision] = useState(0)
  const reset = () => { patients = initialPatients(); attempts = 0; saved = 0; reloadFails = false; release = null; publish(); toast.dismiss(); setRevision(value => value + 1) }
  return <AuthContext.Provider value={auth}><MemoryRouter initialEntries={['/reception/patients']}><AppToaster /><Controls key={`controls-${revision}`} reset={reset} />
    <Routes key={`pages-${revision}`}><Route path="/reception/patients" element={<ReceptionPatientsPage />} />
      <Route path="/forgot-password" element={<main className="mx-auto max-w-lg p-6"><ForgotPasswordPage /></main>} />
      <Route path="/login" element={<main className="p-6">Trang đăng nhập DEMO — không nhập thông tin xác thực.</main>} />
      <Route path="/reception/booking" element={<main className="p-6">Đặt lịch DEMO — chuyển tiếp hồ sơ đã chọn.</main>} />
    </Routes></MemoryRouter></AuthContext.Provider>
}
createRoot(document.getElementById('root')!).render(<StrictMode><Preview /></StrictMode>)
