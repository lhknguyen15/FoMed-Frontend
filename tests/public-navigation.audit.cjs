const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const { buildSync } = require('esbuild')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { MemoryRouter } = require('react-router-dom')

const root = path.resolve(__dirname, '..')
const entry = path.join(root, 'src/workspaces/public/components/PublicHeader.tsx')
function loadComponent(filename) {
  const built = buildSync({ entryPoints: [filename], bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', loader: { '.png': 'dataurl' }, jsx: 'automatic' })
  const loaded = new Module(filename, module)
  loaded.filename = filename
  loaded.paths = Module._nodeModulePaths(root)
  loaded._compile(built.outputFiles[0].text, filename)
  return loaded.exports.default
}
const Header = loadComponent(entry)
let checks = 0
function check(label, fn) { fn(); checks++; console.log(`PASS: ${label}`) }
function render(route) { return renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [route] }, React.createElement(Header))) }

for (const [route, label] of [['/specialties', 'Chuyên khoa'], ['/doctors', 'Bác sĩ'], ['/services', 'Dịch vụ'], ['/doctors/7', 'Bác sĩ'], ['/online-consultation', 'Tư vấn trực tuyến'], ['/health-news', 'Tin tức y tế']]) {
  const html = render(route)
  check(`Active link: ${route}`, () => {
    const active = [...html.matchAll(/<a\b[^>]*aria-current="page"[^>]*>(.*?)<\/a>/g)].map(match => match[1])
    assert.equal(active.length, 2) // Desktop and mobile, same active destination.
    assert.ok(active.every(text => text.replace(/<[^>]*>/g, '').startsWith(label)))
  })
}
const html = render('/')
check('FoMed logo reserves dimensions', () => assert.match(html, /<img[^>]*width="44"[^>]*height="44"/))
check('Mobile menu starts collapsed and is linked to toggle', () => {
  assert.match(html, /aria-expanded="false" aria-controls="public-mobile-menu"/)
  assert.match(html, /<nav id="public-mobile-menu" hidden=""/)
})
check('Header has only one login action', () => {
  assert.equal((html.match(/href="\/login"/g) || []).length, 1)
  assert.doesNotMatch(html, /Đặt lịch khám|Tài khoản|href="\/register"/)
})
check('Accessible navigation labels', () => { assert.match(html, /aria-label="Điều hướng chính"/); assert.match(html, /aria-label="Menu di động"/) })
check('Catalog destinations preserve booking discovery', () => { for (const route of ['/doctors', '/specialties', '/services']) assert.ok(html.includes('href="' + route + '"')) })
check('Home is available through logo, not a navigation item', () => { assert.match(html, /aria-label="FoMed - trang chủ"/); assert.doesNotMatch(html, />Trang chủ<\/a>/) })
check('Catalogs are grouped in collapsed booking disclosures', () => {
  assert.match(html, /aria-expanded="false" aria-controls="public-booking-menu"/)
  assert.match(html, /id="public-booking-menu" hidden=""/)
  assert.match(html, /id="public-mobile-booking-menu" hidden=""/)
  for (const label of ['Bác sĩ', 'Chuyên khoa', 'Dịch vụ']) assert.ok(html.includes('aria-label="' + label + '"'))
})
const source = fs.readFileSync(entry, 'utf8')
check('Full-width header separates logo and one right-aligned group', () => {
  assert.doesNotMatch(source, /max-w-7xl items-center justify-between/)
  assert.match(source, /className="ml-auto flex shrink-0 items-center/)
})
check('Header typography overrides shorthand only in header', () => {
  const css = fs.readFileSync(path.join(root, 'src/index.css'), 'utf8')
  assert.match(css, /\.public-header \.public-nav-item\s*\{[^}]*font-family: var\(--font-sans\);[^}]*font-size: 0.875rem;[^}]*font-weight: 600;/)
  assert.match(source, /public-nav-item inline-flex items-center/)
  assert.match(source, /public-nav-item whitespace-nowrap/)
})
check('Escape restores focus and listeners clean up', () => {
  assert.match(source, /event.key !== 'Escape'/)
  assert.match(source, /menuButtonRef.current\?\.focus\(\)/)
  assert.match(source, /removeEventListener\('keydown', closeOnEscape\)/)
  assert.match(source, /removeEventListener\('pointerdown', closeOutside\)/)
})
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
check('Browser icon uses existing FoMed asset', () => {
  assert.match(index, /rel="icon" type="image\/png" href="\/src\/assets\/images\/FoMed_Logo.png"/)
  assert.ok(fs.existsSync(path.join(root, 'src/assets/images/FoMed_Logo.png')))
})
const ComingSoonPage = loadComponent(path.join(root, 'src/workspaces/public/pages/FeatureComingSoonPage.tsx'))
const app = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf8')
for (const [feature, route, label] of [['consultation', '/online-consultation', 'Tư vấn trực tuyến'], ['news', '/health-news', 'Tin tức y tế']]) {
  check(`Coming-soon route: ${route}`, () => {
    assert.ok(app.includes('path="' + route + '" element={<FeatureComingSoonPage feature="' + feature + '" />}'))
    const page = renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [route] }, React.createElement(ComingSoonPage, { feature })))
    assert.match(page, /Chức năng đang phát triển<\/h1>/)
    assert.ok(page.includes(label))
    assert.match(page, /Chưa có thời gian ra mắt chính thức/)
    assert.match(page, /Tìm bác sĩ để đặt khám/)
    assert.match(page, /Về trang chủ/)
    assert.doesNotMatch(page, /<form/)
  })
}
console.log(`${checks} navigation checks passed. Render/source checks only; interaction requires browser verification.`)
