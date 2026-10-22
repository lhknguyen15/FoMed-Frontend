import { newsTopics } from '../types/news'
import type { NewsArticle, NewsFeed } from '../types/news'

function validArticle(value: unknown): value is NewsArticle {
  if (!value || typeof value !== 'object') return false
  const item = value as Record<string, unknown>
  if (!['id', 'title', 'excerpt', 'publishedAt', 'sourceName', 'sourceUrl'].every(key => typeof item[key] === 'string')) return false
  try {
    const url = new URL(item.sourceUrl as string)
    return item.origin === 'external' && Boolean(item.title) && item.sourceName === 'VnExpress'
      && url.protocol === 'https:' && url.hostname === 'vnexpress.net' && !url.port && !url.username && !url.password && url.pathname.endsWith('.html')
      && !Number.isNaN(Date.parse(item.publishedAt as string))
      && newsTopics.some(topic => topic.id !== 'all' && topic.id === item.category)
  } catch { return false }
}

export async function getHealthNews(signal?: AbortSignal): Promise<NewsFeed> {
  // Separate from the authenticated Render API. No auth token is sent to the feed service.
  const response = await fetch('/news-feed', { signal, credentials: 'omit', headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error('Chưa tải được tin tức. Vui lòng thử lại sau.')
  const data = await response.json() as Partial<NewsFeed>
  if (!Array.isArray(data.articles) || !data.articles.every(validArticle) || !data.fetchedAt || Number.isNaN(Date.parse(data.fetchedAt)) || typeof data.stale !== 'boolean') throw new Error('Dữ liệu tin tức chưa sẵn sàng. Vui lòng thử lại sau.')
  return { articles: data.articles, fetchedAt: data.fetchedAt, stale: data.stale, source: { name: 'VnExpress', url: 'https://vnexpress.net/suc-khoe', feedUrl: 'https://vnexpress.net/rss/suc-khoe.rss' } }
}
