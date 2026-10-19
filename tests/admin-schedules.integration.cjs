// Production React DOM, Sonner, API adapters and real loopback HTTP/JWT/SQL.
// No API mocking. Not a substitute for visual/browser/CORS verification.
process.env.TZ = 'Asia/Ho_Chi_Minh'
const assert = require('node:assert/strict')
const path = require('node:path')
const Module = require('node:module')
const { JSDOM } = require('jsdom')
const fixture = JSON.parse(process.env.FOMED_SCHEDULE_AUDIT || '{}')
const origin = new URL(fixture.apiUrl)
assert.equal(origin.hostname, '127.0.0.1'); assert.equal(origin.protocol, 'http:'); assert.equal(origin.pathname, '/api')
const nativeFetch = global.fetch
const requests = []
global.fetch = async (input, init = {}) => {
  const url = new URL(input)
  assert.equal(url.origin, origin.origin, 'External network calls are forbidden')
  assert.ok(url.pathname.startsWith('/api/'))
  const item = { method: init.method || 'GET', path: url.pathname, body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined }
  requests.push(item)
  const response = await nativeFetch(input, init)
  item.status = response.status
  return response
}
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://127.0.0.1:5194/admin/schedules', pretendToBeVisual: true })
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'HTMLSelectElement', 'HTMLButtonElement', 'Element', 'Node', 'NodeFilter', 'MutationObserver', 'Event', 'MouseEvent', 'KeyboardEvent', 'CustomEvent', 'FocusEvent', 'DOMRect', 'DocumentFragment', 'localStorage', 'sessionStorage'])
  Object.defineProperty(global, key, { configurable: true, value: dom.window[key] })
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window)
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window)
global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window)
window.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} })
global.IS_REACT_ACT_ENVIRONMENT = true
window.confirm = window.alert = () => { throw new Error('Native browser dialog is forbidden') }
const React = require('react')
const { act } = React
const { createRoot } = require('react-dom/client')
const { MemoryRouter } = require('react-router-dom')
const { Toaster, toast } = require('sonner')
const esbuild = require('esbuild')
const rootPath = path.resolve(__dirname, '..')
let checks = 0, root
function check(ok, label) { assert.ok(ok, label); checks++; console.log('PASS: ' + label) }
async function until(predicate, label) {
  const end = Date.now() + 10000
  while (Date.now() < end) {
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)) })
    if (predicate()) return
  }
  throw new Error('Timed out: ' + label)
}
const button = (text, parent = document) => {
  const found = [...parent.querySelectorAll('button')].filter(node => node.textContent.trim() === text)
  assert.equal(found.length, 1, 'Expected one button: ' + text)
  return found[0]
}
async function click(node) { assert.ok(node); await act(async () => { node.focus(); node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })) }) }
async function change(node, value) {
  assert.ok(node)
  await act(async () => {
    const proto = node instanceof HTMLSelectElement ? HTMLSelectElement.prototype : node instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(node, value)
    node.dispatchEvent(new Event(node instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }))
  })
}
async function submit() { await act(async () => document.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))) }
const row = reason => [...document.querySelectorAll('tbody tr')].find(node => node.textContent.includes(reason))
const writeCalls = () => requests.filter(item => ['POST', 'PUT', 'DELETE'].includes(item.method) && !item.path.includes('/auth/'))
const nextDate = (days, hour = '08:00') => { const date = new Date(fixture.date + 'T' + hour); date.setDate(date.getDate() + days); return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0') + 'T' + hour }

async function main() {
  const built = await esbuild.build({ absWorkingDir: rootPath, stdin: { resolveDir: rootPath, loader: 'ts', contents: `export {default as Page} from './src/cms/schedules/pages/ScheduleManagementPage';export {scheduleAdminApi} from './src/features/schedules/api/schedule-api';export {doctorAdminApi} from './src/features/doctors/api/doctor-api';export {authApi} from './src/features/auth/api/auth-api';export * from './src/shared/api/token-storage';export {apiRequest} from './src/shared/api/http-client';` }, bundle: true, write: false, format: 'cjs', platform: 'node', jsx: 'automatic', define: { 'import.meta.env.VITE_API_URL': JSON.stringify(fixture.apiUrl) }, external: ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client', 'react-router-dom', 'lucide-react', '@radix-ui/react-alert-dialog', 'sonner'] })
  const compiled = new Module(path.join(rootPath, 'tests/admin-schedules.integration.compiled.cjs'), module)
  compiled.filename = path.join(rootPath, 'tests/admin-schedules.integration.compiled.cjs'); compiled.paths = module.paths
  compiled._compile(built.outputFiles[0].text, compiled.filename)
  const { Page, scheduleAdminApi: api, doctorAdminApi, authApi, saveStoredSession, apiRequest } = compiled.exports
  async function login(username) {
    const auth = await authApi.login({ username, password: 'Audit-Only!2026' })
    saveStoredSession({ ...auth, expiresAt: Date.now() + auth.expiresIn * 1000, remember: false })
    return auth
  }
  async function mount(tab = 'leave') {
    if (root) await act(async () => root.unmount())
    await act(async () => toast.dismiss())
    root = createRoot(document.getElementById('root'))
    await act(async () => root.render(React.createElement(MemoryRouter, { initialEntries: ['/admin/schedules' + (tab === 'leave' ? '?tab=leave' : '')] }, React.createElement(React.Fragment, null, React.createElement(Page), React.createElement(Toaster)))))
    await until(() => document.querySelector('tbody') && !document.querySelector('[data-schedule-create]')?.disabled, 'real page GETs complete')
  }
  async function fillLeave(doctorId, from, to, reason) {
    await change(document.querySelector('form select'), doctorId)
    const dates = document.querySelectorAll('input[type="datetime-local"]')
    await change(dates[0], from); await change(dates[1], to)
    await change(document.querySelector('textarea'), reason)
  }
  async function slots(doctorId, date = fixture.date) { return apiRequest(`/appointments/available-slots?doctorId=${doctorId}&date=${date}`) }
  function earlySlots(items) {
    const selected = items.filter(item => /T08:(00|30)/.test(item.startTime))
    assert.equal(selected.length, 2, 'Expected both actual morning booking slots, not an empty result')
    return selected
  }
  async function expectReject(action, status, label) {
    try { await action(); throw new Error('Unexpected success: ' + label) }
    catch (error) { check(error.status === status && !/Sql|Exception|database/i.test(error.message), label) }
  }
  await login('admin')
  await mount()
  check(document.body.textContent.includes('Audit inactive history'), 'INT-01 real JWT and mixed wrapped/raw API responses render in React')
  await click(button('Tạo lịch nghỉ'))
  check(![...document.querySelector('form select').options].some(option => option.value === String(fixture.inactiveId)), 'INT-02 new leave excludes inactive doctor returned by actual backend')
  const writesBeforeEmpty = writeCalls().length
  await submit()
  check(writeCalls().length === writesBeforeEmpty && document.querySelector('form'), 'INT-03 invalid form is stopped before real HTTP')
  await fillLeave(String(fixture.doctorA), nextDate(0), nextDate(0, '09:00'), '  Audit UI riêng  ')
  await submit(); await until(() => !document.querySelector('form') && row('Audit UI riêng'), 'doctor leave create refresh')
  let leave = (await api.timeOff()).find(item => item.reason === 'Audit UI riêng')
  check(leave?.doctorId === fixture.doctorA && leave.startAt.startsWith(nextDate(0)), 'INT-04 local 08:00 survives frontend ISO conversion, HTTP normalization and SQL reload')
  check(document.querySelector('[data-sonner-toast][data-type="success"]'), 'INT-05 actual Sonner success appears only after API success')
  check(earlySlots(await slots(fixture.doctorA)).every(item => !item.isAvailable) && earlySlots(await slots(fixture.doctorB)).every(item => item.isAvailable), 'INT-06 individual leave blocks only selected doctor booking slots')
  await mount(); await click(row('Audit UI riêng').querySelector('[aria-label="Sửa lịch nghỉ"]'))
  check(document.querySelector('input[type="datetime-local"]').value === nextDate(0), 'INT-07 edit round-trip has no seven-hour shift')
  await change(document.querySelector('form select'), ''); await submit()
  await until(() => !document.querySelector('form') && row('Audit UI riêng')?.textContent.includes('Toàn phòng khám'), 'clinic-wide scope refresh')
  const changeRequest = writeCalls().filter(item => item.method === 'PUT' && item.path.endsWith('/time-off/' + leave.id)).at(-1)
  check(!('doctorId' in changeRequest.body) && (await api.timeOff()).find(item => item.id === leave.id).doctorId === null, 'INT-08 omitted doctorId in real frontend request persists clinic-wide null')
  check(earlySlots(await slots(fixture.doctorA)).every(item => !item.isAvailable) && earlySlots(await slots(fixture.doctorB)).every(item => !item.isAvailable), 'INT-09 clinic-wide leave blocks both doctors booking slots')
  await click(row('Audit UI riêng').querySelector('[aria-label="Sửa lịch nghỉ"]'))
  await change(document.querySelector('form select'), String(fixture.doctorA)); await submit()
  await until(() => !document.querySelector('form') && !row('Audit UI riêng')?.textContent.includes('Toàn phòng khám'), 'narrow scope refresh')
  check(earlySlots(await slots(fixture.doctorB)).every(item => item.isAvailable), 'INT-10 narrowing scope reopens unrelated doctor slots')
  await click(row('Audit UI riêng').querySelector('[aria-label="Sửa lịch nghỉ"]'))
  await fillLeave('', nextDate(1, '09:00'), nextDate(1, '09:30'), 'Audit rejected clinic-wide change')
  await submit(); await until(() => document.querySelector('form [role="alert"]'), 'actual HTTP conflict displayed')
  check(requests.at(-1).status === 409 && document.querySelector('form [role="alert"]').textContent.includes('lịch hẹn'), 'INT-11 scope expansion sees another doctor booking and displays actual 409 message')
  check(document.querySelector('form select').value === '' && document.querySelector('textarea').value === 'Audit rejected clinic-wide change', 'INT-12 rejected edit preserves user input for correction')
  leave = (await api.timeOff()).find(item => item.id === leave.id)
  check(leave.doctorId === fixture.doctorA && leave.reason === 'Audit UI riêng' && leave.startAt.startsWith(nextDate(0)), 'INT-13 rejected scope change leaves backend data unchanged')
  await click(button('Hủy')); await mount()
  await click(row('Audit inactive history').querySelector('[aria-label="Sửa lịch nghỉ"]')); await submit()
  await until(() => document.querySelector('form [role="alert"]'), 'actual inactive doctor error')
  check(document.querySelector('form [role="alert"]').textContent.includes('Không tìm thấy bác sĩ đang hoạt động.'), 'INT-14 inactive history edit displays backend business message with Vietnamese accents')
  await click(button('Hủy'))
  for (const doctorId of [2147483647, 0, -1, fixture.inactiveId])
    await expectReject(() => api.createTimeOff({ doctorId, startAt: new Date(nextDate(3)).toISOString(), endAt: new Date(nextDate(3, '09:00')).toISOString() }), 404, 'INT-15 real API adapter rejects invalid/inactive doctor ' + doctorId)

  const deleteBefore = writeCalls().filter(item => item.method === 'DELETE').length
  await click(row('Audit UI riêng').querySelector('[aria-label="Xóa lịch nghỉ"]'))
  check(document.querySelector('[role="alertdialog"]')?.textContent.includes('Audit UI riêng') && writeCalls().filter(item => item.method === 'DELETE').length === deleteBefore, 'INT-16 real Radix confirmation identifies selected leave before HTTP DELETE')
  await click(button('Giữ lại'))
  check((await api.timeOff()).some(item => item.id === leave.id), 'INT-17 cancellation preserves persisted leave')
  await click(row('Audit UI riêng').querySelector('[aria-label="Xóa lịch nghỉ"]')); await click(button('Xóa lịch nghỉ'))
  await until(() => !document.querySelector('[role="alertdialog"]') && !row('Audit UI riêng'), '204 delete refresh')
  check(requests.some(item => item.method === 'DELETE' && item.path.endsWith('/time-off/' + leave.id) && item.status === 204) && !(await api.timeOff()).some(item => item.id === leave.id), 'INT-18 actual 204 response removes exact leave and refreshes list')
  check(earlySlots(await slots(fixture.doctorA)).every(item => item.isAvailable), 'INT-19 deleting leave reopens booking slots without changing appointments')

  await mount('work'); await click(button('Thêm khung giờ'))
  await change(document.querySelector('form select'), String(fixture.doctorA))
  await click(button('Chọn Thứ 2–Thứ 7'))
  await click([...document.querySelectorAll('form label')].find(label => label.textContent.trim() === 'Chủ nhật').querySelector('input'))
  const workTimes = document.querySelectorAll('input[type="time"]')
  await change(workTimes[0], '13:00'); await change(workTimes[1], '15:00'); await submit()
  await until(() => !document.querySelector('form') && [...document.querySelectorAll('tbody tr')].some(node => node.textContent.includes('13:00')), 'batch create refresh')
  const afternoon = (await api.schedules()).filter(item => item.doctorId === fixture.doctorA && item.startTime === '13:00:00')
  check(afternoon.length === 7 && afternoon.every(item => item.version.length === 64), 'INT-20 one UI batch creates seven versioned day records through actual HTTP')
  const afternoonSlots = (await slots(fixture.doctorA)).filter(item => /T13:(00|30)/.test(item.startTime))
  check(afternoonSlots.length === 2 && afternoonSlots.every(item => item.isAvailable), 'INT-21 new weekly work shift becomes bookable')
  await expectReject(() => api.createSchedules({ doctorId: fixture.doctorA, dayOfWeeks: [1, 2], startTime: '13:00', endTime: '15:00', slotMinutes: 30, isActive: true }), 409, 'INT-22 real duplicate batch is rejected atomically')
  check((await api.schedules()).filter(item => item.doctorId === fixture.doctorA && item.startTime === '13:00:00').length === 7, 'INT-23 rejected overlap leaves no duplicate days')
  const group = [...document.querySelectorAll('tbody tr')].find(node => node.textContent.includes('Audit doctor') && node.textContent.includes('13:00'))
  await click(group.querySelector('button[aria-expanded]'))
  const details = group.nextElementSibling
  await click(details.querySelector('button[aria-label^="Sửa lịch"]'))
  const chosenDay = Number(document.querySelectorAll('form select')[1].value)
  const loadedShift = afternoon.find(item => item.dayOfWeek === chosenDay)
  await api.updateSchedule(loadedShift.id, { ...loadedShift, endTime: '16:00', expectedVersion: loadedShift.version })
  await change(document.querySelectorAll('input[type="time"]')[1], '17:00'); await submit()
  await until(() => document.querySelector('form [role="alert"]'), 'stale version conflict')
  check(requests.at(-1).status === 409 && (await api.schedules()).find(item => item.id === loadedShift.id).endTime === '16:00:00', 'INT-24 stale UI version cannot overwrite concurrent schedule edit')
  await click(button('Hủy')); await mount('work')
  const morning = [...document.querySelectorAll('tbody tr')].find(node => node.textContent.includes('Audit doctor') && node.textContent.includes('08:00'))
  await click(morning.querySelector('button[aria-expanded]'))
  const bookedDay = new Date(nextDate(2)).getDay()
  const dayName = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'][bookedDay]
  await click(morning.nextElementSibling.querySelector(`[aria-label="Xóa lịch ${dayName}"]`)); await click(button('Ngừng áp dụng'))
  await until(() => document.querySelector('[role="alertdialog"] [role="alert"]'), 'booked shift guard')
  check(requests.at(-1).status === 409 && document.querySelector('[role="alertdialog"]'), 'INT-25 confirmed work deactivation refuses to strand an existing booking')
  await click(button('Giữ lại'))
  for (const username of ['doctor', 'receptionist', 'patient']) {
    await login(username)
    await expectReject(() => api.createTimeOff({ startAt: new Date(nextDate(4)).toISOString(), endAt: new Date(nextDate(4, '09:00')).toISOString() }), 403, 'INT-26 ' + username + ' cannot write admin scope with real JWT')
  }
  await login('admin')
  check((await doctorAdminApi.list()).length === 3, 'INT-27 authorized admin still reads doctors after role checks')
  console.log(`Frontend/backend schedules integration: ${checks} checks passed; real React/Sonner/Radix + HTTP/JWT + disposable local SQL, no API mocks.`)
}
main().catch(error => { console.error(error.stack); process.exitCode = 1 }).finally(async () => { if (root) await act(async () => root.unmount()); dom.window.close() })
