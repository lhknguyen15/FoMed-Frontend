// Render the real cashier page with read-only in-memory query snapshots.
// No browser, credentials, network calls or payment writes.
const assert = require('node:assert/strict')
const path = require('node:path')
const Module = require('node:module')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { MemoryRouter, Route, Routes } = require('react-router-dom')
const esbuild = require('esbuild')

async function main() {
  const root = path.resolve(__dirname, '..')
  const result = await esbuild.build({ absWorkingDir: root,
    entryPoints: ['src/workspaces/reception/pages/ReceptionCashierPage.tsx'], bundle: true, write: false,
    platform: 'node', format: 'cjs', jsx: 'automatic', define: { 'import.meta.env': '{}' },
    external: ['react', 'react/jsx-runtime', 'react-router-dom', 'lucide-react'],
    plugins: [{ name: 'isolated-cashier', setup(build) {
      build.onResolve({ filter: /(?:AppShell|useApiQuery|billing-api)$/ }, args => ({ path: args.path, namespace: 'fixture' }))
      build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ loader: 'js', contents:
        args.path.endsWith('AppShell') ? 'export default function AppShell({children}) { return children }'
          : args.path.endsWith('useApiQuery') ? 'export function useApiQuery() { return globalThis.__cashierSnapshot }'
            : 'const forbidden = () => { throw new Error("Unexpected API call") }; export const invoiceApi = new Proxy({}, {get: () => forbidden})' }))
    } }] })
  const filename = path.join(root, 'tests', 'cashier-paid-state.compiled.cjs')
  const compiled = new Module(filename, module)
  compiled.filename = filename
  compiled.paths = module.paths
  compiled._compile(result.outputFiles[0].text, filename)
  const Page = compiled.exports.default
  const invoice = { id: 101, invoiceNo: 'HD-DEMO-101', patientId: 1, medicalRecordId: 1,
    totalAmount: 261000, paidAmount: 261000, status: 1, consultationFee: 0,
    items: [{ description: 'Dịch vụ DEMO', quantity: 1, unitPrice: 261000, amount: 261000 }],
    payments: [{ id: 1, amount: 261000, method: 2, paidAt: '2026-10-06T08:00:00Z',
      provider: 'SePay', providerEnvironment: 'Test', providerTransactionId: 1 }] }
  const render = (changes = {}, query = {}) => {
    globalThis.__cashierSnapshot = { data: { ...invoice, ...changes }, loading: false, error: '', refresh() {}, ...query }
    return renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: ['/reception/cashier/101'] },
      React.createElement(Routes, null, React.createElement(Route, { path: '/reception/cashier/:invoiceId', element: React.createElement(Page) }))))
  }
  let checks = 0
  const check = (ok, label) => { assert.ok(ok, label); checks++; console.log('PASS: ' + label) }
  const region = html => html.includes('aria-label="Hóa đơn đã thanh toán"')
  const paid = render()
  check(region(paid) && paid.includes('Hóa đơn không còn công nợ'), 'Paid invoice has a read-only settlement region')
  check(!/<(?:form|select|input|textarea)\b/.test(paid), 'Paid invoice removes all collection inputs, not just disables them')
  check(!paid.includes('Xác nhận thu') && !paid.includes('Tạo mã QR SePay'), 'Paid invoice has no cash/QR submit action')
  check(!paid.includes('Hủy hóa đơn'), 'Paid invoice has no cancel action')
  check(paid.includes('Số tiền đã thu') && /261[.\s]000/.test(paid), 'Settlement amount comes from invoice paidAmount')
  check(paid.includes('Lịch sử thanh toán') && paid.includes('Giao dịch mô phỏng'), 'SePay Test history remains visible and identified')
  check(/<button[^>]*>.*?In hóa đơn<\/button>/.test(paid), 'Printing remains available')
  check(paid.includes('tabindex="-1"') && paid.includes('role="region"'), 'Read-only region can receive restored focus')
  check(region(render()), 'Fresh page render restores settled state without local success flags')
  const cash = render({ payments: [{ id: 2, amount: 261000, method: 0, paidAt: '2026-10-06T08:00:00Z',
    cashReceived: 300000, changeAmount: 39000, receivedByName: 'Lễ tân DEMO' }] })
  check(region(cash) && !cash.includes('<form'), 'Cash settlement uses the same read-only state')
  check(cash.includes('Tiền khách đưa') && cash.includes('Tiền thừa trả khách') && /39[.\s]000/.test(cash), 'Cash tender/change remain in history, not an editable form')
  for (const [label, changes] of [
    ['unpaid', { status: 0, paidAmount: 0, payments: [] }],
    ['partial', { status: 0, paidAmount: 100000 }],
    ['cancelled', { status: 2, paidAmount: 0, payments: [] }],
    ['zero-balance but open', { status: 0 }],
    ['inconsistent paid status', { paidAmount: 100000 }],
    ['different invoice', { id: 999 }],
    ['nonfinite amount', { paidAmount: NaN }],
  ]) {
    const html = render(changes)
    check(!region(html), label + ' is not declared settled')
    check(html.includes('Ghi nhận thanh toán'), label + ' retains the existing form workflow')
    if (changes.status !== 0 || changes.paidAmount === 261000 || changes.id === 999) {
      check(/<select[^>]*disabled/.test(html), label + ' cannot collect while inactive')
    }
  }
  check(!/<select[^>]*disabled/.test(render({ status: 0, paidAmount: 100000 })), 'Open partial invoice still permits collecting remaining debt')
  check(!region(render({}, { loading: true })) && !render({}, { loading: true }).includes('<form'), 'Loading does not show stale settled state or form')
  check(!region(render({}, { error: 'Không thể tải hóa đơn.' })), 'Read error does not assert paid state')
  delete globalThis.__cashierSnapshot
  console.log(`Cashier paid state: ${checks} passed. Render-only; no API or database changes.`)
}
main().catch(error => { delete globalThis.__cashierSnapshot; console.error(error); process.exitCode = 1 })
