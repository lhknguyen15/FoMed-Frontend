const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const read = file => fs.readFileSync(path.join(root, file), 'utf8')
const theme = read('src/workspaces/public/public-theme.css')
const home = read('src/workspaces/public/pages/HomePage.tsx')
function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
  return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2]
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (values[0] + .05) / (values[1] + .05)
}
test('Defines exactly two named brand colors, scoped to public pages', () => {
  assert.match(theme, /\.public-site\s*\{/)
  assert.match(theme, /--public-primary: #0f766e;/)
  assert.match(theme, /--public-secondary: #ddefe8;/)
  assert.doesNotMatch(theme, /(?:^|\n)\s*(?::root|body|html|\.admin|\.cms)\b/)
  assert.ok(read('src/App.tsx').includes('import "./workspaces/public/public-theme.css"'))
})
test('Public page roots opt in explicitly; authenticated workspaces stay untouched', () => {
  for (const file of ['HomePage', 'HealthNewsPage', 'DoctorListPage', 'DoctorDetailPage', 'SpecialtyListPage', 'ServiceListPage', 'FeatureComingSoonPage']) {
    assert.match(read(`src/workspaces/public/pages/${file}.tsx`), /className="public-site /)
  }
  assert.doesNotMatch(read('src/cms/dashboard/pages/AdminDashboardPage.tsx'), /public-site/)
})
test('Home sections alternate mint and neutral with specialties/services matching', () => {
  const ids = ['specialties', 'doctors', 'services', 'about', 'how-it-works', 'faq']
  const accents = ids.map(id => home.match(new RegExp(`id="${id}" className="([^"]+)"`))[1].includes('home-section-tinted'))
  assert.deepEqual(accents, [false, true, false, true, false, true])
  assert.equal(accents[0], accents[2])
  assert.match(read('src/workspaces/public/pages/home-page.css'), /\.home-hero\s*\{ background: var\(--home-surface\); \}/)
})
test('Homepage and blog consume shared tokens rather than separate brand palettes', () => {
  for (const file of ['src/workspaces/public/pages/home-page.css', 'src/workspaces/public/pages/health-news.css']) {
    const css = read(file)
    assert.ok(css.includes('var(--public-primary)'))
    assert.ok(css.includes('var(--public-secondary)'))
  }
})
test('Primary and secondary pairing has readable normal-text contrast', () => {
  for (const [text, background] of [['#ffffff', '#0f766e'], ['#0f766e', '#ddefe8'], ['#173c38', '#ddefe8'], ['#45665d', '#ddefe8'], ['#f5f7f4', '#123f3b'], ['#ddefe8', '#123f3b']]) {
    assert.ok(contrast(text, background) >= 4.5, `${text} on ${background}: ${contrast(text, background).toFixed(2)}`)
  }
})
test('Footer copy uses high-contrast neutrals and booking banner uses the secondary surface', () => {
  assert.match(theme, /--public-footer-surface: #123f3b;/)
  assert.match(theme, /\.public-site \.public-footer \{ background: var\(--public-footer-surface\)/)
  assert.match(theme, /\.public-site \.public-footer :is\([^}]+color: #f5f7f4;/)
  assert.match(theme, /\.public-site \.public-footer \.text-slate-300 \{ color: var\(--public-secondary\)/)
  assert.match(theme, /\.public-site \.public-booking-cta \{ background: var\(--public-secondary\)/)
})

test('Homepage doctor portraits have a neutral surface distinct from the mint section', () => {
  const css = read('src/workspaces/public/pages/home-page.css')
  assert.match(css, /\.fomed-home \.catalog-doctor-photo \{[^}]*background: #f6f8f7;[^}]*border-bottom:/)
  assert.match(css, /\.fomed-home \.catalog-doctor-card \{[^}]*background: white;[^}]*box-shadow:/)
  assert.doesNotMatch(css, /\.fomed-home \.catalog-doctor-photo \{[^}]*background: var\(--home-surface\)/)
})
