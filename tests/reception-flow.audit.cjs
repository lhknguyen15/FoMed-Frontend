// Offline real hook/page checks. No browser, cloud credentials, API writes or patient data.
const assert = require('node:assert/strict')
const path = require('node:path')
const Module = require('node:module')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const esbuild = require('esbuild')
const root = path.resolve(__dirname, '..')
let checks = 0
const check = (ok, label) => { assert.ok(ok, label); checks++; console.log('PASS: ' + label) }
const f = { states: [], cursor: 0, effects: [], navigation: [], search: '', params: new URLSearchParams(), calls: [], callbacks: [] }
global.__receptionFlow = f
const reactMock = `const f=global.__receptionFlow;
export function useState(initial){const i=f.cursor++;if(!(i in f.states))f.states[i]=typeof initial==='function'?initial():initial;return[f.states[i],v=>f.states[i]=typeof v==='function'?v(f.states[i]):v]}
export function useRef(initial){const i=f.cursor++;return f.states[i]??(f.states[i]={current:initial})}
export const useMemo=fn=>fn(); export const useCallback=fn=>fn; export const useId=()=> 'demo-field';
export function useEffect(fn,deps){const i=f.cursor++,old=f.states[i];if(!old||deps.some((v,n)=>!Object.is(v,old.deps[n]))){f.effects.push(()=>{old?.cleanup?.();const slot={deps};f.states[i]=slot;slot.cleanup=fn()})}}`
async function compile(contents, pages = false) {
  const plugin = { name: 'reception-fixture', setup(build) {
    build.onResolve({ filter: /^react$|^react-router-dom$|\/AppShell$|\/useApiQuery$|\/useClinicDate$|\/billing-api$|\/appointment-api$|\/catalog-api$|notifications\/notify$|\/useLiveApiQuery$/ }, args => {
      if (args.path.endsWith('/useLiveApiQuery') && !pages) return
      return { path: args.path, namespace: 'fixture' }
    })
    build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents:
      args.path === 'react' ? reactMock :
      args.path === 'react-router-dom' ? `const f=global.__receptionFlow;export const useNavigate=()=> (...a)=>f.navigation.push(a);export const useLocation=()=>({search:f.search});export const useParams=()=>({invoiceId:'170'});export const useSearchParams=()=>[f.params,()=>{}];` :
      args.path.endsWith('/AppShell') ? `export default function AppShell({children,navigationCounts}){global.__receptionFlow.counts=navigationCounts;return children}` :
      args.path.endsWith('/useClinicDate') ? `export const useClinicDate=()=> '2030-01-01'` :
      args.path.endsWith('/useLiveApiQuery') ? `export function useLiveApiQuery(key,query,paused){global.__receptionFlow.live={key,query,paused};return global.__receptionFlow.liveSnapshot}` :
      args.path.endsWith('/useApiQuery') ? `export function useApiQuery(key,query){const f=global.__receptionFlow;f.callbacks.push(query);return key.startsWith('reception-invoice-')?f.invoiceSnapshot:key.startsWith('reception-invoices-')?{data:{key:key.slice('reception-invoices-'.length),result:{items:[f.invoice],page:2,pageSize:20,totalCount:45}},loading:false,error:'',refresh(){}}:key.startsWith('invoice-print-')?{data:null,loading:true,error:'',refresh(){}}:{data:[],loading:false,error:'',refresh(){}}}` :
      args.path.endsWith('/billing-api') ? `export const invoiceApi=new Proxy({}, {get:()=>()=>{throw new Error('Unexpected payment write')}})` :
      args.path.endsWith('/appointment-api') ? `export const appointmentApi=new Proxy({}, {get:(_,name)=>(...args)=>{global.__receptionFlow.calls.push({name,args});return Promise.resolve([])}})` :
      args.path.endsWith('/catalog-api') ? `export const catalogApi={doctors:async()=>[]}` :
      `export const notify={success(){},error(){}}`
    }))
  } }
  const output = await esbuild.build({ absWorkingDir: root, stdin: { resolveDir: root, contents, loader: 'ts' }, bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', loader: { '.png': 'dataurl', '.css': 'empty' }, external: ['react/jsx-runtime', 'lucide-react'], plugins: [plugin] })
  const compiled = new Module(path.join(root, 'tests', 'reception-flow.compiled.cjs'), module)
  compiled.filename = path.join(root, 'tests', 'reception-flow.compiled.cjs'); compiled.paths = module.paths
  compiled._compile(output.outputFiles[0].text, compiled.filename)
  return compiled.exports
}
const elements = (node, out = []) => { if (node && typeof node === 'object') { out.push(node); React.Children.forEach(node.props?.children, child => elements(child, out)) }; return out }
const text = node => typeof node === 'string' ? node : React.Children.toArray(node?.props?.children).map(text).join('')
const unmount = () => { for (const slot of f.states) slot?.cleanup?.(); f.states = []; f.effects = [] }
const begin = () => { f.cursor = 0 }
const flushEffects = () => { const effects = f.effects.splice(0); effects.forEach(fn => fn()) }
const settle = async () => { for (let i = 0; i < 10; i++) await Promise.resolve() }
async function main() {
  const { useLiveApiQuery, ApiError, invoiceListReturnTo, invoiceDetailPath } = await compile(`export * from './src/shared/hooks/useLiveApiQuery';export * from './src/shared/api/api-error';export * from './src/features/billing/utils/invoice-navigation';`)
  const back = '/reception/cashier?tab=issued&page=2&status=paid&keyword=HD170&fromDate=2030-01-01'
  check(invoiceListReturnTo(back) === back, 'List return path retains tab, filters and page')
  for (const target of [undefined, null, {}, 'https://evil.test', '//evil.test', '/admin', '/reception/cashier/170', '/reception/cashier?x=1#outside', '/reception/cashier?' + 'a'.repeat(2050)])
    check(invoiceListReturnTo(target) === '/reception/cashier', 'Unsafe/direct-entry back target falls back to cashier list')
  const detail = invoiceDetailPath(170, back)
  check(new URL(detail, 'https://local.test').searchParams.get('returnTo') === back, 'Detail URL carries list context across reload')
  check(invoiceDetailPath(170, back, true).includes('/170/print?'), 'Print URL carries identical list context')

  const originals = { window: global.window, document: global.document, setTimeout: global.setTimeout, clearTimeout: global.clearTimeout, now: Date.now }
  let clock = 100000, timerId = 0
  const timers = new Map(), docListeners = new Map(), winListeners = new Map(), requests = []
  const add = (map, event, fn) => { if (!map.has(event)) map.set(event, new Set()); map.get(event).add(fn) }
  const remove = (map, event, fn) => map.get(event)?.delete(fn)
  const fire = (map, event) => [...(map.get(event) ?? [])].forEach(fn => fn())
  const query = signal => new Promise((resolve, reject) => requests.push({ signal, resolve, reject }))
  const renderHook = (key = 'queue-a', paused = false) => { begin(); const snapshot = useLiveApiQuery(key, query, paused); flushEffects(); return snapshot }
  const tick = async (ms = 15000) => { clock += ms; for (const [id, timer] of [...timers]) if (timer.at <= clock) { timers.delete(id); timer.fn() }; await settle() }
  try {
    Date.now = () => clock
    global.setTimeout = (fn, delay) => { const id = ++timerId; timers.set(id, { fn, at: clock + delay }); return id }
    global.clearTimeout = id => timers.delete(id)
    global.document = { visibilityState: 'visible', addEventListener: (e, fn) => add(docListeners, e, fn), removeEventListener: (e, fn) => remove(docListeners, e, fn) }
    global.window = { addEventListener: (e, fn) => add(winListeners, e, fn), removeEventListener: (e, fn) => remove(winListeners, e, fn) }
    check(renderHook().loading && requests.length === 1, 'Initial mount starts exactly one read')
    requests.at(-1).resolve([{ id: 170, status: 1 }]); await settle()
    check(renderHook().data[0].status === 1 && timers.size === 1, 'Waiting snapshot schedules a single next update')
    await tick()
    let snapshot = renderHook()
    check(!snapshot.loading && snapshot.refreshing && snapshot.data.length === 1, 'Background read retains rows without replacing page with spinner')
    fire(winListeners, 'focus'); fire(winListeners, 'focus')
    check(requests.length === 2, 'Focus events never overlap the current read')
    requests.at(-1).resolve([]); await settle()
    check(renderHook().data.length === 0, 'Authoritative empty waiting queue removes patient after doctor starts')
    await tick(); requests.at(-1).resolve([{ id: 171, status: 1 }]); await settle()
    check(renderHook().data[0].id === 171, 'Empty queue keeps polling to discover new arrivals')
    global.document.visibilityState = 'hidden'; fire(docListeners, 'visibilitychange')
    const hiddenCount = requests.length; await tick(60000)
    check(requests.length === hiddenCount && timers.size === 0, 'Hidden tab stops scheduled polling')
    global.document.visibilityState = 'visible'; fire(docListeners, 'visibilitychange')
    check(requests.length === hiddenCount + 1, 'Returning to visible tab refreshes immediately')
    requests.at(-1).resolve([{ id: 171, status: 2 }]); await settle()
    check(renderHook().data[0].status === 2, 'Daily appointments can receive the doctor in-progress status')
    renderHook('queue-a', true); const pausedCount = requests.length; await tick(60000); fire(winListeners, 'focus')
    check(requests.length === pausedCount, 'Open confirmation or mutation pauses automatic reads')
    renderHook('queue-a', false)
    check(requests.length === pausedCount + 1, 'Closing confirmation resumes with a fresh read')
    snapshot = renderHook(); snapshot.refresh(); snapshot.refresh()
    check(requests.length === pausedCount + 1, 'Manual refresh during read queues rather than overlaps')
    requests.at(-1).resolve([]); await settle()
    check(requests.length === pausedCount + 2, 'Queued refresh reconciles once after the existing read')
    requests.at(-1).resolve([]); await settle()
    snapshot = renderHook(); snapshot.refresh()
    const old = requests.at(-1)
    check(renderHook('queue-b').data === null && old.signal.aborted, 'Changing date/doctor hides and aborts the old snapshot')
    old.resolve([{ id: 999 }]); await settle()
    requests.at(-1).resolve([{ id: 180 }]); await settle()
    check(renderHook('queue-b').data[0].id === 180, 'Late result cannot overwrite a different filter')
    await tick(); requests.at(-1).reject(new Error('SQL_PRIVATE')); await settle()
    snapshot = renderHook('queue-b')
    check(snapshot.data === null && snapshot.error && !snapshot.error.includes('SQL_PRIVATE'), 'Read failure removes stale actions and hides diagnostics')
    const failedCount = requests.length; fire(winListeners, 'focus'); await tick(15000)
    check(requests.length === failedCount, 'Failed read backs off instead of retrying on every focus')
    await tick(15000); requests.at(-1).reject(new ApiError('Vui lòng chờ.', 429, null, 90)); await settle()
    snapshot = renderHook('queue-b'); const limitedCount = requests.length
    snapshot.refresh(); fire(winListeners, 'focus'); await tick(60000)
    check(requests.length === limitedCount, '429 Retry-After applies to automatic and manual refresh')
    await tick(30000); requests.at(-1).reject(new Error('offline')); await settle()
    const stoppedCount = requests.length; await tick(300000); fire(winListeners, 'focus')
    check(requests.length === stoppedCount && timers.size === 0, 'Three consecutive failures stop automatic retries')
    renderHook('queue-b').refresh(); requests.at(-1).resolve([]); await settle()
    check(renderHook('queue-b').error === '' && timers.size === 1, 'Explicit retry recovers and restarts polling')
    renderHook('queue-b').refresh(); const unfinished = requests.at(-1); unmount()
    check(unfinished.signal.aborted && timers.size === 0 && [...docListeners.values(), ...winListeners.values()].every(set => set.size === 0), 'Unmount aborts read and cleans timer/listeners')
    unfinished.resolve([{ id: 999 }]); await settle()
    check(timers.size === 0, 'Late completion after unmount never restarts polling')
    renderHook('protected'); requests.at(-1).reject(new ApiError('Đăng nhập lại.', 401)); await settle()
    const unauthorizedCount = requests.length; await tick(300000); fire(winListeners, 'focus')
    check(requests.length === unauthorizedCount, 'Expired authentication stops background reads')
    unmount()
  } finally {
    unmount(); global.window = originals.window; global.document = originals.document
    global.setTimeout = originals.setTimeout; global.clearTimeout = originals.clearTimeout; Date.now = originals.now
  }

  const pages = await compile(`export {default as Cashier} from './src/workspaces/reception/pages/ReceptionCashierPage';export {default as InvoiceList} from './src/workspaces/reception/pages/ReceptionInvoiceListPage';export {default as Print} from './src/workspaces/reception/pages/ReceptionInvoicePrintPage';export {default as Queue} from './src/workspaces/reception/pages/ReceptionQueuePage';export {default as Dashboard} from './src/workspaces/reception/pages/ReceptionDashboardPage';`, true)
  f.invoice = { id: 170, invoiceNo: 'HD170', patientId: 1, patientName: 'DEMO', createdAt: '2030-01-01T01:00:00Z', totalAmount: 100, paidAmount: 0, status: 0, consultationFee: 100, items: [], payments: [] }
  const pageTree = Page => { unmount(); begin(); return elements(Page()) }
  const clickBack = tree => tree.find(node => node.type?.name === 'PageTitle').props.action.props.onClick()
  f.search = new URL(detail, 'https://local.test').search
  for (const invoiceSnapshot of [{ data: f.invoice, loading: false, error: '' }, { data: null, loading: true, error: '' }, { data: null, loading: false, error: 'Không tải được hóa đơn' }]) {
    f.invoiceSnapshot = { ...invoiceSnapshot, refresh() {} }; clickBack(pageTree(pages.Cashier))
    check(f.navigation.at(-1)[0] === back, 'Cashier back button works in loaded/loading/error states with filters preserved')
  }
  f.search = ''; clickBack(pageTree(pages.Cashier))
  check(f.navigation.at(-1)[0] === '/reception/cashier', 'Direct detail entry returns safely without browser history')
  f.search = new URL(detail, 'https://local.test').search; f.invoiceSnapshot = { data: f.invoice, loading: false, error: '', refresh() {} }
  pageTree(pages.Cashier).find(node => node.type?.name === 'Button' && text(node).includes('In hóa đơn')).props.onClick()
  check(f.navigation.at(-1)[0] === invoiceDetailPath(170, back, true), 'Cashier print action preserves list filters before opening preview')
  f.params = new URLSearchParams(back.split('?')[1]); let tree = pageTree(pages.InvoiceList)
  tree.find(node => node.type?.name === 'Button' && text(node).includes('Xem hóa đơn')).props.onClick()
  check(new URL(f.navigation.at(-1)[0], 'https://local.test').searchParams.get('returnTo') === back, 'Actual invoice list passes all active filters to detail')
  f.search = new URL(invoiceDetailPath(170, back, true), 'https://local.test').search
  tree = pageTree(pages.Print); tree.find(node => node.type?.name === 'Button' && text(node).includes('Về thu ngân')).props.onClick()
  check(f.navigation.at(-1)[0] === detail, 'Print returns to same detail with original list context')
  const patient = { id: 170, appointmentCode: 'AP170', patientId: 1, patientName: 'Bệnh nhân DEMO', doctorId: 2, doctorName: 'Bác sĩ DEMO', startTime: '2030-01-01T01:00:00Z', checkedInAt: '2030-01-01T00:30:00Z', queueNumber: 1, status: 1 }
  const html = Page => { unmount(); begin(); return renderToStaticMarkup(React.createElement(Page)) }
  f.liveSnapshot = { data: [patient], loading: false, error: '', refresh() {} }
  check(html(pages.Queue).includes(patient.patientName) && f.counts['reception-waiting'] === 1, 'Queue initially shows checked-in patient and correct menu count')
  const signal = new AbortController().signal; await f.live.query(signal)
  check(f.calls.at(-1).name === 'waitingQueue' && f.calls.at(-1).args[2] === signal, 'Queue polling only calls abortable waiting-list read')
  f.liveSnapshot.data = []
  check(!html(pages.Queue).includes(patient.patientName) && f.counts['reception-waiting'] === 0, 'New queue snapshot removes patient and decrements menu count')
  f.liveSnapshot.data = [{ ...patient, status: 2 }]
  const dashboard = html(pages.Dashboard)
  check(dashboard.includes(patient.patientName) && dashboard.includes('Đang khám') && !dashboard.includes('>Đã check-in<') && f.counts['reception-waiting'] === 0, 'Reception daily list retains patient as in-progress without counting as waiting')
  await f.live.query(signal)
  check(f.calls.at(-1).name === 'staffAppointments' && f.calls.at(-1).args[1] === signal, 'Dashboard polling only reads daily appointments with abort signal')
  f.liveSnapshot = { data: null, loading: false, error: 'Không thể cập nhật danh sách', refresh() {} }
  check(!html(pages.Queue).includes(patient.patientName) && !html(pages.Dashboard).includes('>0</p>'), 'Read errors do not show stale patient rows or invented zero summary counts')
  check(f.calls.every(call => ['waitingQueue', 'staffAppointments'].includes(call.name)), 'Polling tests never invoke call-next/check-in or another mutation')
  console.log(`Reception flow: ${checks} passed. Offline synthetic hook/page checks only.`)
}
main().catch(error => { console.error(error.stack); process.exitCode = 1 }).finally(() => { unmount(); delete global.__receptionFlow })
