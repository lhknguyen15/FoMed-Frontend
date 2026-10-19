// Real React DOM + Radix dialogs in jsdom; only in-memory APIs, no cloud or credentials.
process.env.TZ = 'Asia/Ho_Chi_Minh'
const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs')
const Module = require('node:module')
const { JSDOM } = require('jsdom')
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/admin/schedules', pretendToBeVisual: true })
for (const key of ['window','document','navigator','HTMLElement','HTMLInputElement','HTMLTextAreaElement','HTMLSelectElement','HTMLButtonElement','Element','Node','NodeFilter','MutationObserver','Event','MouseEvent','KeyboardEvent','CustomEvent','FocusEvent','DOMRect','DocumentFragment'])
  Object.defineProperty(global, key, { configurable: true, value: dom.window[key] })
global.getComputedStyle = dom.window.getComputedStyle.bind(dom.window)
global.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window)
global.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window)
global.IS_REACT_ACT_ENVIRONMENT = true
global.fetch = async () => { throw new Error('Unexpected network request') }
window.confirm = window.alert = () => { throw new Error('Native browser dialog forbidden') }
const React = require('react')
const { act } = React
const { createRoot } = require('react-dom/client')
const { MemoryRouter, useNavigate } = require('react-router-dom')
const esbuild = require('esbuild')
const rootPath = path.resolve(__dirname, '..')
const f = { mode: 'success', calls: [], notices: [], release: null, failRead: false }
global.__adminScheduleAudit = f
let checks = 0, root
const check = (ok, name) => { assert.ok(ok, name); checks++; console.log('PASS: ' + name) }
const doctor = { doctorId: 1, userId: 1, fullName: 'Bác sĩ DEMO', isActive: true }
const inactive = { doctorId: 2, userId: 2, fullName: 'Bác sĩ tạm ngừng DEMO', isActive: false }
const schedule = { id: 1, version: 'version-DEMO-01', doctorId: 1, doctorName: doctor.fullName, dayOfWeek: 1, startTime: '08:00:00', endTime: '12:00:00', slotMinutes: 30, isActive: true }
const leave = { id: 10, doctorId: 1, startAt: '2030-01-03T01:00:00Z', endAt: '2030-01-03T05:00:00Z', reason: 'Đào tạo DEMO' }
const flush = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 5)) })
const buttons = name => [...document.querySelectorAll('button')].filter(node => node.textContent.trim() === name)
const button = name => { const result = buttons(name); assert.equal(result.length, 1, 'Expected one button: ' + name); return result[0] }
const click = async node => { assert.ok(node, 'Missing click target'); await act(async () => { node.focus(); node.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })) }); await flush() }
const change = async (node, value) => { assert.ok(node, 'Missing field'); await act(async () => {
  const prototype = node instanceof HTMLSelectElement ? HTMLSelectElement.prototype : node instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(prototype, 'value').set.call(node, value)
  node.dispatchEvent(new Event(node instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }))
}); await flush() }
const submit = async () => { await act(async () => { document.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })) }); await flush() }
const escape = async () => { await act(async () => { document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })) }); await flush() }
const dialog = () => document.querySelector('[role="alertdialog"]')
const calls = name => f.calls.filter(call => call.name === name)
const successes = () => f.notices.filter(notice => notice.kind === 'success')
async function main() {
  const plugin = { name: 'admin-schedule-api-fixture', setup(build) {
    build.onResolve({ filter: /\/schedule-api$|\/doctor-api$|notifications\/notify$/ }, args => ({ path: args.path, namespace: 'fixture' }))
    build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents:
      args.path.endsWith('/notify') ? `const f=global.__adminScheduleAudit;export const notify={success:message=>f.notices.push({kind:'success',message}),error:message=>f.notices.push({kind:'error',message})}` :
      args.path.endsWith('/doctor-api') ? `export const doctorAdminApi={list:()=>global.__adminScheduleAudit.read('doctors')}` :
      `const f=global.__adminScheduleAudit;export const scheduleAdminApi={schedules:()=>f.read('schedules'),timeOff:()=>f.read('leaves'),createSchedules:(...a)=>f.write('createSchedules',a),updateSchedule:(...a)=>f.write('updateSchedule',a),deleteSchedule:(...a)=>f.write('deleteSchedule',a),createTimeOff:(...a)=>f.write('createTimeOff',a),updateTimeOff:(...a)=>f.write('updateTimeOff',a),deleteTimeOff:(...a)=>f.write('deleteTimeOff',a)};`
    }))
  } }
  const built = await esbuild.build({ absWorkingDir: rootPath, stdin: { resolveDir: rootPath, loader: 'ts', contents: `export {default as Page} from './src/cms/schedules/pages/ScheduleManagementPage';export {default as LegacyPage} from './src/cms/time-off/pages/TimeOffManagementPage';export * from './src/features/schedules/schemas/time-off-schema';export * from './src/features/schedules/schemas/schedule-schema';export * from './src/shared/api/api-error';` }, bundle: true, write: false, format: 'cjs', platform: 'node', jsx: 'automatic', external: ['react','react/jsx-runtime','react-dom','react-dom/client','react-router-dom','lucide-react','@radix-ui/react-alert-dialog'], plugins: [plugin] })
  const compiled = new Module(path.join(rootPath, 'tests', 'admin-schedules.compiled.cjs'), module)
  compiled.filename = path.join(rootPath, 'tests', 'admin-schedules.compiled.cjs'); compiled.paths = module.paths
  compiled._compile(built.outputFiles[0].text, compiled.filename)
  const { Page, LegacyPage, validateTimeOff, scheduleValidation, ApiError } = compiled.exports
  f.read = async name => { if (f.failRead === true || f.failRead === name) throw new Error('SqlClient SECRET'); return structuredClone(f[name]) }
  f.write = async (name, args) => {
    f.calls.push({ name, args: structuredClone(args) }); const mode = f.mode
    if (mode === 'pending') await new Promise(resolve => { f.release = resolve })
    if (mode === 'error') throw new Error('SqlClient SECRET')
    if (mode === 'conflict') throw new ApiError('Khoảng nghỉ đang có lịch hẹn, cần xử lý lịch bị ảnh hưởng trước.', 409)
    if (mode === 'forbidden') throw new ApiError('Bạn không có quyền thực hiện thao tác này.', 403)
    if (mode === 'missing') throw new ApiError('Không tìm thấy lịch nghỉ.', 404)
    let result = null
    if (name === 'deleteTimeOff') f.leaves = f.leaves.filter(item => item.id !== args[0])
    if (name === 'deleteSchedule') f.schedules = f.schedules.filter(item => item.id !== args[0])
    if (name === 'createTimeOff') { result = { id: 100, ...args[0] }; f.leaves.push(result) }
    if (name === 'updateTimeOff') { result = { ...f.leaves.find(item => item.id === args[0]), ...args[1] }; f.leaves = f.leaves.map(item => item.id === args[0] ? result : item) }
    if (name === 'createSchedules') { result = args[0].dayOfWeeks.map((dayOfWeek, index) => ({ ...schedule, ...args[0], id: index + 100, dayOfWeek })); f.schedules.push(...result) }
    if (name === 'updateSchedule') { result = { ...schedule, ...args[1], id: args[0] }; f.schedules = f.schedules.map(item => item.id === args[0] ? result : item) }
    if (mode === 'reload-error') f.failRead = true
    return result
  }
  async function mount(tab = 'leave', options = {}) {
    if (root) { await act(async () => root.unmount()); root = null }
    f.mode = options.mode ?? 'success'; f.calls = []; f.notices = []; f.release = null; f.failRead = options.failRead ?? false
    f.doctors = [doctor, inactive]; f.leaves = structuredClone(options.leaves ?? [leave]); f.schedules = structuredClone(options.schedules ?? [schedule])
    function Harness() { f.navigate = useNavigate(); return React.createElement(options.legacy ? LegacyPage : Page) }
    root = createRoot(document.getElementById('root'))
    await act(async () => root.render(React.createElement(MemoryRouter, { initialEntries: ['/admin/schedules' + (tab === 'leave' ? '?tab=leave' : '')] }, React.createElement(Harness))))
    await flush()
  }
  const valid = { doctorId: '1', startAt: '2030-01-03T08:00', endAt: '2030-01-03T12:00', reason: 'Đào tạo' }
  check(Object.keys(validateTimeOff(valid)).length === 0, 'VAL-01 valid doctor leave accepted')
  check(Object.keys(validateTimeOff({ ...valid, doctorId: '' })).length === 0, 'VAL-02 clinic-wide leave accepted')
  for (const bad of [{ startAt: '' }, { endAt: '' }, { startAt: 'garbage' }, { startAt: '2030-02-30T08:00' }, { endAt: valid.startAt }, { endAt: '2030-01-03T07:00' }, { doctorId: '-1' }, { doctorId: '1.5' }, { doctorId: 'abc' }, { reason: 'a'.repeat(256) }]) check(Object.keys(validateTimeOff({ ...valid, ...bad })).length > 0, 'VAL-03 invalid date/range/doctor/reason rejected')
  const goodWork = { doctorId: 1, dayOfWeeks: [1, 3], startTime: '08:00', endTime: '12:00', slotMinutes: 30, isActive: true }
  check(scheduleValidation(goodWork) === null, 'VAL-04 valid weekly multi-day shift')
  for (const bad of [{ doctorId: 0 }, { dayOfWeeks: [] }, { dayOfWeeks: [1, 1] }, { dayOfWeeks: [7] }, { startTime: '24:00' }, { endTime: '07:00' }, { slotMinutes: 4 }, { slotMinutes: 241 }, { slotMinutes: 31.5 }]) check(scheduleValidation({ ...goodWork, ...bad }) !== null, 'VAL-05 invalid shift rejected')

  await mount(); const trigger = document.querySelector('[aria-label="Xóa lịch nghỉ"]'); await click(trigger)
  check(dialog() && calls('deleteTimeOff').length === 0, 'DEL-01 clicking delete opens real Radix alert dialog without sending DELETE')
  check(dialog().textContent.includes(doctor.fullName) && dialog().textContent.includes(leave.reason) && dialog().textContent.includes('3/1/30'), 'DEL-02 dialog identifies exact doctor/time/reason')
  check(document.getElementById(dialog().getAttribute('aria-labelledby'))?.textContent.includes('Xóa lịch nghỉ') && document.getElementById(dialog().getAttribute('aria-describedby'))?.textContent, 'DEL-03 accessible title and description linked')
  check(document.activeElement === button('Giữ lại'), 'DEL-04 safe cancel action focused by default')
  await act(async () => { document.body.dispatchEvent(new MouseEvent('click', { bubbles: true })) }); await flush()
  check(dialog(), 'DEL-05 outside click cannot accidentally confirm/dismiss destructive action')
  await click(button('Giữ lại')); check(!dialog() && f.calls.length === 0 && document.activeElement === trigger, 'DEL-06 cancel sends no request and restores trigger focus')
  await click(trigger); await escape(); check(!dialog() && f.calls.length === 0, 'DEL-07 Escape safely cancels before submitting')
  await click(trigger); const cancel = button('Giữ lại'), confirm = button('Xóa lịch nghỉ')
  await act(async () => { cancel.focus(); cancel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true })) })
  check(document.activeElement === confirm, 'DEL-08 Shift+Tab wraps focus within actual Radix dialog')
  await act(async () => confirm.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })))
  check(document.activeElement === cancel, 'DEL-09 Tab wraps back to cancel')
  f.mode = 'pending'; await click(confirm); await click(button('Đang xử lý…')); await escape()
  check(calls('deleteTimeOff').length === 1 && dialog() && button('Giữ lại').disabled, 'DEL-10 double click/Enter/Escape cannot duplicate or close a pending delete')
  check(successes().length === 0, 'DEL-11 no premature success while waiting')
  await act(async () => f.release()); await flush()
  check(!dialog() && f.leaves.length === 0 && successes().length === 1 && calls('deleteTimeOff')[0].args[0] === leave.id, 'DEL-12 exact selected ID removed, success once, list refreshed')
  check(document.activeElement?.hasAttribute('data-schedule-create'), 'DEL-13 removed trigger restores focus to a surviving action')
  for (const mode of ['error','conflict','forbidden','missing']) {
    await mount('leave', { mode }); await click(document.querySelector('[aria-label="Xóa lịch nghỉ"]')); await click(button('Xóa lịch nghỉ'))
    check(dialog() && dialog().querySelector('[role="alert"]') && !dialog().textContent.includes('SECRET') && successes().length === 0 && f.leaves.length === 1, 'DEL-14 ' + mode + ' retains dialog/data with safe inline error and no success')
    f.mode = 'success'; await click(button('Xóa lịch nghỉ'))
    check(!dialog() && successes().length === 1, 'DEL-15 retry after ' + mode + ' succeeds and unlocks')
  }
  await mount('leave', { leaves: [{ ...leave, doctorId: null }] }); await click(document.querySelector('[aria-label="Xóa lịch nghỉ"]'))
  check(dialog().textContent.includes('Toàn phòng khám'), 'DEL-16 clinic-wide deletion clearly identified')
  await mount('leave', { mode: 'reload-error' }); await click(document.querySelector('[aria-label="Xóa lịch nghỉ"]')); await click(button('Xóa lịch nghỉ'))
  check(!dialog() && successes().length === 1 && document.body.textContent.includes('Thử lại') && !document.querySelector('[aria-label="Xóa lịch nghỉ"]'), 'DEL-17 committed delete plus GET failure shows read error, not stale row or false empty success')
  await mount('leave', { leaves: Array.from({ length: 11 }, (_, index) => ({ ...leave, id: 100 + index, reason: `DEMO ${index}` })) }); await click(button('Sau'))
  check(document.body.textContent.includes('Trang 2 / 2'), 'PAGE-01 leave last page selectable')
  await click(document.querySelector('[aria-label="Xóa lịch nghỉ"]')); await click(button('Xóa lịch nghỉ'))
  check(document.body.textContent.includes('Trang 1 / 1') && document.querySelectorAll('[aria-label="Xóa lịch nghỉ"]').length === 10 && !document.body.textContent.includes('11–10'), 'PAGE-02 deleting last row clamps page without impossible range/empty table')
  await mount(); await act(async () => f.navigate('/admin/schedules')); await flush()
  check(button('Thêm khung giờ'), 'PAGE-03 URL tab change updates selected view')
  await act(async () => f.navigate(-1)); await flush(); check(button('Tạo lịch nghỉ'), 'PAGE-04 browser history restores leave tab')

  await mount(); await click(button('Tạo lịch nghỉ')); await submit()
  check(f.calls.length === 0 && document.body.textContent.includes('bắt buộc'), 'FORM-01 empty leave blocked before API call')
  const dates = document.querySelectorAll('input[type="datetime-local"]')
  await change(dates[0], valid.startAt); await change(dates[1], '2030-01-03T07:00'); await submit()
  check(f.calls.length === 0 && document.body.textContent.includes('phải sau'), 'FORM-02 reversed interval kept open with Vietnamese validation')
  await change(dates[1], valid.endAt); await change(document.querySelector('textarea'), '  Đào tạo DEMO  ')
  f.mode = 'pending'; await submit(); await submit()
  check(calls('createTimeOff').length === 1 && document.querySelector('fieldset:disabled') && successes().length === 0, 'FORM-03 pending leave disables fields and blocks duplicate submit')
  await escape(); check(document.querySelector('form'), 'FORM-04 pending leave cannot close via Escape')
  await act(async () => f.release()); await flush()
  check(!document.querySelector('form') && successes().length === 1 && calls('createTimeOff')[0].args[0].doctorId === undefined, 'FORM-05 clinic-wide creation succeeds without invented doctor')
  check(calls('createTimeOff')[0].args[0].startAt === new Date(valid.startAt).toISOString() && calls('createTimeOff')[0].args[0].reason === 'Đào tạo DEMO', 'FORM-06 dates convert to ISO once, reason trimmed')
  await mount(); await click(document.querySelector('[aria-label="Sửa lịch nghỉ"]'))
  check(document.querySelector('input[type="datetime-local"]').value === valid.startAt && document.querySelector('select').value === '1', 'FORM-07 editing preloads local time and actual doctor')
  f.mode = 'conflict'; await submit()
  check(document.querySelector('form') && document.querySelector('textarea').value === leave.reason && document.querySelector('[role="alert"]') && successes().length === 0, 'FORM-08 booked-range conflict preserves edits and shows error')
  f.mode = 'success'; await submit(); check(calls('updateTimeOff').at(-1).args[0] === leave.id && successes().length === 1, 'FORM-09 editing targets real selected leave ID')
  await mount('leave', { leaves: [{ ...leave, doctorId: 2 }] }); await click(document.querySelector('[aria-label="Sửa lịch nghỉ"]'))
  check(document.querySelector('select').value === '2', 'FORM-10 inactive current doctor remains visible during editing')

  await mount('work', { schedules: [schedule, { ...schedule, id: 2, dayOfWeek: 0 }] })
  check(document.querySelectorAll('tbody tr').length === 1, 'WORK-01 identical shifts group without losing per-day records')
  await click(document.querySelector('button[aria-expanded="false"]'))
  check(document.querySelectorAll('li').length === 2 && document.querySelectorAll('li')[1].textContent.includes('Chủ nhật'), 'WORK-02 details show individual days, Sunday last')
  await click(document.querySelector('[aria-label="Xóa lịch Thứ hai"]')); check(dialog() && f.calls.length === 0, 'WORK-03 work deactivation uses same app dialog, not browser confirm')
  f.mode = 'conflict'; await click(button('Ngừng áp dụng'))
  check(dialog() && successes().length === 0, 'WORK-04 protected booked shift remains on API conflict')
  f.mode = 'success'; await click(button('Ngừng áp dụng'))
  check(calls('deleteSchedule').at(-1).args[0] === schedule.id && calls('deleteSchedule').at(-1).args[1] === schedule.version, 'WORK-05 deactivation preserves expected version and exact ID')
  await mount('work'); await click(button('Thêm khung giờ')); await submit()
  check(f.calls.length === 0, 'WORK-06 empty doctor/day rejected')
  await change(document.querySelector('select'), '1'); await click(button('Chọn Thứ 2–Thứ 7')); await submit()
  check(calls('createSchedules').length === 1 && calls('createSchedules')[0].args[0].dayOfWeeks.length === 6 && successes().length === 1, 'WORK-07 batch creates selected six days once')
  await mount('work'); await click(document.querySelector('button[aria-expanded="false"]')); await click(document.querySelector('[aria-label="Sửa lịch Thứ hai"]')); await submit()
  check(calls('updateSchedule')[0].args[0] === schedule.id && calls('updateSchedule')[0].args[1].expectedVersion === schedule.version && calls('updateSchedule')[0].args[1].dayOfWeek === 1, 'WORK-08 edit preserves version and one selected day')
  for (const tab of ['work','leave']) {
    await mount(tab, { leaves: [], schedules: [] }); check(document.body.textContent.includes('Chưa có'), 'READ-01 empty ' + tab + ' is explained')
    await mount(tab, { failRead: tab === 'work' ? 'schedules' : 'leaves' }); check(document.body.textContent.includes('Thử lại') && !document.querySelector('tbody'), 'READ-02 ' + tab + ' read failure hides stale rows')
  }
  await mount('leave', { failRead: 'doctors' }); check(button('Tạo lịch nghỉ').disabled, 'READ-03 doctor lookup error disables creation')
  await mount('leave', { legacy: true }); await click(document.querySelector('[aria-label="Xóa lịch nghỉ"]')); await click(button('Giữ lại'))
  check(!dialog() && f.calls.length === 0, 'LEGACY-01 standalone leave page also uses cancellable application dialog')
  for (const source of ['cms/schedules/pages/ScheduleManagementPage.tsx','cms/time-off/pages/TimeOffManagementPage.tsx']) check(!/window\.(confirm|alert)\s*\(/.test(fs.readFileSync(path.join(rootPath, 'src', source), 'utf8')), 'SOURCE-01 no native browser confirmation: ' + source)
  console.log(`Admin schedules: ${checks} checks passed. Real React DOM/Radix, in-memory APIs only; not cloud/browser E2E.`)
}
main().catch(error => { console.error(error.stack); process.exitCode = 1 }).finally(async () => { if (root) await act(async () => root.unmount()); delete global.__adminScheduleAudit; dom.window.close() })
