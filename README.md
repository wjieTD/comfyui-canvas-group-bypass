# 画布组 Bypass 控制器 / Canvas Group Bypass Controller

ComfyUI 自定义节点：把画布上多个 Group 设为 Bypass 切换，**一次只允许启用一个组**。点按钮即整组切换 `Bypass（Ctrl+B）` / 启用，无需运行工作流，非 Bypass 组完全不受影响。

A ComfyUI custom node that toggles canvas Groups between Bypass and Enabled — **only one group enabled at a time**. One click switches a whole group between `Bypass (Ctrl+B)` and Enabled. No workflow run needed; non-Bypass groups are never touched.

---

## 安装 / Install

1. 把整个 `comfyui-canvas-group-bypass/` 文件夹放进 `ComfyUI/custom_nodes/`。
2. 重启 ComfyUI。
3. 节点位于 `utils / logic` 分类下。

1. Copy the whole `comfyui-canvas-group-bypass/` folder into `ComfyUI/custom_nodes/`.
2. Restart ComfyUI.
3. Find the nodes under category `utils / logic`.

---

## 切换语言 / Switch Language

编辑 `web/language.json` 的 `language` 字段，改完**重启 ComfyUI**：

Edit the `language` field in `web/language.json`, then **restart ComfyUI**:

```json
{ "language": "zh" }
```

| 值 Value | 语言 Language |
|---|---|
| `zh` | 中文（默认 / default） |
| `en` | English |

节点显示名、输入框标签、按钮文字、提示会一起切换。Node titles, input labels, button text and tooltips switch together.

> 内部节点 id 为 `Bypass Group Controller (...)` / `Bypass Group User Controller (...)`。切换语言只改显示文案，不改变 id；若从更早版本的节点 id 升级，旧工作流里的节点需重新添加。
> Internal node ids are `Bypass Group Controller (...)` / `Bypass Group User Controller (...)`. Language switch changes display text only, not ids; when upgrading from older node ids, re-add nodes in existing workflows.

---

## 节点说明 / Nodes

### 开发者节点 · Dev node
`画布组Bypass控制器（开发者）` / `Canvas Group Bypass Controller (Dev)`

- **Bypass组名 / Bypass Group Names**：每行填一个画布 Group 的**标题**（区分大小写、空格）。只有列出的组参与Bypass。
  One canvas Group **title** per line (case & space sensitive). Only listed groups participate.
- **▶ 应用到用户组件 / Apply to User Nodes**：把组名同步给所有已连线的用户节点，刷新按钮。改完组名后点一次。
  Sync group names to all connected user nodes and refresh buttons. Click once after editing names.
- **↩ 恢复全部组为启用 / Restore All Groups**：把所有画布组的所有节点恢复为启用（`mode=ALWAYS`）。
  Restore all nodes in every canvas group to Enabled (`mode=ALWAYS`).

### 用户节点 · User node
`画布组Bypass控制器（用户）` / `Canvas Group Bypass Controller (User)`

- 只有一个「配置 / Config」输入，接开发者节点的「配置 / Config」输出。
  One `Config` input, connect to the Dev node's `Config` output.
- 连接后自动生成：每个Bypass组一个按钮（按钮名 = 组名）。**无任何其它控件、无输出。**
  Auto-generates one button per Bypass group (label = group title). **No other widgets, no output.**
- 点某组按钮 → 该组启用，其余Bypass组 Bypass；非Bypass组不动。
  Click a group's button → that group Enabled, other Bypass groups Bypass; non-Bypass groups untouched.

---

## 快速上手 / Quick Start

1. 在画布上框好几个功能 Group，记下各自标题。
   Create several function Groups on canvas; note their titles.
2. 加一个开发者节点，把标题逐行填进「Bypass组名」，点「应用到用户组件」。
   Add a Dev node, fill titles line by line into `Bypass Group Names`, click `Apply to User Nodes`.
3. 加用户节点，把开发者节点的「配置」连过来。
   Add a User node, connect the Dev node's `Config` output.
4. 之后只点用户节点上的组名按钮即可切换，不用跑工作流。
   Afterwards just click group-name buttons on the User node. No workflow run needed.

连线关系 / Wiring:

```
[Dev] 配置 ──→ [User] 配置
  (组名列表)         (只有按钮)
```

---

## 行为规则 / Behavior

| 项 Item | 说明 Detail |
|---|---|
| 启用 Enable | `mode = ALWAYS (0)` |
| 绕过 Bypass | `mode = BYPASS (4)`，等同 Ctrl+B，不是 Mute |
| 非Bypass组 Non-Bypass | 完全不读写，保持原样 Never read or written |
| 作用范围 Scope | 整个 Group 内所有节点 All nodes inside the Group |
| 生效方式 When | 点按钮立即生效，无需 Queue Prompt Instant on button click |

---

## 常见问题 / FAQ

- **用户节点按钮不出现 / Buttons not showing**
  确认已连接开发者节点、开发者已填组名并点过「应用到用户组件」；确认 JS 已加载（重启 ComfyUI + 刷新页面）。
  Ensure Dev is connected, names filled, `Apply to User Nodes` clicked, and JS loaded (restart + refresh).

- **切组没效果 / Switching has no effect**
  检查填写的组名是否与画布 Group 标题**完全一致**（含大小写、空格、全角符号）。
  Check group titles match canvas Group titles **exactly** (case, spaces, full-width chars).

- **改语言后界面没变 / Language change not applied**
  重启 ComfyUI 并强制刷新浏览器（Ctrl+F5）。
  Restart ComfyUI and hard-refresh the browser (Ctrl+F5).

---

## 文件结构 / Files

```
comfyui-canvas-group-bypass/
├── __init__.py                  # 节点注册 + 语言检测
├── bypass_group_controller.py    # 后端节点定义 + 双语文案
├── web/
│   ├── bypass_group_controller.js # 前端扩展（按钮 / Bypass 逻辑）
│   └── language.json            # 语言配置：zh / en
└── README.md                    # 本文档 This doc
```
