// Offline schema, API contract, real render and handler checks; not deployed browser E2E.
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
const shift = { id: 21, doctorId: 7, doctorName: 'Bác sĩ DEMO', dayOfWeek: 1, startTime: '08:00:00', endTime: '12:00:00', slotMinutes: 30, isActive: true, version: 'A'.repeat(64) }
const fixture = { params: new URLSearchParams(), states: [], cursor: 0, updates: [], writes: [], notices: [], callbacks: {}, mode: 'success', apiMode: 'success', httpRequests: [] }
global.__scheduleFixture = fixture
async function compile(entry, plugins = []) {
  const output = await esbuild.build({ absWorkingDir: root, entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime', 'lucide-react'], plugins })
  const compiled = new Module(path.join(root, 'tests', 'reception-schedules.compiled.cjs'), module)
  compiled.filename = path.join(root, 'tests', 'reception-schedules.compiled.cjs'); compiled.paths = module.paths
  compiled._compile(output.outputFiles[0].text, compiled.filename)
  return compiled.exports
}
function elements(node, found = []) { if (!node || typeof node !== 'object') return found; found.push(node); React.Children.forEach(node.props?.children, child => elements(child, found)); return found }
function textOf(node) { if (typeof node === 'string' || typeof node === 'number') return String(node); return React.Children.toArray(node?.props?.children).map(textOf).join('') }
async function main() {
  const { scheduleValidation } = await compile('src/features/schedules/schemas/schedule-schema.ts')
  const input = { doctorId: 7, dayOfWeeks: [1, 3], startTime: '08:00', endTime: '12:00', slotMinutes: 30, isActive: true }
  check(scheduleValidation(input) === null, 'Valid multi-day work shift accepted')
  for (const change of [{ doctorId: 0 }, { doctorId: 1.5 }, { dayOfWeeks: [] }, { dayOfWeeks: [1, 1] }, { dayOfWeeks: [7] }, { startTime: '' }, { startTime: '24:00' }, { startTime: '08:00:10' }, { endTime: '08:00' }, { slotMinutes: NaN }, { slotMinutes: 4 }, { slotMinutes: 30.5 }, { slotMinutes: 241 }, { endTime: '08:10' }])
    check(Boolean(scheduleValidation({ ...input, ...change })), 'Invalid doctor/day/time/duration rejected')
  const clientPlugin = { name: 'http-fixture', setup(build) {
    build.onResolve({ filter: /http-client$/ }, args => ({ path: args.path, namespace: 'http-fixture' }))
    build.onLoad({ filter: /.*/, namespace: 'http-fixture' }, () => ({ contents: `export const apiRequest=async(path,options={})=>{global.__scheduleFixture.httpRequests.push({path,options});return null}` }))
  } }
  const api = (await compile('src/features/schedules/api/reception-schedule-api.ts', [clientPlugin])).receptionScheduleApi
  await api.schedules(7); check(fixture.httpRequests.at(-1).path === '/reception/schedules?doctorId=7', 'Doctor filter reaches scheduling endpoint')
  await api.timeOff(7); check(fixture.httpRequests.at(-1).path === '/reception/schedules/time-off?doctorId=7', 'Leave query stays read only')
  await api.update(21, { ...input, dayOfWeek: 1, expectedVersion: shift.version })
  check(JSON.parse(fixture.httpRequests.at(-1).options.body).expectedVersion === shift.version, 'Update carries loaded version')
  await api.deactivate(21, 'A&B')
  check(fixture.httpRequests.at(-1).path.endsWith('expectedVersion=A%26B') && fixture.httpRequests.at(-1).options.method === 'DELETE', 'Deactivation explicitly encodes expected version')
  check(fixture.httpRequests.every(r => !r.path.startsWith('/admin/')), 'Reception client never opens Admin endpoints')
  const plugin = { name: 'schedule-fixtures', setup(build) {
    build.onResolve({ filter: /^react$|react-router-dom$|useApiQuery$|reception-schedule-api$|notifications\/notify$|components\/AppShell$|components\/ScheduleForm$|components\/ScheduleDialog$/ }, args => ({ path: args.path, namespace: 'fixture' }))
    build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents:
      args.path === 'react' ? `const f=global.__scheduleFixture;export const useState=initial=>{const i=f.cursor++;if(!(i in f.states))f.states[i]=typeof initial==='function'?initial():initial;return[f.states[i],v=>f.states[i]=typeof v==='function'?v(f.states[i]):v]};export const useRef=initial=>{const i=f.cursor++;if(!(i in f.states))f.states[i]={current:initial};return f.states[i]};` :
      args.path.endsWith('react-router-dom') ? `export const useSearchParams=()=>[global.__scheduleFixture.params,next=>global.__scheduleFixture.updates.push(next)]` :
      args.path.endsWith('notifications/notify') ? `export const notify={success:msg=>global.__scheduleFixture.notices.push(msg)}` :
      args.path.endsWith('AppShell') ? `export default function AppShell({children}){return children}` :
      args.path.endsWith('ScheduleForm') ? `export default function ScheduleForm(){return null}` :
      args.path.endsWith('ScheduleDialog') ? `export default function ScheduleDialog({children}){return children}` :
      args.path.endsWith('reception-schedule-api') ? `const f=global.__scheduleFixture;async function write(...args){f.writes.push(args);if(f.apiMode==='delay')await new Promise(r=>f.resolve=r);if(f.apiMode==='error')throw new Error('Ca làm việc đã được người khác thay đổi. Hãy tải lại.');return {}}export const receptionScheduleApi={doctors:async()=>[],schedules:async()=>[],timeOff:async()=>[],create:(...args)=>write('create',...args),update:(...args)=>write('update',...args),deactivate:(...args)=>write('deactivate',...args)}` :
      `export function useApiQuery(key,query){const f=global.__scheduleFixture;f.callbacks[key]=query;const doctors=key==='reception-schedule-doctors';const leave=key.startsWith('reception-time-off');return {data:doctors?f.doctors:{key:f.mode==='stale'?'previous':key,items:f.mode==='empty'?[]:leave?f.leaves:f.rows},loading:f.mode==='loading',error:f.mode==='error'?'Lỗi kết nối DEMO':'',refresh(){f.refreshed=true}}}`
    }))
  } }
  fixture.doctors = [{ doctorId: 7, fullName: shift.doctorName, isActive: true }]
  fixture.rows = Array.from({ length: 13 }, (_, i) => ({ ...shift, id: i + 21, doctorName: `Bác sĩ DEMO ${String(i + 1).padStart(2, '0')}` }))
  fixture.leaves = [{ id: 1, doctorId: null, startAt: '2026-10-10T08:00:00', endAt: '2026-10-11T08:00:00', reason: 'Nghỉ toàn phòng khám DEMO' }]
  const Page = (await compile('src/workspaces/reception/pages/ReceptionSchedulePage.tsx', [plugin])).default
  const tree = () => { fixture.cursor = 0; return elements(Page()) }
  const render = () => { fixture.cursor = 0; return renderToStaticMarkup(React.createElement(Page)) }
  const html = render()
  check(html.includes('Lịch bác sĩ') && html.includes('08:00–12:00') && html.includes('30 phút') && html.includes('Đang áp dụng'), 'Real page renders shift information')
  check(html.includes('13 ca làm việc') && html.includes('Trang 1/2') && !html.includes('Bác sĩ DEMO 13'), 'Pagination covers full loaded list without flooding page')
  tree().find(e => textOf(e) === 'Sau' && e.props.onClick).props.onClick()
  check(fixture.updates.at(-1).get('page') === '2', 'Next-page handler updates URL')
  fixture.params = fixture.updates.at(-1)
  check(render().includes('Bác sĩ DEMO 13') && !render().includes('Bác sĩ DEMO 01'), 'Second page shows remaining shifts')
  const select = tree().find(e => e.type === 'select')
  select.props.onChange({ target: { value: '7' } })
  check(fixture.updates.at(-1).get('doctor') === '7' && !fixture.updates.at(-1).has('page'), 'Filter resets pagination and preserves URL')
  fixture.params = fixture.updates.at(-1)
  for (const mode of ['loading', 'stale', 'error']) { fixture.mode = mode; check(!render().includes('Bác sĩ DEMO 01'), `${mode} hides stale schedule rows`) }
  fixture.mode = 'empty'; check(render().includes('Không có lịch phù hợp'), 'Empty result explained')
  fixture.mode = 'success'; fixture.params = new URLSearchParams('page=999'); check(render().includes('Về trang đầu'), 'Out-of-range page offers recovery')
  fixture.params = new URLSearchParams('tab=leave&doctor=7')
  const leaveHtml = render()
  check(leaveHtml.includes('Toàn phòng khám') && leaveHtml.includes('Nghỉ toàn phòng khám DEMO') && !leaveHtml.includes('Ngừng áp dụng'), 'Leave tab includes clinic exception without write actions')
  fixture.params = new URLSearchParams()
  const firstShift = fixture.rows[0]
  tree().find(e => e.props['aria-label'] === `Sửa ca Thứ hai của ${firstShift.doctorName}`).props.onClick()
  let form = tree().find(e => e.type?.name === 'ScheduleForm')
  check(form.props.schedule.id === firstShift.id, 'Edit targets actual selected shift')
  fixture.apiMode = 'delay'
  const first = form.props.onSubmit(input)
  await form.props.onSubmit(input)
  check(fixture.writes.length === 1 && fixture.notices.length === 0, 'Duplicate edit blocked and no premature success')
  check(tree().find(e => e.type?.name === 'ScheduleForm').props.submitting, 'Pending write locks form')
  tree().find(e => e.type?.name === 'ScheduleForm').props.onCancel()
  check(tree().some(e => e.type?.name === 'ScheduleForm'), 'Cannot close form while write pending')
  fixture.resolve(); await first
  check(fixture.writes[0][0] === 'update' && fixture.writes[0][2].expectedVersion === firstShift.version && fixture.notices.length === 1 && fixture.refreshed, 'Completed edit sends version, notifies and refreshes')
  check(!tree().some(e => e.type?.name === 'ScheduleForm'), 'Successful edit closes form')
  tree().find(e => e.props['aria-label'] === `Sửa ca Thứ hai của ${firstShift.doctorName}`).props.onClick()
  fixture.apiMode = 'error'; await tree().find(e => e.type?.name === 'ScheduleForm').props.onSubmit(input)
  form = tree().find(e => e.type?.name === 'ScheduleForm')
  check(form.props.error.includes('đã được người khác thay đổi') && fixture.notices.length === 1, 'Failed edit stays open with Vietnamese message, no success')
  form.props.onCancel()
  tree().find(e => textOf(e) === 'Ngừng áp dụng' && e.props.onClick).props.onClick()
  let dialog = tree().find(e => e.type?.name === 'ScheduleDialog')
  check(dialog.props.title.includes('Ngừng áp dụng'), 'Deactivation requires confirmation')
  fixture.apiMode = 'success'
  await elements(dialog).find(e => textOf(e) === 'Ngừng áp dụng' && e.props.onClick).props.onClick()
  check(fixture.writes.at(-1)[0] === 'deactivate' && fixture.writes.at(-1)[2] === firstShift.version, 'Confirmed deactivation sends expected version')
  tree().find(e => e.type?.name === 'PageTitle').props.action.props.onClick()
  form = tree().find(e => e.type?.name === 'ScheduleForm')
  await form.props.onSubmit(input)
  check(fixture.writes.at(-1)[0] === 'create' && fixture.writes.at(-1)[1].dayOfWeeks.length === 2, 'Create sends multi-day batch')
  const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8')
  check(app.includes('"/reception/schedules"') && app.includes('roles={["Receptionist", "Admin"]}'), 'Route wired into staff role boundary')
  check(fs.readFileSync(path.join(root, 'src/data/navigation.ts'), 'utf8').includes("label: 'Lịch bác sĩ', path: '/reception/schedules'"), 'Reception schedule menu discoverable')
  const source = fs.readFileSync(path.join(root, 'src/cms/schedules/components/ScheduleDialog.tsx'), 'utf8')
  check(source.includes('aria-modal="true"') && source.includes("event.key === 'Escape'") && source.includes('previous.focus()') && source.includes('fieldset:disabled'), 'Dialog has focus handling and skips disabled form fields')
  console.log(`Reception schedules frontend: ${checks} checks passed. Offline render/handler checks, not deployed E2E.`)
}
main().catch(error => { console.error(error.stack); process.exitCode = 1 }).finally(() => { delete global.__scheduleFixture })
