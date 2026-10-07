// Static render/validation checks only. No browser, network, credentials or payment writes.
const assert = require('node:assert/strict')
const path = require('node:path')
const Module = require('node:module')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const esbuild = require('esbuild')

async function main() {
  const root = path.resolve(__dirname, '..')
  async function compile(entry) {
    const result = await esbuild.build({ absWorkingDir: root, entryPoints: [entry], bundle: true, write: false,
      platform: 'node', format: 'cjs', jsx: 'automatic', define: { 'import.meta.env': '{}' },
      external: ['react', 'react/jsx-runtime', 'lucide-react'] })
    const compiled = new Module(path.join(root, 'tests', 'sepay-success.compiled.cjs'), module)
    compiled.filename = path.join(root, 'tests', 'sepay-success.compiled.cjs')
    compiled.paths = module.paths
    compiled._compile(result.outputFiles[0].text, compiled.filename)
    return compiled.exports
  }
  const Modal = (await compile('src/features/billing/components/SePayPaymentModal.tsx')).default
  const { validateSePayRequest } = await compile('src/features/billing/schemas/sepay-schema.ts')
  const request = { id: '00000000-0000-4000-8000-000000000001', invoiceId: 101, environment: 'Test',
    code: 'FM0123456789ABCDEF01234567', amount: 261000, bankCode: 'MB', accountNumber: '0000000001', accountName: 'DEMO',
    createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 900000).toISOString(), status: 'Pending', remainingAmount: 261000,
    qrUrl: 'https://vietqr.app/img?acc=0000000001&bank=MB&amount=261000&des=FM0123456789ABCDEF01234567' }
  const render = changes => renderToStaticMarkup(React.createElement(Modal, { initial: { ...request, ...changes },
    invoiceNo: 'HD-DEMO-101', onClose() {}, onTerminal() {} }))
  let checks = 0
  const check = (ok, label) => { assert.ok(ok, label); checks++; console.log('PASS: ' + label) }
  const pending = render({})
  check(pending.includes('Đang chờ xác nhận thanh toán') && !pending.includes('thành công'), 'Pending never claims success')
  check(pending.includes('Nội dung chuyển khoản') && pending.includes('Số tiền cần chuyển'), 'Pending keeps transfer information')
  check(!pending.includes('<img'), 'Test never loads a bank QR')
  const testPaid = render({ status: 'Paid', remainingAmount: 0 })
  check(testPaid.includes('Thanh toán mô phỏng thành công'), 'Paid Test result has a clear success title')
  check(testPaid.includes('không có tiền thật được chuyển') && testPaid.includes('Số tiền đã ghi nhận mô phỏng'), 'Test result remains explicitly simulated')
  check(testPaid.includes('HD-DEMO-101') && /261[.\s]000/.test(testPaid), 'Result identifies invoice and confirmed amount')
  check(!testPaid.includes('Nội dung chuyển khoản') && !testPaid.includes('Số tài khoản') && !testPaid.includes('Chuyển đúng số tiền'), 'Paid removes transfer instructions and account/code')
  check(!testPaid.includes('<img') && !testPaid.includes('Sao chép') && !testPaid.includes('Còn '), 'Paid removes QR, clipboard actions and countdown')
  check(testPaid.includes('Xem hóa đơn') && testPaid.includes('Không chuyển thêm tiền'), 'Completion action is invoice review, not payment confirmation')
  check(testPaid.includes('aria-atomic="true"') && testPaid.includes('role="status"') && testPaid.includes('tabindex="-1"'), 'Result supports announcement and programmatic focus')
  const livePaid = render({ environment: 'Live', status: 'Paid', remainingAmount: 0 })
  check(livePaid.includes('Thanh toán thành công') && livePaid.includes('Số tiền đã thanh toán') && !livePaid.includes('mô phỏng'), 'Paid Live has a real payment result, not Test wording')
  for (const status of ['Expired', 'Superseded', 'ReviewRequired', 'InvoiceSettled', 'InvoiceCancelled']) {
    const html = render({ status })
    check(!html.includes('thành công') && !html.includes('Xem hóa đơn'), status + ' is not a successful SePay receipt')
  }
  check(!renderToStaticMarkup(React.createElement(Modal, { initial: { ...request, status: 'Paid', remainingAmount: 0 }, onClose() {}, onTerminal() {} })).includes('undefined'), 'Optional invoice number has no broken placeholder')
  check(renderToStaticMarkup(React.createElement(Modal, { initial: { ...request, status: 'Paid', remainingAmount: 0 }, invoiceNo: '<script>DEMO</script>', onClose() {}, onTerminal() {} })).includes('&lt;script&gt;'), 'Invoice number is escaped')
  check(validateSePayRequest({ ...request, status: 'Paid', remainingAmount: 0 }, 101).status === 'Paid', 'Only matching authoritative Paid response is accepted')
  for (const changes of [{ remainingAmount: 1 }, { invoiceId: 999 }, { id: 'invalid' }]) {
    assert.throws(() => validateSePayRequest({ ...request, status: 'Paid', remainingAmount: 0, ...changes }, 101, request.id))
    checks++; console.log('PASS: Reject malformed/mismatched Paid response: ' + Object.keys(changes)[0])
  }
  console.log(`SePay success: ${checks} passed. Static render/validation only; polling checked separately in the isolated browser fixture.`)
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
