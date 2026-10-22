import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { articleUrl, createNewsService, newsCategory, parseNewsFeed } from '../server/health-news.mjs'

const entry = (title, link, date = 'Tue, 06 Oct 2026 10:00:00 +0700', description = 'Thông tin giới thiệu bài viết.') => `<item><title><![CDATA[${title}]]></title><link>${link}</link><pubDate>${date}</pubDate><description><![CDATA[${description}]]></description></item>`
const wrap = items => `<?xml version="1.0"?><rss version="2.0"><channel><title>Sức khỏe</title>${items}</channel></rss>`
const xml = wrap(entry('ĐI BỘ mỗi ngày', 'https://vnexpress.net/bai-viet-1.html?utm_source=test#top') + entry('Dinh dưỡng cho gia đình', 'https://vnexpress.net/bai-viet-2.html', 'Wed, 07 Oct 2026 10:00:00 +0700'))
const response = body => new Response(body, { status: 200, headers: { 'Content-Type': 'application/xml' } })

test('Parses and sorts valid articles; IDs and URLs are canonical', async () => {
  const articles = await parseNewsFeed(xml)
  assert.equal(articles.length, 2)
  assert.equal(articles[0].title, 'Dinh dưỡng cho gia đình')
  assert.equal(articles[1].category, 'wellness')
  assert.equal(articles[1].sourceUrl, 'https://vnexpress.net/bai-viet-1.html')
  assert.equal(articles[1].origin, 'external')
  assert.equal(articles[0].sourceName, 'VnExpress')
  assert.equal((await parseNewsFeed(xml))[0].id, articles[0].id)
})
test('Only allowed HTTPS article links survive, with no embedded credentials', () => {
  for (const value of ['javascript:alert(1)', 'https://vnexpress.net.evil.test/a.html', 'https://evil.test/a.html', 'http://vnexpress.net/a.html', 'https://user:pass@vnexpress.net/a.html', 'https://vnexpress.net:444/a.html', 'https://vnexpress.net/a']) assert.equal(articleUrl(value), null)
})
test('Drops duplicates, invalid dates and off-site links', async () => {
  const articles = await parseNewsFeed(wrap(entry('A', 'https://vnexpress.net/a.html') + entry('Duplicate', 'https://vnexpress.net/a.html') + entry('Bad date', 'https://vnexpress.net/b.html', 'not a date') + entry('Bad link', 'https://evil.test/a.html')))
  assert.equal(articles.length, 1)
})
test('Feed HTML is converted to plain text, never executable markup', async () => {
  const articles = await parseNewsFeed(wrap(entry('<b>Tiêu đề</b>', 'https://vnexpress.net/a.html', undefined, '<a href="https://evil.test">Mô tả</a><img src=x onerror="alert(1)">')))
  assert.equal(articles[0].title, 'Tiêu đề')
  assert.equal(articles[0].excerpt, 'Mô tả')
  assert.doesNotMatch(JSON.stringify(articles), /<img|onerror|<a /)
})
test('Rejects entity definitions, oversized, malformed and empty feeds', async () => {
  for (const value of ['<!DOCTYPE foo [<!ENTITY test "abc">]>' + xml, '<!ENTITY x "y">' + xml, 'x'.repeat(1_000_001), '<rss>broken', wrap('')]) await assert.rejects(parseNewsFeed(value))
})
test('Bounds response size and article count', async () => {
  const articles = await parseNewsFeed(wrap(Array.from({ length: 70 }, (_, index) => entry('Bài ' + index, `https://vnexpress.net/bai-${index}.html`)).join('')))
  assert.equal(articles.length, 40)
  const long = await parseNewsFeed(wrap(entry('Tin tức', 'https://vnexpress.net/long.html', undefined, 'Thông tin dài. '.repeat(100))))
  assert.ok(long[0].excerpt.length <= 200)
  assert.ok(long[0].excerpt.endsWith('…'))
  const service = createNewsService({ fetcher: async () => new Response('x'.repeat(1_000_001)) })
  await assert.rejects(service())
})
test('Uppercase Vietnamese topic labels classify without losing Đ', () => {
  assert.equal(newsCategory('ĐI BỘ'), 'wellness')
  assert.equal(newsCategory('Chăm sóc TRẺ EM'), 'family')
  assert.equal(newsCategory('VITAMIN'), 'nutrition')
  assert.equal(newsCategory('Thông tin y tế'), 'health')
})
test('Fixed feed URL, no redirects; concurrent and fresh requests share one fetch', async () => {
  let calls = 0
  const service = createNewsService({ fetcher: async (url, options) => {
    calls++
    assert.equal(url, 'https://vnexpress.net/rss/suc-khoe.rss')
    assert.equal(options.redirect, 'error')
    assert.ok(options.signal instanceof AbortSignal)
    return response(xml)
  } })
  const [first, second] = await Promise.all([service(), service()])
  assert.deepEqual(first, second)
  assert.equal((await service()).stale, false)
  assert.equal(calls, 1)
})
test('Serves marked stale cache on upstream failure, then expires it', async () => {
  let time = 0
  let calls = 0
  const service = createNewsService({ now: () => time, fetcher: async () => { if (++calls > 1) throw new Error('Offline'); return response(xml) } })
  const first = await service()
  time = 6 * 60_000
  const stale = await service()
  assert.equal(stale.stale, true)
  assert.equal(stale.fetchedAt, first.fetchedAt)
  await service()
  assert.equal(calls, 2)
  time = 25 * 60 * 60_000
  await assert.rejects(service())
})
test('Cold failures cool down and never fabricate sample articles', async () => {
  let calls = 0
  const service = createNewsService({ fetcher: async () => { calls++; return new Response('Forbidden', { status: 403 }) } })
  await assert.rejects(service())
  await assert.rejects(service())
  assert.equal(calls, 1)
})
test('Vercel feed rewrite precedes SPA fallback and uses the shared handler', async () => {
  const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'))
  assert.deepEqual(config.rewrites[0], { source: '/news-feed', destination: '/api/health-news' })
  const entry = await import('../api/health-news.mjs')
  const shared = await import('../server/health-news.mjs')
  assert.equal(entry.default, shared.default)
})
test('Endpoint rejects writes without calling the source', async () => {
  const { default: handler } = await import('../server/health-news.mjs')
  const headers = {}
  let body
  const res = { setHeader: (key, value) => { headers[key] = value }, end: value => { body = value } }
  await handler({ method: 'POST' }, res)
  assert.equal(res.statusCode, 405)
  assert.equal(headers.Allow, 'GET, HEAD')
  assert.equal(JSON.parse(body).message, 'Phương thức không được hỗ trợ.')
})
