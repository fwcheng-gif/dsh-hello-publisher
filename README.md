# dsh-hello-publisher

一个**极小的 DSH（DeepSeek Harness）插件**，用途只有一个：作为 `dsh-github-publisher` 的**端到端测试样本**。

它故意做得足够小，好让整条发布链路涉及的每个文件都能人工核对。

## 它做什么

注册一个示例工具 `hello_publisher`，返回一句问候。这不是功能，而是**存活探针**：工具能在会话里出现，就说明插件被正确加载、且工具注册路径通了。

## 安装

```powershell
dsh plugin --profile desktop add '<本仓库的绝对路径>'
```

或按 profile bundle 手工挂载：把 `dsh.bundle.patch` 指向的 `cordis.patch.yml` 里的行加进 profile。

## 结构

| 文件 | 作用 |
|---|---|
| `package.json` | 声明 `dsh.bundle.patch`，这是被收录的**前置条件** |
| `cordis.patch.yml` | 一行 loader 条目，使插件可安装 |
| `lib/index.js` | 宿主半边：注册一个工具 |
| `LICENSE` | MIT |

## 为什么它适合做测试样本

- **结构完整**：有 `dsh.bundle`、有 loader 行、有 README、有 LICENSE、有 description——收录所需的要素齐全。
- **足够无害**：只注册一个只读的问候工具，不写文件、不访问网络、不修改任何状态。
- **便于核对**：`git log` 只有一次提交，`git status` 干净，方便观察发布流程新增的分支与提交。

## 许可

MIT
