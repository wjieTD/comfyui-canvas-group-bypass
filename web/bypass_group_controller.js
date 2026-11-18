// 画布组 Bypass 控制器 · 前端扩展（单包双语）
// 开发者节点：Bypass组名输入框 + 「应用到用户组件」「恢复全部组为启用」两个按钮
// 用户节点：连接开发者「配置」后，自动生成每个Bypass组一个带名字的按钮，点按钮整组切换
// 非Bypass组完全不碰（保持不变）
// 语言由 web/language.json 决定：zh / en
import { app } from "../../../scripts/app.js";

const DEV_NODE_CLASS = "Bypass Group Controller (画布组Bypass控制器)";
const USER_NODE_CLASS = "Bypass Group User Controller (画布组Bypass控制器-用户)";

const MODE_ALWAYS = 0;  // 正常启用
const MODE_BYPASS = 4;  // 绕过（Ctrl+B）

// ---------- 双语文案 ----------
const I18N = {
    zh: {
        devApply: "▶ 应用到用户组件",
        devRestore: "↩ 恢复全部组为启用",
        applyTip: "把当前Bypass组名同步给所有已连接的用户组件，刷新其按钮。",
        restoreTip: "把所有画布组的所有节点恢复为启用状态。",
        noDev: "⚠ 请先连接开发者节点",
        noDevTip: "从『画布组 Bypass 控制器（开发者）』的「配置」输出拉线到本节点。",
        noNames: "⚠ 开发者未填写Bypass组名",
        noNamesTip: "请在开发者节点的「Bypass组名」里每行填一个画布 Group 标题。",
        btnTip: (name) => `开启「${name}」，其余Bypass组 Bypass；非Bypass组不受影响。`,
        applied: (n) => `[canvas-bypass] 已应用到 ${n} 个用户组件`,
        // 输入名（与后端 I18N 保持一致，用于查找 widget）
        groupInput: "Bypass组名",
        configInput: "配置",
    },
    en: {
        devApply: "▶ Apply to User Nodes",
        devRestore: "↩ Restore All Groups",
        applyTip: "Sync current Bypass group names to all connected user nodes and refresh their buttons.",
        restoreTip: "Restore all nodes in every canvas group to Enabled.",
        noDev: "⚠ Connect Dev node first",
        noDevTip: "Drag a link from the Dev node's 'Config' output to this node.",
        noNames: "⚠ No Bypass groups set in Dev",
        noNamesTip: "Enter one canvas Group title per line in the Dev node's 'Bypass Group Names' field.",
        btnTip: (name) => `Enable "${name}"; all other Bypass groups Bypass. Non-Bypass groups are untouched.`,
        applied: (n) => `[canvas-bypass] Applied to ${n} user node(s)`,
        groupInput: "Bypass Group Names",
        configInput: "Config",
    },
};

let T = I18N.zh;  // 默认中文，语言文件加载后覆盖

async function loadLanguage() {
    try {
        const url = new URL("./language.json", import.meta.url);
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) return;
        const cfg = await res.json();
        const lang = String(cfg.language || "zh").toLowerCase();
        if (lang === "en") T = I18N.en;
    } catch (e) {
        console.warn("[canvas-bypass] language.json load failed, use zh", e);
    }
}

// 兼容中英输入名：任一命中即可
function findWidgetByNames(node, names) {
    for (const name of names) {
        const w = (node.widgets || []).find((x) => x.name === name);
        if (w) return w;
    }
    return null;
}

function findWidget(node, name) {
    return findWidgetByNames(node, [name]);
}

function parseNames(text) {
    return String(text || "")
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);
}

// 从开发者节点读Bypass组名（兼容中英输入名）
function devNames(dev) {
    const w = findWidgetByNames(dev, [I18N.zh.groupInput, I18N.en.groupInput]);
    return w ? parseNames(w.value) : [];
}

function getGroups() {
    const g = app.graph;
    return (g && g.groups) ? g.groups : [];
}

// 取组内节点：先强制重算（关键！否则新建组的 _nodes 为空）
function getInnerNodes(group) {
    try { if (typeof group.recomputeInsideNodes === "function") group.recomputeInsideNodes(); } catch (e) { /* noop */ }
    const inner = group.nodes || group._nodes || group.children || [];
    return Array.from(inner).filter((n) => n && typeof n === "object" && "mode" in n && "id" in n);
}

// 从用户节点沿连线找到开发者节点（兼容中英输入名）
function getConnectedDev(userNode) {
    const graph = app.graph;
    if (!graph || !graph.links) return null;
    const configNames = [I18N.zh.configInput, I18N.en.configInput];
    let linkId = null;
    for (const inp of (userNode.inputs || [])) {
        if (inp && configNames.includes(inp.name) && inp.link != null) { linkId = inp.link; break; }
    }
    if (linkId == null) {
        for (const inp of (userNode.inputs || [])) {
            if (inp && inp.link != null) { linkId = inp.link; break; }
        }
    }
    if (linkId == null) return null;
    let link = graph.links[linkId];
    if (!link && typeof graph.links.get === "function") link = graph.links.get(linkId);
    if (!link) return null;
    const originId = (link.origin_id != null) ? link.origin_id : (link.origin && link.origin.id);
    if (originId == null) return null;
    const dev = (typeof graph.getNodeById === "function") ? graph.getNodeById(originId) : null;
    if (!dev || dev.comfyClass !== DEV_NODE_CLASS) return null;
    return dev;
}

