// Isolated UI fixture: real cashier/modal/polling, in-memory fake API only.
// No storage/session access, network API requests, webhook or payment mutations.
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext, type AuthContextValue } from '../../src/features/auth/context/auth-context'
import { invoiceApi } from '../../src/features/billing/api/billing-api'
import type { Invoice, SePayPaymentRequest, SePayStatus } from '../../src/features/billing/types/billing'
import ReceptionCashierPage from '../../src/workspaces/reception/pages/ReceptionCashierPage'
import '../../src/index.css'

const scenario = new URLSearchParams(location.search).get('case') ?? 'paid'
const unavailable = async (): Promise<never> => { throw new Error('DEMO: Thao tác ngoài phạm vi kiểm thử.') }
// Fail closed if any unexpected API tries to use HTTP. Test mode never renders external QR images.
window.fetch = unavailable
const initial: SePayPaymentRequest = {
  id: '00000000-0000-4000-8000-000000000001', invoiceId: 101, environment: 'Test',
  code: 'FM0123456789ABCDEF01234567', amount: 261000, bankCode: 'MB', accountNumber: '0000000001', accountName: 'TÀI KHOẢN DEMO',
  createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 900000).toISOString(), status: 'Pending', remainingAmount: 261000,
  qrUrl: 'https://vietqr.app/img?acc=0000000001&bank=MB&amount=261000&des=FM0123456789ABCDEF01234567',
}
let invoice: Invoice = { id: 101, invoiceNo: 'HD-DEMO-101', patientId: 1, medicalRecordId: 1, totalAmount: 261000, paidAmount: 0,
  status: 0, consultationFee: 0, items: [{ description: 'Dịch vụ DEMO', quantity: 1, unitPrice: 261000, amount: 261000 }], payments: [] }
const testPayment = { id: 1, amount: 261000, method: 2, paidAt: '2026-10-06T08:00:00Z',
  provider: 'SePay', providerEnvironment: 'Test', providerTransactionId: 1 }
if (scenario === 'paid-reload' || scenario === 'cash-reload') {
  invoice = { ...invoice, paidAmount: 261000, status: 1, payments: [scenario === 'cash-reload'
    ? { id: 1, amount: 261000, method: 0, paidAt: '2026-10-06T08:00:00Z', cashReceived: 300000, changeAmount: 39000, receivedByName: 'Lễ tân DEMO' }
    : testPayment] }
}
if (scenario === 'partial') invoice = { ...invoice, paidAmount: 100000, payments: [{ ...testPayment, amount: 100000 }] }
if (scenario === 'cancelled') invoice = { ...invoice, status: 2 }
if (scenario === 'zero-open') invoice = { ...invoice, totalAmount: 0, items: [] }
let reads = 0
let creates = 0
let invoiceReads = 0
function stats() {
  const element = document.getElementById('fixture-stats')
  if (element) element.textContent = `DEMO: tạo yêu cầu ${creates}; kiểm tra trạng thái ${reads}; tải hóa đơn ${invoiceReads}; khoản thu ${invoice.payments.length}.`
}
function result(status: SePayStatus): SePayPaymentRequest {
  if (status === 'Paid' && invoice.payments.length === 0) {
    invoice = { ...invoice, paidAmount: 261000, status: 1, payments: [{ id: 1, amount: 261000, method: 2, paidAt: new Date().toISOString(),
      provider: 'SePay', providerEnvironment: 'Test', providerTransactionId: 1 }] }
  }
  return { ...initial, status, remainingAmount: status === 'Paid' || status === 'InvoiceSettled' ? 0 : 261000 }
}
invoiceApi.getById = async () => { invoiceReads++; stats(); return invoice }
invoiceApi.createSePayRequest = async () => { creates++; reads = 0; stats(); return scenario === 'initial-paid' ? result('Paid') : { ...initial } }
invoiceApi.getSePayRequest = async () => {
  reads++; stats()
  if (scenario === 'retry' && reads === 2) throw new TypeError('DEMO network failure')
  if (scenario === 'pending' || reads < 2) return { ...initial }
  if (scenario === 'invalid') return { ...initial, status: 'Paid', remainingAmount: 1 }
  const status = scenario === 'review' ? 'ReviewRequired' : scenario === 'settled' ? 'InvoiceSettled' : scenario === 'expired' ? 'Expired' : 'Paid'
  const value = result(status)
  stats()
  return value
}
invoiceApi.pay = async (_id, payload) => {
  if (scenario !== 'cash' || payload.method !== 0 || payload.amount !== 261000 || payload.cashReceived !== 300000 || invoice.status !== 0) return unavailable()
  invoice = { ...invoice, paidAmount: 261000, status: 1, payments: [{ id: 1, amount: payload.amount, method: 0,
    paidAt: '2026-10-06T08:00:00Z', cashReceived: payload.cashReceived, changeAmount: 39000,
    idempotencyKey: payload.idempotencyKey, receivedByName: 'Lễ tân DEMO' }] }
}
invoiceApi.cancel = unavailable
const auth: AuthContextValue = { user: { id: 1, patientId: null, doctorId: null, fullName: 'Lễ tân DEMO', roles: ['Receptionist'] },
  isReady: true, isAuthenticated: true, login: unavailable, register: unavailable, forgotPassword: unavailable, logout() {}, updateFullName() {} }

createRoot(document.getElementById('root')!).render(<AuthContext.Provider value={auth}><MemoryRouter initialEntries={['/reception/cashier/101']}>
  <div className="fixed bottom-0 left-0 z-10 max-w-full rounded-tr-xl bg-amber-50 p-2 text-xs text-amber-900"><p>DỮ LIỆU MÔ PHỎNG — không gửi tiền hoặc thay dữ liệu thật.</p><p id="fixture-stats">Đang tải DEMO…</p></div>
  <Routes><Route path="/reception/cashier/:invoiceId" element={<ReceptionCashierPage />} /></Routes>
</MemoryRouter></AuthContext.Provider>)
