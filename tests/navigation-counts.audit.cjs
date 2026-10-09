// Real navigation and source-page renders with synthetic snapshots, no API/credentials.
const assert = require('node:assert/strict')
const path = require('node:path')
const Module = require('node:module')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { MemoryRouter } = require('react-router-dom')
const esbuild = require('esbuild')

async function compile(entry) {
  const root = path.resolve(__dirname, '..')
  const result = await esbuild.build({ absWorkingDir: root, entryPoints: [entry], bundle: true, write: false,
    platform: 'node', format: 'cjs', jsx: 'automatic', define: { 'import.meta.env': '{}' }, loader: { '.png': 'dataurl' },
    external: ['react', 'react/jsx-runtime', 'react-router-dom', 'lucide-react'],
    plugins: [{ name: 'isolated-navigation', setup(build) {
      build.onResolve({ filter: /(?:useAuth|useApiQuery|useLiveApiQuery|appointment-api|catalog-api|clinical-api)$/ }, args => ({ path: args.path, namespace: 'fixture' }))
      build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ loader: 'js', contents:
        args.path.endsWith('useAuth') ? 'export function useAuth() {return {user:globalThis.__navUser, logout(){}}}'
          : args.path.endsWith('useApiQuery') || args.path.endsWith('useLiveApiQuery') ? 'export function useApiQuery(key) {return globalThis.__navQuery(key)}; export const useLiveApiQuery=useApiQuery;'
            : 'const forbidden = new Proxy({}, {get(){return () => {throw Error("Unexpected API call")}}}); export const appointmentApi=forbidden, catalogApi=forbidden, clinicalApi=forbidden;' }))
    } }] })
  const filename = path.join(root, 'tests', 'navigation-counts.compiled.cjs')
  const compiled = new Module(filename, module)
  compiled.filename = filename
  compiled.paths = module.paths
  compiled._compile(result.outputFiles[0].text, filename)
  return compiled.exports
}

