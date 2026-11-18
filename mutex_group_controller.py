# -*- coding: utf-8 -*-
"""
画布组 Bypass 控制器（后端 UI 载体 · 单包双语）

语言由 web/language.json 决定，__init__.py 导入时调用 set_language() 设置。

- MutexGroupController（开发者）：互斥组名输入框 + 两个按钮（应用到用户组件 / 恢复全部组为启用），
  输出两个「配置」槽（slot 1 兼容旧工作流连线）。
- MutexGroupUserController（用户）：连接开发者「配置」后，前端自动生成每个互斥组一个带名字的按钮，
  点按钮即开启该组、其余互斥组 Bypass。非互斥组完全不受影响。

真正的「Bypass / 启用」动作由前端扩展 web/mutex_group_controller.js 完成。
"""

# 内部 class id 保持不变（兼容已存在工作流），仅显示名按语言切换
NODE_NAME = "Mutex Group Controller (互斥组控制器)"
USER_NODE_NAME = "Mutex Group User Controller (画布组控制器-用户)"

# 开发者 -> 用户 的连线配置类型
CONFIG_TYPE = "MUTEX_GROUP_CONFIG"

# 双语文案表
I18N = {
    "zh": {
        "group_input": "互斥组名",
        "config_input": "配置",
        "ret_names": ("配置", "配置(旧版兼容)"),
        "group_tooltip": (
            "每行一个『画布 Group 的标题』，只有这里列出的组参与互斥。"
            "把默认示例替换为你的真实组名后，点节点上的「应用到用户组件」刷新用户按钮。"
            "组名要与画布上 Group 标题完全一致（区分大小写/空格）。"
        ),
        "config_tooltip": "连接『画布组 Bypass 控制器（开发者）』的「配置」输出。连接后自动生成各组按钮。",
        "dev_description": (
            "画布组 Bypass 控制器（开发者）：每行填一个画布 Group 标题作为互斥组，"
            "点「应用到用户组件」把配置同步给已连接的用户节点。"
            "开启组在用户节点上用对应组名的按钮切换；非互斥组不会被改动。"
        ),
        "user_description": (
            "画布组 Bypass 控制器（用户）：必须连接『画布组 Bypass 控制器（开发者）』的「配置」输出。"
            "节点上只有每个互斥组一个按钮（带组名），点某个按钮即开启该组、其余互斥组 Bypass，"
            "非互斥组不受影响，无需运行工作流。"
        ),
    },
    "en": {
        "group_input": "Mutex Group Names",
        "config_input": "Config",
        "ret_names": ("Config", "Config (legacy)"),
        "group_tooltip": (
            "One canvas Group title per line. Only listed groups participate in the mutex. "
            "Replace the sample with your real group titles, then click 'Apply to User Nodes' "
            "on the node to refresh user buttons. Titles must match exactly (case and spaces matter)."
        ),
        "config_tooltip": "Connect the 'Config' output of the Dev node. Buttons for each group are generated automatically.",
        "dev_description": (
            "Canvas Group Bypass Controller (Dev): enter one canvas Group title per line as a mutex group. "
            "Click 'Apply to User Nodes' to sync the config to connected user nodes. "
            "Switch groups via the named buttons on the user node; non-mutex groups are untouched."
        ),
        "user_description": (
            "Canvas Group Bypass Controller (User): must connect the 'Config' output of the Dev node. "
            "The node has only one named button per mutex group. Clicking a button enables that group "
            "and bypasses the others; non-mutex groups are untouched. No workflow run required."
        ),
    },
}

# 输入名默认中文（ComfyUI 缓存兼容），导入时由 set_language 按语言覆盖
LANG = "zh"


def set_language(lang):
    global LANG
    LANG = "en" if lang == "en" else "zh"
    t = I18N[LANG]
    MutexGroupController.INPUT_NAME = t["group_input"]
    MutexGroupController.RETURN_NAMES = t["ret_names"]
    MutexGroupController.DESCRIPTION = t["dev_description"]
    MutexGroupUserController.INPUT_NAME = t["config_input"]
    MutexGroupUserController.DESCRIPTION = t["user_description"]


class MutexGroupController:
    INPUT_NAME = I18N["zh"]["group_input"]
    RETURN_TYPES = (CONFIG_TYPE, CONFIG_TYPE)
    RETURN_NAMES = I18N["zh"]["ret_names"]
    FUNCTION = "status"
    CATEGORY = "utils/logic"
    DESCRIPTION = I18N["zh"]["dev_description"]

    @classmethod
    def INPUT_TYPES(cls):
        t = I18N[LANG]
        return {
            "required": {
                t["group_input"]: ("STRING", {
                    "multiline": True,
                    "default": "<GroupName1>\n<GroupName2>\n<GroupName3>",
                    "tooltip": t["group_tooltip"],
                }),
            },
        }

    # 两个槽位都输出配置：slot 0 供新连线，slot 1 兼容旧工作流原「配置」连线
    # 同时兼容位置传参与关键字传参（输入名随语言变化）
    def status(self, value=None, **kwargs):
        if not isinstance(value, str):
            value = next((v for v in kwargs.values() if isinstance(v, str)), "")
        val = value or ""
        return (val, val)


class MutexGroupUserController:
    INPUT_NAME = I18N["zh"]["config_input"]
    RETURN_TYPES = ()
    OUTPUT_NODE = True
    FUNCTION = "status"
    CATEGORY = "utils/logic"
    DESCRIPTION = I18N["zh"]["user_description"]

    @classmethod
    def INPUT_TYPES(cls):
        t = I18N[LANG]
        return {
            "required": {
                t["config_input"]: (CONFIG_TYPE, {"tooltip": t["config_tooltip"]}),
            },
        }

    def status(self, value=None, **kwargs):
        return ()
