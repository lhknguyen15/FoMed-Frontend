import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import './public-catalog-carousel.css'

type Props = {
  label: string
  variant: 'doctors' | 'specialties'
  children: ReactNode[]
}

export default function PublicCatalogCarousel({ label, variant, children }: Props) {
  const id = useId()
  const trackRef = useRef<HTMLUListElement>(null)
  const [bounds, setBounds] = useState({ previous: false, next: false })

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const updateBounds = () => {
      const maximum = track.scrollWidth - track.clientWidth
      setBounds({ previous: track.scrollLeft > 2, next: maximum - track.scrollLeft > 2 })
    }
    updateBounds()
    track.addEventListener('scroll', updateBounds, { passive: true })
    const observer = new ResizeObserver(updateBounds)
    observer.observe(track)
    if (track.firstElementChild) observer.observe(track.firstElementChild)
    return () => {
      track.removeEventListener('scroll', updateBounds)
      observer.disconnect()
    }
  }, [children.length])

  const move = (direction: -1 | 1 | 'first' | 'last') => {
    const track = trackRef.current
    if (!track) return
    const maximum = Math.max(0, track.scrollWidth - track.clientWidth)
    const cards = Array.from(track.children) as HTMLElement[]
    if (!cards.length || !track.clientWidth) return
    // Use real card positions: rounding, responsive widths and gaps stay aligned.
    const pitch = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth
    const gap = Math.max(0, pitch - cards[0].getBoundingClientRect().width)
    const pageSize = Math.max(1, Math.floor((track.clientWidth + gap + 2) / pitch))
    const currentCard = Math.round(track.scrollLeft / pitch)
    const destination = direction === 'first' ? 0 : direction === 'last' ? maximum : (currentCard + direction * pageSize) * pitch
    track.scrollTo({
      left: Math.max(0, Math.min(maximum, destination)),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  }

  const onKeyDown = (event: KeyboardEvent<HTMLUListElement>) => {
    if (event.target !== event.currentTarget) return
    const direction = ({ ArrowLeft: -1, ArrowRight: 1, Home: 'first', End: 'last' } as const)[event.key as 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End']
    if (direction === undefined) return
    event.preventDefault()
    move(direction)
  }

  const buttonClass = 'absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-teal-100 bg-white text-teal-800 shadow-sm transition hover:border-teal-300 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-default disabled:opacity-35 disabled:shadow-none'

  return <div role="region" aria-label={'Khám phá ' + label} className="public-catalog-carousel relative mt-7 px-6">
    <p id={id + '-instructions'} className="sr-only">Vuốt ngang hoặc dùng hai nút mũi tên để xem thêm {label}. Khi chọn danh sách bằng bàn phím, dùng phím mũi tên trái, phải, Home hoặc End.</p>
    <button type="button" aria-label={'Xem ' + label + ' trước'} aria-controls={id} disabled={!bounds.previous} onClick={() => move(-1)} className={buttonClass + ' left-0'}><ChevronLeft aria-hidden="true" className="size-5" /></button>
    <ul id={id} ref={trackRef} tabIndex={0} aria-label={'Danh sách ' + label} aria-describedby={id + '-instructions'} onKeyDown={onKeyDown} className={'public-catalog-track public-catalog-track--' + variant}>
      {children.map((child, index) => <li key={typeof child === 'object' && child && 'key' in child ? String(child.key ?? index) : index} className="public-catalog-slide">{child}</li>)}
    </ul>
    <button type="button" aria-label={'Xem ' + label + ' tiếp theo'} aria-controls={id} disabled={!bounds.next} onClick={() => move(1)} className={buttonClass + ' right-0'}><ChevronRight aria-hidden="true" className="size-5" /></button>
  </div>
}
