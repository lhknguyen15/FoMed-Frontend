const test = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const Module = require('node:module')
const fs = require('node:fs')
const { JSDOM } = require('jsdom')
const { buildSync } = require('esbuild')

const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/health-news' })
global.window = dom.window
global.document = dom.window.document
global.Node = dom.window.Node
global.Element = dom.window.Element
global.HTMLElement = dom.window.HTMLElement
global.IS_REACT_ACT_ENVIRONMENT = true
window.scrollTo = () => {}
const React = require('react')
const { act } = React
const { createRoot } = require('react-dom/client')
const { MemoryRouter } = require('react-router-dom')
const rootDirectory = path.resolve(__dirname, '..')
const file = path.join(rootDirectory, 'src/workspaces/public/pages/HealthNewsPage.tsx')
const result = buildSync({ entryPoints: [file], bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', jsx: 'automatic', loader: { '.css': 'empty', '.png': 'dataurl' } })
const loaded = new Module(file, module)
loaded.filename = file
loaded.paths = Module._nodeModulePaths(rootDirectory)
loaded._compile(result.outputFiles[0].text, file)
const Page = loaded.exports.default
const articles = Array.from({ length: 24 }, (_, index) => ({ id: `news-${index}`, origin: 'external', title: index === 0 ? 'ĐI BỘ và sức khỏe' : `Bài viết thử nghiệm ${index}`, excerpt: 'Thông tin minh họa trong kiểm thử tự động.', sourceName: 'VnExpress', sourceUrl: `https://vnexpress.net/bai-${index}.html`, category: index % 2 === 0 ? 'wellness' : 'nutrition', publishedAt: new Date(Date.UTC(2026, 9, 22 - index)).toISOString() }))
const payload = { articles, source: { name: 'VnExpress', url: 'https://vnexpress.net/suc-khoe' }, fetchedAt: '2026-10-22T08:00:00.000Z', stale: false }
const originalFetch = global.fetch
let root
const count = selector => document.querySelectorAll(selector).length
const button = text => [...document.querySelectorAll('button')].find(element => element.textContent.trim() === text)
const click = async element => { assert.ok(element); await act(async () => element.click()) }
const mount = async fetcher => {
  global.fetch = fetcher || (async () => new Response(JSON.stringify(payload)))
  root = createRoot(document.getElementById('root'))
  await act(async () => root.render(React.createElement(MemoryRouter, { initialEntries: ['/health-news'] }, React.createElement(Page))))
}
const cleanup = async () => {
  if (root) await act(async () => root.unmount())
  root = null
  global.fetch = originalFetch
}
test.afterEach(cleanup)

test('Shows one latest article, nine other cards, without duplicating articles', async () => {
  await mount()
  assert.equal(count('.news-featured'), 1)
  assert.equal(count('.news-card'), 9)
  assert.ok(document.querySelector('.news-featured h3').textContent.includes(articles[0].title))
  assert.equal(document.querySelector('h1').textContent, 'Hiểu thêm.Chăm sóc tốt hơn.')
})

test('Text-led articles avoid repeated placeholder covers and keep source links', async () => {
  await mount()
  assert.equal(count('.news-cover'), 0)
  assert.equal(count('.news-featured img,.news-card img'), 0)
  for (const article of document.querySelectorAll('.news-featured,.news-card')) {
    assert.equal(article.querySelectorAll('h3').length, 1)
    assert.ok(article.querySelector('.news-excerpt').textContent)
    assert.ok(article.querySelector('.news-text-link').href.startsWith('https://vnexpress.net/'))
  }
})

test('News surfaces override the public base without affecting other pages', () => {
  const css = fs.readFileSync(path.join(rootDirectory, 'src/workspaces/public/pages/health-news.css'), 'utf8')
  assert.match(css, /\.public-site\.health-news-page\s*\{[^}]*--news-surface: #f6f8f7;[^}]*background: var\(--news-surface\)/)
  for (const selector of ['news-card', 'news-featured', 'news-search', 'news-empty']) {
    assert.match(css, new RegExp(`\\.${selector} \\{[^}]*background: white;`))
  }
  assert.match(css, /\.news-card\s*\{[^}]*box-shadow:/)
  assert.match(css, /\.news-intro\s*\{[^}]*background: var\(--news-pale\)/)
  assert.match(css, /prefers-reduced-motion: reduce/)
})
test('Load more and filters reset the visible slice correctly', async () => {
  await mount()
  await click(button('Xem thêm bài viết'))
  assert.equal(count('.news-card'), 18)
  await click(button('Dinh dưỡng'))
  assert.equal(count('.news-featured'), 0)
  assert.equal(count('.news-card'), 9)
  assert.ok([...document.querySelectorAll('.news-card .news-meta > span:first-child')].every(element => element.textContent === 'Dinh dưỡng'))
  await click(button('Tất cả'))
  assert.equal(count('.news-card'), 9)
})
test('Sort changes are reflected in article dates', async () => {
  await mount()
  const select = document.querySelector('.news-sort select')
  await act(async () => { select.value = 'oldest'; select.dispatchEvent(new window.Event('change', { bubbles: true })) })
  assert.equal(count('.news-featured'), 0)
  const dates = [...document.querySelectorAll('.news-card time')].map(element => Date.parse(element.dateTime))
  assert.ok(dates.every((date, index) => !index || date >= dates[index - 1]))
})
test('Search accepts unaccented Vietnamese and no-result view can reset', async () => {
  await mount()
  const input = document.getElementById('news-search')
  const setValue = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  const type = async value => act(async () => { setValue.call(input, value); input.dispatchEvent(new window.Event('input', { bubbles: true })) })
  await type('di bo')
  assert.equal(count('.news-card'), 1)
  assert.equal(count('.news-featured'), 0)
  await type('not-a-matching-article')
  assert.equal(count('.news-card'), 0)
  assert.match(document.querySelector('.news-empty h3').textContent, /Chưa tìm thấy/)
  await click(button('Xem tất cả bài viết'))
  assert.equal(input.value, '')
  assert.equal(count('.news-featured'), 1)
})
test('External links name the source and open safely in a new tab', async () => {
  await mount()
  for (const element of document.querySelectorAll('.news-card a,.news-featured a')) {
    assert.equal(new URL(element.href).hostname, 'vnexpress.net')
    assert.equal(element.target, '_blank')
    assert.ok(element.rel.includes('noopener') && element.rel.includes('noreferrer'))
    assert.match(element.textContent, /mở tại VnExpress trong thẻ mới/)
  }
})
test('Failure view does not fabricate articles; retry recovers', async () => {
  let calls = 0
  await mount(async () => ++calls === 1 ? new Response('{}', { status: 503 }) : new Response(JSON.stringify(payload)))
  assert.equal(count('.news-card'), 0)
  assert.match(document.querySelector('[role="alert"]').textContent, /Chưa tải được bản tin/)
  await click(button('Thử lại'))
  assert.equal(count('.news-card'), 9)
})
test('Rejects untrusted article URLs from an invalid response', async () => {
  await mount(async () => new Response(JSON.stringify({ ...payload, articles: [{ ...articles[0], sourceUrl: 'javascript:alert(1)' }] })))
  assert.equal(count('.news-card'), 0)
  assert.equal(count('[role="alert"]'), 1)
})
test('Displays cache date and stale notice honestly', async () => {
  await mount(async () => new Response(JSON.stringify({ ...payload, stale: true })))
  assert.match(document.querySelector('.news-notice').textContent, /đã lưu từ ngày 22\/10\/2026/)
})
test('Loading is announced, and leaving the page cancels the request', async () => {
  let signal
  await mount((_url, options) => { signal = options.signal; return new Promise(() => {}) })
  assert.equal(count('[aria-label="Đang tải tin tức"]'), 1)
  assert.equal(count('.news-card'), 0)
  await cleanup()
  assert.equal(signal.aborted, true)
})
test('News request is same-origin and does not send authentication', async () => {
  await mount(async (url, options) => {
    assert.equal(url, '/news-feed')
    assert.equal(options.credentials, 'omit')
    assert.equal(options.headers.Authorization, undefined)
    return new Response(JSON.stringify(payload))
  })
  assert.equal(count('.news-card'), 9)
})
