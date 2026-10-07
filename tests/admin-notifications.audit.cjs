// Source contracts, not runtime/API integration tests. Browser DEMO exercises handlers separately.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
let checks = 0
const check = (ok, label) => { assert.ok(ok, label); checks++; console.log('PASS: ' + label) }
const read = file => fs.readFileSync(path.join(__dirname, '../src/', file), 'utf8')
const groups = ['doctors', 'specialties', 'services', 'users', 'schedules', 'time-off']
const names = ['Doctor', 'Specialty', 'Service', 'User', 'Schedule', 'TimeOff']
const sources = groups.map((group, index) => read(`cms/${group}/pages/${names[index]}ManagementPage.tsx`))
sources.forEach((source, index) => {
  check(source.includes("import { notify } from '../../../shared/notifications/notify'"), `${groups[index]} uses shared adapter`)
  check(!source.includes('setSuccess') && !source.includes('{success &&'), `${groups[index]} has no duplicate green banner`)
  check(!source.includes('<AppToaster') && !source.includes('toast.'), `${groups[index]} has no extra toaster`)
})
for (const index of [0, 1, 2, 5]) {
  check(/await mutation\.[\s\S]*?notify.success\(/.test(sources[index]) && /catch\s*\{/.test(sources[index]), `${groups[index]} reports success only inside successful write path`)
  check(sources[index].includes('apiError={mutation.error}'), `${groups[index]} retains form errors`)
}
const users = sources[3]
check(/await operation\(\)[\s\S]*?notify.success\(message\)/.test(users) && /catch\s*\{/.test(users), 'User action catches rejection and notifies only after response')
check(users.includes('if (pending.current) return') && users.includes('finally { pending.current = false }'), 'User action pending guard released after failure/success')
check((users.match(/onSubmit=\{.*runAction\(/g) || []).length === 3, 'Status, roles, password use guarded handler')
check(users.includes('thu hồi các phiên đăng nhập cũ'), 'Password result preserves session revocation message')
check(read('cms/users/components/UserStatusForm.tsx').includes('Các phiên đăng nhập hiện tại sẽ bị thu hồi.'), 'Account lock warning remains persistent')
check(read('cms/users/components/ResetPasswordForm.tsx').includes('role="alert"'), 'Password validation stays in dialog')
check(sources[4].includes('window.confirm') && sources[5].includes('window.confirm'), 'Delete confirmations retained')
check(sources[4].includes("notify.error(e, 'Không thể xóa lịch nghỉ.')") && sources[5].includes("notify.error(reason, 'Không thể xóa lịch nghỉ.')"), 'Leave removal errors are error notifications, never green success')
check(sources[4].includes('error={error}') && !sources[4].includes('{error && <div'), 'Schedule save error has one location inside form')
check(!read('cms/roles/pages/RoleManagementPage.tsx').includes('notify.'), 'Read-only roles has no artificial operation toast')
const fixture = fs.readFileSync(path.join(__dirname, 'fixtures/admin-notifications.tsx'), 'utf8')
check(fixture.includes('window.fetch = blocked') && fixture.includes('for (const key of Object.keys(api))'), 'DEMO blocks HTTP and unmocked business calls')
console.log(`Admin notifications: ${checks} source contracts passed; not production E2E.`)
