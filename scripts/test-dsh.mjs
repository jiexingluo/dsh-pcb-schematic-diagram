/** Run the synthetic browser scenario through a built DSH checkout's real profile. */
import { readFile, writeFile, unlink } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const checkout = process.env.DSH_CHECKOUT
if (!checkout) throw new Error('Set DSH_CHECKOUT to a built DeepSeek Harness checkout')
const plugin = resolve(fileURLToPath(new URL('..', import.meta.url)))
const source = await readFile(new URL('../tests/integration/diagram.e2e.template', import.meta.url), 'utf8')
const target = join(checkout, 'apps/web/tests/pcb-diagram-standalone.e2e.ts')
await writeFile(target, source.replace('PLUGIN_DIRECTORY', JSON.stringify(plugin)), { flag: 'wx' })
try {
  const result = spawnSync(process.execPath, [join(checkout, 'node_modules/vitest/vitest.mjs'), 'run', '--config', 'vitest.web.config.ts', 'apps/web/tests/pcb-diagram-standalone.e2e.ts'], {
    cwd: checkout, stdio: 'inherit', env: { ...process.env, DSH_SNAPSHOT: 'replay' },
  })
  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
} finally { await unlink(target) }
