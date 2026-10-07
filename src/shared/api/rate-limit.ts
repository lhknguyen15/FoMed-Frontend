// Treat retry information as untrusted response data. Never schedule another request here.
export function retryAfterSeconds(header: string | null, payload: unknown, now = Date.now()): number | undefined {
  const valid = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 86400
  if (header && header.length <= 100) {
    const value = header.trim()
    if (/^\d{1,5}$/.test(value)) {
      const seconds = Number(value)
      if (valid(seconds)) return seconds
    } else if (/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun), \d{2} [A-Za-z]{3} \d{4} \d{2}:\d{2}:\d{2} GMT$/.test(value)) {
      const seconds = Math.ceil((Date.parse(value) - now) / 1000)
      if (valid(seconds)) return seconds
    }
  }
  if (payload && typeof payload === 'object' && 'retryAfterSeconds' in payload && valid(payload.retryAfterSeconds)) return payload.retryAfterSeconds
  return undefined
}

export function rateLimitMessage(seconds?: number): string {
  return seconds === undefined ? 'Bạn thao tác quá nhanh. Vui lòng chờ một chút rồi thử lại.'
    : `Bạn thao tác quá nhanh. Vui lòng chờ ${seconds} giây rồi thử lại.`
}
