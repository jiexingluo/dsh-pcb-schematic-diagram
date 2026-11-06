import { build } from 'esbuild'
import { transform } from 'lightningcss'
import { readFile, mkdir, copyFile } from 'node:fs/promises'

const manifest = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
const external = ['react', 'react/jsx-runtime', '@deepseek-ai/dsh-client-ui-primitives']
const cssModules = {
  name: 'plugin-css-modules',
  setup(builder) {
    builder.onLoad({ filter: /\.module\.css$/ }, async ({ path }) => {
      const input = await readFile(path)
      const result = transform({ filename: path.split(/[\\/]/).at(-1), code: input, cssModules: true })
      const names = Object.fromEntries(Object.entries(result.exports ?? {}).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => [key, value.name]))
      return {
        loader: 'js',
        contents: `const id=${JSON.stringify(manifest.name)};if(!document.querySelector('style[data-plugin-css="'+id+'"]')){const style=document.createElement('style');style.dataset.plugin=id;style.dataset.pluginCss=id;style.textContent=${JSON.stringify(result.code.toString())};document.head.append(style)}export default ${JSON.stringify(names)};`,
      }
    })
  },
}
await mkdir(new URL('../lib', import.meta.url), { recursive: true })
await build({ entryPoints: ['src/index.ts'], outfile: 'lib/index.js', format: 'esm', platform: 'node', target: 'node24', bundle: true })
await build({
  entryPoints: ['src/client/index.ts'], outfile: 'lib/client.js',
  format: 'cjs', platform: 'browser', target: 'es2022', bundle: true,
  jsx: 'automatic', external, plugins: [cssModules], legalComments: 'inline',
  // Omit esbuild's module-path comments, which contain platform-specific pnpm directory names.
  minifyWhitespace: true,
  define: { 'process.env.NODE_ENV': '"production"' },
  banner: { js: `window.__ModuleLoader__.load({id:${JSON.stringify(manifest.name)},factory:(require)=>{const module={exports:{}};const exports=module.exports;` },
  footer: { js: 'return module.exports;}});' },
})
await copyFile('node_modules/dompurify/LICENSE', 'lib/DOMPURIFY-LICENSE')
console.log(`Built ${manifest.name}@${manifest.version}`)
