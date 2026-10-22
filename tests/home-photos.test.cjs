const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const { JSDOM } = require('jsdom')
const { buildSync } = require('esbuild')
const dom = new JSDOM('<!doctype html><div id="root"></div>', { url: 'http://localhost/' })
global.window = dom.window
global.document = dom.window.document
global.Node = dom.window.Node
global.Element = dom.window.Element
global.HTMLElement = dom.window.HTMLElement
global.IS_REACT_ACT_ENVIRONMENT = true
const React = require('react')
const { act } = React
const { createRoot } = require('react-dom/client')
const { MemoryRouter } = require('react-router-dom')
const project = path.resolve(__dirname, '..')
const filename = path.join(project, 'src/workspaces/public/pages/HomePage.tsx')
const built = buildSync({ entryPoints: [filename], bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external', external: ['*/useAuth', '*/catalog-api'], loader: { '.css': 'empty', '.png': 'dataurl', '.jpg': 'dataurl' }, jsx: 'automatic' })
const loaded = new Module(filename, module)
loaded.filename = filename
loaded.paths = Module._nodeModulePaths(project)
const originalRequire = loaded.require.bind(loaded)
loaded.require = request => request.endsWith('/useAuth')
  ? { useAuth: () => ({ user: null, isReady: true }) }
  : request.endsWith('/catalog-api') ? { catalogApi: { doctors: async () => [], specialties: async () => [], services: async () => [] } } : originalRequire(request)
loaded._compile(built.outputFiles[0].text, filename)
const Home = loaded.exports.default
let root
async function mount() {
  root = createRoot(document.getElementById('root'))
  await act(async () => root.render(React.createElement(MemoryRouter, null, React.createElement(Home))))
}
test.afterEach(async () => { if (root) await act(async () => root.unmount()); root = null })

test('Uses exactly two local stock photos, without replacing doctor portraits', async () => {
  await mount()
  assert.equal(document.querySelectorAll('.home-stock-photo').length, 2)
  for (const img of document.querySelectorAll('.home-stock-photo')) assert.match(img.src, /^data:image\/jpeg/)
  const source = fs.readFileSync(filename, 'utf8')
  assert.match(source, /doctors\.map\(\(doctor\) => <DoctorPreviewCard/)
})
test('Hero image is eager/high priority; below-fold photo is lazy with reserved dimensions', async () => {
  await mount()
  const hero = document.querySelector('.home-hero-photo img')
  const about = document.querySelector('.home-about-photo img')
  assert.equal(hero.getAttribute('loading'), 'eager')
  assert.equal(hero.getAttribute('fetchpriority'), 'high')
  assert.equal(about.getAttribute('loading'), 'lazy')
  for (const img of [hero, about]) {
    assert.ok(Number(img.getAttribute('width')) > 0 && Number(img.getAttribute('height')) > 0)
    assert.match(img.alt, /^Ảnh minh họa:/)
  }
})
test('Captions disclose stock use and link to the original photographer pages', async () => {
  await mount()
  const captions = [...document.querySelectorAll('figcaption')]
  assert.equal(captions.length, 2)
  assert.ok(captions.some(element => element.textContent.includes('không phải cơ sở FoMed')))
  for (const link of document.querySelectorAll('figcaption a')) {
    assert.equal(new URL(link.href).hostname, 'www.pexels.com')
    assert.equal(link.target, '_blank')
    assert.ok(link.rel.includes('noopener') && link.rel.includes('noreferrer'))
  }
})
test('Image failure gives a labelled fallback while search and booking remain available', async () => {
  await mount()
  const img = document.querySelector('.home-hero-photo img')
  await act(async () => img.dispatchEvent(new window.Event('error')))
  assert.equal(document.querySelectorAll('.home-hero-photo img').length, 0)
  assert.match(document.querySelector('.home-photo-fallback').getAttribute('aria-label'), /chưa tải được ảnh/)
  assert.ok(document.querySelector('input[name="doctorSearch"]'))
  assert.equal(document.querySelector('.home-photo-appointment').getAttribute('href'), '/doctors')
})
test('Local images are small JPEG assets and provenance is kept in the repository', () => {
  let total = 0
  for (const file of ['healthcare-stethoscope.jpg', 'clinic-waiting-room.jpg']) {
    const bytes = fs.readFileSync(path.join(project, 'src/assets/images/home', file))
    assert.equal(bytes.readUInt16BE(0), 0xffd8)
    total += bytes.length
  }
  assert.ok(total < 200 * 1024)
  const attribution = fs.readFileSync(path.join(project, 'src/assets/images/home/ATTRIBUTION.md'), 'utf8')
  assert.match(attribution, /Thirdman/)
  assert.match(attribution, /Los Muertos Crew/)
})
