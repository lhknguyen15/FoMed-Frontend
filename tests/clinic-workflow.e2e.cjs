// Full cross-role journeys. Run only through the disposable SQL/HTTP audit runner.
// Catalog/identities are seeded; all clinical and billing writes must come from UI controls.
const fs = require('node:fs')
const path = require('node:path')
const base = process.env.FOMED_PREVIEW_URL || 'http://127.0.0.1:5184'
const output = path.resolve(__dirname, '../dist/review-clinic')

exports.run = async (browser, fixture) => {
  if (!fixture.doctorId || fixture.patients?.length !== 2) throw new Error('Isolated journey fixture required')
  const results = []
  const contexts = []
  let activePage
  const check = (ok, label, evidence) => {
    results.push({ passed: !!ok, label, evidence })
    console.log(`${ok ? 'PASS' : 'FAIL'}: E2E ${label}`)
    if (!ok) throw new Error(label)
  }
  const responseFor = (page, method, pathname) => page.waitForResponse(response => new URL(response.url()).pathname === pathname && response.request().method() === method)
  const mutate = async (page, method, pathname, action, expected, label) => {
    const pending = responseFor(page, method, pathname)
    await action()
    const response = await pending
    const body = await response.json()
    check(response.status() === expected, label, { status: response.status() })
    await page.waitForLoadState('networkidle')
    return body.dataResponse ?? body
  }
  const snapshot = async (page, name, width) => {
    activePage = page
    await page.waitForLoadState('networkidle')
    await page.evaluate(() => window.scrollTo(0, 0))
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name} ${width}: no document overflow`)
    await page.screenshot({ path: path.join(output, `journey-${name}-${width}.png`), fullPage: true })
  }
  const busyMutation = async (page, method, pathname, button, expected, label, pendingChecks, loseAcknowledgement = false) => {
    let release
    const gate = new Promise(resolve => { release = resolve })
    let arrived
    const arrival = new Promise(resolve => { arrived = resolve })
    let requests = 0
    let committed
    const route = async request => {
      if (request.request().method() !== method) return request.continue()
      requests++; arrived()
      await gate
      if (loseAcknowledgement) {
        const response = await request.fetch()
        committed = { status: response.status(), body: await response.json() }
        return request.abort('failed') // Real API has committed; only browser acknowledgement is lost.
      }
      await request.continue()
    }
    await page.route('**' + pathname, route)
    try {
      const refreshed = loseAcknowledgement ? responseFor(page, 'GET', pathname.replace(/\/payments$/, '')) : null
      refreshed?.catch(() => {})
      const response = loseAcknowledgement
        ? page.waitForEvent('requestfailed', { predicate: request => request.method() === method && new URL(request.url()).pathname === pathname })
        : responseFor(page, method, pathname)
      response.catch(() => {}) // Preserve the actual assertion error if a pending check fails.
      const element = await button.elementHandle()
      await button.click()
      await arrival
      check(await element.isDisabled(), label + ': action disabled while pending')
      if (pendingChecks) await pendingChecks()
      // A second native click on a disabled button must not dispatch another request.
      await element.evaluate(buttonElement => buttonElement.click())
      release()
      const received = await response
      const body = loseAcknowledgement ? committed.body : await received.json()
      const status = loseAcknowledgement ? committed.status : received.status()
      check(status === expected && requests === 1, label + ': exactly one successful server request', { status, requests })
      if (refreshed) await refreshed
      await page.waitForLoadState('networkidle')
      return body.dataResponse ?? body
    } finally { release(); await page.unroute('**' + pathname, route) }
  }
  try {
    for (const [index, patient] of fixture.patients.entries()) {
      const width = patient.width
      const variant = width === 1440 ? 'desktop' : 'mobile'
      const diagnosis = 'Journey diagnosis ' + variant
      const summary = 'Journey result ' + variant
      const pages = {}
      const jsErrors = []
      const serverErrors = []
      for (const [role, username] of Object.entries({ patient: patient.username, receptionist: 'receptionist', doctor: 'journey-doctor', technician: 'technician', pharmacist: 'pharmacist', admin: 'admin' })) {
        const context = await browser.newContext({ viewport: { width, height: 950 }, timezoneId: 'Asia/Ho_Chi_Minh' })
        contexts.push(context)
        const page = await context.newPage()
        pages[role] = page
        activePage = page
        page.setDefaultTimeout(12000)
        page.on('pageerror', error => jsErrors.push({ role, message: error.message }))
        page.on('response', response => { if (response.url().includes('/api/') && response.status() >= 500) serverErrors.push({ role, path: new URL(response.url()).pathname, status: response.status() }) })
        await page.goto(base + '/login')
        await page.getByPlaceholder('Nhập tên đăng nhập', { exact: true }).fill(username)
        await page.getByPlaceholder('Nhập mật khẩu', { exact: true }).fill('Audit-Only!2026')
        await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
        await page.waitForURL(url => !url.pathname.includes('/login'))
      }

      const p = pages.patient
      activePage = p
      await p.goto(base + '/booking')
      await p.getByLabel(/^Bác sĩ/).selectOption(String(fixture.doctorId))
      await p.waitForLoadState('networkidle')
      const slots = p.getByRole('button', { name: /^\d{2}:\d{2}/ })
      check(await slots.count() >= 2, variant + ': future working slots available')
      await slots.nth(Math.min(3, await slots.count() - 1)).click()
      await p.getByPlaceholder('Ví dụ: đau ngực, khó thở khi gắng sức...').fill('Journey reason ' + variant)
      const bookButton = p.getByRole('button', { name: 'Xác nhận đặt lịch', exact: true })
      await p.route('**/api/appointments/book', route => route.abort('failed'))
      await bookButton.click()
      await p.getByRole('alert').waitFor()
      check(await p.getByPlaceholder('Ví dụ: đau ngực, khó thở khi gắng sức...').inputValue() === 'Journey reason ' + variant, variant + ': booking network error preserves reason')
      await p.unroute('**/api/appointments/book')
      await p.waitForLoadState('networkidle')
      const appointment = await busyMutation(p, 'POST', '/api/appointments/book', bookButton, 201, variant + ': patient books')
      await p.getByRole('status').filter({ hasText: 'Đã gửi yêu cầu đặt lịch' }).waitFor()
      check(appointment.status === 0 && await bookButton.isDisabled(), variant + ': new booking is pending and selection cleared')
      await p.getByRole('button', { name: 'Xem lịch hẹn của tôi', exact: true }).click()
      await p.getByText(appointment.appointmentCode, { exact: false }).waitFor()
      await p.getByText('Chờ xác nhận', { exact: true }).waitFor()
      await snapshot(p, 'patient-pending', width)

      const reception = pages.receptionist
      activePage = reception
      await reception.goto(base + '/reception')
      await reception.getByLabel(/^Bác sĩ/).selectOption(String(fixture.doctorId))
      const receptionRow = reception.locator('tbody tr').filter({ hasText: patient.patientName })
      await receptionRow.getByRole('button', { name: 'Xác nhận', exact: true }).click()
      await mutate(reception, 'PUT', `/api/appointments/${appointment.id}/confirm`, () => reception.getByRole('dialog').getByRole('button', { name: 'Xác nhận lịch', exact: true }).click(), 200, variant + ': receptionist confirms')
      await receptionRow.getByRole('button', { name: 'Check-in', exact: true }).waitFor()
      await busyMutation(reception, 'PUT', `/api/appointments/${appointment.id}/check-in`, receptionRow.getByRole('button', { name: 'Check-in', exact: true }), 200, variant + ': receptionist checks in')
      await receptionRow.getByText('Đã check-in', { exact: true }).waitFor()
      await receptionRow.getByRole('button', { name: 'Hàng chờ', exact: true }).click()
      await reception.getByLabel(/^Bác sĩ/).selectOption(String(fixture.doctorId))
      await reception.locator('tbody tr').filter({ hasText: patient.patientName }).waitFor()
      await snapshot(reception, 'reception-queue', width)
      await p.reload()
      await p.getByText('Đã xác nhận', { exact: true }).waitFor()
      check(true, variant + ': patient sees confirmation after reload')

      const doctor = pages.doctor
      activePage = doctor
      await doctor.goto(base + '/doctor/queue')
      await doctor.getByRole('heading', { name: patient.patientName, exact: true }).waitFor()
      await doctor.getByText('Dị ứng: Workflow allergen', { exact: true }).waitFor()
      const record = await mutate(doctor, 'POST', `/api/clinical/appointments/${appointment.id}/record`, () => doctor.getByRole('button', { name: 'Bắt đầu khám', exact: true }).click(), 201, variant + ': doctor starts checked-in patient')
      await doctor.waitForURL(`**/doctor/exam/${record.id}`)
      await doctor.getByPlaceholder('Mô tả triệu chứng chính...').fill('Journey symptom ' + variant)
      await doctor.getByPlaceholder('Nhập chẩn đoán để có thể chốt lượt khám...').fill(diagnosis)
      await doctor.getByPlaceholder('Ví dụ: J06.9').fill('J06.9')
      await doctor.getByPlaceholder('Thuốc, theo dõi và dặn dò...').fill('Journey treatment ' + variant)
      await doctor.getByPlaceholder('Tâm thu', { exact: true }).fill('120')
      await doctor.getByPlaceholder('Tâm trương', { exact: true }).fill('80')
      await doctor.getByPlaceholder('Nhịp/phút', { exact: true }).fill('72')
      await busyMutation(doctor, 'PUT', `/api/clinical/records/${record.id}`, doctor.getByRole('button', { name: 'Lưu bệnh án', exact: true }), 200, variant + ': clinical note and vitals saved', async () => {
        check(await doctor.getByRole('button', { name: 'Hoàn tất khám', exact: true }).isDisabled() && await doctor.getByPlaceholder('Nhập chẩn đoán để có thể chốt lượt khám...').isDisabled(), variant + ': saving blocks concurrent finalization and editing')
      })
      await doctor.reload()
      await doctor.waitForLoadState('networkidle')
      check(await doctor.getByPlaceholder('Nhập chẩn đoán để có thể chốt lượt khám...').inputValue() === diagnosis && await doctor.getByPlaceholder('Tâm thu', { exact: true }).inputValue() === '120', variant + ': clinical note/vitals survive reload')
      const followUp = doctor.getByLabel('Ngày tái khám', { exact: true })
      await followUp.fill('2040-01-15')
      const scheduled = await mutate(doctor, 'PUT', `/api/clinical/records/${record.id}`, () => doctor.getByRole('button', { name: 'Lưu bệnh án', exact: true }).click(), 200, variant + ': follow-up date saved')
      check(scheduled.followUpDate === '2040-01-15', variant + ': API preserves selected follow-up date')
      await followUp.fill('')
      const cleared = await mutate(doctor, 'PUT', `/api/clinical/records/${record.id}`, () => doctor.getByRole('button', { name: 'Lưu bệnh án', exact: true }).click(), 200, variant + ': follow-up date cleared')
      check(cleared.followUpDate === null, variant + ': API receives null when date input is cleared')
      await snapshot(doctor, 'doctor-exam', width)
      await doctor.getByRole('link', { name: 'Chỉ định cận lâm sàng', exact: true }).click()
      await doctor.getByLabel(/^Dịch vụ/).selectOption(String(fixture.serviceId))
      await doctor.getByLabel('Số lượng', { exact: true }).fill('0')
      await doctor.getByRole('button', { name: 'Thêm chỉ định', exact: true }).click()
      await doctor.getByRole('alert').filter({ hasText: 'Số lượng chỉ định phải là số nguyên từ 1 đến 1000.' }).waitFor()
      check(await doctor.locator('tbody tr').count() === 0, variant + ': invalid service quantity is not silently converted to one')
      await doctor.getByLabel('Số lượng', { exact: true }).fill('1')
      const order = await mutate(doctor, 'POST', `/api/clinical/records/${record.id}/services`, () => doctor.getByRole('button', { name: 'Thêm chỉ định', exact: true }).click(), 201, variant + ': doctor orders service')
      await doctor.getByLabel(/^Dịch vụ/).selectOption(String(fixture.cancelServiceId))
      const canceled = await mutate(doctor, 'POST', `/api/clinical/records/${record.id}/services`, () => doctor.getByRole('button', { name: 'Thêm chỉ định', exact: true }).click(), 201, variant + ': second order for cancellation')
      await doctor.locator('tbody tr').filter({ hasText: `Chỉ định #${canceled.id}` }).getByRole('button', { name: 'Hủy chỉ định', exact: true }).click()
      await mutate(doctor, 'PUT', `/api/clinical/orders/${canceled.id}/cancel`, () => doctor.getByRole('dialog').getByRole('button', { name: 'Xác nhận hủy', exact: true }).click(), 200, variant + ': ordered service canceled')
      const doctorFiles = doctor.getByRole('region', { name: 'File đính kèm', exact: true })
      const pdf = Buffer.from('%PDF-1.4\nJourney ' + variant + '\n%%EOF')
      await doctorFiles.getByLabel('Chọn file đính kèm', { exact: true }).setInputFiles({ name: 'journey-' + variant + '.pdf', mimeType: 'application/pdf', buffer: pdf })
      await mutate(doctor, 'POST', `/api/clinical/records/${record.id}/attachments`, () => doctorFiles.getByRole('button', { name: 'Đính kèm file', exact: true }).click(), 201, variant + ': doctor attaches private PDF')
      await doctor.getByRole('button', { name: 'Về bệnh án', exact: true }).click()
      await mutate(doctor, 'PUT', `/api/appointments/${appointment.id}/complete`, () => doctor.getByRole('button', { name: 'Hoàn tất khám', exact: true }).click(), 409, variant + ': pending result blocks finalization')
      await doctor.getByRole('alert').waitFor()
      check(await doctor.getByPlaceholder('Nhập chẩn đoán để có thể chốt lượt khám...').isEnabled(), variant + ': rejected finalization keeps draft editable')

      const tech = pages.technician
      activePage = tech
      await tech.goto(base + '/technician/orders')
      await tech.locator('tbody tr').filter({ hasText: `#${record.id}` }).getByRole('button', { name: 'Nhập kết quả', exact: true }).click()
      await tech.getByPlaceholder('Nhập kết quả đo/xét nghiệm...').fill(summary)
      await tech.getByPlaceholder('Nhận định chuyên môn...').fill('Within reference range')
      await tech.getByPlaceholder('Ví dụ: 12–16 g/dL').fill('12–16 g/dL')
      await mutate(tech, 'POST', `/api/clinical/lab-orders/${order.id}/result`, () => tech.getByRole('button', { name: 'Lưu kết quả', exact: true }).click(), 201, variant + ': technician saves result')
      await tech.getByRole('main').getByRole('link', { name: 'Lịch sử kết quả', exact: true }).click()
      await tech.locator('tbody tr').filter({ hasText: summary }).getByRole('button', { name: 'File kết quả', exact: true }).click()
      const techFiles = tech.getByRole('region', { name: 'File đính kèm', exact: true })
      const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4u0AAAAASUVORK5CYII=', 'base64')
      await techFiles.getByLabel('Chọn file đính kèm', { exact: true }).setInputFiles({ name: 'journey-' + variant + '.png', mimeType: 'image/png', buffer: png })
      await mutate(tech, 'POST', `/api/clinical/records/${record.id}/attachments`, () => techFiles.getByRole('button', { name: 'Đính kèm file', exact: true }).click(), 201, variant + ': technician attaches result image')
      await snapshot(tech, 'technician-result', width)

      activePage = doctor
      await doctor.goto(base + `/doctor/exam/${record.id}/services`)
      const completedRow = doctor.locator('tbody tr').filter({ hasText: `Chỉ định #${order.id}` })
      await completedRow.getByText(summary, { exact: true }).waitFor()
      check(await completedRow.getByRole('button', { name: 'Hủy chỉ định', exact: true }).count() === 0, variant + ': completed result cannot be canceled')
      await doctor.getByRole('button', { name: 'Về bệnh án', exact: true }).click()
      await doctor.getByRole('link', { name: 'Kê đơn thuốc', exact: true }).click()
      await doctor.getByPlaceholder('Nhập tên thuốc...', { exact: true }).fill('Workflow medicine')
      await doctor.getByRole('button', { name: 'Tìm thuốc', exact: true }).click()
      await doctor.getByRole('button', { name: 'Thêm thuốc Workflow medicine', exact: true }).click()
      await doctor.getByLabel('Số lượng', { exact: true }).fill('2')
      await doctor.getByLabel('Liều dùng', { exact: true }).fill('1 tablet twice daily')
      await doctor.getByLabel('Hướng dẫn', { exact: true }).fill('After meals')
      await doctor.getByLabel('Đã kiểm tra dị ứng thuốc', { exact: false }).check()
      const rx = await mutate(doctor, 'POST', `/api/clinical/records/${record.id}/prescription`, () => doctor.getByRole('button', { name: 'Lưu đơn thuốc', exact: true }).click(), 201, variant + ': doctor saves prescription after allergy acknowledgement')
      await doctor.getByRole('button', { name: 'Về bệnh án', exact: true }).click()
      await mutate(doctor, 'PUT', `/api/appointments/${appointment.id}/complete`, () => doctor.getByRole('button', { name: 'Hoàn tất khám', exact: true }).click(), 200, variant + ': doctor finalizes after completed results')
      await doctor.getByText('Bệnh án đã được chốt, chỉ có thể xem lại thông tin.', { exact: true }).waitFor()
      check(await doctor.getByRole('button', { name: 'Lưu bệnh án', exact: true }).isDisabled() && await doctor.getByRole('button', { name: 'Hoàn tất khám', exact: true }).isDisabled(), variant + ': finalized record is read-only')

      activePage = reception
      await reception.goto(base + '/reception/cashier')
      await reception.getByRole('button', { name: 'Chờ lập hóa đơn', exact: true }).click()
      const candidateRow = reception.locator('tbody tr').filter({ hasText: patient.patientName })
      await candidateRow.getByRole('button', { name: 'Lập hóa đơn', exact: true }).click()
      await snapshot(reception, 'create-invoice', width)
      const invoiceReady = reception.waitForResponse(response => response.request().method() === 'GET' && /^\/api\/invoices\/\d+$/.test(new URL(response.url()).pathname), { timeout: 30000 })
      invoiceReady.catch(() => {})
      const invoice = await busyMutation(reception, 'POST', '/api/invoices', reception.getByRole('dialog').getByRole('button', { name: 'Xác nhận lập hóa đơn', exact: true }), 201, variant + ': receptionist creates invoice')
      await reception.waitForURL(`**/reception/cashier/${invoice.id}`)
      check((await invoiceReady).status() === 200, variant + ': created invoice detail loads from API')
      await reception.waitForLoadState('networkidle')
      await reception.getByText('Đã lập hóa đơn thành công.', { exact: true }).waitFor()
      check(invoice.totalAmount === 420 && invoice.consultationFee === 300 && invoice.items.length === 2, variant + ': invoice bills fee + completed lab + medication only')
      const amount = reception.getByLabel('Tiền khách đưa *', { exact: true })
      const pay = reception.getByRole('button', { name: 'Xác nhận thu', exact: true })
      await amount.fill('419')
      await reception.getByRole('alert').waitFor()
      check(await pay.isDisabled() && await amount.inputValue() === '419', variant + ': insufficient cash cannot create a partial payment')
      await amount.fill('500')
      check((await reception.locator('dl[aria-label="Đối chiếu thanh toán"]').innerText()).includes('80 đ'), variant + ': cash tender preview shows exact change')
      await reception.route(`**/api/invoices/${invoice.id}/payments`, route => route.abort('failed'))
      await pay.click()
      await reception.getByRole('alert').waitFor()
      await reception.waitForLoadState('networkidle')
      check(await amount.inputValue() === '500', variant + ': failed payment preserves cash tender')
      await reception.unroute(`**/api/invoices/${invoice.id}/payments`)

      const admin = pages.admin
      activePage = admin
      await admin.goto(base + '/admin/reports')
      await admin.getByLabel(/^Bác sĩ/).selectOption(String(fixture.doctorId))
      const readReport = async () => {
        const pending = admin.waitForResponse(response => new URL(response.url()).pathname === '/api/reports/summary' && new URL(response.url()).searchParams.get('doctorId') === String(fixture.doctorId))
        await admin.getByRole('button', { name: 'Lọc báo cáo', exact: true }).click()
        const response = await pending
        const body = await response.json()
        await admin.waitForLoadState('networkidle')
        return body.dataResponse ?? body
      }
      const debtReport = await readReport()
      check(debtReport.collectedAmount === index * 420 && debtReport.outstandingAmount === 420, variant + ': unpaid invoice is debt, not collected cash')
      activePage = reception
      const settled = await busyMutation(reception, 'POST', `/api/invoices/${invoice.id}/payments`, pay, 200, variant + ': cash settlement', async () => {
        check(await amount.isDisabled() && await reception.getByLabel('Hình thức', { exact: true }).isDisabled(), variant + ': cash form locks while payment is pending')
      }, width === 1440)
      if (width === 1440) check((await reception.getByRole('status').innerText()).includes('Đã đối soát') && await pay.isDisabled(), variant + ': lost acknowledgement reconciles real committed payment without collecting again')
      check(settled.paidAmount === 420 && settled.status === 1 && settled.payments.length === 1 && await pay.isDisabled(), variant + ': only invoice debt is collected, not the 500 cash tender')
      check((await reception.locator('dl[aria-label="Tiền mặt đã xác nhận"]').innerText()).includes('80 đ'), variant + ': successful settlement retains change to return')
      check(settled.payments[0].cashReceived === 500 && settled.payments[0].changeAmount === 80 && settled.payments[0].receivedByName === 'Audit receptionist' && !!settled.payments[0].idempotencyKey, variant + ': server confirms cash metadata and authenticated collector')
      await reception.reload()
      await reception.locator('dl[aria-label="Tiền mặt đã xác nhận"]').waitFor()
      check(await reception.locator('dl[aria-label="Tiền mặt đã xác nhận"]').getByText('80 đ', { exact: true }).count() === 1 && await pay.isDisabled(), variant + ': change history and payment lock survive reload')
      await snapshot(reception, 'cashier-settled', width)
      activePage = admin
      const settledReport = await readReport()
      check(settledReport.collectedAmount === (index + 1) * 420 && settledReport.outstandingAmount === 0, variant + ': same report filters refresh after settlement')
      await snapshot(admin, 'admin-report', width)
      const csvPromise = admin.waitForEvent('download')
      await admin.getByRole('button', { name: 'Xuất CSV', exact: true }).click()
      const csv = await csvPromise
      check(await csv.failure() === null && fs.readFileSync(await csv.path(), 'utf8').includes('Journey doctor'), variant + ': report CSV downloads actual doctor data')

      const pharmacist = pages.pharmacist
      activePage = pharmacist
      await pharmacist.goto(base + '/pharmacy/dispense')
      await pharmacist.getByPlaceholder('Tìm tên bệnh nhân, mã BN hoặc mã đơn...', { exact: true }).fill(String(rx.id))
      const filteredPrescription = pharmacist.waitForResponse(response => {
        const url = new URL(response.url())
        return response.request().method() === 'GET' && url.pathname === '/api/pharmacy/prescriptions' && url.searchParams.get('keyword') === String(rx.id)
      })
      await pharmacist.getByRole('button', { name: 'Lọc đơn', exact: true }).click()
      check((await filteredPrescription).status() === 200, variant + ': pharmacy filter returns the selected prescription')
      await pharmacist.waitForLoadState('networkidle')
      await pharmacist.locator(`a[href="/pharmacy/dispense/${rx.id}"]`).click()
      await pharmacist.getByText('Sẵn sàng cấp phát', { exact: true }).waitFor()
      await snapshot(pharmacist, 'pharmacy-fefo', width)
      const dispensed = await busyMutation(pharmacist, 'POST', `/api/pharmacy/prescriptions/${rx.id}/dispense`, pharmacist.getByRole('button', { name: 'Xác nhận phát thuốc', exact: true }), 200, variant + ': pharmacist dispenses')
      check(!dispensed.alreadyDispensed && dispensed.lines.reduce((sum, line) => sum + line.quantity, 0) === 2 && (index > 0 || dispensed.lines.length === 2 && dispensed.lines[0].lotNumber === 'JOURNEY-EARLY'), variant + ': FEFO allocation matches prescription')
      await pharmacist.reload()
      await pharmacist.getByText('Đã phát đủ', { exact: true }).first().waitFor()
      check(await pharmacist.getByRole('button', { name: 'Xác nhận phát thuốc', exact: true }).isDisabled(), variant + ': dispensing lock survives reload')

      activePage = p
      await p.goto(base + '/my-appointments')
      await p.getByRole('button', { name: 'Đã khám', exact: true }).click()
      await p.getByRole('button', { name: 'Xem bệnh án', exact: true }).click()
      const modal = p.getByRole('dialog')
      await modal.getByText(diagnosis, { exact: true }).waitFor()
      await modal.getByText('Workflow medicine', { exact: true }).waitFor()
      await modal.getByText(summary, { exact: true }).waitFor()
      check(await modal.locator('table').count() === 3, variant + ': patient sees final note, medication and result tables')
      check(await modal.getByText('Đã hủy', { exact: true }).count() === 1, variant + ': canceled service is not presented as a pending result')
      await modal.getByRole('button', { name: 'Tải file đính kèm', exact: true }).click()
      const patientFiles = modal.getByRole('region', { name: 'File đính kèm', exact: true })
      for (const [extension, expectedBytes] of [['pdf', pdf], ['png', png]]) {
        const name = 'journey-' + variant + '.' + extension
        const downloading = p.waitForEvent('download')
        await patientFiles.getByRole('button', { name: 'Tải file ' + name, exact: true }).click()
        const download = await downloading
        check(download.suggestedFilename() === name && await download.failure() === null && fs.readFileSync(await download.path()).equals(expectedBytes), variant + ': patient downloads exact ' + extension + ' bytes through protected API')
      }
      await snapshot(p, 'patient-record', width)
      await p.goto(base + '/my-invoices')
      await p.getByRole('button', { name: 'Xem chi tiết', exact: true }).click()
      await p.getByRole('dialog').getByText('Lịch sử thanh toán', { exact: true }).waitFor()
      const paymentHistory = p.getByRole('dialog').getByRole('region', { name: 'Lịch sử thanh toán', exact: true })
      check(await paymentHistory.getByText('420 đ', { exact: true }).count() === 2 && await paymentHistory.getByText('500 đ', { exact: true }).count() === 1 && await paymentHistory.getByText('80 đ', { exact: true }).count() === 1, variant + ': patient history distinguishes net collection, cash tender and returned change')
      await snapshot(p, 'patient-invoice', width)
      await p.goto(base + '/admin/reports')
      await p.waitForURL('**/forbidden')
      check(true, variant + ': patient cannot access admin reports')
      activePage = admin
      await admin.goto(base + '/admin/audit-logs')
      await admin.getByLabel('Loại ghi nhận', { exact: true }).selectOption('Finalize')
      await admin.getByLabel('Mã người thực hiện', { exact: true }).fill(String(fixture.doctorUserId))
      const filteredAudit = admin.waitForResponse(response => {
        const url = new URL(response.url())
        return url.pathname === '/api/audit-logs' && url.searchParams.get('action') === 'Finalize' && url.searchParams.get('userId') === String(fixture.doctorUserId)
      })
      await admin.getByRole('button', { name: 'Lọc nhật ký', exact: true }).click()
      const auditResponse = await filteredAudit
      check(auditResponse.status() === 200, variant + ': filtered finalization audit loads successfully')
      await admin.waitForLoadState('networkidle')
      const auditRows = admin.locator('tbody tr').filter({ has: admin.getByRole('cell', { name: `#${record.id}`, exact: true }) })
      await auditRows.waitFor()
      check(await auditRows.count() === 1 && (await auditRows.innerText()).includes('Journey doctor'), variant + ': audit row belongs to exact record and doctor')
      check(!(await admin.locator('tbody').innerText()).includes(diagnosis), variant + ': admin audit records finalization without disclosing diagnosis')
      await snapshot(admin, 'admin-audit', width)
      check(jsErrors.length === 0, variant + ': no uncaught JS errors', jsErrors)
      check(serverErrors.length === 0, variant + ': no API 5xx', serverErrors)
      for (const context of contexts.splice(0)) await context.close()
    }
  } catch (error) {
    results.push({ passed: false, label: 'Journey interrupted', evidence: { message: error.message, route: activePage ? new URL(activePage.url()).pathname : '' } })
    if (activePage) await activePage.screenshot({ path: path.join(output, 'journey-failure.png'), fullPage: true }).catch(() => {})
    throw error
  } finally {
    for (const context of contexts) await context.close()
    fs.writeFileSync(path.join(output, 'journey-audit.json'), JSON.stringify(results, null, 2))
  }
}
