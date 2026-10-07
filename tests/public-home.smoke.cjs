// Run against vite preview + local API. No database mutations.
// Install/cache Playwright separately; set PLAYWRIGHT_MODULE to its package path if needed.
const assert = require('node:assert/strict')
const path = require('node:path')
const fs = require('node:fs')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const base = process.env.FOMED_PREVIEW_URL || 'http://127.0.0.1:5184'
const screenshots = path.resolve(__dirname, '../dist/review')

async function main() {
  fs.mkdirSync(screenshots, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  const assertNoOverflow = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Horizontal overflow')
  try {
    const doctorsResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/api/doctors' && response.ok())
    const specialtiesResponse = page.waitForResponse(response => new URL(response.url()).pathname === '/api/specialties' && response.ok())
    await page.goto(base)
    await page.locator('#doctors article').first().waitFor()
    assert.equal(await page.locator('#doctors article').count(), (await (await doctorsResponse).json()).dataResponse.length)
    assert.equal(await page.locator('#specialties a[href*="specialtyId="]').count(), (await (await specialtiesResponse).json()).dataResponse.length)
    assert.equal(await page.locator('#services article').count(), 6)
    await page.locator('#doctors').scrollIntoViewIfNeeded()
    await page.waitForFunction(() => Array.from(document.querySelectorAll('#doctors img')).every((img) => img.complete))
    await page.evaluate(() => window.scrollTo(0, 0))
    await assertNoOverflow()
    await page.screenshot({ path: path.join(screenshots, 'home-desktop.png'), fullPage: true })
    const faq = page.locator('#faq details').nth(1)
    await faq.locator('summary').click()
    assert.equal(await faq.getAttribute('open'), '')
    await page.locator('#services').getByRole('link', { name: 'Xem tất cả dịch vụ' }).click()
    await page.getByRole('heading', { name: 'Dịch vụ tại FoMed', exact: true }).waitFor()
    await page.locator('main article').first().waitFor()
    assert.equal(await page.getByRole('button', { name: 'Trang sau' }).isDisabled(), true, 'Last page should not allow an empty next page')
    await page.getByRole('searchbox').fill('no-matching-demo-service')
    await page.getByRole('button', { name: 'Tìm kiếm', exact: true }).click()
    await page.getByRole('heading', { name: 'Không tìm thấy dịch vụ trong trang này' }).waitFor()
    await page.getByRole('button', { name: 'Xóa tìm kiếm' }).click()
    assert.ok(await page.locator('main article').count() > 0)
    await assertNoOverflow()
    await page.screenshot({ path: path.join(screenshots, 'services-desktop.png'), fullPage: true })

    for (const width of [320, 390, 768, 1024]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(base)
      await page.locator('#doctors article').first().waitFor()
      await assertNoOverflow()
      if (width < 1024) {
        await page.getByRole('button', { name: 'Mở menu', exact: true }).click()
        await page.locator('#public-mobile-menu').getByRole('button', { name: 'Đặt khám theo', exact: true }).click()
        await page.locator('#public-mobile-menu').getByRole('link', { name: 'Dịch vụ', exact: true }).click()
        await page.locator('main article').first().waitFor()
        assert.equal(await page.locator('#public-mobile-menu').isVisible(), false)
        await assertNoOverflow()
        await page.screenshot({ path: path.join(screenshots, 'services-' + width + '.png'), fullPage: true })
        await page.goto(base)
        await page.locator('#doctors article').first().waitFor()
      }
      await page.screenshot({ path: path.join(screenshots, 'home-' + width + '.png'), fullPage: true })
    }

    await page.setViewportSize({ width: 1440, height: 1000 })
    await page.goto(base)
    await page.getByRole('searchbox').fill('Hoa')
    await page.getByRole('button', { name: 'Tìm bác sĩ', exact: true }).click()
    await page.locator('main article').first().waitFor()
    assert.ok(page.url().includes('search=Hoa'))
    await assertNoOverflow()

    const fixtureServices = Array.from({ length: 21 }, (_, index) => ({ id: index + 1, name: 'Dịch vụ kiểm thử ' + (index + 1), price: 100000 }))
    await page.route('**/api/services?*', (route) => {
      const current = Number(new URL(route.request().url()).searchParams.get('page'))
      return route.fulfill({ json: { dataResponse: fixtureServices.slice((current - 1) * 20, current * 20), statusCode: 200, message: 'Test' } })
    })
    await page.goto(base + '/services')
    await page.locator('main article').first().waitFor()
    assert.equal(await page.locator('main article').count(), 20)
    await page.getByRole('button', { name: 'Trang sau', exact: true }).click()
    await page.getByRole('heading', { name: 'Dịch vụ kiểm thử 21', exact: true }).waitFor()
    assert.equal(await page.locator('main article').count(), 1)
    assert.equal(await page.getByRole('button', { name: 'Trang sau', exact: true }).isDisabled(), true)
    await page.unroute('**/api/services?*')

    // Controlled empty/error fixtures affect only browser responses, not the database.
    await page.route('**/api/services?*', (route) => route.fulfill({ json: { dataResponse: [], statusCode: 200, message: 'Test' } }))
    await page.goto(base + '/services')
    await page.getByRole('heading', { name: 'Trang này chưa có dịch vụ' }).waitFor()
    await page.unroute('**/api/services?*')
    await page.route('**/api/services?*', (route) => route.fulfill({ status: 503, json: { message: 'Không thể tải dữ liệu kiểm thử.' } }))
    await page.goto(base + '/services')
    await page.getByRole('alert').waitFor()
    await page.unroute('**/api/services?*')
    await page.getByRole('button', { name: 'Tải lại', exact: true }).click()
    await page.locator('main article').first().waitFor()
    assert.deepEqual(errors, [])
    console.log('Public UI smoke passed: real API catalogs, navigation, FAQ, service search/empty/error/retry, responsive 320/390/768/1024/1440. Screenshots: dist/review')
  } finally { await browser.close() }
}

main().catch((error) => { console.error(error); process.exitCode = 1 })
