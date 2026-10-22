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
function load(file) {
  const filename = path.join(project, file)
  const built = buildSync({ entryPoints: [filename], bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external', loader: { '.jpg': 'dataurl' }, jsx: 'automatic' })
  const loaded = new Module(filename, module)
  loaded.filename = filename
  loaded.paths = Module._nodeModulePaths(project)
  loaded._compile(built.outputFiles[0].text, filename)
  return loaded.exports
}
const { SpecialtyPreviewCard } = load('src/workspaces/public/components/PublicCatalogCards.tsx')
const { getSpecialtyPhoto, specialtyPhotos } = load('src/workspaces/public/components/specialty-photos.ts')
let root
async function mount(name = 'Nhi khoa') {
  root = createRoot(document.getElementById('root'))
  await act(async () => root.render(React.createElement(MemoryRouter, null, React.createElement(SpecialtyPreviewCard, { specialty: { specialtyId: 37, name } }))))
}
test.afterEach(async () => { if (root) await act(async () => root.unmount()); root = null })

test('Specialty mapping follows names, not list order or database IDs', () => {
  for (const [name, key] of [['Cơ xương khớp', 'musculoskeletal'], ['DA LIỄU', 'dermatology'], ['Nhi khoa', 'pediatrics'], ['Noi tiet', 'endocrinology'], ['Răng Hàm Mặt', 'dental'], ['Tai Mũi Họng', 'ent'], ['Tim mạch', 'cardiology'], ['Nội tổng quát', 'general'], ['Tiêu hóa', 'digestive'], ['Chuyên khoa mới', 'general']]) assert.equal(getSpecialtyPhoto(name).key, key)
})

test('Photos are local, lazy, labelled illustrative, and reserve their dimensions', async () => {
  await mount()
  const image = document.querySelector('.catalog-specialty-media img')
  assert.match(image.src, /^data:image\/jpeg/)
  assert.match(image.alt, /^Ảnh minh họa:/)
  assert.equal(image.loading || image.getAttribute('loading'), 'lazy')
  assert.equal(image.getAttribute('decoding'), 'async')
  assert.ok(+image.getAttribute('width') > 0 && +image.getAttribute('height') > 0)
  const link = document.querySelector('a')
  assert.equal(link.getAttribute('href'), '/doctors?specialtyId=37')
  assert.equal(link.getAttribute('aria-label'), 'Khám phá bác sĩ chuyên khoa Nhi khoa')
})

test('Failed image falls back without hiding the specialty or breaking navigation', async () => {
  await mount()
  await act(async () => document.querySelector('img').dispatchEvent(new window.Event('error')))
  assert.equal(document.querySelectorAll('img').length, 0)
  assert.ok(document.querySelector('.catalog-specialty-fallback svg'))
  assert.equal(document.querySelector('h3').textContent, 'Nhi khoa')
  assert.equal(document.querySelector('a').getAttribute('href'), '/doctors?specialtyId=37')
})

test('All downloaded photos stay under a bounded payload and have traceable sources', () => {
  let total = 0
  const attribution = fs.readFileSync(path.join(project, 'src/assets/images/specialties/ATTRIBUTION.md'), 'utf8')
  assert.equal(specialtyPhotos.length, 9)
  for (const photo of specialtyPhotos) {
    const bytes = fs.readFileSync(path.join(project, `src/assets/images/specialties/${photo.key}.jpg`))
    assert.equal(bytes.readUInt16BE(0), 0xffd8)
    total += bytes.length
    assert.equal(new URL(photo.source).hostname, 'www.pexels.com')
    assert.ok(attribution.includes(photo.source))
    assert.ok(attribution.includes(photo.author))
  }
  assert.ok(total < 400 * 1024)
})

test('Credits remain outside clickable cards and carousel layout stays responsive', () => {
  const home = fs.readFileSync(path.join(project, 'src/workspaces/public/pages/HomePage.tsx'), 'utf8')
  assert.match(home, /<details className="home-specialty-credits"><summary>Ảnh minh họa · Nguồn: Pexels/)
  assert.match(home, /không phải nhân sự hoặc cơ sở thực tế của FoMed/)
  assert.match(home, /href=\{photo.source\} target="_blank" rel="noopener noreferrer"/)
  const css = fs.readFileSync(path.join(project, 'src/workspaces/public/pages/home-page.css'), 'utf8')
  assert.match(css, /\.catalog-specialty-media \{[^}]*aspect-ratio: 16 \/ 11/)
  assert.match(css, /\.catalog-specialty-media img \{[^}]*object-fit: cover/)
})
