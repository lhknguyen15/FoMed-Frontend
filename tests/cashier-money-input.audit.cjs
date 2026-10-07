// Actual React page, synthetic session/invoice, ALL API calls intercepted.
// Tests UI parsing/tender/change and mocked response handling, NOT real backend payments.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert/strict')
const base = process.env.FOMED_MONEY_AUDIT_URL || 'http://127.0.0.1:5186'
const output = path.resolve(__dirname, '../dist/money-input-audit')
const results = []
let assertions = 0
const check = (condition, label) => { assert.ok(condition, label); assertions++ }
const cases = [
  ['500000', 500000], ['500.000', 500000], ['500 000', 500000],
  ['500\u00a0000', 500000], ['500\u202f000', 500000], ['350000', 350000],
  ['350001', 350001], ['150000', 150000], ['150.000', 150000],
  ['150,000', null], ['150,5', null], ['150.000,00', null], ['150,000.00', null],
  ['0', 0], ['-150000', null], ['1e5', null], ['0.1', null], ['0.001', null],
  ['15.00', null], ['1.50.000', null], ['500000.00', null], ['500.000,00', null],
  ['9999999999', 9999999999], ['10000000000', 10000000000], ['10000000001', null], ['', null],
]
const freshInvoice = (overrides = {}) => ({
  id: 900001, invoiceNo: 'TEST-NOT-REAL', patientId: 1, medicalRecordId: 1,
  totalAmount: 350000, paidAmount: 0, status: 0, consultationFee: 350000, items: [], payments: [], ...overrides,
})
const money = value => value.toLocaleString('vi-VN', { maximumFractionDigits: 2 }) + ' đ'

