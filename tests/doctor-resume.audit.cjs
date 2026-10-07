// Pure component render checks. No browser, API, credentials or DB mutations.
const assert = require('node:assert/strict')
const path = require('node:path')
const Module = require('node:module')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const esbuild = require('esbuild')

async function main() {
  const root = path.resolve(__dirname, '..')
  const result = await esbuild.build({
    absWorkingDir: root, entryPoints: ['src/workspaces/doctor/components/DoctorInProgressPanel.tsx'],
    bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
    external: ['react', 'react/jsx-runtime', 'lucide-react'],
  })
  const compiled = new Module(path.join(root, 'tests', 'doctor-resume-panel.compiled.cjs'), module)
  compiled.filename = path.join(root, 'tests', 'doctor-resume-panel.compiled.cjs')
  compiled.paths = module.paths
  compiled._compile(result.outputFiles[0].text, compiled.filename)
  const Panel = compiled.exports.default
  let checks = 0
  function check(ok, label) { assert.ok(ok, label); checks++; console.log('PASS: ' + label) }
  const props = { visits: [], loading: false, error: '', onRefresh() {}, onResume() {} }
  const render = changes => renderToStaticMarkup(React.createElement(Panel, { ...props, ...changes }))
  const visit = { medicalRecordId: 101, startedAt: '2026-10-06T06:30:00Z', appointment: { id: 1, appointmentCode: 'AP-DEMO-1', patientName: 'Bệnh nhân DEMO', startTime: '2026-10-06T13:30:00', status: 2 } }
  const filled = render({ visits: [visit] })
  check(filled.includes('Bệnh án #101'), 'Shows record ID rather than appointment ID')
  check(filled.includes('AP-DEMO-1') && filled.includes('Bệnh nhân DEMO'), 'Shows appointment code and patient')
  check(filled.includes('Tiếp tục khám') && !filled.includes('Bắt đầu khám'), 'Resume action never offers create/start action')
  check(filled.includes('w-full') && filled.includes('sm:w-auto') && filled.includes('lg:flex-row'), 'Responsive stacked layout and button classes')
  const loading = render({ loading: true, visits: [visit] })
  check(loading.includes('Đang tải lượt khám') && !loading.includes('Tiếp tục khám'), 'Loading hides stale resume actions')
  const failed = render({ error: 'DEMO lỗi kết nối', visits: [visit] })
  check(failed.includes('role="alert"') && failed.includes('Thử tải lại') && !failed.includes('Tiếp tục khám'), 'Error is visible and stale actions hidden')
  check(render({}).includes('Không có lượt khám chưa hoàn tất.'), 'Empty state is explicit')
  check(!render({ visits: [{ ...visit, appointment: { ...visit.appointment, patientName: '<script>demo</script>' } }] }).includes('<script>demo</script>'), 'Patient name escaped by React')
  console.log(`Doctor resume component: ${checks} passed. Render checks only, not deployed E2E.`)
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
