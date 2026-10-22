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
global.MutationObserver = dom.window.MutationObserver
global.IS_REACT_ACT_ENVIRONMENT = true
const React = require('react')
const { act, useState } = React
const { createRoot } = require('react-dom/client')
const { MemoryRouter, useNavigate, useLocation } = require('react-router-dom')
const project = path.resolve(__dirname, '..')
const filename = path.join(project, 'src/routes/RouteScrollManager.tsx')
const built = buildSync({ entryPoints: [filename], bundle: true, write: false, format: 'cjs', platform: 'node', packages: 'external', jsx: 'automatic' })
const loaded = new Module(filename, module)
loaded.filename = filename
loaded.paths = Module._nodeModulePaths(project)
loaded._compile(built.outputFiles[0].text, filename)
const Manager = loaded.exports.default
let root, navigate, attachSection, scrolls, sections

function Fixture() {
  navigate = useNavigate()
  const location = useLocation()
  const [late, setLate] = useState(false)
  attachSection = () => setLate(true)
  return React.createElement(React.Fragment, null,
    React.createElement(Manager),
    React.createElement('main', { 'data-route': location.pathname },
      React.createElement('section', { id: 'about' }),
      React.createElement('section', { id: 'về-FoMed' }),
      late && React.createElement('section', { id: 'late' })))
}
async function mount(initial = '/') {
  scrolls = []; sections = []
  window.history.scrollRestoration = 'auto'
  window.scrollTo = options => scrolls.push(options)
  window.HTMLElement.prototype.scrollIntoView = function(options) { sections.push({ id: this.id, ...options }) }
  root = createRoot(document.getElementById('root'))
  await act(async () => root.render(React.createElement(React.StrictMode, null, React.createElement(MemoryRouter, { initialEntries: [initial] }, React.createElement(Fixture)))))
}
const go = async destination => act(async () => navigate(destination))
test.afterEach(async () => { if (root) await act(async () => root.unmount()); root = null })

test('Initial entry scrolls immediately to the top and disables browser restoration', async () => {
  await mount()
  assert.deepEqual(scrolls.at(-1), { top: 0, left: 0, behavior: 'instant' })
  assert.equal(window.history.scrollRestoration, 'manual')
})

test('Different pages, detail IDs, query changes and repeated links reset scroll', async () => {
  await mount()
  for (const url of ['/doctors', '/doctors/7', '/doctors/8', '/services?page=2', '/services?page=3', '/services?page=3']) {
    scrolls.length = 0
    await go(url)
    assert.deepEqual(scrolls, [{ top: 0, left: 0, behavior: 'instant' }], url)
  }
})

test('Back and forward also open at the top instead of restoring the old bottom offset', async () => {
  await mount()
  await go('/doctors'); await go('/services')
  for (const delta of [-1, 1]) {
    scrolls.length = 0
    await go(delta)
    assert.equal(scrolls.length, 1)
    assert.equal(scrolls[0].top, 0)
  }
})

test('Explicit section links and encoded Vietnamese IDs keep their destination', async () => {
  await mount()
  await go('/#about')
  assert.deepEqual(sections.at(-1), { id: 'about', block: 'start', behavior: 'instant' })
  await go('/#v%E1%BB%81-FoMed')
  assert.equal(sections.at(-1).id, 'về-FoMed')
})

test('Section links wait for asynchronously rendered destination content', async () => {
  await mount('/#late')
  assert.equal(sections.length, 0)
  await act(async () => attachSection())
  assert.deepEqual(sections, [{ id: 'late', block: 'start', behavior: 'instant' }])
})

test('Leaving a pending section stops it from moving the next page', async () => {
  await mount('/#late')
  await go('/services')
  await act(async () => attachSection())
  assert.equal(sections.length, 0)
})

test('Missing or malformed fragments are harmless and remain at the top', async () => {
  await mount('/#%broken')
  assert.equal(sections.length, 0)
  assert.equal(scrolls.at(-1).top, 0)
  await go('/#')
  assert.equal(sections.length, 0)
})

test('Unmount restores the previous history setting, including StrictMode cleanup', async () => {
  await mount()
  await act(async () => root.unmount())
  root = null
  assert.equal(window.history.scrollRestoration, 'auto')
})

test('Manager is installed once inside BrowserRouter for every workspace', () => {
  const main = fs.readFileSync(path.join(project, 'src/main.tsx'), 'utf8')
  assert.match(main, /<BrowserRouter>\s*<RouteScrollManager \/>/)
  assert.equal((main.match(/<RouteScrollManager \/>/g) || []).length, 1)
})
