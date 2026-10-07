// Pure Node tests with synthetic responses. No real requests, accounts or database writes.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const esbuild = require('esbuild')
const ts = require('typescript')

async function main() {
  const root = path.resolve(__dirname, '..')
  const result = await esbuild.build({ absWorkingDir: root, stdin: {
    contents: "export * from './src/shared/api/user-messages'; export * from './src/shared/api/http-client'; export * from './src/shared/api/refresh-token'; export * from './src/shared/api/api-error';",
    resolveDir: root, loader: 'ts',
  }, bundle: true, write: false, platform: 'node', format: 'cjs', define: { 'import.meta.env.VITE_API_URL': "'/api'" } })
  const compiled = new Module(path.join(root, 'tests', 'user-messages.compiled.cjs'), module)
  compiled.filename = path.join(root, 'tests', 'user-messages.compiled.cjs'); compiled.paths = module.paths
  compiled._compile(result.outputFiles[0].text, compiled.filename)
  const { getUserErrorMessage: message, toUserMessage, displayError, apiRequest, apiDownload, refreshStoredSession, ApiError } = compiled.exports
  let checks = 0
  const check = (ok, label) => { assert.ok(ok, label); checks++; console.log('PASS: ' + label) }
  check(message({ message: 'Bac si da co lich hen khac trong khung gio nay.' }, 409).includes('Bác sĩ đã có lịch hẹn khác'), 'Legacy appointment conflict retains meaning with accents')
  check(message({ message: 'Can cap nhat chan doan truoc khi hoan tat lich hen.' }, 400).includes('chẩn đoán'), 'Clinical requirement remains actionable')
  check(message({ message: 'Khong the huy hoa don da phat sinh thanh toan.' }, 409).includes('đã phát sinh thanh toán'), 'Invoice restriction translated')
  check(message({ message: 'Không thể hủy chỉ định đã thực hiện.' }, 409) === 'Không thể hủy chỉ định đã thực hiện.', 'Accented business message preserved')
  check(message({ message: 'Token khong hop le.' }, 401).includes('đăng nhập lại'), 'Authentication internals replaced with login guidance')
  check(message({ message: 'TÃ i khoáº£n hoáº·c sá»‘ Ä‘iá»‡n thoáº¡i Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng.' }, 409) === 'Tài khoản hoặc số điện thoại đã được sử dụng.', 'Known corrupted account message translated')
  check(toUserMessage('KhÃ´ng thá»ƒ demo', 'Không thể thực hiện thao tác.') === 'Không thể thực hiện thao tác.', 'Unknown corrupted encoding suppressed')
  check(message({ message: 'Không thể kết nối SQL database; SECRET_DEMO' }, 500) === message(null, 500), 'Server diagnostics never become visible messages')
  check(message({ title: 'One or more validation errors occurred.', errors: { startTime: ['The StartTime field is required.'] } }, 400).includes('trường bắt buộc'), 'English framework validation replaced with Vietnamese guidance')
  check(message({ message: 'Bad Request', errors: { diagnosis: ['Vui lòng nhập chẩn đoán.'] } }, 400) === 'Vui lòng nhập chẩn đoán.', 'Vietnamese field validation preferred over framework text')
  check(message({ message: { unexpected: 'value' }, errors: { x: 12 } }, 400).includes('thông tin'), 'Malformed error payload handled safely')
  check(message(null, 0).includes('kết nối mạng'), 'Network failure includes useful next action')
  check(message(null, 403).includes('không có quyền') && message(null, 429).includes('chờ'), 'Permission and rate-limit errors differ')
  check(displayError(new Error('Failed to fetch'), 'Không thể tải hồ sơ.') === 'Không thể tải hồ sơ.', 'Unexpected browser error does not leak English')

  const appointmentMessages = fs.readFileSync(path.join(root, '../FoMed-API/FoMed.Application/DTO/Appointment/AppointmentResponseMessageDTO.cs'), 'utf8')
  const legacy = [...appointmentMessages.matchAll(/const string \w+ = "([^"]+)"/g)].map(match => match[1])
  check(legacy.every(value => /[À-ỹ]/u.test(toUserMessage(value, ''))), 'Every current appointment response has an accented translation')

  const originalFetch = global.fetch, originalLocal = global.localStorage, originalSession = global.sessionStorage
  const store = new Map()
  global.localStorage = { getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value), removeItem: key => store.delete(key) }
  global.sessionStorage = { getItem: () => null, setItem() {}, removeItem() {} }
  const response = (status, payload) => new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json' } })
  async function rejected(action, predicate, label) { try { await action(); throw new Error('Expected rejection') } catch (error) { check(predicate(error), label) } }
  try {
    global.fetch = async () => response(400, { message: 'Khong tim thay lich hen.' })
    await rejected(() => apiRequest('/synthetic', { skipAuth: true }), error => error instanceof ApiError && error.status === 400 && error.message === 'Không tìm thấy lịch hẹn.', 'HTTP adapter translates business error')
    global.fetch = async () => response(500, { message: 'System.Data.SqlClient.SqlException SECRET_DEMO' })
    await rejected(() => apiRequest('/synthetic', { skipAuth: true }), error => error.status === 500 && error.message === message(null, 500), 'HTTP adapter hides internal server text')
    await rejected(() => apiDownload('/synthetic', { skipAuth: true }), error => error.message === message(null, 500), 'Download adapter uses same safe messages')
    global.fetch = async () => { throw new TypeError('Failed to fetch') }
    await rejected(() => apiRequest('/synthetic', { skipAuth: true }), error => error.status === 0 && error.message.includes('kết nối mạng'), 'HTTP network failure translated')
    await rejected(() => apiDownload('/synthetic', { skipAuth: true }), error => error.status === 0 && error.message.includes('kết nối mạng'), 'Download network failure translated')
    global.fetch = async () => new Response('<html>bad gateway</html>', { status: 200 })
    await rejected(() => apiRequest('/synthetic', { skipAuth: true }), error => error.message === 'Không thể tải thông tin lúc này. Vui lòng thử lại.', 'Invalid success body has friendly message')
    const data = { note: 'Ghi chu khong dau do nguoi dung nhap', name: 'DEMO_NAME', code: 'Pending' }
    global.fetch = async () => response(200, { dataResponse: data, statusCode: 200, message: 'Success' })
    check(JSON.stringify(await apiRequest('/synthetic', { skipAuth: true })) === JSON.stringify(data), 'Patient-entered data and machine values never rewritten')
    store.set('fomed_session', JSON.stringify({ refreshToken: 'synthetic-not-a-credential' }))
    global.fetch = async () => response(401, { message: 'Refresh token không hợp lệ hoặc đã hết hạn.' })
    await rejected(refreshStoredSession, error => error.message.includes('đăng nhập lại') && !error.message.includes('token'), 'Session renewal uses user-facing guidance')
  } finally { global.fetch = originalFetch; global.localStorage = originalLocal; global.sessionStorage = originalSession }

  // Catch developer vocabulary in user-facing literals, excluding routes/import paths.
  const forbidden = /\b(?:API|backend|frontend|components?|endpoint|database|transaction|snapshot|preview|VC-\d+)\b|MEDICAL_RECORDS|PRESCRIPTION_ITEMS|LAB_RESULTS/i
  const leaks = []
  function scan(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name)
      if (entry.isDirectory()) { scan(file); continue }
      if (!/\.tsx?$/.test(file)) continue
      const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)
      function visit(node) {
        if ((ts.isJsxText(node) || ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && !node.text.startsWith('/') && !node.text.startsWith('.') && forbidden.test(node.text)) leaks.push(path.relative(root, file) + ': ' + node.text.trim())
        ts.forEachChild(node, visit)
      }
      visit(source)
    }
  }
  scan(path.join(root, 'src'))
  check(leaks.length === 0, 'No developer vocabulary in displayed source literals: ' + leaks.join('; '))
  console.log(`User-facing messages: ${checks} checks passed. Synthetic responses only.`)
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
