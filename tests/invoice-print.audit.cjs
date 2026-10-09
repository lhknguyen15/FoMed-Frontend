// Offline validation, rendered sheet and handler checks only; no printer/browser/HTTP/cloud writes.
const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs')
const Module = require('node:module')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const esbuild = require('esbuild')
const root = path.resolve(__dirname, '..')
let checks = 0
const check = (ok, label) => { assert.ok(ok, label); checks++; console.log('PASS: ' + label) }
const invoice = { id: 101, invoiceNo: 'HD-PRINT-DEMO', patientId: 1, patientName: 'Nguyễn An DEMO', patientCode: 'BN-PRINT-DEMO', createdAt: '2026-10-06T17:00:00Z',
  consultationFee: 150000, totalAmount: 301000, paidAmount: 200000, status: 0,
  items: [{ description: 'Dịch vụ DEMO', quantity: 1, unitPrice: 151000, amount: 151000 }],
  payments: [{ id: 1, method: 0, amount: 200000, cashReceived: 250000, changeAmount: 50000, paidAt: '2026-10-07T01:00:00Z', receivedByName: 'Lễ tân DEMO', idempotencyKey: 'PRIVATE-ID-DO-NOT-PRINT' }] }
const fixture = { invoiceId: '101', query: { data: { invoice, loadedAt: '2026-10-07T01:05:00Z' }, loading: false, error: '' }, navigation: [], apiCalls: [], printed: 0 }
global.__printFixture = fixture
global.window = { print: () => fixture.printed++ }
async function compile(entry, plugins = []) {
  const result = await esbuild.build({ absWorkingDir: root, entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', loader: { '.png': 'dataurl', '.css': 'empty' }, external: ['react', 'react/jsx-runtime', 'lucide-react'], plugins })
  const compiled = new Module(path.join(root, 'tests', 'invoice-print.compiled.cjs'), module)
  compiled.filename = path.join(root, 'tests', 'invoice-print.compiled.cjs'); compiled.paths = module.paths
  compiled._compile(result.outputFiles[0].text, compiled.filename)
  return compiled.exports
}
function elements(node, found = []) { if (!node || typeof node !== 'object') return found; found.push(node); React.Children.forEach(node.props?.children, child => elements(child, found)); return found }
function textOf(node) { if (typeof node === 'string' || typeof node === 'number') return String(node); return React.Children.toArray(node?.props?.children).map(textOf).join('') }
async function main() {
  const schema = await compile('src/features/billing/schemas/invoice-print-schema.ts')
  check(schema.invoicePrintError(invoice, 101) === null, 'Partial invoice with saved tender/change can print')
  const full = { ...invoice, status: 1, paidAmount: 301000, payments: [{ ...invoice.payments[0], amount: 301000, cashReceived: 350000, changeAmount: 49000 }] }
  check(schema.invoicePrintError(full, 101) === null && schema.invoicePrintStatus(full) === 'Đã thanh toán', 'Paid state comes from settled saved amount and status')
  const open = { ...invoice, paidAmount: 0, payments: [] }
  check(schema.invoicePrintError(open, 101) === null && schema.invoicePrintStatus(open) === 'Chưa thanh toán', 'Unpaid preview does not claim receipt')
  const cancelled = { ...open, status: 2 }
  check(schema.invoicePrintError(cancelled, 101) === null && schema.invoicePrintStatus(cancelled) === 'Đã hủy', 'Cancelled unpaid invoice can print only with cancelled status')
  const free = { ...open, totalAmount: 0, consultationFee: 0, status: 1, items: [{ description: 'Miễn phí DEMO', quantity: 2, unitPrice: 0, amount: 0 }] }
  check(schema.invoicePrintError(free, 101) === null, 'Free-price settled invoice without fake payment accepted')
  const decimal = { ...open, consultationFee: 0, totalAmount: 0.3, items: [{ description: 'Phí DEMO', quantity: 3, unitPrice: 0.1, amount: 0.3 }] }
  check(schema.invoicePrintError(decimal, 101) === null, 'Legacy decimal amounts verified in cents rather than float equality')
  for (const change of [
    { id: 999 }, { invoiceNo: '' }, { patientName: undefined }, { patientCode: '' }, { createdAt: 'invalid' }, { status: 7 },
    { totalAmount: NaN }, { totalAmount: -1 }, { totalAmount: Infinity }, { paidAmount: -1 }, { consultationFee: -1 }, { totalAmount: 301000.001 },
    { items: [{ ...invoice.items[0], quantity: 0 }] }, { items: [{ ...invoice.items[0], unitPrice: -1 }] }, { items: [{ ...invoice.items[0], amount: 99 }] },
    { totalAmount: 301001 }, { paidAmount: 200001 }, { payments: [...invoice.payments, ...invoice.payments], paidAmount: 400000 },
    { payments: [{ ...invoice.payments[0], method: 7 }] }, { payments: [{ ...invoice.payments[0], paidAt: 'invalid' }] },
    { payments: [{ ...invoice.payments[0], amount: 0 }] }, { payments: [{ ...invoice.payments[0], cashReceived: 1 }] },
    { payments: [{ ...invoice.payments[0], changeAmount: 0 }] }, { payments: [{ ...invoice.payments[0], changeAmount: null }] },
    { status: 1 }, { status: 2 }, { status: 0, paidAmount: 301000, payments: full.payments },
  ]) check(Boolean(schema.invoicePrintError({ ...invoice, ...change }, 101)), 'Missing/mismatched invoice or payment data blocks print')
  check(schema.invoicePrintError({ ...invoice, payments: [{ ...invoice.payments[0], cashReceived: null, changeAmount: null }] }, 101) === null, 'Legacy cash without tender remains printable, without invented values')
  const simulated = { ...full, payments: [{ id: 2, amount: 301000, method: 2, paidAt: invoice.payments[0].paidAt, provider: 'SePay', providerEnvironment: 'Test', providerTransactionId: 177 }] }
  check(schema.hasSimulatedPayments(simulated) && !schema.hasSimulatedPayments({ ...simulated, payments: [{ ...simulated.payments[0], providerEnvironment: 'Live' }] }), 'Test and Live markers distinguish simulated receipts')
  check(schema.printDateTime('2026-10-06T17:00:00Z').includes('7/10/26') && schema.printDateTime('2026-10-06T17:00:00Z').includes('00:00'), 'Printed timestamps explicitly use Vietnam day boundary')
  const Sheet = (await compile('src/features/billing/components/InvoicePrintSheet.tsx')).default
  const renderSheet = changes => renderToStaticMarkup(React.createElement(Sheet, { invoice: { ...invoice, ...changes }, loadedAt: fixture.query.data.loadedAt }))
  const html = renderSheet({})
  check(html.includes(invoice.invoiceNo) && html.includes(invoice.patientName) && html.includes(invoice.patientCode), 'Real sheet shows correct invoice and patient identity')
  check(html.includes('Phí khám') && html.includes('Dịch vụ DEMO') && html.includes('151.000') && html.includes('301.000'), 'Line prices and separate fee from saved invoice')
  check(html.includes('200.000') && html.includes('101.000') && html.includes('250.000') && html.includes('50.000'), 'Tender/change separated from payment and remaining debt')
  check(html.includes('Thanh toán một phần') && html.includes('không xác nhận đã thu đủ tiền'), 'Partial invoice carries unpaid warning')
  check(!/<(?:button|form|input|select|textarea|nav)\b/.test(html) && !html.includes('PRIVATE-ID-DO-NOT-PRINT'), 'Sheet excludes cashier controls and idempotency secrets')
  check(renderSheet(simulated).includes('CÓ GIAO DỊCH MÔ PHỎNG') && renderSheet(simulated).includes('Giao dịch #177'), 'Simulated invoice prominently marked and traced')
  const cancelHtml = renderSheet(cancelled)
  check(cancelHtml.includes('HÓA ĐƠN ĐÃ HỦY') && !cancelHtml.includes('Còn phải thu'), 'Cancelled sheet is not a collection demand')
  const legacyHtml = renderSheet({ payments: [{ ...invoice.payments[0], receivedByName: null, cashReceived: null, changeAmount: null }] })
  check(legacyHtml.includes('Chưa ghi nhận') && !legacyHtml.includes('250.000'), 'Legacy missing cashier/tender never replaced with guessed values')
  const escaped = renderSheet({ patientName: '<script>DEMO</script>', items: [{ ...invoice.items[0], description: '<img src=x onerror=DEMO>' }] })
  check(escaped.includes('&lt;script&gt;') && escaped.includes('&lt;img') && !escaped.includes('<script>'), 'Patient-entered strings safely escaped by React')
  const many = renderSheet({ items: Array.from({ length: 80 }, (_, index) => ({ ...invoice.items[0], description: `Khoản mục dài DEMO ${index + 1} ${'A'.repeat(160)}` })) })
  check(many.includes('Khoản mục dài DEMO 80') && (many.match(/class="description"/g) || []).length === 81, 'Long invoices include all rows, not just a screen page')

  const plugin = { name: 'print-fixtures', setup(build) {
    build.onResolve({ filter: /^react$|react-router-dom$|useApiQuery$|billing-api$/ }, args => ({ path: args.path, namespace: 'fixture' }))
    build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents:
      args.path === 'react' ? 'export const useEffect=()=>{};' :
      args.path.endsWith('react-router-dom') ? `export const useParams=()=>({invoiceId:global.__printFixture.invoiceId});export const useLocation=()=>({search:''});export const useNavigate=()=>path=>global.__printFixture.navigation.push(path)` :
      args.path.endsWith('billing-api') ? `export const invoiceApi={getById:async id=>{global.__printFixture.apiCalls.push(id);return global.__printFixture.query.data?.invoice}}` :
      `export function useApiQuery(key,query){global.__printFixture.queryCallback=query;return {...global.__printFixture.query,refresh(){global.__printFixture.refreshed=true}}}`
    }))
  } }
  const Page = (await compile('src/workspaces/reception/pages/ReceptionInvoicePrintPage.tsx', [plugin])).default
  const tree = () => elements(Page())
  const printButton = () => tree().find(e => e.props.onClick && textOf(e) === ' In hóa đơn')
  check(!printButton().props.disabled, 'Print enabled only for verified loaded invoice')
  printButton().props.onClick(); check(fixture.printed === 1, 'Print handler invokes browser dialog exactly once on click')
  tree().find(e => e.props.onClick && textOf(e) === ' Về thu ngân').props.onClick()
  check(fixture.navigation.at(-1).startsWith('/reception/cashier/101?returnTo='), 'Back action returns to same invoice with list return context, not fixed demo route')
  tree().find(e => e.props.onClick && textOf(e) === ' Tải lại').props.onClick(); check(fixture.refreshed, 'Refresh lets cashier retrieve updated saved payments')
  await fixture.queryCallback(); check(fixture.apiCalls.at(-1) === 101, 'Preview fetches only selected authorized invoice GET')
  for (const query of [{ ...fixture.query, loading: true }, { ...fixture.query, error: 'Không tải được hóa đơn.' }, { ...fixture.query, data: { ...fixture.query.data, invoice: { ...invoice, id: 999 } } }, { ...fixture.query, data: { ...fixture.query.data, invoice: { ...invoice, paidAmount: 999 } } }]) {
    const previous = fixture.query; fixture.query = query
    check(printButton().props.disabled && !tree().some(e => e.type?.name === 'InvoicePrintSheet'), 'Loading/error/stale/unreconciled invoice hides sheet and disables print')
    printButton().props.onClick(); check(fixture.printed === 1, 'Guard prevents print handler while data unsafe')
    fixture.query = previous
  }
  fixture.invoiceId = 'wrong'; fixture.apiCalls = []; await (tree(), fixture.queryCallback())
  check(fixture.apiCalls.length === 0 && printButton().props.disabled, 'Invalid ID never fetches invoice or permits printing')
  const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8')
  check(app.includes('path="/reception/cashier/:invoiceId/print"') && app.indexOf('path="/reception/cashier/:invoiceId/print"') > app.indexOf('roles={["Receptionist", "Admin"]}'), 'Print route resides in staff-only boundary')
  const cashier = fs.readFileSync(path.join(root, 'src/workspaces/reception/pages/ReceptionCashierPage.tsx'), 'utf8')
  check(cashier.includes('navigate(invoiceDetailPath(id, returnTo, true))') && !cashier.includes('window.print()'), 'Cashier navigates to preview with return context instead of printing workspace')
  const css = fs.readFileSync(path.join(root, 'src/features/billing/components/invoice-print.css'), 'utf8')
  check(css.includes('@page fomed-invoice') && css.includes('page: fomed-invoice') && css.includes('table-header-group') && css.includes('break-inside: avoid'), 'Named A4 page and repeated headers target invoice print only')
  check(css.includes('[data-sonner-toaster]') && css.includes('.invoice-print-toolbar') && css.includes('display: none !important') && css.includes('overflow-wrap: anywhere'), 'Print hides controls/toasts and permits long text wrapping')
  console.log(`Invoice print frontend: ${checks} checks passed. Offline render/handler checks, not physical print or deployed E2E.`)
}
main().catch(error => { console.error(error.stack); process.exitCode = 1 }).finally(() => { delete global.__printFixture; delete global.window })
