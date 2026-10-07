// Actual React cashier UI; ALL APIs intercepted. No bank transfers or backend/database mutations.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const base = process.env.FOMED_SEPAY_AUDIT_URL || 'http://127.0.0.1:5186'
const output = path.resolve(__dirname, '../dist/sepay-ui-audit')
let assertions = 0
const results = []
const check = (value, label) => { assert.ok(value, label); assertions++ }
const id = 'aabbccdd-1234-1234-1234-aabbccddeeff'
const code = 'FM0123456789ABCDEF01234567'
const freshInvoice = () => ({ id: 900001, invoiceNo: 'SEPAY-UI-TEST', patientId: 1,
  medicalRecordId: 1, totalAmount: 350000, paidAmount: 0, status: 0, consultationFee: 350000, items: [], payments: [] })
const freshRequest = () => ({ id, invoiceId: 900001, environment: 'Test', code, amount: 350000,
  bankCode: 'MB', accountNumber: 'TEST-ONLY-NOT-REAL', accountName: 'TEST ONLY',
  createdAt: new Date(Date.now() - 60000).toISOString(), expiresAt: new Date(Date.now() + 600000).toISOString(),
  status: 'Pending', qrUrl: `https://vietqr.app/img?acc=TEST-ONLY-NOT-REAL&bank=MB&amount=350000&des=${code}`, remainingAmount: 350000 })