// 核心：只切换Bypass组。选中组 -> ALWAYS，其余Bypass组 -> BYPASS。非Bypass组一律不碰。
function applyGroup(dev, selected) {
    const names = devNames(dev);
    if (!names.length || !selected || !names.includes(selected)) return;
    const groups = getGroups();
    const graph = app.graph;
    for (const g of groups) {
        if (!names.includes(g.title)) continue; // 非Bypass组：完全不动
        const target = (g.title === selected) ? MODE_ALWAYS : MODE_BYPASS;
        for (const n of getInnerNodes(g)) {
            if (n.mode !== target) {
                n.mode = target;
                if (graph && typeof graph.change === "function") graph.change();
            }
        }
    }
    if (graph && typeof graph.setDirtyCanvas === "function") graph.setDirtyCanvas(true, true);
}

// 恢复全部组为启用
function doRestoreAll() {
    const graph = app.graph;
    for (const g of getGroups()) {
        for (const n of getInnerNodes(g)) {
            if (n.mode !== MODE_ALWAYS) {
                n.mode = MODE_ALWAYS;
                if (graph && typeof graph.change === "function") graph.change();
            }
        }
    }
    if (graph && typeof graph.setDirtyCanvas === "function") graph.setDirtyCanvas(true, true);
}

// ---------- 用户节点：动态按钮（无任何其它控件） ----------

const userNodes = new Set();
const userSigs = new WeakMap();

function rebuildUserButtons(un) {
    const dev = getConnectedDev(un);
    const names = dev ? devNames(dev) : [];

    // 用户节点除按钮外无任何控件
    un.widgets = (un.widgets || []).filter((w) => !w.__bypassUserBtn);

    if (!dev) {
        const b = un.addWidget("button", T.noDev, null, () => {});
        if (b) { b.serialize = false; b.__bypassUserBtn = true; b.tooltip = T.noDevTip; }
    } else if (!names.length) {
        const b = un.addWidget("button", T.noNames, null, () => {});
        if (b) { b.serialize = false; b.__bypassUserBtn = true; b.tooltip = T.noNamesTip; }
    } else {
        for (const name of names) {
            const b = un.addWidget("button", name, null, () => {
                try { applyGroup(dev, name); }
                catch (e) { console.error("[canvas-bypass] apply failed", e); }
            });
            if (b) {
                b.serialize = false;
                b.__bypassUserBtn = true;
                b.tooltip = T.btnTip(name);
            }
        }
    }

    try {
        const s = (typeof un.computeSize === "function") ? un.computeSize() : null;
        if (s && Array.isArray(s)) un.setSize(s);
    } catch (e) { /* noop */ }
    if (app.graph && typeof app.graph.setDirtyCanvas === "function") app.graph.setDirtyCanvas(true, true);
}

// 轻量轮询：连线变化 / 开发者组名变化时自动重建用户按钮
function syncUserButtons() {
    for (const un of Array.from(userNodes)) {
        if (!un.graph) { userNodes.delete(un); continue; }
        const dev = getConnectedDev(un);
        const names = dev ? devNames(dev) : [];
        const sig = JSON.stringify([dev ? dev.id : "none", names, T.devApply]);
        if (userSigs.get(un) !== sig) {
            userSigs.set(un, sig);
            try { rebuildUserButtons(un); }
            catch (e) { console.error("[canvas-bypass] rebuild user buttons failed", e); }
        }
    }
}
setInterval(syncUserButtons, 600);

// 开发者节点「应用到用户组件」：强制刷新所有连接的用户节点按钮
function applyToUsers(dev) {
    let count = 0;
    for (const un of userNodes) {
        if (!un.graph) continue;
        const linked = getConnectedDev(un);
        if (linked && linked.id === dev.id) {
            userSigs.delete(un);
            try { rebuildUserButtons(un); count++; } catch (e) { /* noop */ }
        }
    }
    if (app.graph && typeof app.graph.setDirtyCanvas === "function") app.graph.setDirtyCanvas(true, true);
    console.log(T.applied(count));
}

// 刷新开发者节点按钮文字（语言切换后）
function refreshDevButtons() {
    for (const node of (app.graph && app.graph.nodes) ? app.graph.nodes : []) {
        if (node.comfyClass !== DEV_NODE_CLASS || !node.__bypassDevInstalled) continue;
        const btns = (node.widgets || []).filter((w) => w.__bypassDevBtn);
        if (btns[0]) { btns[0].name = T.devApply; btns[0].tooltip = T.applyTip; }
        if (btns[1]) { btns[1].name = T.devRestore; btns[1].tooltip = T.restoreTip; }
    }
}

// ---------- 扩展注册 ----------
app.registerExtension({
    name: "CanvasGroupBypass.Frontend",
    async setup() {
        await loadLanguage();
        refreshDevButtons();
        for (const un of userNodes) userSigs.delete(un);
    },
    nodeCreated(node) {
        // 开发者节点：只有两个按钮
        if (node.comfyClass === DEV_NODE_CLASS) {
            if (node.__bypassDevInstalled) return;
            node.__bypassDevInstalled = true;

            const btnApply = node.addWidget("button", T.devApply, null, () => applyToUsers(node));
            const btnRestore = node.addWidget("button", T.devRestore, null, () => doRestoreAll());
            [btnApply, btnRestore].forEach((b) => {
                if (b) { b.serialize = false; b.__bypassDevBtn = true; }
            });
            if (btnApply) btnApply.tooltip = T.applyTip;
            if (btnRestore) btnRestore.tooltip = T.restoreTip;
            return;
        }

        // 用户节点
        if (node.comfyClass === USER_NODE_CLASS) {
            if (node.__bypassUserInstalled) return;
            node.__bypassUserInstalled = true;
            userNodes.add(node);
            const origRemove = node.onRemoved;
            node.onRemoved = function (...args) {
                userNodes.delete(node);
                if (origRemove) return origRemove.apply(this, args);
            };
            try { rebuildUserButtons(node); } catch (e) { /* noop */ }
        }
    },
});
