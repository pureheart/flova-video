# flova-video

> Claude Code 插件：使用隔离浏览器在 flova.ai 上自动创建 AI 视频。

---

## 这个插件是做什么的

flova-video 是一个 Claude Code 插件。当你对 Claude 说"帮我在 flova 做个视频"时，它会：

1. 用**系统 Chrome**（非 Playwright 内置 Chromium）打开一个**独立浏览器配置**，避免 Google 登录被拦截
2. 自动导航到 flova.ai 创作页面
3. 自动填写视频描述（prompt）并尝试提交
4. 遇到需要人工操作的步骤（登录、验证码）时暂停并提示

[flova.ai](https://flova.ai) 是集成了 Sora2、Veo3.1、Gemini 等多种 AI 模型的视频/电影创作平台。

---

## 安装方式

### 方式一：从 GitHub 安装（推荐）

```bash
claude plugin install https://github.com/rarezhang2020/flova-video
```

安装完成后重启 Claude Code 即可生效。

### 方式二：本地安装（开发调试用）

```bash
git clone https://github.com/rarezhang2020/flova-video.git
claude plugin install ./flova-video
```

### 方式三：当前 session 临时加载

```bash
git clone https://github.com/rarezhang2020/flova-video.git
claude --plugin-dir ./flova-video
```

---

## 首次使用前的准备

### 第一步：安装 Node.js 依赖

```bash
cd flova-video
npm install
```

### 第二步：安装 Playwright Chromium（仅备用，系统 Chrome 优先）

```bash
npx playwright install chromium
```

> **为什么需要系统 Chrome？**
> Google OAuth 登录会检测 Playwright 内置的 Chromium 并拦截，报"不安全"错误。
> 插件会优先使用 `/Applications/Google Chrome.app`（macOS）中的真实 Chrome，
> 完全规避这个问题。

---

## 使用方式

### 方式一：自然语言触发（推荐）

启动 Claude Code 后直接说，技能自动识别：

```
帮我用 flova 做一个关于城市夜景的视频
用 flova.ai 生成一段 30 秒的婚礼场景，迪士尼风格
打开 flova，做个视频
```

**触发关键词**（含以下任意一个即触发）：
`flova`、`flova.ai`、`帮我做视频`、`生成视频`、`用隔离浏览器`、`flova做视频`

### 方式二：斜杠命令

```
/flova-video:flova 朱迪和尼克的迪士尼风格婚礼，30秒，喜气洋洋
```

不带参数时 Claude 会主动询问视频内容：

```
/flova-video:flova
```

---

## 完整工作流程

技能触发后，Claude 按以下步骤自动执行：

```
1. 收集信息
   ├── 视频描述（必填）
   ├── 时长（默认 5 秒）
   ├── 风格（默认 cinematic）
   └── 模型偏好（可选）

2. 检查依赖
   └── node_modules 是否存在，Chromium 是否已下载

3. 启动隔离浏览器
   ├── 优先使用系统 Chrome（Google 登录不被拦截）
   ├── 独立配置目录：~/.flova-browser-profile
   └── 窗口可见模式，用户全程可以看到操作

4. 打开 flova.ai
   ├── 检测是否已登录
   └── 未登录时暂停 → 提示用户手动登录 → 继续

5. 导航到视频创作页面
   ├── 自动尝试 /zh-CN/create、/create 等路径
   └── 失败时提示用户手动导航

6. 填写 prompt
   ├── 自动定位输入框并填写
   └── 失败时显示 prompt 内容，等待用户手动粘贴

7. 提交生成
   ├── 自动点击 Generate / 生成 按钮
   └── 失败时提示用户手动点击

8. 等待完成
   └── 浏览器保持打开，用户实时查看进度，完成后按 ENTER

9. 返回结果
   └── 报告最终页面地址
```

---

## 文件结构

```
flova-video/
├── .claude-plugin/
│   └── plugin.json          # 插件元信息
├── skills/
│   └── flova-video/
│       └── SKILL.md         # 技能定义（自动触发逻辑 + 工作流程指引）
├── commands/
│   └── flova.md             # 斜杠命令 /flova-video:flova
├── scripts/
│   ├── open_flova.js        # 简单模式：仅打开浏览器
│   └── create_video.js      # 完整模式：自动化填写 + 提交
├── package.json             # Node.js 依赖声明
├── .gitignore
└── README.md
```

---

## 关于浏览器隔离

插件使用 `~/.flova-browser-profile` 作为专属浏览器配置目录：

- 与你日常使用的 Chrome/Safari/Firefox **完全隔离**
- 关闭后**登录状态保留**，下次无需重新登录
- 清除登录状态：`rm -rf ~/.flova-browser-profile`

---

## 环境依赖

| 依赖 | 版本要求 | 说明 |
|------|----------|------|
| Node.js | v18+ | `node --version` |
| @playwright/test | ^1.58 | `npm install` 自动安装 |
| Google Chrome | 任意版本 | macOS 默认路径自动检测 |
| Chromium（备用） | 自动下载 | `npx playwright install chromium` |

---

## 常见问题

**Q：Google 登录提示"不安全"或被拦截**

A：插件已改为优先使用系统 Chrome，此问题应已解决。如仍有问题，请改用 flova.ai 的**邮箱密码登录**，而非 Google OAuth。

**Q：`Cannot find module '@playwright/test'`**

A：在插件目录运行：
```bash
npm install
```

**Q：`Executable doesn't exist` 错误**

A：Playwright Chromium 未下载：
```bash
npx playwright install chromium
```

**Q：自动填写 prompt 失败**

A：flova.ai 的 UI 可能更新了。脚本会打印 prompt 内容并暂停，手动粘贴后按 ENTER 继续。

**Q：想清除登录状态重新登录**

A：
```bash
rm -rf ~/.flova-browser-profile
```

---

## 版本信息

- 插件版本：1.0.0
- 适配 Claude Code：最新稳定版
- Node.js 要求：v18+
- 作者：rarezhang2020