async function main() {
  fs.mkdirSync(output, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  try {
    for (const scenario of [{ locale: 'en-US', width: 1440 }, { locale: 'vi-VN', width: 390 }]) {
      const context = await browser.newContext({ locale: scenario.locale, viewport: { width: scenario.width, height: 950 }, serviceWorkers: 'block' })
      const page = await context.newPage()
      const jsErrors = []
      const unexpectedApi = []
      page.on('pageerror', error => jsErrors.push(error.message))
      await context.addInitScript(() => sessionStorage.setItem('fomed_session', JSON.stringify({
        accessToken: 'synthetic-not-valid-on-server', refreshToken: '', expiresAt: Date.now() + 3600000,
        remember: false, user: { id: 1, fullName: 'Cash regression', roles: ['Receptionist'], doctorId: null, patientId: null },
      })))
      let invoice, payloads, responseMode, release, gate
      await context.route(/^https?:\/\/[^/]+\/api(?:\/|$)/, async route => {
        const request = route.request()
        const pathname = new URL(request.url()).pathname
        if (request.method() === 'GET' && pathname === '/api/invoices/900001') {
          return route.fulfill({ json: { statusCode: 200, dataResponse: invoice, message: '' } })
        }
        if (request.method() === 'POST' && pathname === '/api/invoices/900001/payments') {
          const body = request.postDataJSON()
          payloads.push(body)
          if (responseMode === 'held') await gate
          if (responseMode === 'network') return route.abort('failed')
          if (responseMode === 'capture') return route.fulfill({ status: 400, json: { message: 'Test capture only; no payment executed.' } })
          invoice = { ...invoice, paidAmount: invoice.paidAmount + body.amount, status: 1,
            payments: [...invoice.payments, { id: 900001, amount: body.amount, method: body.method, paidAt: new Date().toISOString(),
              cashReceived: body.cashReceived ?? null, changeAmount: body.cashReceived == null ? null : body.cashReceived - body.amount,
              receivedBy: 1, receivedByName: 'Server cashier snapshot', idempotencyKey: body.idempotencyKey }] }
          if (responseMode === 'lost-response') return route.abort('failed')
          return route.fulfill({ json: { statusCode: 200, dataResponse: invoice, message: '' } })
        }
        unexpectedApi.push({ method: request.method(), pathname })
        return route.abort('blockedbyclient')
      })
      const input = page.getByLabel('Tiền khách đưa *', { exact: true })
      const button = page.getByRole('button', { name: 'Xác nhận thu', exact: true })
      const preview = page.locator('dl[aria-label="Đối chiếu thanh toán"]')
      const receipt = page.locator('dl[aria-label="Tiền mặt đã xác nhận"]')
      const reset = async (overrides = {}, mode = 'capture') => {
        invoice = freshInvoice(overrides); payloads = []; responseMode = mode
        await page.goto(base + '/reception/cashier/900001')
        await input.waitFor()
        await page.waitForLoadState('networkidle')
      }
      const capture = async () => {
        const failed = responseMode === 'network' || responseMode === 'lost-response'
        const refreshed = page.waitForResponse(r => r.request().method() === 'GET' && new URL(r.url()).pathname === '/api/invoices/900001')
        refreshed.catch(() => {})
        const response = failed
          ? page.waitForEvent('requestfailed', { predicate: request => new URL(request.url()).pathname.endsWith('/payments') })
          : page.waitForResponse(r => new URL(r.url()).pathname.endsWith('/payments'))
        await button.click()
        await response
        await refreshed
        await page.waitForLoadState('networkidle')
      }
      for (const entryMode of ['typing', 'text-insertion']) {
        for (const [inputText, received] of cases) {
          await reset()
          await input.click()
          if (entryMode === 'typing') await input.pressSequentially(inputText)
          else if (inputText) await page.keyboard.insertText(inputText)
          await page.keyboard.press('Tab')
          const allowed = received !== null && received >= 350000
          const expectedDisplay = received === null ? inputText : received.toLocaleString('vi-VN')
          check(await input.inputValue() === expectedDisplay, 'Grouping/invalid text preserved: ' + inputText)
          check(await button.isDisabled() === !allowed, 'Insufficient/invalid cash blocks confirmation: ' + inputText)
          if (allowed) {
            check((await preview.innerText()).includes(money(received - 350000)), 'Correct change preview: ' + inputText)
            await capture()
            check(payloads.length === 1 && payloads[0].amount === 350000, 'Only debt posted, never cash tender')
            check(payloads[0].cashReceived === received && /^[0-9a-f-]{36}$/i.test(payloads[0].idempotencyKey), 'Tender and retry key sent separately')
            check(await input.inputValue() === expectedDisplay, 'Error preserves tender for correction')
          } else {
            await button.evaluate(element => element.click())
            check(payloads.length === 0, 'No blocked input issues payment')
            if (inputText) check(await page.getByRole('alert').count() === 1, 'Specific inline validation shown')
          }
          results.push({ ...scenario, entryMode, inputText, received, display: await input.inputValue(),
            submittedAmount: payloads[0]?.amount ?? null, blocked: !allowed })
        }
      }
      console.log('PASS: 52 amount cases ' + scenario.locale)

      await reset({}, 'held')
      await input.fill('500000')
      await page.getByLabel('Mã giao dịch / ghi chú', { exact: true }).fill('Cash regression')
      gate = new Promise(resolve => { release = resolve })
      const response = page.waitForResponse(r => new URL(r.url()).pathname.endsWith('/payments'))
      response.catch(() => {}) // Report an assertion failure rather than an unhandled pending wait.
      const element = await button.elementHandle()
      await button.click()
      await page.waitForFunction(() => document.querySelector('form button[type="submit"]').disabled)
      check(await input.isDisabled() && await page.getByLabel('Hình thức', { exact: true }).isDisabled()
        && await page.getByLabel('Mã giao dịch / ghi chú', { exact: true }).isDisabled(), 'All payment fields lock while pending')
      await element.evaluate(e => e.click())
      release()
      await response
      await page.waitForLoadState('networkidle')
      check(payloads.length === 1 && payloads[0].amount === 350000 && payloads[0].note === 'Cash regression', 'Single full settlement request')
      check((await receipt.innerText()).includes('500.000 đ') && (await receipt.innerText()).includes('150.000 đ'), 'Tender and change retained after success')
      check(await button.count() === 0, 'Settled invoice removes collection action')
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.screenshot({ path: path.join(output, 'cash-success-' + scenario.width + '.png'), fullPage: true })
      await page.reload(); await page.waitForLoadState('networkidle')
      check(await button.count() === 0 && await page.getByRole('region', { name: 'Hóa đơn đã thanh toán', exact: true }).count() === 1, 'Read-only paid state survives reload')
      check((await receipt.innerText()).includes('150.000 đ') && (await page.getByRole('region', { name: 'Lịch sử thanh toán' }).innerText()).includes('Server cashier snapshot'), 'Confirmed change and collector restore from server after reload')
      results.push({ ...scenario, kind: 'busy-success-reload', submittedAmount: payloads[0].amount, change: 150000 })

      await reset({}, 'network')
      await input.fill('500.000')
      await capture()
      check(await input.inputValue() === '500.000' && await button.isEnabled(), 'Pre-server failure keeps tender after reconciliation')
      responseMode = 'success'
      await capture()
      check(invoice.paidAmount === 350000 && invoice.payments.length === 1, 'Retry settles only outstanding invoice')
      check(payloads.length === 2 && payloads[0].idempotencyKey === payloads[1].idempotencyKey, 'Unchanged retry reuses its original key')
      results.push({ ...scenario, kind: 'network-retry' })

      await reset({}, 'lost-response')
      await input.fill('500000')
      await capture()
      check(invoice.paidAmount === 350000 && await button.count() === 0, 'Mocked committed-but-lost response reconciles paid state')
      check((await receipt.innerText()).includes('150.000 đ'), 'Lost acknowledgement restores receipt from GET, never from local assumptions')
      check((await page.getByRole('status').innerText()).includes('Đã đối soát') && await page.getByRole('alert').count() === 0, 'Reconciled committed payment is not presented as a failed collection')
      results.push({ ...scenario, kind: 'mock-lost-response-not-real-backend-idempotency' })

      await reset({}, 'network')
      await input.fill('500000'); await capture()
      await page.getByLabel('Mã giao dịch / ghi chú', { exact: true }).fill('Updated payment')
      responseMode = 'success'; await capture()
      check(payloads[0].idempotencyKey !== payloads[1].idempotencyKey, 'Changed payment payload gets a new key')
      results.push({ ...scenario, kind: 'changed-payload-new-key' })

      await reset({ paidAmount: 150000, payments: [{ id: 1, amount: 150000, method: 0, paidAt: new Date().toISOString() }] }, 'success')
      await input.fill('500000')
      check((await preview.innerText()).includes('300.000 đ'), 'Legacy partial debt determines change')
      check((await page.getByRole('region', { name: 'Lịch sử thanh toán' }).innerText()).includes('Chưa ghi nhận tiền khách đưa'), 'Legacy cash tender remains unknown')
      await capture()
      check(payloads[0].amount === 200000 && invoice.paidAmount === 350000, 'Legacy partial invoice settled using remaining, not total')
      results.push({ ...scenario, kind: 'legacy-debt', submittedAmount: 200000, change: 300000 })

      await reset({ totalAmount: 350000.25, consultationFee: 350000.25 }, 'success')
      await input.fill('500000')
      check((await preview.innerText()).includes('149.999,75 đ'), 'Fractional legacy debt is not rounded away')
      await capture()
      check(payloads[0].amount === 350000.25, 'Legacy decimal amount kept exactly in payment request')
      results.push({ ...scenario, kind: 'legacy-fraction', submittedAmount: 350000.25 })

      await reset({ totalAmount: 0.3, paidAmount: 0.1, consultationFee: 0.3 }, 'success')
      await input.fill('1')
      check((await preview.innerText()).includes('0,8 đ'), 'Decimal subtraction shows correct change')
      await capture()
      check(payloads[0].amount === 0.2, 'Decimal subtraction does not post floating point tails')
      results.push({ ...scenario, kind: 'legacy-decimal-subtraction', submittedAmount: 0.2 })

      // Bank transfers now use automatic SePay confirmation; covered by sepay-payment.audit.cjs.
      for (const method of [1, 3]) {
        await reset({}, 'success')
        await page.getByLabel('Hình thức', { exact: true }).selectOption(String(method))
        check(await input.count() === 0 && !(await preview.innerText()).includes('Tiền thừa'), 'Non-cash has no tender or change')
        await capture()
        check(payloads[0].amount === 350000 && payloads[0].method === method && payloads[0].cashReceived === undefined && await receipt.count() === 0, 'Non-cash settles debt without fictitious change')
        results.push({ ...scenario, kind: 'non-cash', method })
      }
      for (const status of [1, 2]) {
        await reset({ status, paidAmount: status === 1 ? 350000 : 0 })
        check(status === 1 ? await input.count() === 0 && await button.count() === 0 : await input.isDisabled() && await button.isDisabled(), 'Paid/canceled invoice cannot receive cash')
        results.push({ ...scenario, kind: 'closed-invoice', status })
      }
      await reset()
      await input.fill('500000')
      await input.press('ArrowLeft')
      await input.press('Backspace')
      check(await input.inputValue() === '50000', 'Editing caret does not jump to end or discard digits')
      await input.press('Control+A'); await input.pressSequentially('500.000'); await input.press('Tab')
      check(await input.inputValue() === '500.000' && await button.isEnabled(), 'Replacement and grouping remain editable')
      check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No document overflow')
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.screenshot({ path: path.join(output, 'cash-preview-' + scenario.width + '.png'), fullPage: true })
      assert.deepEqual(jsErrors, []); assert.deepEqual(unexpectedApi, [])
      results.push({ ...scenario, kind: 'editing-and-layout', noJsErrors: true, noUnexpectedApi: true })
      console.log('PASS: cash/non-cash/retry/legacy/guards/layout ' + scenario.locale)
      await context.close()
    }
    console.log('PASS: ' + assertions + ' assertions across ' + results.length + ' cases. No requests forwarded to backend.')
  } finally {
    fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify({
      scope: 'Frontend regression, mocked API only; not actual payments, server idempotency, OS clipboard or mobile keyboard',
      browser: browser.version(), assertions, results,
    }, null, 2))
    await browser.close()
  }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
