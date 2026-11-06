# PCB Schematic Diagram for DeepSeek Harness

[中文](README.zh.md) | English

An independently installable right-sidebar viewer for `.diagram` files containing SVG. Provides scrolling, 25–400% zoom, Ctrl/Meta-wheel zoom anchored at the pointer, actual size and fit-to-window. DSH supplies file loading, Reload, automatic refresh and Plain text fallback. The drawing keeps its authored colors on a white canvas in both app themes.

## Install

Validated with DeepSeek Harness **0.2.2-rc.1**, Node **24.9+**. Compatibility is pinned while DSH's plugin API is pre-stable. Both the browser UI and Electron desktop use this browser contribution.

In **Plugins → Add plugin**, enter:

```text
https://github.com/jiexingluo/dsh-pcb-schematic-diagram/releases/download/v0.1.0/dsh-pcb-schematic-diagram-0.1.0.tgz
```

Find **PCB Schematic Diagram** in installed plugins. If requested, restart DSH; open a `.diagram` from workspace Files. Web and Desktop have separate plugin profiles: install in the app you use. Sharing sessions does not share installed plugins.

For a stopped profile, the CLI equivalents are:

```powershell
dsh plugin --profile web add "https://github.com/jiexingluo/dsh-pcb-schematic-diagram/releases/download/v0.1.0/dsh-pcb-schematic-diagram-0.1.0.tgz"
dsh plugin --profile desktop add "https://github.com/jiexingluo/dsh-pcb-schematic-diagram/releases/download/v0.1.0/dsh-pcb-schematic-diagram-0.1.0.tgz"
```

The repository includes prebuilt `lib/` assets, so a version source archive is also installable: `https://github.com/jiexingluo/dsh-pcb-schematic-diagram/archive/refs/tags/v0.1.0.tar.gz`. No installation scripts or DSH source modifications are required. This package coexists with `dsh-pcb-resource-map`; each claims only its own extension.

**Not published to npm yet.** The intended package name is `dsh-pcb-schematic-diagram`. A manual npm publication workflow is provided; it requires a repository `NPM_TOKEN` with publish access. Pushes do not publish to npm.

## File support and limits

- Accepts complete UTF-8 SVG, optionally enclosed in a Markdown SVG/XML fence, with a valid `viewBox` or positive absolute dimensions. Physical lengths (`mm`, `cm`, `in`, `pt`, `pc`) are converted to CSS pixels.
- Preserves local arrow markers, gradients, CSS, text and fragment references. Rejects malformed XML, DOCTYPEs and missing dimensions. Does not attempt to render malformed raw SVG through an image fallback.
- Uses DOMPurify and a sandboxed, script-free iframe with a restrictive content policy. External resources, links, script, embedded HTML and animation are blocked. Font rendering depends on fonts available on the machine. The host's full-file read limit applies.
- Fit mode follows panel resizing until manual zoom. Replacement content resets the viewport; reloading identical bytes keeps the viewer usable.
- Read-only: no file writes, hardware control, EDA editing, `.SchDoc` parsing or diagram generation. SideTest's workflow-specific automatic opening is not included in this release.

## Develop

```powershell
npm install --global pnpm@11.28.5
pnpm install --frozen-lockfile
npm run check
npm test
npm run build
npm run verify:package
npm pack
```

Commit rebuilt `lib/` assets. CI verifies types, tests, deterministic builds and the standalone module loader, then uploads an installable `.tgz`. React and shared UI primitives come from DSH; DOMPurify is bundled with its license.

Run a browser replay against a built DSH checkout, without a model API key:

```powershell
$env:DSH_CHECKOUT = "D:/CodeBase/deepseek-harness-master"
node scripts/test-dsh.mjs
# Optionally use a local private diagram instead of the synthetic fixture:
$env:DSH_DIAGRAM_SAMPLE = "C:/path/to/example.diagram"
node scripts/test-dsh.mjs
```

The runner temporarily places a scenario in DSH's Web harness and removes it afterward. Private diagrams and screenshots stay outside the published package.

## License and implementation

MIT. The package/build structure and isolated SVG rendering are derived from [dsh-pcb-resource-map](https://github.com/jiexingluo/dsh-pcb-resource-map), based on DeepSeek Harness commit `7f18821d`. Retains the upstream MIT notice. SideTest's `.diagram` viewer was used to identify user-facing requirements; no SideTest source is copied or changed. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) for DOMPurify licensing.
