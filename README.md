# 微信消息蓝点 · GNOME 扩展

把 Linux 原生微信在顶部托盘的消息闪烁，改为**固定图标＋左下角蓝点**，减少视觉干扰。

- 蓝点直径为图标宽度的约 62%，保持原来的点击和右键菜单。
- 微信停止闪烁后约 1.8 秒，蓝点自动消失。
- 关闭扩展即可恢复微信原有的闪烁提醒。

## 兼容范围

已在 Ubuntu 24.04、GNOME 46、X11、微信 4.1.1.8 和 Ubuntu AppIndicators 58 上验证。
需要启用 Ubuntu AppIndicators；其他桌面环境及 Wayland 尚未验证。

## 安装

在 [Releases](https://github.com/ZaneHe0528/gnome-wechat-message-dot/releases) 下载 `wechat-message-dot.zip`，然后执行：

```bash
gnome-extensions install wechat-message-dot.zip
```

刷新桌面：X11 下按 `Alt+F2`，输入 `r` 后回车；Wayland 需要注销并重新登录。
随后启用：

```bash
gnome-extensions enable wechat-red-dot@local
```

扩展 UUID 保留最初开发时的名称，实际提示点为蓝色。

## 关闭或卸载

```bash
# 恢复原来的闪烁提醒
gnome-extensions disable wechat-red-dot@local

# 卸载扩展
gnome-extensions uninstall wechat-red-dot@local
```

## 实现与限制

微信通过交替发送正常图标和透明图标来闪烁。本扩展仅在桌面显示层替换透明帧，
不读取聊天内容，也不修改微信程序。

蓝点根据闪烁推断提醒状态，不代表全部会话的未读状态；免打扰消息遵循微信自身的提醒行为。
扩展依赖 AppIndicators 的内部接口，升级 GNOME、微信或 AppIndicators 后需要重新验证。

## 许可证

[MIT](LICENSE)，非微信官方项目。
