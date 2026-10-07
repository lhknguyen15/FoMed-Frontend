// Synthetic handler tests + source contracts. No browser, credentials, HTTP or real data.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const esbuild = require('esbuild')
const root = path.resolve(__dirname, '..')
let checks = 0
const check = (ok, label) => { assert.ok(ok, label); checks++; console.log('PASS: ' + label) }
const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const paths = {
  register: 'src/workspaces/auth/pages/RegisterPage.tsx',
  password: 'src/workspaces/auth/pages/ChangePasswordPage.tsx',
  forgot: 'src/workspaces/auth/pages/ForgotPasswordPage.tsx',
  patients: 'src/workspaces/reception/pages/ReceptionPatientsPage.tsx',
}
for (const [name, file] of Object.entries(paths)) {
  const source = read(file)
  check(source.includes('pending.current') && source.includes('pending.current = false;'), `${name}: pending guard and release`)
  check(source.includes('displayError(') && source.includes('role="alert"'), `${name}: safe inline form errors`)
  check(!source.includes('<AppToaster'), `${name}: no extra toaster`)
}
const reg = read(paths.register), pw = read(paths.password), forgot = read(paths.forgot), patients = read(paths.patients)
check([reg, pw, patients].every(source => source.includes('import { notify }') && source.includes('<fieldset disabled=')), 'Shared notifications and native pending locks')
check(!pw.includes('setMessage') && !patients.includes('setSuccess'), 'No duplicate success banners')
check(patients.includes("notify.info('Đã mở biểu mẫu tạo hồ sơ mới.')"), 'Opening a form is advice, not saved success')
check(!patients.includes('Đã tạo bệnh nhân ${') && !reg.includes('notify.success(form.'), 'Success notifications exclude patient/account identifiers')
check(forgot.includes('Nếu email đã được đăng ký') && !forgot.includes('notify.'), 'Recovery explanation remains persistent and non-enumerating')
check(pw.includes('aria-label={visible') && pw.includes("setConfirmPassword('')"), 'Password visibility has a label and successful fields clear')
check(patients.includes('historyOpen && selected') && patients.includes('Tiền sử dị ứng'), 'History and medical fields retained')
check(patients.includes('!optionalPhone(values.phone)'), 'Required phone cannot normalize to empty')
check(patients.includes('grid grid-cols-1 gap-6') && patients.includes('min-w-0 p-5') && patients.includes('flex flex-wrap items-start justify-between'), 'Patient form uses shrinkable cards and wrapping actions on mobile')

