// Real cashier page rendered against isolated fixtures. Never calls HTTP or Azure.
const assert = require('node:assert/strict')
const path = require('node:path')
const Module = require('node:module')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const esbuild = require('esbuild')
const root = path.resolve(__dirname, '..')
let checks = 0
function check(value, label) { assert.ok(value, label); checks++; console.log('PASS: ' + label) }
const fixture = { params: new URLSearchParams(), mode: 'success', totalCount: 45, callbacks: {}, updates: [], requests: [] }
global.__invoiceFixture = fixture
const invoice = { id: 1, invoiceNo: 'HD-DEMO-0001', patientId: 8, patientCode: 'BN-DEMO', patientName: 'Bệnh nhân DEMO', medicalRecordId: 12, totalAmount: 100000, paidAmount: 20000, status: 0, createdAt: '2026-10-06T17:00:00Z' }
fixture.invoice = invoice
async function main() {
  const plugin = { name: 'cashier-fixture', setup(build) {
    build.onResolve({ filter: /^react$|react-router-dom$|AppShell$|useApiQuery$|billing-api$/ }, args => ({ path: args.path, namespace: 'fixture' }))
    build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents:
      args.path === 'react' ? `export const useState=initial=>[initial,()=>{}],useRef=initial=>({current:initial}),useEffect=()=>{}` :
      args.path.endsWith('react-router-dom') ? `export const useNavigate=()=>()=>{}; export const useSearchParams=()=>[global.__invoiceFixture.params, next=>global.__invoiceFixture.updates.push(next)]` :
      args.path.endsWith('AppShell') ? `export default function AppShell({children}){return children}` :
      args.path.endsWith('billing-api') ? `export const invoiceApi={search:async (...args)=>{global.__invoiceFixture.requests.push(args);return {items:[],page:1,pageSize:20,totalCount:0}},eligible:async()=>[],create:async()=>{throw new Error('Unexpected write')}}` :
      `export function useApiQuery(key, query){const f=global.__invoiceFixture; f.callbacks[key]=query; const issued=key.startsWith('reception-invoices-');return {data:issued?{key:f.mode==='stale'?'previous-filter':key.slice('reception-invoices-'.length),result:{items:f.mode==='empty'?[]:[f.invoice],page:Number(f.params.get('page')||1),pageSize:20,totalCount:f.mode==='empty'?0:f.totalCount}}:[],error:f.mode==='error'?'Lỗi kết nối DEMO':'',loading:f.mode==='loading',refresh(){}}}`
    }))
  } }
  const result = await esbuild.build({ absWorkingDir: root, entryPoints: ['src/workspaces/reception/pages/ReceptionInvoiceListPage.tsx'], bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime', 'lucide-react'], plugins: [plugin] })
  const compiled = new Module(path.join(root, 'tests', 'invoice-filters.compiled.cjs'), module)
  compiled.filename = path.join(root, 'tests', 'invoice-filters.compiled.cjs'); compiled.paths = module.paths
  compiled._compile(result.outputFiles[0].text, compiled.filename)
  const Page = compiled.exports.default
  const render = () => renderToStaticMarkup(React.createElement(Page))
  const html = render()
  check(html.includes(invoice.invoiceNo) && html.includes(invoice.patientName) && html.includes(invoice.patientCode), 'Cashier rows show invoice and readable patient identity')
  check(html.includes('7/10/26') && html.includes('00:00'), 'Issue time uses Vietnam day, not UTC date')
  check(html.includes('Thanh toán một phần') && html.includes('20.000'), 'Partial payment status and collected amount displayed')
  check(html.includes('/ 45 hóa đơn phù hợp'), 'Displays server total instead of current-page length')
  check(html.includes('Ngày lập từ') && html.includes('Đến ngày') && html.includes('Còn phải thu'), 'Date/keyword/status filters rendered with accented labels')
  function elements(element, found = []) { if (!element || typeof element !== 'object') return found; found.push(element); React.Children.forEach(element.props?.children, child => elements(child, found)); return found }
  let tree = elements(Page())
  const form = tree.find(element => element.type?.name === 'InvoiceFilterForm')
  form.props.onApply({ keyword: 'HD-DEMO-0001', status: 'partial', fromDate: '2026-10-07', toDate: '2026-10-07' })
  const applied = fixture.updates.at(-1)
  check(applied.get('keyword') === 'HD-DEMO-0001' && applied.get('page') === '1' && applied.get('status') === 'partial', 'Applying filters resets page one and stores filter in URL')
  fixture.params = applied; fixture.callbacks = {}; render()
  await fixture.callbacks[Object.keys(fixture.callbacks).find(key => key.startsWith('reception-invoices-'))]()
  check(fixture.requests.at(-1)[0].keyword === 'HD-DEMO-0001' && fixture.requests.at(-1)[0].fromDate === '2026-10-07', 'Applied filters sent to server, not filtered over current page')
  fixture.params.set('page', '3'); tree = elements(Page())
  const next = tree.find(element => element.type?.name === 'Button' && element.props.children === 'Sau')
  check(next.props.disabled, 'Next disabled using total count on last page')
  const previous = tree.find(element => element.type?.name === 'Button' && element.props.children === 'Trước')
  previous.props.onClick()
  check(fixture.updates.at(-1).get('page') === '2' && fixture.updates.at(-1).get('keyword') === 'HD-DEMO-0001', 'Pagination preserves filter')
  fixture.params.set('page', 'invalid'); fixture.callbacks = {}; render()
  await fixture.callbacks[Object.keys(fixture.callbacks).findLast(key => key.startsWith('reception-invoices-'))]()
  check(fixture.requests.at(-1)[1] === 1, 'Invalid URL page safely defaults to one')
  for (const mode of ['loading', 'stale', 'error']) {
    fixture.mode = mode; const output = render()
    check(!output.includes(`<strong>${invoice.invoiceNo}</strong>`) && !output.includes('Không có hóa đơn phù hợp'), `${mode} does not display stale rows or false empty state`)
  }
  fixture.mode = 'error'; check(render().includes('role="alert"') && render().includes('Thử lại'), 'Backend unavailable shows an actionable error without old-endpoint fallback')
  fixture.mode = 'empty'; check(render().includes('Không có hóa đơn phù hợp'), 'Actual empty search has clear filter guidance')
  fixture.mode = 'success'; fixture.params.set('tab', 'eligible')
  check(!render().includes('Tìm hóa đơn hoặc bệnh nhân') && render().includes('Không có lượt khám chờ lập hóa đơn'), 'Existing candidate tab remains separate, not silently page-filtered')
  console.log(`Invoice filter page: ${checks} passed. Synthetic render/interaction checks only.`)
}
main().catch(error => { console.error(error.stack); process.exitCode = 1 }).finally(() => { delete global.__invoiceFixture })
