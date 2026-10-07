const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const { buildSync } = require('esbuild')
const React = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

const root = path.resolve(__dirname, '..')
const entry = path.join(root, 'src/workspaces/public/components/PublicCatalogCarousel.tsx')
const built = buildSync({ entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external', loader: { '.css': 'empty' }, jsx: 'automatic' })
const loaded = new Module(entry, module)
loaded.filename = entry
loaded.paths = Module._nodeModulePaths(root)
loaded._compile(built.outputFiles[0].text, entry)
const Carousel = loaded.exports.default
let checks = 0
function check(label, fn) { fn(); checks++; console.log('PASS: ' + label) }
for (const [label, variant] of [['bác sĩ', 'doctors'], ['chuyên khoa', 'specialties']]) {
  for (const count of [0, 1, 17]) {
    const children = Array.from({ length: count }, (_, index) => React.createElement('a', { key: index, href: '/demo/' + index }, 'Lựa chọn ' + index))
    const html = renderToStaticMarkup(React.createElement(Carousel, { label, variant }, children))
    check(`${variant}: renders all ${count} choices, accessible controls and list`, () => {
      assert.equal((html.match(/<li /g) || []).length, count)
      assert.equal((html.match(/<button /g) || []).length, 2)
      assert.ok(html.includes('aria-label="Xem ' + label + ' trước"'))
      assert.ok(html.includes('aria-label="Xem ' + label + ' tiếp theo"'))
      assert.ok(html.includes('aria-label="Danh sách ' + label + '"'))
      assert.match(html, /<ul[^>]*tabindex="0"[^>]*aria-describedby=/)
      const listId = html.match(/<ul id="([^"]+)"/)[1]
      assert.equal((html.match(/aria-controls="([^"]+)"/g) || []).filter(value => value.includes(listId)).length, 2)
    })
  }
}
const source = fs.readFileSync(entry, 'utf8')
check('Scroll/resize observers are cleaned up; no autoplay', () => {
  assert.match(source, /removeEventListener\('scroll', updateBounds\)/)
  assert.match(source, /observer.disconnect\(\)/)
  assert.doesNotMatch(source, /setInterval|setTimeout/)
})
check('Reduced motion and keyboard navigation preserve child link interaction', () => {
  assert.match(source, /prefers-reduced-motion: reduce/)
  assert.match(source, /event.target !== event.currentTarget/)
  for (const key of ['ArrowLeft', 'ArrowRight', 'Home', 'End']) assert.ok(source.includes(key))
})
check('Home includes full doctors/specialties while preserving existing error/loading states', () => {
  const home = fs.readFileSync(path.join(root, 'src/workspaces/public/pages/HomePage.tsx'), 'utf8')
  assert.match(home, /sectionState\(1, specialties.length, 'chuyên khoa'\) \?\? <PublicCatalogCarousel/)
  assert.match(home, /sectionState\(0, doctors.length, 'bác sĩ'\) \?\? <PublicCatalogCarousel/)
  assert.match(home, /variant="specialties">\{specialties.map/)
  assert.match(home, /variant="doctors">\{doctors.map/)
  assert.doesNotMatch(home, /specialties.slice\(0, 10\)|doctors.slice\(0, 4\)/)
})
check('Responsive, native horizontal swipe and visible scrollbar styles', () => {
  const css = fs.readFileSync(path.join(path.dirname(entry), 'public-catalog-carousel.css'), 'utf8')
  for (const rule of ['overflow-x: auto', 'scroll-snap-type: x mandatory', 'scroll-snap-align: start', 'scrollbar-width: thin', 'min-width: 640px', 'min-width: 1024px']) assert.ok(css.includes(rule))
})
console.log(`${checks} carousel render/source checks passed. Browser interactions are checked separately using the isolated fixture.`)
