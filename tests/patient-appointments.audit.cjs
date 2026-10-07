// Pure grouping + rendering the real page. No credentials, HTTP or database writes.
const assert = require('node:assert/strict')
const path = require('node:path')
const Module = require('node:module')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { MemoryRouter } = require('react-router-dom')
const esbuild = require('esbuild')

async function compile(entry, plugins = []) {
  const root = path.resolve(__dirname, '..')
  const result = await esbuild.build({ absWorkingDir: root, entryPoints: [entry], bundle: true, write: false,
    platform: 'node', format: 'cjs', jsx: 'automatic', define: { 'import.meta.env': '{}' },
    external: ['react', 'react/jsx-runtime', 'react-router-dom', 'lucide-react'], plugins })
  const filename = path.join(root, 'tests', 'patient-appointments.compiled.cjs')
  const compiled = new Module(filename, module)
  compiled.filename = filename
  compiled.paths = module.paths
  compiled._compile(result.outputFiles[0].text, filename)
  return compiled.exports
}

async function main() {
  const helpers = await compile('src/features/appointments/utils/patient-appointment-groups.ts')
  const { appointmentTimestamp: time, patientAppointmentGroup: group, filterPatientAppointments: filter,
    canChangePatientAppointment: editable, clinicDateInput, formatAppointmentTime, patientAppointmentGroups } = helpers
  const now = Date.parse('2026-10-06T08:00:00+07:00')
  const past = '2026-10-05T09:00:00'
  const future = '2026-10-06T09:00:00'
  const farFuture = '2026-10-08T09:00:00'
  const at = '2026-10-06T08:00:00'
  const appointment = (id, status, startTime) => ({ id, status, startTime, endTime: '2026-10-06T09:30:00',
    appointmentCode: `DEMO-${id}`, doctorName: `Bác sĩ DEMO ${id}`, doctorSpecialty: 'Khám tổng quát', patientId: 1, doctorId: 1,
    source: 0, statusName: 'INTERNAL_STATUS', patientName: 'Bệnh nhân DEMO', createdAt: past })
  let checks = 0
  const check = (ok, label) => { assert.ok(ok, label); checks++; console.log('PASS: ' + label) }
  for (const status of [0, 1]) {
    check(group(appointment(1, status, future), now) === 'upcoming', `Future status ${status} is upcoming`)
    check(group(appointment(1, status, past), now) === 'needs-attention', `Past status ${status} stays unresolved`)
    check(group(appointment(1, status, at), now) === 'needs-attention', `Exact start boundary status ${status} is not upcoming`)
    check(editable(appointment(1, status, farFuture), now), `Status ${status} more than 24 hours away permits explicit changes`)
    check(!editable(appointment(1, status, future), now) && !editable(appointment(1, status, '2026-10-07T08:00:00'), now), `Status ${status} inside/exact 24-hour cutoff cannot be changed`)
    check(!editable(appointment(1, status, at), now) && !editable(appointment(1, status, past), now), `At/past status ${status} forbids patient changes`)
  }
  for (const [status, expected] of [[2, 'in-progress'], [3, 'completed'], [4, 'closed'], [5, 'closed']]) {
    check([past, future].every(start => group(appointment(1, status, start), now) === expected), `Status ${status} has priority over time`)
    check(!editable(appointment(1, status, future), now), `Status ${status} is not patient-editable`)
  }
  check(group(appointment(1, 99, future), now) === 'needs-attention', 'Unknown future status stays visible without guessing')
  for (const invalid of ['', 'bad-time', '10/06/2026', '2026-02-30T09:00:00', '2026-13-01T09:00:00', '2026-10-06T24:00:00']) {
    check(Number.isNaN(time(invalid)) && group(appointment(1, 0, invalid), now) === 'needs-attention'
      && !editable(appointment(1, 0, invalid), now), `Invalid time ${JSON.stringify(invalid)} is safe and visible`)
  }
  check(time(future) === time(future + '+07:00') && time(future) === time('2026-10-06T02:00:00Z'), 'Offsetless, Vietnam offset and UTC refer to the same instant')
  check(time('2026-10-06T09:00') === time(future), 'Minute precision follows Vietnam clock')
  check(time('2026-10-06T09:00:00.1234567') === time('2026-10-06T09:00:00.123+07:00'), 'SQL fractional seconds are supported')
  check(clinicDateInput(time('2026-10-05T18:00:00Z')) === '2026-10-06', 'UTC date rollover uses clinic date')
  check(formatAppointmentTime('2026-10-06T02:00:00Z', { timeStyle: 'short' }).includes('09:00'), 'UTC time displays as Vietnam time')
  check(formatAppointmentTime('invalid') === 'Chưa xác định thời gian' && clinicDateInput(NaN) === '', 'Invalid date formatting does not crash')
  const originalTZ = process.env.TZ
  for (const zone of ['UTC', 'America/Los_Angeles', 'Asia/Ho_Chi_Minh']) {
    process.env.TZ = zone
    check(time(future) === Date.parse(future + '+07:00') && formatAppointmentTime(future, { timeStyle: 'short' }).includes('09:00'), `Browser timezone ${zone} cannot shift clinic time`)
  }
  if (originalTZ === undefined) delete process.env.TZ
  else process.env.TZ = originalTZ
  const records = [appointment(1, 0, future), appointment(2, 1, '2026-10-06T10:00:00'), appointment(3, 1, past),
    appointment(4, 2, past), appointment(5, 3, past), appointment(6, 4, future), appointment(7, 5, past),
    appointment(8, 0, 'invalid'), appointment(9, 99, future)]
  const before = JSON.stringify(records)
  const allGroups = patientAppointmentGroups.flatMap(item => filter(records, item.value, now))
  check(allGroups.length === records.length && new Set(allGroups.map(item => item.id)).size === records.length, 'Every appointment belongs to exactly one group')
  check(JSON.stringify(records) === before, 'Grouping and sorting never mutate source records or statuses')
  check(filter(records.slice().reverse(), 'upcoming', now).map(item => item.id).join() === '1,2', 'Upcoming is sorted nearest first')
  const attention = filter([appointment(1, 1, past), appointment(2, 0, at), appointment(3, 0, 'bad')], 'needs-attention', now)
  check(attention.map(item => item.id).join() === '2,1,3', 'Unresolved is newest first, invalid dates last')
  check(filter([appointment(1, 2, future), appointment(2, 2, past)], 'in-progress', now)[0].id === 2, 'Old unfinished visits are shown first')
  check(filter([appointment(1, 0, future), appointment(2, 0, future)], 'upcoming', now)[0].id === 2, 'Equal timestamps have a stable ID tie-breaker')
  check(group(records[0], time(future)) === 'needs-attention' && records[0].status === 0, 'Clock advancement re-groups without changing status')

  const Page = (await compile('src/workspaces/patient/pages/MyAppointmentsPage.tsx', [{ name: 'isolated-patient-page', setup(build) {
    build.onResolve({ filter: /(?:AppShell|useApiQuery|appointment-api)$/ }, args => ({ path: args.path, namespace: 'fixture' }))
    build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ loader: 'js', contents:
      args.path.endsWith('AppShell') ? 'export default function AppShell({children}) { return children }'
        : args.path.endsWith('useApiQuery') ? 'export function useApiQuery() { return globalThis.__appointmentSnapshot }'
          : 'export const appointmentApi = new Proxy({}, {get() {return () => {throw Error("Unexpected API call")}}})' }))
  } }])).default
  const realNow = Date.now
  Date.now = () => now
  const render = query => {
    globalThis.__appointmentSnapshot = { data: records, loading: false, error: '', refresh() {}, ...query }
    return renderToStaticMarkup(React.createElement(MemoryRouter, null, React.createElement(Page)))
  }
  try {
    const html = render()
    check(patientAppointmentGroups.every(item => html.includes(item.label)), 'Real page renders all five Vietnamese groups')
    check(html.includes('DEMO-1') && html.includes('DEMO-2') && !html.includes('DEMO-3') && !html.includes('DEMO-4'), 'Default upcoming excludes past and in-progress visits')
    check(html.includes('Làm mới') && html.includes('giờ Việt Nam'), 'Refresh and clinic timezone explanation are visible')
    check(!html.includes('> Hủy lịch<') && html.includes('Trong 24 giờ trước lịch hẹn'), 'Near appointments show contact advice, not forbidden changes')
    const farHtml = render({ data: [appointment(1, 0, farFuture), appointment(2, 1, farFuture)] })
    check((farHtml.match(/> Hủy lịch</g) ?? []).length === 2, 'Only pending/confirmed cards outside the cutoff offer cancellation')
    check(render({ data: [] }).includes('Không có lịch hẹn phù hợp'), 'Empty group has a clear Vietnamese explanation')
    check(!render({ loading: true }).includes('DEMO-1'), 'Loading does not expose stale cards')
    check(render({ error: 'Không thể tải dữ liệu.' }).includes('Thử lại'), 'Read failure offers retry')
  } finally { Date.now = realNow; delete globalThis.__appointmentSnapshot }
  console.log(`Patient appointments: ${checks} passed. No HTTP or database changes.`)
}
main().catch(error => { delete globalThis.__appointmentSnapshot; console.error(error); process.exitCode = 1 })
