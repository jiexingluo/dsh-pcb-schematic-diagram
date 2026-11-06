import { readFileSync } from 'node:fs'
import { strict as assert } from 'node:assert'
import { runInNewContext } from 'node:vm'
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const bundle = readFileSync('lib/client.js', 'utf8')
let definition
runInNewContext(bundle, { window: { __ModuleLoader__: { load: value => { definition = value } } } })
assert.equal(definition.id, pkg.name)
assert.equal(typeof definition.factory, 'function')
assert.ok(bundle.includes('DOMPurify'))
assert.ok(!bundle.includes('@deepseek-ai/dsh-client-ui-resmap'))
assert.ok(readFileSync('cordis.patch.yml', 'utf8').includes('insert:'))
assert.ok(!JSON.stringify(pkg).includes('workspace:'))
console.log('Standalone loader identity, insertion patch and package dependencies verified')
