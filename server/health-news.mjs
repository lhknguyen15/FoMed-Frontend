import { createHash } from 'node:crypto'
import Parser from 'rss-parser'

export const NEWS_SOURCE = Object.freeze({
  name: 'VnExpress',
  url: 'https://vnexpress.net/suc-khoe',
  feedUrl: 'https://vnexpress.net/rss/suc-khoe.rss',
})
const MAX_BYTES = 1_000_000
const FRESH_MS = 5 * 60_000
const STALE_MS = 24 * 60 * 60_000
const plainText = (value) => typeof value === 'string'
  ? value.slice(0, 8000).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]*>/g, '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()
  : ''

export function articleUrl(value) {
  try {
    const url = new URL(value)
    if (url.protocol !== 'https:' || url.hostname !== 'vnexpress.net' || url.port || url.username || url.password || !url.pathname.endsWith('.html')) return null
    url.hash = ''
    url.search = ''
    return url.href
  } catch { return null }
}

// These are FoMed discovery labels, not diagnoses or publisher-assigned categories.
export function newsCategory(title) {
  const value = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
  if (/\b(tre em|tre nho|so sinh|thai ky|mang thai|ba bau|em be|me va be)\b/.test(value)) return 'family'
  if (/\b(dinh duong|thuc pham|an uong|vitamin|rau|trai cay|protein|bua an)\b/.test(value)) return 'nutrition'
  if (/\b(tap luyen|the duc|giac ngu|ngu ngon|song khoe|di bo|chay bo|stress|hut thuoc)\b/.test(value)) return 'wellness'
  return 'health'
}

export async function parseNewsFeed(xml) {
  if (typeof xml !== 'string' || Buffer.byteLength(xml, 'utf8') > MAX_BYTES || /<!\s*(DOCTYPE|ENTITY)\b/i.test(xml)) throw new Error('Unsupported feed')
  const feed = await new Parser().parseString(xml)
  const seen = new Set()
  const articles = []
  for (const item of feed.items ?? []) {
    const url = articleUrl(item.link)
    const title = plainText(item.title).slice(0, 240)
    const date = new Date(item.isoDate || item.pubDate)
    if (!url || !title || Number.isNaN(date.getTime()) || seen.has(url)) continue
    seen.add(url)
    const snippet = plainText(item.contentSnippet)
    articles.push({
      id: 'vnexpress-' + createHash('sha256').update(url).digest('hex').slice(0, 20),
      origin: 'external', title,
      excerpt: snippet.length > 200 ? snippet.slice(0, 197).replace(/\s+\S*$/, '') + '…' : snippet,
      publishedAt: date.toISOString(),
      category: newsCategory(title),
      sourceName: NEWS_SOURCE.name, sourceUrl: url,
    })
  }
  if (!articles.length) throw new Error('Empty feed')
  return articles.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 40)
}

async function readFeed(fetcher) {
  const response = await fetcher(NEWS_SOURCE.feedUrl, {
    signal: AbortSignal.timeout(10_000), redirect: 'error',
    headers: { Accept: 'application/rss+xml, application/xml, text/xml', 'User-Agent': 'FoMed-Health-News/1.0' },
  })
  if (!response.ok || !response.body || Number(response.headers.get('content-length')) > MAX_BYTES) throw new Error('Feed unavailable')
  const reader = response.body.getReader()
  const chunks = []
  let length = 0
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > MAX_BYTES) throw new Error('Feed too large')
      chunks.push(value)
    }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock() }
  return Buffer.concat(chunks).toString('utf8')
}

// One shared in-flight fetch per warm instance; no URLs or credentials supplied by visitors.
export function createNewsService({ fetcher = fetch, now = Date.now } = {}) {
  let cache = null
  let pending = null
  let retryAt = 0
  return async () => {
    if (cache && now() - cache.timestamp < FRESH_MS) return { ...cache.payload, stale: false }
    if (!pending && now() >= retryAt) {
      pending = (async () => {
        const articles = await parseNewsFeed(await readFeed(fetcher))
        const timestamp = now()
        const payload = { articles, source: NEWS_SOURCE, fetchedAt: new Date(timestamp).toISOString() }
        cache = { timestamp, payload }
        retryAt = 0
        return { ...payload, stale: false }
      })().catch((error) => { retryAt = now() + 60_000; throw error }).finally(() => { pending = null })
    }
    try {
      if (pending) return await pending
      throw new Error('Feed cooling down')
    } catch {
      if (cache && now() - cache.timestamp < STALE_MS) return { ...cache.payload, stale: true }
      throw new Error('News unavailable')
    }
  }
}

const getNews = createNewsService()
export default async function healthNewsHandler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405
    res.setHeader('Allow', 'GET, HEAD')
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify({ message: 'Phương thức không được hỗ trợ.' }))
    return
  }
  try {
    const payload = await getNews()
    res.setHeader('Cache-Control', payload.stale ? 'public, max-age=0, s-maxage=60' : 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
    res.statusCode = 200
    res.end(req.method === 'HEAD' ? undefined : JSON.stringify(payload))
  } catch {
    res.statusCode = 503
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('Retry-After', '60')
    res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ message: 'Chưa tải được tin tức. Vui lòng thử lại sau.' }))
  }
}
