# flova-video

> MCP Server + Claude Code Plugin：用隔离浏览器在 flova.ai 上创建 AI 视频。
> 支持 Claude Code、Cursor、Cline、Continue.dev、Windsurf 等所有 MCP 兼容 Agent。

---

## 这个项目是做什么的

flova-video 把 [flova.ai](https://flova.ai) 的视频创作能力封装成 **MCP（Model Context Protocol）工具**，
任何支持 MCP 的 AI agent 只需配置一次，之后直接对 agent 说"帮我在 flova 做个视频"即可。

**[flova.ai](https://flova.ai)** 是集成了 Sora2、Veo3.1、Gemini 等多种 AI 模型的视频/电影创作平台。

**核心能力：**
- 用系统 Chrome（非 Playwright 内置 Chromium）打开**独立浏览器配置**，Google 登录不被拦截
- 自动导航到 flova.ai 创作页面并预填 prompt
- 遇到需要人工操作（登录、点击生成）时，浏览器保持打开，用户直接在浏览器里完成

---

## 暴露的 MCP 工具

| 工具名 | 说明 | 必填参数 |
|--------|------|----------|
| `create_video` | 打开 flova.ai 并预填视频描述，用户点击 Generate 即可生成 | `prompt` |
| `open_browser` | 仅打开 flova.ai 隔离浏览器，不预填内容 | 无 |

### `create_video` 参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `prompt` | string | 必填 | 视频描述，中英文均可 |
| `duration` | number | `5` | 视频时长（秒） |
| `style` | string | `cinematic` | 风格提示词 |

---

## 安装与配置

### 第一步：克隆仓库并安装依赖

```bash
git clone https://github.com/pureheart/flova-video.git
cd flova-video
npm install
npx playwright install chromium
```

### 第二步：在你的 Agent 中配置 MCP

根据你使用的 agent，选择对应配置方式：

---

#### Claude Code

编辑 `~/.claude/settings.json`（没有则新建）：

```json
{
  "mcpServers": {
    "flova-video": {
      "command": "node",
      "args": ["/absolute/path/to/flova-video/mcp/server.js"]
    }
  }
}
```

或者使用 Claude Code 内置命令：

```bash
claude mcp add flova-video node /absolute/path/to/flova-video/mcp/server.js
```

---

#### Cursor

打开 `Cursor Settings → MCP`，点击 `Add MCP Server`，填入：

```json
{
  "flova-video": {
    "command": "node",
    "args": ["/absolute/path/to/flova-video/mcp/server.js"]
  }
}
```

或直接编辑 `~/.cursor/mcp.json`：

```json
{
  "mcpServers": {
    "flova-video": {
      "command": "node",
      "args": ["/absolute/path/to/flova-video/mcp/server.js"]
    }
  }
}
```

---

#### Cline（VS Code 插件）

打开 VS Code → Cline 插件设置 → `MCP Servers` → 点击 `Edit MCP Settings`，添加：

```json
{
  "flova-video": {
    "command": "node",
    "args": ["/absolute/path/to/flova-video/mcp/server.js"],
    "disabled": false,
    "autoApprove": ["create_video", "open_browser"]
  }
}
```

---

#### Continue.dev

编辑 `~/.continue/config.json`，在 `mcpServers` 数组中添加：

```json
{
  "mcpServers": [
    {
      "name": "flova-video",
      "command": "node",
      "args": ["/absolute/path/to/flova-video/mcp/server.js"]
    }
  ]
}
```

---

#### Windsurf

编辑 `~/.codeium/windsurf/mcp_config.json`：

```json
{
  "mcpServers": {
    "flova-video": {
      "command": "node",
      "args": ["/absolute/path/to/flova-video/mcp/server.js"]
    }
  }
}
```

---

#### 通用（任何支持 stdio MCP 的 Agent）

MCP Server 通过标准输入输出（stdio）通信，启动命令：

```bash
node /absolute/path/to/flova-video/mcp/server.js
```

---

## 使用方式

配置完成并重启 agent 后，直接用自然语言：

```
帮我在 flova 做一个关于城市夜景的视频，30秒，电影感
```

```
用 flova.ai 生成一段迪士尼风格的婚礼视频，朱迪和尼克结婚，喜气洋洋
```

```
打开 flova 浏览器，我要手动做个视频
```

Agent 会自动调用 `create_video` 或 `open_browser` 工具，Chrome 窗口随即弹出。

---

## 文件结构

```
flova-video/
├── mcp/
│   └── server.js            # MCP Server 入口（核心）
├── scripts/
│   ├── create_video.js      # 浏览器自动化脚本（支持 --non-interactive）
│   └── open_flova.js        # 简单打开浏览器
├── skills/
│   └── flova-video/
│       └── SKILL.md         # Claude Code 专属技能定义（自动触发）
├── commands/
│   └── flova.md             # Claude Code 斜杠命令 /flova-video:flova
├── .claude-plugin/
│   └── plugin.json          # Claude Code 插件元信息
├── .mcp.json                # MCP 配置声明
├── package.json
└── README.md
```

---

## 关于浏览器隔离

- 使用 `~/.flova-browser-profile` 作为专属配置目录，与日常浏览器完全隔离
- **优先使用系统 Chrome**，彻底避免 Google OAuth 登录被拦截
- 登录状态跨 session 持久保存，无需每次重新登录
- 清除登录状态：`rm -rf ~/.flova-browser-profile`

---

## 环境依赖

| 依赖 | 要求 | 说明 |
|------|------|------|
| Node.js | v18+ | `node --version` |
| Google Chrome | 任意版本 | macOS 自动检测，解决 Google 登录问题 |
| @modelcontextprotocol/sdk | ^1.0.0 | `npm install` 自动安装 |
| @playwright/test | ^1.58 | `npm install` 自动安装 |
| Chromium（备用） | 自动下载 | `npx playwright install chromium` |

---

## 常见问题

**Q：配置后 agent 看不到工具**

A：重启 agent（Cursor/VS Code 需要完全退出重开）。用 Claude Code 可以运行 `claude mcp list` 验证。

**Q：Google 登录提示不安全**

A：脚本优先使用系统 Chrome，Google 登录应正常。若仍有问题，改用 flova.ai 邮箱密码登录。

**Q：`Cannot find module '@modelcontextprotocol/sdk'`**

A：运行 `npm install`。

**Q：浏览器自动填写 prompt 失败**

A：flova.ai 的 UI 可能更新了。agent 返回的提示里会包含完整 prompt，手动粘贴到浏览器即可。

---

## 版本

- `1.0.0` - 初始版本，MCP Server + Claude Code Plugin 双模式
