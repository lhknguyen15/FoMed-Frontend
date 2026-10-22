import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowUpRight, BookOpen, CalendarDays, HeartPulse, Newspaper, RefreshCw, Search, ShieldCheck, X } from 'lucide-react'
import { getHealthNews } from '../../../features/news/api/news-api'
import { newsTopics } from '../../../features/news/types/news'
import type { NewsArticle, NewsFeed, NewsTopic } from '../../../features/news/types/news'
import PublicHeader from '../components/PublicHeader'
import PublicFooter from '../components/PublicFooter'
import './health-news.css'

const pageSize = 9
const formatDate = (date: string) => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date(date))
const normalize = (text: string) => text.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim()
const topicLabel = (category: NewsTopic) => newsTopics.find(topic => topic.id === category)?.label ?? 'Y tế & sức khỏe'

export default function HealthNewsPage() {
  const [feed, setFeed] = useState<NewsFeed | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [retry, setRetry] = useState(0)
  const [search, setSearch] = useState('')
  const [topic, setTopic] = useState<NewsTopic>('all')
  const [sort, setSort] = useState('newest')
  const [visibleCount, setVisibleCount] = useState(pageSize)
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    const title = document.title
    document.title = 'Tin tức y tế · FoMed'
    heading.current?.focus({ preventScroll: true })
    return () => { document.title = title }
  }, [])

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 15_000)
    setLoading(true)
    setError(false)
    void getHealthNews(controller.signal).then(data => {
      if (active) setFeed(data)
    }).catch(() => {
      if (active) setError(true)
    }).finally(() => {
      window.clearTimeout(timeout)
      if (active) setLoading(false)
    })
    return () => { active = false; controller.abort(); window.clearTimeout(timeout) }
  }, [retry])

  const filtered = useMemo(() => {
    const query = normalize(search)
    return (feed?.articles ?? []).filter(article => (topic === 'all' || article.category === topic)
      && (!query || normalize(article.title + ' ' + article.excerpt).includes(query)))
      .sort((a, b) => sort === 'oldest' ? Date.parse(a.publishedAt) - Date.parse(b.publishedAt) : Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
  }, [feed, search, topic, sort])
  const isDefaultView = !search.trim() && topic === 'all' && sort === 'newest'
  const featured = isDefaultView ? filtered[0] : undefined
  const articles = featured ? filtered.slice(1) : filtered
  const clearFilters = () => { setSearch(''); setTopic('all'); setSort('newest'); setVisibleCount(pageSize) }

  return <div className="public-site health-news-page">
    <PublicHeader />
    <a className="news-skip" href="#news-content">Đến nội dung tin tức</a>
    <main id="news-content" tabIndex={-1}>
      <header className="news-intro">
        <div className="news-container">
          <Link className="news-back" to="/"><ArrowLeft aria-hidden="true" className="size-4" /> Trang chủ</Link>
          <div className="news-intro-grid">
            <div><p className="news-eyebrow">GÓC ĐỌC SỨC KHỎE</p><h1 tabIndex={-1} ref={heading}>Hiểu thêm.<br /><span>Chăm sóc tốt hơn.</span></h1><p className="news-lead">Những thông tin y tế và câu chuyện sống khỏe,<br className="hidden sm:block" /> cùng bạn chủ động quan tâm đến sức khỏe mỗi ngày.</p></div>
            <aside className="news-source-note" aria-label="Thông tin nguồn tin"><span className="news-source-icon"><BookOpen aria-hidden="true" /></span><p className="news-eyebrow">ĐỌC TIN CÓ NGUỒN</p><h2>Tin tức y tế</h2><p>Bản tin được tổng hợp từ kênh Sức khỏe của <a href="https://vnexpress.net/suc-khoe" target="_blank" rel="noopener noreferrer">VnExpress <ArrowUpRight aria-hidden="true" className="size-3" /></a>. Mở bài viết để đọc đầy đủ tại báo gốc.</p><span className="news-source-caption">Không thay thế tư vấn của nhân viên y tế.</span></aside>
          </div>
        </div>
      </header>

      <section className="news-container news-reading" aria-labelledby="news-list-title">
        <div className="news-toolbar">
          <div><p className="news-eyebrow">DÀNH THỜI GIAN CHO SỨC KHỎE</p><h2 id="news-list-title">Bản tin & kiến thức</h2></div>
          <div className="news-search"><Search aria-hidden="true" className="size-5" /><label className="sr-only" htmlFor="news-search">Tìm bài viết</label><input id="news-search" type="search" autoComplete="off" placeholder="Tìm chủ đề bạn quan tâm…" value={search} onChange={event => { setSearch(event.target.value); setVisibleCount(pageSize) }} />{search && <button type="button" onClick={() => { setSearch(''); setVisibleCount(pageSize) }} aria-label="Xóa từ khóa tìm kiếm"><X aria-hidden="true" className="size-4" /></button>}</div>
        </div>
        <div className="news-filter-row"><div role="group" aria-label="Lọc theo chủ đề" className="news-topics">{newsTopics.map(item => <button key={item.id} type="button" aria-pressed={topic === item.id} onClick={() => { setTopic(item.id); setVisibleCount(pageSize) }}>{item.label}</button>)}</div><label className="news-sort">Sắp xếp<select value={sort} onChange={event => { setSort(event.target.value); setVisibleCount(pageSize) }}><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option></select></label></div>
        {feed && <div className="news-feed-meta"><span role="status">{filtered.length} bài viết{search.trim() ? ` phù hợp với “${search.trim()}”` : ''}</span><span>Cập nhật nguồn: {formatDate(feed.fetchedAt)}</span></div>}
        {(feed?.stale || (error && feed)) && <p role="status" className="news-notice">Nguồn tin đang tạm gián đoạn. Bạn đang xem bản tin đã lưu từ ngày {formatDate(feed!.fetchedAt)}.</p>}
        {error && !feed && <div role="alert" className="news-empty"><Newspaper aria-hidden="true" className="size-10" /><h3>Chưa tải được bản tin</h3><p>Nguồn tin có thể đang tạm gián đoạn. Bạn có thể thử lại hoặc đọc trực tiếp tại VnExpress.</p><div className="news-empty-actions"><button type="button" className="news-button" onClick={() => setRetry(value => value + 1)}><RefreshCw aria-hidden="true" className="size-4" /> Thử lại</button><a href="https://vnexpress.net/suc-khoe" target="_blank" rel="noopener noreferrer" className="news-text-link">Đọc tại VnExpress <ArrowUpRight aria-hidden="true" className="size-4" /></a></div></div>}
        {loading && !feed && <div role="status" aria-label="Đang tải tin tức" className="news-grid">{[0, 1, 2].map(item => <div key={item} aria-hidden="true" className="news-skeleton"><div /><span /><span /></div>)}</div>}
        {feed && !filtered.length && <div className="news-empty"><Search aria-hidden="true" className="size-10" /><h3>Chưa tìm thấy bài viết phù hợp</h3><p>Thử một từ khóa ngắn hơn hoặc chọn chủ đề khác.</p><button className="news-button" type="button" onClick={clearFilters}>Xem tất cả bài viết</button></div>}
        {featured && <article className="news-featured"><div className="news-featured-content"><p className="news-eyebrow"><Newspaper aria-hidden="true" className="size-4" /> BÀI MỚI NHẤT</p><NewsMeta article={featured} /><h3><ArticleLink article={featured}>{featured.title}</ArticleLink></h3><p className="news-excerpt">{featured.excerpt}</p><ArticleLink article={featured} className="news-text-link">Đọc bài tại VnExpress <ArrowUpRight aria-hidden="true" className="size-4" /></ArticleLink></div></article>}
        {articles.length > 0 && <div className="news-grid">{articles.slice(0, visibleCount).map(article => <article key={article.id} className="news-card"><div className="news-card-content"><NewsMeta article={article} /><h3><ArticleLink article={article}>{article.title}</ArticleLink></h3><p className="news-excerpt">{article.excerpt}</p><ArticleLink article={article} className="news-text-link">Đọc tại VnExpress <ArrowUpRight aria-hidden="true" className="size-4" /></ArticleLink></div></article>)}</div>}
        {articles.length > visibleCount && <div className="news-load-more"><p>Đang hiển thị {Math.min(visibleCount, articles.length) + (featured ? 1 : 0)} / {filtered.length} bài viết</p><button type="button" className="news-button" onClick={() => setVisibleCount(value => value + pageSize)}>Xem thêm bài viết <ArrowDown aria-hidden="true" className="size-4" /></button></div>}
        <div className="news-editorial-note"><ShieldCheck aria-hidden="true" className="size-5 shrink-0" /><p>FoMed chỉ giới thiệu tiêu đề và đoạn tin ngắn; nội dung đầy đủ thuộc về đơn vị xuất bản. Các chủ đề được FoMed nhóm để tiện tìm đọc. Liên kết bài viết mở tại nguồn trong thẻ mới.</p></div>
      </section>
      <section className="news-bottom-note"><div className="news-container"><HeartPulse aria-hidden="true" className="size-7 shrink-0" /><div><h2>Đọc để hiểu. Thăm khám để được tư vấn.</h2><p>Nếu có vấn đề sức khỏe, hãy trao đổi trực tiếp với bác sĩ để được đánh giá phù hợp.</p></div><Link to="/doctors" className="news-button">Tìm bác sĩ <ArrowUpRight aria-hidden="true" className="size-4" /></Link></div></section>
    </main>
    <PublicFooter />
  </div>
}

function ArticleLink({ article, children, className }: { article: NewsArticle; children: ReactNode; className?: string }) {
  return <a href={article.sourceUrl} className={className} target="_blank" rel="noopener noreferrer">{children}<span className="sr-only"> (mở tại {article.sourceName} trong thẻ mới)</span></a>
}

function NewsMeta({ article }: { article: NewsArticle }) {
  return <div className="news-meta"><span>{topicLabel(article.category)}</span><span><CalendarDays aria-hidden="true" className="size-3.5" /><time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time></span></div>
}
