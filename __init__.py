# -*- coding: utf-8 -*-
"""
画布组 Bypass 控制器 · ComfyUI 节点（单包双语）

语言切换：编辑 web/language.json 的 "language" 字段（"zh" / "en"），重启 ComfyUI 生效。
前端按钮/tooltip 与后端显示名/tooltip 会同步切换。

- 画布组 Bypass 控制器（开发者）：Bypass组名输入框 + 应用到用户组件 / 恢复全部组为启用。
- 画布组 Bypass 控制器（用户）：连接开发者配置后，自动生成每个Bypass组一个按钮。
  点按钮即整组 Bypass / 启用，非Bypass组完全不动，无需运行工作流。

前端 JS 位于 web/ 目录，通过 WEB_DIRECTORY 注册。
"""
import json
import os

# 向 ComfyUI 注册 web/ 目录，前端扩展才会被加载（否则按钮不出现）
WEB_DIRECTORY = "./web"


def _detect_language():
    """读取 web/language.json 决定界面语言，缺省 zh。"""
    cfg_path = os.path.join(os.path.dirname(__file__), "web", "language.json")
    try:
        with open(cfg_path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        lang = str(data.get("language", "zh")).strip().lower()
        return "en" if lang in ("en", "english", "英文") else "zh"
    except Exception:
        return "zh"


LANG = _detect_language()

from .bypass_group_controller import (
    BypassGroupController,
    BypassGroupUserController,
    NODE_NAME as GROUP_NODE_NAME,
    USER_NODE_NAME as USER_NODE_NAME,
    set_language,
)

# 让后端输入项 tooltip / DESCRIPTION 跟随语言
set_language(LANG)

NODE_CLASS_MAPPINGS = {
    GROUP_NODE_NAME: BypassGroupController,
    USER_NODE_NAME: BypassGroupUserController,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    GROUP_NODE_NAME: (
        "Canvas Group Bypass Controller (Dev)" if LANG == "en"
        else "画布组Bypass控制器（开发者）"
    ),
    USER_NODE_NAME: (
        "Canvas Group Bypass Controller (User)" if LANG == "en"
        else "画布组Bypass控制器（用户）"
    ),
}
