// Cash received is integer VND, not the amount posted to payments.
// Never strip arbitrary characters: accept digits or correctly grouped thousands only.
export function parseCashReceived(text: string): number | null {
  const value = text.trim().replace(/[\u00a0\u202f]/g, ' ')
  const valid = /^\d+$/.test(value)
    || /^[1-9]\d{0,2}(?:\.\d{3})+$/.test(value)
    || /^[1-9]\d{0,2}(?: \d{3})+$/.test(value)
  if (!valid) return null
  const amount = Number(value.replace(/[. ]/g, ''))
  // A whole cash tender must cover even the maximum decimal invoice balance (9,999,999,999.99).
  return Number.isSafeInteger(amount) && amount <= 10000000000 ? amount : null
}

// Preserve legacy invoice fractions instead of silently rounding outstanding debt.
export const formatPaymentMoney = (value: number) => `${value.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} đ`

export function cashPaymentPreview(text: string, remaining: number) {
  const received = parseCashReceived(text)
  let error = ''
  if (received === null) error = 'Nhập số tiền bằng chữ số hoặc dấu chấm phân cách hàng nghìn, ví dụ 500.000.'
  else if (received <= 0) error = 'Tiền khách đưa phải lớn hơn 0.'
  else if (received < remaining) error = `Tiền khách đưa chưa đủ. Cần nhận ít nhất ${formatPaymentMoney(remaining)}.`
  return { received, error, change: !error && received !== null ? Number((received - remaining).toFixed(2)) : null }
}
