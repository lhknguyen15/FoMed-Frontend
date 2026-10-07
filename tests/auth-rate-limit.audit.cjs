// Synthetic HTTP + real React page/hook handlers, without a browser or external API.
const assert = require('node:assert/strict')
const path = require('node:path')
const Module = require('node:module')
const React = require('react')
const esbuild = require('esbuild')
let checks = 0
const check = (ok, label) => { assert.ok(ok, label); checks++; console.log('PASS: ' + label) }
const fixture = { states: [], cursor: 0, effects: [], notices: [], navigations: [], authCalls: [], fetches: [], refreshes: 0 }
global.__authLimitFixture = fixture
function elements(node, output = []) { if (!node || typeof node !== 'object') return output; output.push(node); React.Children.forEach(node.props?.children, child => elements(child, output)); return output }
async function main() {
  const root = path.resolve(__dirname, '..')
  const plugin = { name: 'auth-limit-fixture', setup(build) {
    build.onResolve({ filter: /^react$|^react-router-dom$|\/useAuth$|notifications\/notify$|\/token-storage$|\/refresh-token$/ }, args => ({ path: args.path, namespace: 'fixture' }))
    build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ contents:
      args.path === 'react' ? `const R=require('react'),f=global.__authLimitFixture;module.exports={...R,useState(initial){const i=f.cursor++;if(!(i in f.states))f.states[i]=typeof initial==='function'?initial():initial;return[f.states[i],v=>f.states[i]=typeof v==='function'?v(f.states[i]):v]},useRef(initial){const i=f.cursor++;return f.states[i]??(f.states[i]={current:initial})},useMemo(fn){return fn()},useEffect(fn){f.effects.push(fn)}}` :
      args.path === 'react-router-dom' ? `const f=global.__authLimitFixture;export const Link=({children,...props})=>require('react').createElement('a',props,children);export const useLocation=()=>({search:''});export const useNavigate=()=> (...args)=>f.navigations.push(args);` :
      args.path.endsWith('/useAuth') ? `const f=global.__authLimitFixture;export const useAuth=()=>({login:f.login,register:f.register});` :
      args.path.endsWith('/notify') ? `const f=global.__authLimitFixture;export const notify={error:(reason,fallback,id)=>f.notices.push({message:reason.message,id}),success:message=>f.notices.push({message})};` :
      args.path.endsWith('/token-storage') ? `export const getStoredSession=()=>global.__authLimitFixture.session;` :
      `export const refreshStoredSession=async()=>{global.__authLimitFixture.refreshes++;};`
    }))
  } }
  const output = await esbuild.build({ absWorkingDir: root, stdin: { resolveDir: root, loader: 'ts', contents:
    `export * from './src/shared/api/rate-limit';export * from './src/shared/api/api-error';export * from './src/shared/api/http-client';export * from './src/shared/hooks/useRateLimitCooldown';export {default as LoginPage} from './src/workspaces/auth/pages/LoginPage';export {default as RegisterPage} from './src/workspaces/auth/pages/RegisterPage';`
  }, bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic', external: ['react/jsx-runtime', 'lucide-react'], loader: { '.png': 'dataurl' }, plugins: [plugin], define: { 'import.meta.env.VITE_API_URL': "'/api'" } })
  const compiled = new Module(path.join(root, 'tests', 'auth-rate-limit.compiled.cjs'), module)
  compiled.filename = path.join(root, 'tests', 'auth-rate-limit.compiled.cjs'); compiled.paths = module.paths
  compiled._compile(output.outputFiles[0].text, compiled.filename)
  const { ApiError, retryAfterSeconds, rateLimitMessage, apiRequest, apiDownload, LoginPage, RegisterPage, useRateLimitCooldown } = compiled.exports
  check(retryAfterSeconds('12', null) === 12, 'Numeric Retry-After parsed')
  const now = Date.UTC(2030, 0, 1)
  check(retryAfterSeconds(new Date(now + 12000).toUTCString(), null, now) === 12, 'HTTP-date wait parsed relative to current time')
  check(retryAfterSeconds(null, { retryAfterSeconds: 7 }) === 7, 'Safe body fallback works when header is unavailable')
  check(retryAfterSeconds('12', { retryAfterSeconds: 7 }) === 12, 'Header takes priority over body')
  for (const value of ['-1', '0', '1.5', 'Infinity', '999999999999999999', 'database error', new Date(now - 1000).toUTCString()])
    check(retryAfterSeconds(value, { retryAfterSeconds: -1 }, now) === undefined, 'Invalid/expired retry metadata rejected')
  for (const value of [null, '12', 1.5, 0, -10, Infinity, 86401])
    check(retryAfterSeconds(null, { retryAfterSeconds: value }) === undefined, 'Malformed body wait rejected')
  check(rateLimitMessage(12).includes('12 giây') && rateLimitMessage().includes('chờ một chút'), 'Accented wait messages with safe fallback')
  const originalFetch = global.fetch, originalWindow = global.window, originalNow = Date.now
  try {
    fixture.session = { accessToken: 'synthetic', refreshToken: 'synthetic' }
    global.fetch = async (url, options) => {
      fixture.fetches.push({ url, options })
      return new Response(JSON.stringify({ message: 'SQL_SECRET must not appear', retryAfterSeconds: 7 }), { status: 429, headers: { 'Retry-After': '12' } })
    }
    async function denied(action, label) {
      try { await action(); throw new Error('Expected 429') }
      catch (error) { check(error instanceof ApiError && error.status === 429 && error.retryAfterSeconds === 12 && error.message === rateLimitMessage(12), label) }
    }
    await denied(() => apiRequest('/auth/login', { method: 'POST', body: '{}', skipAuth: true }), 'HTTP adapter exposes safe wait, not diagnostic body')
    check(fixture.fetches.length === 1 && fixture.refreshes === 0, '429 never refreshes session or resends POST')
    await denied(() => apiDownload('/synthetic'), 'Download uses identical safe 429 handling')
    check(fixture.fetches.length === 2 && fixture.refreshes === 0, 'Download rejection is not automatically retried')

    let clock = now, timer, cleared = false
    Date.now = () => clock
    global.window = { setInterval(fn) { timer = fn; return 41 }, clearInterval(id) { cleared = id === 41 } }
    const reset = () => { fixture.states = []; fixture.cursor = 0; fixture.effects = []; fixture.notices = []; fixture.navigations = []; fixture.authCalls = [] }
    const render = Page => { fixture.cursor = 0; fixture.effects = []; return elements(Page()) }
    for (const [Page, method] of [[LoginPage, 'login'], [RegisterPage, 'register']]) {
      reset()
      fixture.login = fixture.register = async request => { fixture.authCalls.push(request); throw new ApiError(rateLimitMessage(12), 429, null, 12) }
      let tree = render(Page)
      if (method === 'login') {
        tree.find(node => node.props?.label === 'Tên đăng nhập hoặc email').props.onChange({ target: { value: 'demo-user' } })
        tree.find(node => node.props?.label === 'Mật khẩu').props.onChange({ target: { value: 'demo-password' } })
      } else {
        const values = { 'Họ và tên *': 'Người dùng DEMO', 'Số điện thoại *': '0987654321', 'Mật khẩu *': 'demo-password', 'Xác nhận mật khẩu *': 'demo-password' }
        for (const [label, value] of Object.entries(values)) { tree = render(Page); tree.find(node => node.props?.label === label).props.onChange({ target: { value } }) }
        render(Page).find(node => node.type === 'input' && node.props.type === 'checkbox').props.onChange({ target: { checked: true } })
      }
      tree = render(Page)
      const form = tree.find(node => node.type === 'form')
      const event = { preventDefault() {} }
      await Promise.all([form.props.onSubmit(event), form.props.onSubmit(event)])
      check(fixture.authCalls.length === 1, method + ' duplicate submit blocked before request')
      check(fixture.notices.length === 1 && fixture.notices[0].message.includes('12 giây'), method + ' shows one safe Sonner wait notification')
      check(fixture.navigations.length === 0, method + ' does not navigate or claim success after 429')
      tree = render(Page)
      check(tree.some(node => node.type === 'button' && node.props.disabled && String(node.props.children).includes('12 giây')), method + ' submit disabled during cooldown')
      check(tree.some(node => node.props?.value === 'demo-password'), method + ' preserves entered data after rejection')
      await tree.find(node => node.type === 'form').props.onSubmit(event)
      check(fixture.authCalls.length === 1 && fixture.notices.length === 1, method + ' cannot resubmit through handler during wait')
      const cleanup = fixture.effects.at(-1)()
      clock += 13000; timer(); cleanup()
      tree = render(Page)
      check(!tree.some(node => node.type === 'button' && String(node.props.children).includes('giây')), method + ' wait clears using elapsed time')
      check(cleared, method + ' timer is cleaned up')
      check(fixture.authCalls.length === 1, method + ' expiry never sends a request')
    }

    reset(); fixture.cursor = 0
    let cooldown = useRateLimitCooldown()
    check(!cooldown.start(new ApiError('Sai mật khẩu.', 401)) && fixture.states[1] === 0, 'Ordinary auth error never starts cooldown')
    check(cooldown.start(new ApiError(rateLimitMessage(), 429)) && fixture.states[1] === 60, 'Missing wait uses bounded client fallback')
    fixture.cursor = 0; cooldown = useRateLimitCooldown()
    check(cooldown.isBlocked(), 'Fallback deadline guards the handler')
    check(fixture.fetches.length === 2, 'Cooldown hook never performs network requests')
  } finally { global.fetch = originalFetch; global.window = originalWindow; Date.now = originalNow; delete global.__authLimitFixture }
  console.log(`Auth rate-limit frontend: ${checks} passed. Offline synthetic HTTP/page/hook checks only.`)
}
main().catch(error => { console.error(error); process.exitCode = 1 })