async function main() {
  const { validNavigationCount, navigationCountLabel, roleNavigation } = await compile('src/data/navigation.ts')
  let checks = 0
  const check = (ok, label) => { assert.ok(ok, label); checks++; console.log('PASS: ' + label) }
  for (const bad of [undefined, null, '', '6', -1, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
    check(validNavigationCount(bad) === null, `Unknown/invalid count ${String(bad)} is hidden, never guessed as zero`)
  }
  check(validNavigationCount(0) === 0, 'Confirmed empty data is a real zero')
  check(validNavigationCount(17) === 17, 'Nonempty data preserves exact count')
  check(Object.values(roleNavigation).flat().every(item => !Object.hasOwn(item, 'badge')), 'All six role menus have no hard-coded badges')
  check(navigationCountLabel('patient-upcoming', 3).includes('3 lịch hẹn sắp tới'), 'Patient badge describes upcoming rather than all appointments')
  check(navigationCountLabel('doctor-waiting', 2).includes('của tôi hôm nay'), 'Doctor count is scoped to own queue today')
  const Shell = (await compile('src/components/AppShell.tsx')).default
  const roles = [
    ['Bệnh nhân', 'Patient', '/my-appointments', 'patient-upcoming'],
    ['Lễ tân', 'Receptionist', '/reception/queue', 'reception-waiting'],
    ['Bác sĩ', 'Doctor', '/doctor/queue', 'doctor-waiting'],
    ['Kỹ thuật viên', 'Technician', '/technician/orders'],
    ['Dược sĩ', 'Pharmacist', '/pharmacy/inventory'],
    ['Quản trị', 'Admin', '/admin/dashboard'],
  ]
  const render = (Component, route, props = {}) => renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [route] }, React.createElement(Component, props)))
  const hasCount = html => /<span[^>]*aria-label="[^"]*theo danh sách đã tải"/.test(html)
  for (const [label, apiRole, route, key] of roles) {
    globalThis.__navUser = { id: 1, fullName: 'Người dùng DEMO', roles: [apiRole], doctorId: 1, patientId: 1 }
    const shellMarkup = render(Shell, route)
    const roleButton = shellMarkup.match(/<button[^>]*aria-label="Chọn vai trò: [^"]*"[^>]*>([\s\S]*?)<\/button>/)?.[0] ?? ''
    check(roleButton.includes(`aria-label="Chọn vai trò: ${label}"`), `${label} role button has an explicit accessible name`)
    check(roleButton.includes('lucide-user-round') && roleButton.includes('aria-hidden="true"'), `${label} uses the shared decorative person icon`)
    check(!roleButton.includes(`>${label.slice(0, 2).toUpperCase()}</span>`), `${label} has no role initials avatar`)
    check(roleButton.includes(`>${label}</span>`) && roleButton.includes('aria-expanded="false"'), `${label} keeps its visible name and disclosure state`)
    check(!hasCount(shellMarkup), `${label} has no badge without a query snapshot`)
    if (!key) continue
    for (const count of [0, 3, 17, 101]) {
      const html = render(Shell, route, { navigationCounts: { [key]: count } })
      check(hasCount(html) && html.includes(navigationCountLabel(key, count)), `${label} renders and describes actual count ${count}`)
      if (count === 101) check(html.includes('>99+</span>') && html.includes('101 '), 'Large counts have compact visual and exact accessible value')
    }
    check(!hasCount(render(Shell, route, { navigationCounts: { [key]: NaN } })), `${label} does not display a malformed count`)
    const unrelatedKey = key === 'patient-upcoming' ? 'doctor-waiting' : 'patient-upcoming'
    check(!hasCount(render(Shell, route, { navigationCounts: { [unrelatedKey]: 8 } })), `${label} cannot inherit another role's count`)
  }
  const realNow = Date.now
  Date.now = () => Date.parse('2026-10-06T08:00:00+07:00')
  const appointment = (id, status, startTime) => ({ id, status, startTime, endTime: startTime,
    appointmentCode: `DEMO-${id}`, patientId: 1, doctorId: 1, patientName: 'Bệnh nhân DEMO', doctorName: 'Bác sĩ DEMO',
    doctorSpecialty: 'Khám tổng quát', source: 0, statusName: 'INTERNAL', createdAt: startTime, checkedInAt: startTime, queueNumber: id })
  const future = '2026-10-08T09:00:00'
  const records = [appointment(1, 0, future), appointment(2, 1, future), appointment(3, 1, '2026-10-05T09:00:00'),
    appointment(4, 2, future), appointment(5, 3, future), appointment(6, 4, future), appointment(7, 5, future)]
  const sources = [
    ['patient', 'src/workspaces/patient/pages/MyAppointmentsPage.tsx', 'Patient', '/my-appointments', 2, records],
    ['reception', 'src/workspaces/reception/pages/ReceptionQueuePage.tsx', 'Receptionist', '/reception/queue', 4, records.slice(0, 4)],
    ['doctor', 'src/workspaces/doctor/pages/DoctorQueuePage.tsx', 'Doctor', '/doctor/queue', 3,
      records.slice(0, 3).map(appointment => ({ appointment, recentHistory: [] }))],
  ]
  try {
    for (const [name, entry, apiRole, route, expected, data] of sources) {
      const Page = (await compile(entry)).default
      globalThis.__navUser = { id: 1, fullName: 'Người dùng DEMO', roles: [apiRole], doctorId: 1, patientId: 1 }
      let snapshot = { data, loading: false, error: '', refresh() {} }
      globalThis.__navQuery = key => key.startsWith('patient-appointments') || key.startsWith('reception-queue-2026') || key.startsWith('doctor-queue-2026')
        ? snapshot : { data: [], loading: false, error: '', refresh() {} }
      check(hasCount(render(Page, route)) && render(Page, route).includes(`${expected} ${name === 'patient' ? 'lịch hẹn sắp tới' : 'lượt chờ'}`), `${name} real page supplies count from its query, not a fixed badge`)
      snapshot = { ...snapshot, data: [] }
      check(hasCount(render(Page, route)) && render(Page, route).includes('0 '), `${name} real page supplies zero after a confirmed empty query`)
      snapshot = { ...snapshot, data, loading: true }
      check(!hasCount(render(Page, route)), `${name} loading hides the old number`)
      snapshot = { ...snapshot, loading: false, error: 'Không thể tải danh sách.' }
      check(!hasCount(render(Page, route)), `${name} failure hides the number instead of fabricating zero`)
      snapshot = { ...snapshot, error: '', data: null }
      check(!hasCount(render(Page, route)), `${name} absent data has no number`)
    }
  } finally { Date.now = realNow; delete globalThis.__navUser; delete globalThis.__navQuery }
  console.log(`Navigation counts: ${checks} passed. No HTTP or database changes.`)
}
main().catch(error => { delete globalThis.__navUser; delete globalThis.__navQuery; console.error(error); process.exitCode = 1 })
