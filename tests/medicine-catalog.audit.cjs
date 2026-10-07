// Isolated render, validation and handler checks. No HTTP, credentials or Azure access.
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
const medicine = { id: 1, name: 'Thuốc DEMO 10mg', unit: 'viên', price: 1500, description: 'Mô tả DEMO', isActive: true, stockQuantity: 17, availableQuantity: 10, version: 'A'.repeat(64) }
const fixture = { params: new URLSearchParams(), mode: 'success', apiMode: 'success', states: [], cursor: 0, callbacks: {}, updates: [], writes: [], notices: [], queries: [] }
global.__medicineFixture = fixture

async function compile(entry, plugins = []) {
  const result = await esbuild.build({ absWorkingDir: root, entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react', 'react/jsx-runtime', 'lucide-react'], plugins })
  const compiled = new Module(path.join(root, 'tests', 'medicine-catalog.compiled.cjs'), module)
  compiled.filename = path.join(root, 'tests', 'medicine-catalog.compiled.cjs'); compiled.paths = module.paths
  compiled._compile(result.outputFiles[0].text, compiled.filename)
  return compiled.exports
}
function elements(element, found = []) { if (!element || typeof element !== 'object') return found; found.push(element); React.Children.forEach(element.props?.children, child => elements(child, found)); return found }
async function main() {
  const schema = await compile('src/features/pharmacy/schemas/medicine-schema.ts')
  const valid = { name: ' Thuốc DEMO ', unit: ' viên ', price: '0', description: '' }
  check(Object.keys(schema.validateMedicine(valid)).length === 0 && schema.medicineInput(valid).price === 0, 'Zero price allowed and input normalized')
  check(schema.medicineInput(valid).name === 'Thuốc DEMO' && schema.medicineInput(valid).description === undefined, 'Trimmed fields and empty description')
  for (const [field, value] of [['name', ' '], ['name', 'x'.repeat(256)], ['name', 'bad\nname'], ['unit', ''], ['unit', 'x'.repeat(51)], ['price', ''], ['price', '-1'], ['price', '1.001'], ['price', '1e3'], ['price', '10000000000'], ['description', 'x'.repeat(501)]])
    check(Boolean(schema.validateMedicine({ ...valid, [field]: value })[field]), `Validation rejects invalid ${field}`)
  check(!schema.validateMedicine({ ...valid, price: '12.25', description: 'Dòng 1\nDòng 2' }).price, 'Decimal price and multiline description accepted')

  fixture.httpRequests = []
  const clientPlugin = { name: 'offline-http-client', setup(build) {
    build.onResolve({ filter: /http-client$/ }, args => ({ path: args.path, namespace: 'http-fixture' }))
    build.onLoad({ filter: /.*/, namespace: 'http-fixture' }, () => ({ contents: `export const apiRequest=async(path,options={})=>{global.__medicineFixture.httpRequests.push({path,options});return null}` }))
  } }
  const api = (await compile('src/features/pharmacy/api/medicine-catalog-api.ts', [clientPlugin])).medicineCatalogApi
  await api.list({ keyword: ' Thuốc & DEMO ', status: 'inactive' }, 3)
  let request = fixture.httpRequests.at(-1)
  const queryParams = new URLSearchParams(request.path.split('?')[1])
  check(queryParams.get('keyword') === 'Thuốc & DEMO' && queryParams.get('status') === 'inactive' && queryParams.get('page') === '3', 'Client encodes complete filters and page safely')
  await api.update(medicine, schema.medicineInput(valid))
  request = fixture.httpRequests.at(-1)
  check(request.options.method === 'PUT' && JSON.parse(request.options.body).expectedVersion === medicine.version, 'Edit sends expected version for concurrency control')
  await api.setStatus(medicine)
  request = fixture.httpRequests.at(-1)
  check(request.path.endsWith('/1/status') && JSON.parse(request.options.body).isActive === false, 'Client explicitly toggles status without deletion')
  await api.create(schema.medicineInput(valid))
  check(fixture.httpRequests.at(-1).options.method === 'POST' && JSON.parse(fixture.httpRequests.at(-1).options.body).price === 0, 'Create preserves numeric zero price')

  const plugin = { name: 'medicine-fixtures', setup(build) {
    build.onResolve({ filter: /^react$|react-router-dom$|useApiQuery$|medicine-catalog-api$|notifications\/notify$/ }, args => ({ path: args.path, namespace: 'fixture' }))
    build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents:
      args.path === 'react' ? `
        const f=global.__medicineFixture;
        export const useState=initial=>{const i=f.cursor++;if(!(i in f.states))f.states[i]=typeof initial==='function'?initial():initial;return[f.states[i],value=>{f.states[i]=typeof value==='function'?value(f.states[i]):value}]};
        export const useRef=initial=>{const i=f.cursor++;if(!(i in f.states))f.states[i]={current:initial};return f.states[i]};
        export const useEffect=()=>{};export const useId=()=>'medicine-demo-id';` :
      args.path.endsWith('react-router-dom') ? `export const useSearchParams=()=>[global.__medicineFixture.params,next=>global.__medicineFixture.updates.push(next)]` :
      args.path.endsWith('notifications/notify') ? `export const notify={success:message=>global.__medicineFixture.notices.push(message)}` :
      args.path.endsWith('medicine-catalog-api') ? `const f=global.__medicineFixture;const write=async(...args)=>{f.writes.push(args);if(f.apiMode==='delay')await new Promise(resolve=>{f.resolve=resolve});if(f.apiMode==='error')throw new Error('Thông tin thuốc đã thay đổi. Vui lòng tải lại.');return f.medicine};export const medicineCatalogApi={list:async(...args)=>{f.queries.push(args);return {items:[],page:1,pageSize:20,totalCount:0}},create:(...args)=>write('create',...args),update:(...args)=>write('update',...args),setStatus:(...args)=>write('status',...args)}` :
      `export function useApiQuery(key,query){const f=global.__medicineFixture;f.callbacks[key]=query;return {data:{key:f.mode==='stale'?'previous':key.slice('admin-medicines-'.length),result:{items:f.mode==='empty'?[]:[f.medicine],page:Number(f.params.get('page')||1),pageSize:20,totalCount:f.mode==='empty'?0:45}},loading:f.mode==='loading',error:f.mode==='error'?'Lỗi kết nối DEMO':'',refresh(){f.refreshed=true}}}`
    }))
  } }
  fixture.medicine = medicine
  const Page = (await compile('src/cms/medicines/pages/MedicineManagementPage.tsx', [plugin])).default
  const tree = () => { fixture.cursor = 0; return elements(Page()) }
  const render = () => { fixture.cursor = 0; return renderToStaticMarkup(React.createElement(Page)) }
  const html = render()
  check(html.includes(medicine.name) && html.includes('1.500') && html.includes('17') && html.includes('10'), 'Real page shows medicine, price and both stock counts')
  check(html.includes('/ 45 thuốc phù hợp') && html.includes('Ngừng sử dụng'), 'Server total and stop action shown')
  const filters = tree().find(e => e.type?.name === 'MedicineFilters')
  filters.props.onApply({ keyword: 'DEMO', status: 'active' })
  check(fixture.updates.at(-1).get('page') === '1' && fixture.updates.at(-1).get('keyword') === 'DEMO', 'Filter updates URL and resets page')
  fixture.params = fixture.updates.at(-1); fixture.callbacks = {}; render()
  await Object.values(fixture.callbacks)[0]()
  check(fixture.queries.at(-1)[0].keyword === 'DEMO' && fixture.queries.at(-1)[0].status === 'active', 'Filters sent to backend, not current-page filtering')
  const pagination = tree().find(e => e.type?.name === 'CMSPagination')
  pagination.props.onPageChange(2)
  check(fixture.updates.at(-1).get('page') === '2' && fixture.updates.at(-1).get('keyword') === 'DEMO', 'Pagination preserves URL filter')
  for (const mode of ['loading', 'stale', 'error']) {
    fixture.mode = mode
    check(!render().includes(medicine.name), `${mode} does not display stale medicine rows`)
  }
  fixture.mode = 'empty'; check(render().includes('Không có thuốc phù hợp'), 'Empty filter result explained')
  fixture.mode = 'success'
  let nodes = tree()
  nodes.find(e => e.props?.['aria-label'] === `Sửa ${medicine.name}`).props.onClick()
  let form = tree().find(e => e.type?.name === 'MedicineForm')
  check(form.props.medicine.id === medicine.id, 'Edit opens selected medicine rather than fixed demo ID')
  fixture.apiMode = 'delay'
  const first = form.props.onSubmit({ ...valid, price: '2000' })
  await form.props.onSubmit({ ...valid, price: '2000' })
  check(fixture.writes.length === 1 && fixture.notices.length === 0, 'Double submit blocked; no success before response')
  check(tree().find(e => e.type?.name === 'MedicineForm').props.busy, 'Dialog busy state during pending write')
  fixture.resolve(); await first
  check(fixture.notices.length === 1 && !tree().some(e => e.type?.name === 'MedicineForm') && fixture.refreshed, 'Success closes dialog, notifies once and refreshes catalog')
  nodes = tree(); nodes.find(e => e.props?.['aria-label'] === `Sửa ${medicine.name}`).props.onClick()
  form = tree().find(e => e.type?.name === 'MedicineForm')
  fixture.apiMode = 'error'; await form.props.onSubmit({ ...valid, price: '2000' })
  check(tree().find(e => e.type?.name === 'MedicineForm').props.error.includes('đã thay đổi') && fixture.notices.length === 1, 'Failed edit remains in dialog and never shows success')
  tree().find(e => e.type?.name === 'MedicineForm').props.onClose()
  tree().find(e => e.props?.['aria-label'] === `Ngừng sử dụng ${medicine.name}`).props.onClick()
  check(tree().some(e => e.type?.name === 'MedicineDialog'), 'Stop requires explicit confirmation dialog')
  fixture.apiMode = 'success'
  const dialog = tree().find(e => e.type?.name === 'MedicineDialog')
  await elements(dialog).find(e => e.type?.name === 'Button' && e.props.children === 'Xác nhận').props.onClick()
  // Handler uses void; allow its awaited continuation to settle.
  await Promise.resolve(); await Promise.resolve()
  check(fixture.writes.at(-1)[0] === 'status' && fixture.notices.at(-1).includes('ngừng sử dụng'), 'Confirmed stop uses status endpoint and success notification')

  const source = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8')
  check(source.includes('path="/admin/medicines"') && source.includes('roles={["Admin"]}'), 'Admin route wired within existing role-protected CMS')
  check(fs.readFileSync(path.join(root, 'src/data/navigation.ts'), 'utf8').includes("path: '/admin/medicines'"), 'Medicine menu is discoverable')
  const dialogSource = fs.readFileSync(path.join(root, 'src/cms/medicines/components/MedicineDialog.tsx'), 'utf8')
  check(dialogSource.includes('aria-modal="true"') && dialogSource.includes("event.key === 'Escape'") && dialogSource.includes('previous.focus()'), 'Dialog has labeled modal, Escape and focus restoration')
  check(!fs.readFileSync(path.join(root, 'src/features/pharmacy/api/medicine-catalog-api.ts'), 'utf8').includes("method: 'DELETE'"), 'Client never hard-deletes medicines')
  console.log(`Medicine catalog frontend: ${checks} checks passed. Synthetic render/handler checks, not deployed E2E.`)
}
main().catch(error => { console.error(error.stack); process.exitCode = 1 }).finally(() => { delete global.__medicineFixture })
