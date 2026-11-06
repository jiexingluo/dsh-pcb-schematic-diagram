# PCB Schematic Diagram for DeepSeek Harness

中文 | [English](README.md)

独立安装的 `.diagram` 原理示意图查看插件，在 DSH 右侧预览 SVG，支持滚动、25%～400% 缩放、Ctrl/Meta＋滚轮围绕指针缩放、100% 和适应窗口。文件读取、重新加载、自动刷新及纯文本回退沿用 DSH。深浅主题均使用白色图纸背景，保留图纸原有颜色。

## 安装

验证版本为 DeepSeek Harness **0.2.2-rc.1**、Node **24.9+**。DSH 插件接口尚未稳定，兼容声明暂时固定为该版本。支持 Web 和 Electron Desktop。

在要使用的应用中打开 **插件 → 添加插件**，输入：

```text
https://github.com/jiexingluo/dsh-pcb-schematic-diagram/releases/download/v0.1.0/dsh-pcb-schematic-diagram-0.1.0.tgz
```

在已安装插件中找到 **PCB Schematic Diagram**，按提示重启后，从工作区 Files 打开 `.diagram`。Web 与 Desktop 的插件配置独立，需要分别安装；会话记录共享不代表插件共享。

目标配置停止运行后，也可以使用命令：

Desktop 命令必须使用安装版提供的 `dsh`。从 DSH 源码启动的 CLI 无权管理 Desktop 保留配置；也可以直接使用安装版的插件页面。

```powershell
dsh plugin --profile web add "https://github.com/jiexingluo/dsh-pcb-schematic-diagram/releases/download/v0.1.0/dsh-pcb-schematic-diagram-0.1.0.tgz"
dsh plugin --profile desktop add "https://github.com/jiexingluo/dsh-pcb-schematic-diagram/releases/download/v0.1.0/dsh-pcb-schematic-diagram-0.1.0.tgz"
```

仓库提交 `lib/` 构建产物，也可以安装版本源码压缩包：`https://github.com/jiexingluo/dsh-pcb-schematic-diagram/archive/refs/tags/v0.1.0.tar.gz`。安装不依赖脚本或 DSH 源码。可与 PCB Resource Map 共存，两者分别处理 `.diagram` 和 `.resmap`。

**尚未发布到 npm。** 拟用包名为 `dsh-pcb-schematic-diagram`。仓库已提供手动发布流程，需要配置有发布权限的 `NPM_TOKEN`；普通推送不会发布 npm。

## 格式与范围

- 文件为完整的 UTF-8 SVG，也接受包在 Markdown SVG/XML 代码围栏中的内容。要求有效 `viewBox` 或正数绝对宽高，支持常见物理单位。
- 保留文字、箭头、渐变、CSS 和内部片段引用。无效 XML、DOCTYPE 和无有效尺寸的文件显示错误，不直接嵌入未经清理的内容。
- 使用 DOMPurify 清理后置于禁止脚本的沙箱 iframe，阻止外部资源、脚本、嵌入 HTML、链接和动画。字体依赖本机可用字体，文件大小受 Host 完整读取上限约束。
- 适应窗口模式随面板尺寸变化，手动缩放后停止自动适应。内容变化时重置视口，重复加载相同内容后控件仍可用。
- 只读，不修改图纸、不控制硬件、不提供 `.SchDoc` 解析或图纸生成。本版不包含 SideTest 工作流专用的生成后自动打开。

## 开发和验证

```powershell
npm install --global pnpm@11.28.5
pnpm install --frozen-lockfile
npm run check
npm test
npm run build
npm run verify:package
npm pack
```

修改后重新构建并提交 `lib/`。CI 验证类型、测试、构建产物一致性和独立模块加载，并上传 `.tgz` 安装包。React 和共享 UI primitives 由 DSH 提供，DOMPurify 随插件打包并保留许可证。

使用已构建的 DSH 源码进行真实浏览器回放验证，无需模型密钥：

```powershell
$env:DSH_CHECKOUT = "D:/CodeBase/deepseek-harness-master"
node scripts/test-dsh.mjs
# 可选：用本地文件替代内置的合成测试图
$env:DSH_DIAGRAM_SAMPLE = "C:/path/to/example.diagram"
node scripts/test-dsh.mjs
```

测试临时文件会在结束后清理。私有样本和截图不进入发布包。

## 来源与许可证

MIT。插件结构、构建与隔离 SVG 显示基于 [dsh-pcb-resource-map](https://github.com/jiexingluo/dsh-pcb-resource-map)，其来源为 DeepSeek Harness 提交 `7f18821d`；保留上游 MIT 声明。SideTest 的 `.diagram` 查看器仅用于确认功能需求，未复制或修改其源码。DOMPurify 声明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。
