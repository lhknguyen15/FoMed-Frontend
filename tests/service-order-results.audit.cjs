// Offline rendering and isolated lifecycle checks; no browser, API or clinical data.
const assert = require('node:assert/strict')
const path = require('node:path')
const Module = require('node:module')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const esbuild = require('esbuild')
const root = path.resolve(__dirname, '..')
let checks = 0
function check(value, label) { assert.ok(value, label); checks++; console.log('PASS: ' + label) }
async function compile(entry, plugins = []) {
  const result = await esbuild.build({ absWorkingDir: root, entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime', 'lucide-react'], plugins })
  const compiled = new Module(path.join(root, 'tests', 'results.compiled.cjs'), module)
  compiled.filename = path.join(root, 'tests', 'results.compiled.cjs'); compiled.paths = module.paths
  compiled._compile(result.outputFiles[0].text, compiled.filename)
  return compiled.exports
}
async function main() {
  const Results = (await compile('src/features/clinical/components/ServiceOrderResults.tsx')).default
  const order = { id: 1, medicalRecordId: 12, serviceId: 1, serviceName: 'Dịch vụ DEMO', quantity: 1, unitPriceSnapshot: 10000, status: 1, resultSummary: 'Kết quả DEMO', conclusion: 'Kết luận DEMO', referenceRange: 'Tham chiếu DEMO', resultAt: '2026-10-07T01:30:00' }
  const render = changes => renderToStaticMarkup(React.createElement(Results, { orders: [order], loading: false, error: '', updatedAt: 1791340200000, onRefresh() {}, ...changes }))
  const filled = render({})
  check(filled.includes(order.resultSummary) && filled.includes(order.conclusion) && filled.includes(order.referenceRange), 'Summary, conclusion and reference all displayed')
  check(filled.includes('08:30') && filled.includes('7/10/26'), 'Legacy UTC results rendered in Vietnam time')
  check(render({ orders: [{ ...order, resultAt: 'invalid' }] }).includes('Chưa xác định thời gian'), 'Invalid timestamp does not crash result screen')
  const mixed = render({ orders: [order, { ...order, id: 2, status: 0 }, { ...order, id: 3, status: 2 }, { ...order, id: 4, status: 99 }] })
  check(mixed.includes('Chờ thực hiện: 1') && mixed.includes('Đã có kết quả: 1') && mixed.includes('Đã hủy: 1') && mixed.includes('Chưa xác định'), 'Mixed pending/completed/cancelled/unknown statuses remain distinct')
  check(mixed.includes('Còn 1 chỉ định chưa có kết quả'), 'Pending warning without pretending all results are complete')
  check(!render({ orders: [{ ...order, status: 2 }] }).includes(order.resultSummary), 'Cancelled orders do not present stale results')
  const failed = render({ error: 'Lỗi kết nối DEMO' })
  check(failed.includes('role="alert"') && !failed.includes(order.resultSummary) && !failed.includes('Chưa có chỉ định trong'), 'Failure hides stale results and never claims no orders')
  check(render({ loading: true }).includes('role="status"') && !render({ loading: true }).includes(order.resultSummary), 'Loading hides stale actions/results')
  check(render({ orders: [] }).includes('Chưa có chỉ định trong lượt khám này'), 'Correct empty state')
  check(!render({ orders: [{ ...order, resultSummary: '<script>DEMO</script>' }] }).includes('<script>'), 'Clinical text escaped')

  const requests = [], notifications = [], timers = new Map(), listeners = new Map()
  let slots = [], cursor = 0, deps, pendingEffect, cleanup, timerId = 0
  const harness = {
    useState(initial) { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value }] },
    useRef(initial) { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index] },
    useCallback(callback) { const index = cursor++; if (!(index in slots)) slots[index] = callback; return slots[index] },
    useEffect(effect, next) { if (!deps || !Object.is(next[0], deps[0])) { pendingEffect = effect; deps = next } },
    serviceOrders(id, signal) { return new Promise((resolve, reject) => requests.push({ id, signal, resolve, reject })) },
    success(message) { notifications.push(message) },
  }
  const saved = { document: global.document, window: global.window, setTimeout: global.setTimeout, clearTimeout: global.clearTimeout }
  global.__ordersHarness = harness
  const surface = { visibilityState: 'visible', addEventListener(type, listener) { listeners.set(type, listener) }, removeEventListener(type, listener) { if (listeners.get(type) === listener) listeners.delete(type) } }
  global.document = surface; global.window = surface
  global.setTimeout = (fn, delay) => { const id = ++timerId; timers.set(id, { fn, delay }); return id }
  global.clearTimeout = id => timers.delete(id)
  try {
    const plugins = [{ name: 'offline-order-hook', setup(build) {
      build.onResolve({ filter: /^(react)$|clinical-api$|user-messages$|notifications\/notify$/ }, args => ({ path: args.path, namespace: 'order-mock' }))
      build.onLoad({ filter: /.*/, namespace: 'order-mock' }, args => ({ contents: args.path === 'react' ? 'export const {useState,useRef,useCallback,useEffect}=global.__ordersHarness' : args.path.endsWith('clinical-api') ? 'export const clinicalApi=global.__ordersHarness' : args.path.endsWith('notify') ? 'export const notify=global.__ordersHarness' : 'export const displayError=(reason,fallback)=>reason.message || fallback' }))
    } }]
    const useOrders = (await compile('src/features/clinical/hooks/useRecordServiceOrders.ts', plugins)).useRecordServiceOrders
    function renderHook(id) { cursor = 0; const result = useOrders(id); if (pendingEffect) { cleanup?.(); const effect = pendingEffect; pendingEffect = null; cleanup = effect() } return result }
    const flush = async () => { await Promise.resolve(); await Promise.resolve() }
    renderHook(12)
    requests[0].resolve([{ ...order, status: 0 }]); await flush()
    check(renderHook(12).data[0].status === 0 && notifications.length === 0, 'Initial pending fetch does not notify')
    check([...timers.values()].some(timer => timer.delay === 30000), 'Only pending orders schedule 30-second refresh')
    renderHook(12).refresh(); const completing = requests.at(-1)
    completing.resolve([order]); await flush()
    check(renderHook(12).data[0].status === 1 && notifications.length === 1 && timers.size === 0, 'Pending to completed notifies once and stops polling')
    renderHook(12).refresh(); requests.at(-1).resolve([order]); await flush()
    check(notifications.length === 1, 'Repeated completed response does not repeat toast')
    renderHook(12).refresh(); const stale = requests.at(-1)
    const changed = renderHook(13)
    check(stale.signal.aborted && changed.data === null, 'Record navigation aborts request and hides previous record')
    stale.resolve([order]); await flush()
    check(renderHook(13).data === null, 'Late response cannot populate a different record')
    requests.at(-1).resolve([{ ...order, medicalRecordId: 12 }]); await flush()
    check(renderHook(13).error && renderHook(13).data === null, 'Wrong-record result rejected')
    renderHook(13).refresh(); requests.at(-1).resolve([{ ...order, medicalRecordId: 13, status: 0 }]); await flush()
    surface.visibilityState = 'hidden'; listeners.get('visibilitychange')()
    check(timers.size === 0, 'Hidden pages stop pending polling')
    surface.visibilityState = 'visible'; listeners.get('visibilitychange')(); requests.at(-1).reject(new Error('Lỗi DEMO')); await flush()
    check(renderHook(13).error && renderHook(13).data === null && [...timers.values()].some(timer => timer.delay === 60000), 'Refresh error hides stale results and backs off')
    for (let n = 0; n < 2; n++) { const timer = [...timers.values()][0]; timers.clear(); timer.fn(); requests.at(-1).reject(new Error('Lỗi DEMO')); await flush() }
    check(timers.size === 0, 'Stops automatic retries after three consecutive errors')
    const count = requests.length; renderHook(NaN)
    check(requests.length === count && renderHook(NaN).error, 'Invalid record never sends a request')
    cleanup(); check(listeners.size === 0 && timers.size === 0, 'Unmount clears timers/listeners')
  } finally { Object.assign(global, saved); delete global.__ordersHarness }
  const utils = await compile('src/features/billing/utils/invoice-filters.ts')
  check(utils.validateInvoiceFilters({ ...utils.emptyInvoiceFilters, fromDate: '2026-10-08', toDate: '2026-10-07' }).length > 0, 'Reversed invoice date range rejected')
  check(utils.validateInvoiceFilters({ ...utils.emptyInvoiceFilters, keyword: 'x'.repeat(101) }).length > 0 && utils.validateInvoiceFilters(utils.emptyInvoiceFilters) === '', 'Invoice search limit and cleared filter valid')
  console.log(`Results/filter audit: ${checks} passed. Offline tests only.`)
}
main().catch(error => { console.error(error.stack); process.exitCode = 1 })