async function main() {
  fs.mkdirSync(output, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 950 }, serviceWorkers: 'block' })
      await context.addInitScript(() => sessionStorage.setItem('fomed_session', JSON.stringify({
        accessToken: 'synthetic-not-valid', refreshToken: '', expiresAt: Date.now() + 3600000,
        remember: false, user: { id: 1, fullName: 'SePay UI audit', roles: ['Receptionist'], doctorId: null, patientId: null },
      })))
      const page = await context.newPage()
      let invoice, request, createError, pollError, postCount, getCount, bankImages, gate, release
      const unexpected = [], jsErrors = []
      page.on('pageerror', e => jsErrors.push(e.message))
      await context.route('https://vietqr.app/**', route => {
        bankImages++
        return route.fulfill({ status: 500, body: 'Synthetic QR image failure' })
      })
      await context.route(/^https?:\/\/[^/]+\/api(?:\/|$)/, async route => {
        const req = route.request(), url = new URL(req.url())
        if (req.method() === 'GET' && url.pathname === '/api/invoices/900001') return route.fulfill({ json: { dataResponse: invoice } })
        if (req.method() === 'POST' && url.pathname === '/api/invoices/900001/sepay/payment-requests') {
          postCount++
          check(req.postData() === null, 'Create request sends no client amount, account or secret')
          if (gate) await gate
          if (createError) return route.fulfill({ status: createError, json: { message: createError === 503 ? 'SePay chưa được cấu hình.' : 'Giao dịch cần đối soát, không thu lại.' } })
          return route.fulfill({ json: { dataResponse: request } })
        }
        if (req.method() === 'GET' && url.pathname === `/api/invoices/900001/sepay/payment-requests/${id}`) {
          getCount++
          if (pollError) return route.abort('failed')
          return route.fulfill({ json: { dataResponse: request } })
        }
        unexpected.push(req.method() + ' ' + url.pathname)
        return route.abort('blockedbyclient')
      })
      // The accessible dialog name changes automatically when payment succeeds.
      const dialog = page.getByRole('dialog', { name: /^Thanh toán/ })
      const create = page.getByRole('button', { name: 'Tạo mã QR SePay', exact: true })
      const reset = async () => {
        invoice = freshInvoice(); request = freshRequest(); createError = 0; pollError = false
        postCount = 0; getCount = 0; bankImages = 0; gate = null; release = null
        await page.goto(base + '/reception/cashier/900001')
        await page.getByLabel('Hình thức', { exact: true }).selectOption('2')
        await create.waitFor()
        check(postCount === 0, 'No automatic POST on page load/method selection')
      }
      const open = async () => { await create.click(); await dialog.waitFor(); await dialog.getByText(/Đang chờ xác nhận thanh toán|SePay đã xác nhận|Giao dịch cần|Hóa đơn đã|hết hạn|thay thế/).first().waitFor() }
      const finish = label => results.push({ width, label })

      await reset()
      gate = new Promise(resolve => { release = resolve })
      await create.click()
      await page.getByRole('button', { name: 'Đang xử lý...' }).waitFor()
      check(await page.getByLabel('Hình thức', { exact: true }).isDisabled(), 'Busy method selector locked')
      check(postCount === 1, 'Single create request during busy state')
      release(); await dialog.waitFor(); gate = null
      check(await dialog.getByText(/Chế độ thử nghiệm —/).isVisible(), 'Test mode warning visible')
      check(await dialog.locator('img').count() === 0 && bankImages === 0, 'Test mode never fetches real bank QR')
      check((await dialog.innerText()).includes('350.000 đ') && (await dialog.innerText()).includes(code), 'Raw amount formatted correctly and exact transfer code visible')
      check(await dialog.getByRole('button', { name: 'Sao chép nội dung chuyển khoản' }).isEnabled(), 'Transfer code copy offered')
      await page.evaluate(() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.__copiedCode = value } } }))
      await dialog.getByRole('button', { name: 'Sao chép nội dung chuyển khoản' }).click()
      await dialog.getByText('Đã sao chép nội dung chuyển khoản.').waitFor()
      check(await page.evaluate(() => window.__copiedCode) === code, 'Copy writes exact code, not formatted or trimmed data (clipboard mocked)')
      check(await dialog.evaluate(el => el.scrollWidth <= el.clientWidth), 'Modal has no horizontal overflow')
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No document horizontal overflow')
      check(await dialog.evaluate(el => el.getBoundingClientRect().height <= innerHeight * 0.91), 'Modal fits viewport with internal vertical scrolling')
      await page.screenshot({ path: path.join(output, `sepay-test-${width}.png`) })
      request = { ...request, status: 'Paid', qrUrl: null, remainingAmount: 0 }
      invoice = { ...invoice, status: 1, paidAmount: 350000, payments: [{ id: 1, method: 2, amount: 350000, paidAt: new Date().toISOString(), provider: 'SePay', providerEnvironment: 'Test', providerTransactionId: 123 }] }
      await dialog.getByRole('heading', { name: 'Thanh toán mô phỏng thành công', exact: true }).waitFor({ timeout: 10000 })
      check(await dialog.getByText('SePay đã xác nhận giao dịch mô phỏng.', { exact: true }).isVisible(), 'Success shown in foreground without closing QR')
      check(!(await dialog.innerText()).includes(code) && !(await dialog.innerText()).includes('Chuyển đúng số tiền'), 'Paid result no longer offers transfer instructions')
      check((await dialog.innerText()).includes('SEPAY-UI-TEST') && (await dialog.innerText()).includes('350.000 đ'), 'Result identifies invoice and confirmed amount')
      await dialog.getByRole('button', { name: 'Xem hóa đơn', exact: true }).click()
      await page.getByText(/Xác nhận tự động bởi SePay/).waitFor()
      check((await page.getByLabel('Lịch sử thanh toán').innerText()).includes('Giao dịch mô phỏng'), 'Payment history shows automatic test source, not a fake cashier')
      check(await create.count() === 0 && await page.getByRole('region', { name: 'Hóa đơn đã thanh toán', exact: true }).count() === 1, 'Settled invoice replaces collection form and cannot create another QR')
      finish('pending-to-paid, busy, test safety, history, responsive')

      for (const status of ['Expired', 'Superseded', 'ReviewRequired', 'InvoiceSettled', 'InvoiceCancelled']) {
        await reset(); request = { ...request, status, qrUrl: null }
        if (status === 'InvoiceSettled') invoice = { ...invoice, status: 1, paidAmount: 350000 }
        if (status === 'InvoiceCancelled') invoice = { ...invoice, status: 2 }
        await open()
        check(await dialog.locator('img').count() === 0, 'Terminal status has no QR')
        check(await dialog.getByRole('button', { name: 'Sao chép nội dung chuyển khoản' }).isDisabled(), 'Terminal code cannot be copied for transfer')
        check(!(await dialog.innerText()).includes('thành công'), 'Non-paid status never claims paid')
        const before = getCount
        await page.waitForTimeout(3300)
        check(getCount === before, 'Terminal status stops polling')
        await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' })
        if (status === 'ReviewRequired') {
          await page.getByText(/Màn hình tạm khóa thao tác/).waitFor()
          check(await create.isDisabled(), 'Known review state prevents another charge in this screen')
        }
        finish(status)
      }
      for (const status of [503, 409]) {
        await reset(); createError = status; await create.click()
        await page.getByRole('alert').getByText(status === 503 ? 'SePay chưa được cấu hình.' : 'Giao dịch cần đối soát, không thu lại.').waitFor()
        check(await dialog.count() === 0, 'Failed create does not open a payment modal')
        check(postCount === 1, 'Failed create is not automatically retried')
        finish('create error ' + status)
      }
      await reset(); pollError = true; await open()
      await dialog.getByRole('alert').waitFor()
      check(await dialog.getByRole('button', { name: 'Sao chép nội dung chuyển khoản' }).isDisabled(), 'Uncertain network state blocks transfer instructions')
      const before = getCount
      await page.waitForTimeout(3300)
      check(getCount === before && postCount === 1, 'Network error stops background polling and never recreates')
      pollError = false
      await dialog.getByRole('button', { name: 'Kiểm tra lại trạng thái' }).click()
      await dialog.getByRole('alert').waitFor({ state: 'hidden' })
      check(postCount === 1, 'Manual status retry is GET only')
      await page.keyboard.press('Escape'); await dialog.waitFor({ state: 'hidden' })
      const afterClose = getCount
      await page.waitForTimeout(3300)
      check(getCount === afterClose, 'Closing modal stops polling')
      check(await create.isEnabled(), 'Focus target/form survives modal close')
      await page.getByLabel('Hình thức', { exact: true }).waitFor()
      await page.waitForFunction(() => document.querySelector('select[aria-labelledby$="-method-label"]') === document.activeElement)
      check(await page.getByLabel('Hình thức', { exact: true }).evaluate(el => document.activeElement === el), 'Keyboard focus restored after invoice reload')
      await open()
      check(postCount === 2 && (await dialog.innerText()).includes(code), 'Explicit reopen uses server returned pending request code')
      finish('network uncertainty, GET retry, close, reopen')

      for (const override of [{ invoiceId: 999 }, { status: 'Unknown' }, { qrUrl: 'https://evil.invalid/qr' }, { amount: 0 }, { code: 'BAD' }, { remainingAmount: 150000 }]) {
        await reset(); request = { ...request, ...override }; await create.click()
        await page.getByRole('alert').waitFor()
        check(await dialog.count() === 0, 'Malformed response cannot open a QR')
        finish('invalid response ' + Object.keys(override)[0])
      }
      await reset(); await open()
      request = { ...request, accountName: 'UNEXPECTED ACCOUNT CHANGE' }
      await dialog.getByRole('alert').getByText(/thay đổi bất thường/).waitFor({ timeout: 10000 })
      check(await dialog.getByRole('button', { name: 'Sao chép nội dung chuyển khoản' }).isDisabled(), 'Changed request details stop transfer instructions')
      finish('immutable request guard')
      await reset(); request = { ...request, environment: 'Live' }; await open()
      await dialog.getByText(/Không tải được ảnh QR/).waitFor()
      check(bankImages > 0, 'Live mode tries vetted QR endpoint')
      check(!(await dialog.innerText()).includes('Chế độ thử nghiệm —'), 'Live mode does not misleadingly say simulated')
      check((await dialog.innerText()).includes(code), 'Image failure keeps bank data visible')
      finish('live QR image failure')
      await reset(); request = { ...request, createdAt: new Date(Date.now() - 120000).toISOString(), expiresAt: new Date(Date.now() - 1000).toISOString() }
      await open()
      check(await dialog.getByRole('button', { name: 'Sao chép nội dung chuyển khoản' }).isDisabled(), 'Local countdown expiry hides usable transfer code without claiming paid')
      check(!(await dialog.innerText()).includes('thành công'), 'Client clock never confirms payment')
      finish('local expiry')
      assert.deepEqual(unexpected, []); assert.deepEqual(jsErrors, [])
      console.log(`PASS SePay UI ${width}px`)
      await context.close()
    }
    console.log(`PASS ${assertions} assertions, ${results.length} cases; all API/QR requests mocked.`)
  } finally {
    try {
      fs.mkdirSync(output, { recursive: true })
      fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({ scope: 'Mocked frontend only, NOT actual SePay/bank transactions', assertions, results }, null, 2))
    } finally { await browser.close() }
  }
}
main().catch(e => { console.error(e); process.exitCode = 1 })
