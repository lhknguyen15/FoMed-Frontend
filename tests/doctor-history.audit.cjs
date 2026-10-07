// Pure rendering checks: no browser session, API call or database writes.
const assert = require('node:assert/strict')
const path = require('node:path')
const Module = require('node:module')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const esbuild = require('esbuild')

async function main() {
  const root = path.resolve(__dirname, '..')
  const result = await esbuild.build({
    absWorkingDir: root, entryPoints: ['src/workspaces/doctor/components/DoctorHistoryEntries.tsx'],
    bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
    external: ['react', 'react/jsx-runtime', 'lucide-react'],
  })
  const compiled = new Module(path.join(root, 'tests', 'doctor-history.compiled.cjs'), module)
  compiled.filename = path.join(root, 'tests', 'doctor-history.compiled.cjs')
  compiled.paths = module.paths
  compiled._compile(result.outputFiles[0].text, compiled.filename)
  const Entries = compiled.exports.default
  let checks = 0
  function check(ok, label) { assert.ok(ok, label); checks++; console.log('PASS: ' + label) }
  const props = { history: [], loading: false, error: '', onRetry() {} }
  const render = changes => renderToStaticMarkup(React.createElement(Entries, { ...props, ...changes }))
  const history = [106, 105, 104, 103, 102].map(id => ({ medicalRecordId: id, appointmentId: id, visitAt: '2026-10-05T13:30:00', diagnosis: `DEMO-${id}`, note: `Ghi chú DEMO-${id}` }))
  const filled = render({ history })
  check(history.every(item => filled.includes(item.diagnosis) && filled.includes(item.note)), 'All five diagnoses and notes displayed')
  check(filled.indexOf('DEMO-106') < filled.indexOf('DEMO-102'), 'Server order preserved without client re-sorting')
  check(!filled.includes('2026-10-05T13:30:00') && filled.includes('13:30') && filled.includes('5/10/26'), 'Visit timestamps formatted for display')
  check(filled.includes('min-w-0') && filled.includes('break-words'), 'History text wraps on narrow screens')
  const loading = render({ history, loading: true })
  check(loading.includes('role="status"') && loading.includes('Đang tải lịch sử khám') && !loading.includes('DEMO-106'), 'Loading is explicit and hides stale history')
  const failed = render({ history, error: 'DEMO: Lỗi kết nối' })
  check(failed.includes('role="alert"') && failed.includes('Tải lại lịch sử') && !failed.includes('DEMO-106'), 'Failure shows retry, not stale history')
  check(!failed.includes('Chưa có lần khám'), 'Failure is not misrepresented as empty history')
  check(render({}).includes('Chưa có lần khám đã chốt trước lượt khám này.'), 'Empty state explains historical finalized-visit scope')
  check(render({ history: [{ ...history[0], diagnosis: '', note: '' }] }).includes('Chưa ghi chẩn đoán'), 'Missing diagnosis has a safe fallback')
  const escaped = render({ history: [{ ...history[0], diagnosis: '<script>demo</script>', note: '<img src=x onerror=demo()>' }] })
  check(!escaped.includes('<script>') && !escaped.includes('<img '), 'Diagnosis and note escaped by React')
  console.log(`Doctor history component: ${checks} passed. Render checks only, not deployed E2E.`)
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
