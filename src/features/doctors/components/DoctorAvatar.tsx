import { useState } from 'react'

export default function DoctorAvatar({ name, url, className = 'size-20 text-2xl' }: { name: string; url?: string | null; className?: string }) {
  const [failedUrl, setFailedUrl] = useState('')
  const [loadedUrl, setLoadedUrl] = useState('')
  const initials = name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase()
  return <span className={`relative grid shrink-0 place-items-center overflow-hidden rounded-full border border-teal-100 bg-teal-50 font-display font-extrabold text-teal-800 ${className}`}>
    <span aria-hidden="true" className={url && url === loadedUrl && url !== failedUrl ? 'opacity-0' : ''}>{initials}</span>
    {url && url !== failedUrl && <img src={url} alt={`Ảnh ${name}`} loading="lazy" referrerPolicy="no-referrer" onLoad={() => setLoadedUrl(url)} onError={() => setFailedUrl(url)} className={`absolute inset-0 size-full object-cover ${url === loadedUrl ? 'opacity-100' : 'opacity-0'}`} />}
  </span>
}