// A tiny hook runner executes real page handlers without a browser. It does not
// assert React lifecycle, focus, CSS or native form behavior; browser DEMO covers UI.
function harness(file) {
  let state = [], cursor = 0, currentTree
  const calls = [], notifications = [], navigations = []
  let response = async () => ({ patientId: 1, patientCode: 'BN-DEMO', fullName: 'Người dùng DEMO', phone: '0000000000', isActive: true })
  const api = new Proxy({}, { get: (_target, name) => async (...args) => { calls.push({ name, args }); return response() } })
  const react = {
    useState(initial) { const i = cursor++; if (!(i in state)) state[i] = typeof initial === 'function' ? initial() : initial; return [state[i], value => { state[i] = typeof value === 'function' ? value(state[i]) : value }] },
    useRef(initial) { const i = cursor++; if (!(i in state)) state[i] = { current: initial }; return state[i] },
    useMemo(fn) { return fn() }, useEffect() {},
  }
  const jsx = (type, props) => ({ type, props: props ?? {} })
  const runtime = { jsx, jsxs: jsx, Fragment: 'Fragment' }
  const compiled = new Module(path.join(__dirname, 'synthetic-page.cjs'), module)
  compiled.filename = path.join(__dirname, 'synthetic-page.cjs')
  compiled.require = id => {
    if (id === 'react') return react
    if (id === 'react/jsx-runtime') return runtime
    if (id === 'react-router-dom') return { useNavigate: () => (...args) => navigations.push(args), Link: 'Link' }
    if (id.endsWith('/notify')) return { notify: Object.fromEntries(['success', 'info', 'error'].map(type => [type, message => notifications.push({ type, message })])) }
    if (id.endsWith('/user-messages')) return { displayError: (_reason, fallback) => fallback }
    if (id.endsWith('/useAuth')) return { useAuth: () => ({ register: api.register, forgotPassword: api.forgotPassword }) }
    if (id.endsWith('/auth-api')) return { authApi: api }
    if (id.endsWith('/patient-api')) return { patientStaffApi: api }
    if (id.endsWith('/useApiQuery')) return { useApiQuery: () => ({ data: [], loading: false, error: '', refresh() {} }) }
    if (id.endsWith('.png')) return 'logo-demo'
    return new Proxy({}, { get: (_target, key) => key })
  }
  compiled._compile(esbuild.transformSync(read(file), { loader: 'tsx', format: 'cjs', jsx: 'automatic' }).code, compiled.filename)
  function render() { cursor = 0; currentTree = compiled.exports.default(); return currentTree }
  function walk(node) { if (!node || typeof node !== 'object') return []; if (Array.isArray(node)) return node.flatMap(item => walk(item)); return [node, ...walk(node.props?.children)] }
  const all = () => walk(currentTree)
  function field(label, value) { const node = all().find(node => node.props?.label === label); assert.ok(node, label); node.props.onChange({ target: { value } }); render() }
  function submit() { return all().find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }) }
  render()
  return { calls, notifications, navigations, field, submit, render, all, setResponse(fn) { response = fn }, reset() { state = []; notifications.length = 0; calls.length = 0; navigations.length = 0; render() } }
}
async function main() {
  const password = harness(paths.password)
  const fillPassword = () => { password.field('Mật khẩu hiện tại', 'SYNTHETIC-OLD'); password.field('Mật khẩu mới', 'SYNTHETIC-NEW'); password.field('Xác nhận mật khẩu mới', 'SYNTHETIC-NEW') }
  password.field('Mật khẩu mới', 'short'); await password.submit()
  check(password.calls.length === 0 && password.notifications.length === 0, 'Missing old password blocks handler')
  password.field('Mật khẩu hiện tại', 'SYNTHETIC-OLD'); await password.submit()
  check(password.calls.length === 0, 'Short new password blocks handler')
  password.field('Mật khẩu mới', 'SYNTHETIC-NEW'); password.field('Xác nhận mật khẩu mới', 'different'); await password.submit()
  check(password.calls.length === 0, 'Mismatched password blocks handler')
  password.field('Mật khẩu mới', 'SYNTHETIC-OLD'); password.field('Xác nhận mật khẩu mới', 'SYNTHETIC-OLD'); await password.submit()
  check(password.calls.length === 0, 'Unchanged password blocks handler')
  fillPassword(); password.setResponse(async () => { throw new Error('SqlClient secret=DEMO') }); await password.submit(); password.render()
  check(password.notifications.length === 0 && password.all().some(n => n.props.role === 'alert'), 'Failed password change has inline error only')
  check(password.all().find(n => n.props.label === 'Mật khẩu mới').props.value === 'SYNTHETIC-NEW', 'Failed password change keeps draft')
  let release
  password.setResponse(() => new Promise(resolve => { release = resolve }))
  const pendingPassword = password.submit(); password.render(); await password.submit()
  check(password.calls.length === 2 && password.notifications.length === 0 && password.all().some(n => n.type === 'fieldset' && n.props.disabled), 'Pending password handler blocks repeat and locks form')
  release('Internal message must not become toast'); await pendingPassword; password.render()
  check(password.notifications.length === 1 && password.notifications[0].message === 'Đã đổi mật khẩu thành công.', 'Password success only after response; fixed safe message')
  check(password.all().filter(n => n.props.label?.startsWith('Mật khẩu') || n.props.label === 'Xác nhận mật khẩu mới').every(n => n.props.value === ''), 'Successful password change clears all synthetic secrets')

  const register = harness(paths.register)
  register.field('Họ và tên *', 'Người dùng DEMO'); register.field('Số điện thoại *', '0000000000'); register.field('Mật khẩu *', 'SYNTHETIC-NEW'); register.field('Xác nhận mật khẩu *', 'SYNTHETIC-NEW')
  await register.submit(); check(register.calls.length === 0, 'Unchecked terms prevent registration handler')
  register.all().find(n => n.type === 'input' && n.props.type === 'checkbox').props.onChange({ target: { checked: true } }); register.render()
  register.field('Số điện thoại *', 'invalid'); await register.submit(); check(register.calls.length === 0, 'Invalid phone prevents registration handler')
  register.field('Số điện thoại *', '0000000000'); register.setResponse(async () => { throw new Error('SqlClient secret=DEMO') }); await register.submit(); register.render()
  check(register.notifications.length === 0 && register.navigations.length === 0 && register.all().some(n => n.props.role === 'alert'), 'Failed registration stays in form without navigation')
  register.setResponse(() => new Promise(resolve => { release = resolve })); const pendingRegister = register.submit(); register.render(); await register.submit()
  check(register.calls.length === 2 && register.notifications.length === 0 && register.all().some(n => n.type === 'fieldset' && n.props.disabled), 'Pending registration handler locks and blocks repeat')
  release({}); await pendingRegister
  check(register.notifications.length === 1 && register.navigations.length === 1 && register.navigations[0][0] === '/booking', 'Registration success notifies once then navigates')

  const recovery = harness(paths.forgot)
  recovery.field('Email', 'invalid'); await recovery.submit(); check(recovery.calls.length === 0, 'Invalid recovery email blocks handler')
  recovery.field('Email', 'demo@example.invalid'); recovery.setResponse(async () => { throw new Error('SqlClient secret=DEMO') }); await recovery.submit(); recovery.render()
  check(recovery.all().some(n => n.props.role === 'alert') && recovery.notifications.length === 0, 'Recovery failure remains inline')
  recovery.setResponse(() => new Promise(resolve => { release = resolve })); const pendingRecovery = recovery.submit(); recovery.render(); await recovery.submit()
  check(recovery.calls.length === 2 && recovery.notifications.length === 0, 'Pending recovery handler blocks repeated request')
  release('SqlClient secret=DEMO'); await pendingRecovery; recovery.render()
  check(!recovery.all().some(n => n.type === 'form') && recovery.notifications.length === 0 && JSON.stringify(recovery.all()).includes('Nếu email đã được đăng ký'), 'Recovery response uses fixed private explanation, not raw response or duplicate toast')
  check(read('tests/fixtures/account-patients-notifications.tsx').includes('window.fetch = blocked'), 'Browser DEMO blocks HTTP')
  console.log(`Account/patients: ${checks} checks passed. Handler runner is synthetic, not React/browser/backend integration.`)
}
main().catch(error => { console.error(error); process.exitCode = 1 })
