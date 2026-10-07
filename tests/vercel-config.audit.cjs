// Offline configuration checks only; no deploy, browser, API or database calls.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'))
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
let checks = 0
function check(condition, label) {
  assert.ok(condition, label)
  checks++
  console.log('PASS: ' + label)
}

check(config.$schema === 'https://openapi.vercel.sh/vercel.json', 'Official configuration schema declared')
check(config.framework === 'vite', 'Vite framework selected')
check(config.installCommand === 'npm ci', 'Dependency installation uses the lockfile')
check(config.buildCommand === 'npm run lint && npm run build', 'Lint must pass before building')
check(Boolean(pkg.scripts.lint) && Boolean(pkg.scripts.build), 'Configured commands exist')
check(config.outputDirectory === 'dist', 'Publish directory matches the default Vite output')
check(!('env' in config) && !('build' in config), 'No environment values embedded in deployment configuration')
check(config.rewrites.length === 1, 'One SPA rewrite without an API proxy')
const rewrite = config.rewrites[0]
check(rewrite.source === '/(.*)' && rewrite.destination === '/index.html', 'Official SPA fallback pattern preserved')
const route = new RegExp('^' + rewrite.source + '$')
for (const url of ['/', '/login', '/doctors', '/specialties', '/reception/cashier/170', '/admin/users']) {
  check(route.test(url), 'Fallback pattern matches: ' + url)
}
console.log(`Vercel configuration: ${checks} offline checks passed. Actual routing/CORS require a deployed site.`)
