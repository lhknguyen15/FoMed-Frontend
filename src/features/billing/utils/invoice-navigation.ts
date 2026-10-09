const listPath = '/reception/cashier'

// Never use arbitrary history or a caller-provided external redirect as the back target.
export function invoiceListReturnTo(value: unknown): string {
  if (typeof value !== 'string' || value.length > 2048 || (value !== listPath && !value.startsWith(`${listPath}?`))) return listPath
  try {
    const url = new URL(value, 'https://fomed.invalid')
    return url.origin === 'https://fomed.invalid' && url.pathname === listPath && !url.hash ? `${url.pathname}${url.search}` : listPath
  } catch { return listPath }
}

export function invoiceDetailPath(id: number, returnTo: unknown, print = false): string {
  const params = new URLSearchParams({ returnTo: invoiceListReturnTo(returnTo) })
  return `${listPath}/${id}${print ? '/print' : ''}?${params}`
}
