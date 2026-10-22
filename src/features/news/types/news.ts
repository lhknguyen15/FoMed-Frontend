export const newsTopics = [
  { id: 'all', label: 'Tất cả' },
  { id: 'health', label: 'Y tế & sức khỏe' },
  { id: 'wellness', label: 'Sống khỏe' },
  { id: 'nutrition', label: 'Dinh dưỡng' },
  { id: 'family', label: 'Mẹ & bé' },
] as const

export type NewsTopic = typeof newsTopics[number]['id']
export type NewsArticle = {
  id: string
  origin: 'external'
  title: string
  excerpt: string
  publishedAt: string
  category: Exclude<NewsTopic, 'all'>
  sourceName: string
  sourceUrl: string
}
export type NewsFeed = {
  articles: NewsArticle[]
  source: { name: string; url: string; feedUrl: string }
  fetchedAt: string
  stale: boolean
}
