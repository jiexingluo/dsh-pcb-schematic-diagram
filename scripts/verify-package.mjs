import { readFileSync } from 'node:fs'
import { strict as assert } from 'node:assert'
import { runInNewContext } from 'node:vm'
import semver from 'semver'
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const dshRange = pkg.engines.dsh
assert.notEqual(semver.validRange(dshRange), null)
// Match DSH's includePrerelease behavior, including the excluded next-minor prereleases.
for (const version of [
  '0.2.2-rc.3', '0.2.2-rc.4', '0.2.2-rc.5', '0.2.2-rc.6',
  '0.2.2', '0.2.3-rc.1', '0.2.3', '0.2.99',
]) {
  assert.ok(semver.satisfies(version, dshRange, { includePrerelease: true }), `DSH ${version} must be admitted`)
}
for (const version of [
  '0.2.1', '0.2.2-rc.1', '0.2.2-rc.2',
  '0.3.0-alpha.1', '0.3.0-rc.1', '0.3.0', '1.0.0',
]) {
  assert.ok(!semver.satisfies(version, dshRange, { includePrerelease: true }), `DSH ${version} must be excluded`)
}
const bundle = readFileSync('lib/client.js', 'utf8')
let definition
runInNewContext(bundle, { window: { __ModuleLoader__: { load: value => { definition = value } } } })
assert.equal(definition.id, pkg.name)
assert.equal(typeof definition.factory, 'function')
assert.ok(bundle.includes('DOMPurify'))
assert.ok(!bundle.includes('@deepseek-ai/dsh-client-ui-resmap'))
assert.ok(readFileSync('cordis.patch.yml', 'utf8').includes('insert:'))
assert.ok(!JSON.stringify(pkg).includes('workspace:'))
console.log('DSH compatibility range, standalone loader identity, insertion patch and package dependencies verified')
