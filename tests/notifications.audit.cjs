// Isolated Sonner adapter, no browser, credentials, network or data writes.
const assert = require('node:assert/strict')
const path = require('node:path')
const Module = require('node:module')
const esbuild = require('esbuild')
async function main() {
  const calls = []
  globalThis.__notificationCalls = calls
  const result = await esbuild.build({ absWorkingDir: path.resolve(__dirname, '..'), entryPoints: ['src/shared/notifications/notify.ts'],
    bundle: true, write: false, platform: 'node', format: 'cjs', plugins: [{ name: 'stub-sonner', setup(build) {
      build.onResolve({ filter: /^sonner$/ }, () => ({ path: 'sonner', namespace: 'fixture' }))
      build.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ contents: 'export const toast = Object.fromEntries(["success","info","error"].map(type => [type,(message,options)=>{globalThis.__notificationCalls.push({type,message,options});return options.id ?? 1}]))', loader: 'js' }))
    } }] })
  const compiled = new Module(path.join(__dirname, 'notifications.compiled.cjs'), module)
  compiled.filename = path.join(__dirname, 'notifications.compiled.cjs')
  compiled._compile(result.outputFiles[0].text, compiled.filename)
  const { notify } = compiled.exports
  let checks = 0
  const check = (ok, label) => { assert.ok(ok, label); checks++; console.log('PASS: ' + label) }
  check(calls.length === 0, 'Import does not emit an automatic toast')
  notify.success('Đã ghi nhận thanh toán thành công.', 'payment-demo')
  check(calls[0].type === 'success' && calls[0].message === 'Đã ghi nhận thanh toán thành công.', 'Success preserves accented business wording')
  check(calls[0].options.duration === 5000 && calls[0].options.id === 'payment-demo', 'Success has readable duration and optional deduplication id')
  notify.info('Lịch đã gần giờ hẹn. Vui lòng liên hệ lễ tân.')
  check(calls[1].type === 'info' && calls[1].options.duration === 7000, 'Advice is informative, not a false green success')
  for (const raw of ['SqlClient exception: secret=DEMO', 'https://example.invalid/private', '<script>DEMO</script>', 'components failed', 'Thanh toan that bai', 'Lỗi database: mật khẩu DEMO', '']) {
    notify.error(new Error(raw), 'Không thể cập nhật hàng chờ.')
    const last = calls.at(-1)
    check(last.type === 'error' && last.message === 'Không thể cập nhật hàng chờ.', 'Internal/unknown error replaced by contextual Vietnamese fallback')
  }
  notify.error(new Error('Bac si da co lich hen khac trong khung gio nay.'))
  check(calls.at(-1).message === 'Bác sĩ đã có lịch hẹn khác trong khung giờ này.', 'Known unaccented backend error translated safely')
  notify.error(new TypeError('Failed to fetch'))
  check(calls.at(-1).options.duration === 8000 && calls.at(-1).message.includes('Vui lòng thử lại'), 'Unknown network error is readable, not technical')
  notify.success('backend exception')
  check(calls.at(-1).message === 'Thao tác đã hoàn tất.', 'Success adapter cannot expose internal wording')
  check(calls.every(call => typeof call.message === 'string' && /[À-ỹ]/u.test(call.message)), 'Every emitted message uses accented Vietnamese text')
  console.log(`Notifications: ${checks} passed. Sonner is stubbed; no HTTP or database changes.`)
}
main().catch(error => { console.error(error); process.exitCode = 1 }).finally(() => { delete globalThis.__notificationCalls })
