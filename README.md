# analysis-i18n

一个基于 Babel AST 的 i18n 扫描/覆盖工具：

- `scan`：扫描源码里的中文字符串，把缺失的 key 追加到语言包 JSON（不改源码）。
- `cover`：在 `scan` 基础上，把未被 i18n 包裹的中文替换成 `i18nCallStack` 对应的调用（会改源码）。

## 3 分钟上手

在你的业务项目根目录执行（工具会从当前目录读取配置与 ESLint 配置）。

1) 安装

```bash
npm i -D analysis-i18n
```

2) 准备语言包目录（`dataPath`）且至少有 1 个 JSON 文件

例如：

- `src/locale/zh-CN.json`
- `src/locale/en-US.json`

内容可以先是空对象：

```json
{}
```

3) 准备 `./.eslintrc.json`

注意：当前版本在启动时会强依赖 `./.eslintrc.json`，缺少会直接报错（`scan` 也一样）。

一个可用的最小示例（适用于纯 JS；如果你的项目有 TS/TSX，请确保项目已安装并配置好对应 parser/plugin）：

```json
{
  "root": true,
  "env": { "es2021": true, "browser": true, "node": true },
  "parserOptions": { "ecmaVersion": 2021, "sourceType": "module" },
  "rules": {}
}
```

4) 创建 `analysis.config.js`

```js
module.exports = {
  entry: ["src"],
  exclude: ["**/node_modules/**", "**/*.test.*"],

  dataPath: "src/locale",

  importMessage: "import { intl } from '@/intl';",
  i18nCallStack: ["intl", "t"],

  // 处于这些调用内部的中文不会被处理（既不替换，也不写入语言包）
  // 支持写方法名（如 "log" / "error"）或写“对象.方法”（如 "sendRenderLog.error" / "message.error"）
  excludeFunction: ["formatMessage", "log"],

  // 白名单放行，优先级高于 excludeFunction
  // 例如：excludeFunction: ["error"] 但仍希望处理 message.error(...) 里的中文
  includeFunction: ["message.error"],
};
```

5) 运行

```bash
# 先扫一遍：只更新语言包，不改源码
npx i18n scan

# 确认语言包增量 OK 后再覆盖：会改源码
npx i18n cover
```

建议在运行 `cover` 前先提交一次 Git（便于回滚）。

## 命令

- `i18n scan`：只更新语言包 JSON，不改源码
- `i18n cover`：更新语言包 JSON + 改写源码
- `i18n -v`：查看版本号

更推荐用 `npx i18n ...`，避免全局 `i18n` 命令与其它工具冲突。

## 配置说明（`analysis.config.js`）

- `entry`：要扫描/覆盖的目录数组；默认是 `["src/aaa"]`，你基本一定要改成自己的目录。
- `exclude`：glob ignore 规则（数组或字符串均可）。
- `dataPath`：语言包目录；目录下的所有 JSON 文件都会被写回；目录内至少要有 1 个 `.json` 文件。
- `importMessage`：`cover` 模式下，工具认为文件“未引入 i18n”时，会把这段文本原样插入到文件顶部；默认是空字符串（不插入）。
- `i18nCallStack`：替换成的调用栈；默认 `["intl", "t"]`，最终会生成 `intl.t("中文")`。
- `excludeFunction`：处于这些函数调用（或 `new` 调用）内部的中文不处理；例如要跳过 `intl.formatMessage(...)` 内的中文，填 `["formatMessage"]`。

## 示例：会发生什么

假设 `i18nCallStack: ["intl", "t"]`。

代码：

```js
const title = "帕金森病磁刺激治疗系统";
```

运行 `cover` 后：

```js
const title = intl.t("帕金森病磁刺激治疗系统");
```

同时会把缺失的 key 追加到 `dataPath` 下的每一个 JSON 文件中（新增项默认是 `{"中文key":"中文key"}`，不做自动翻译）。

## 常见问题（FAQ）

### 1) 为什么 `intl.formatMessage({ id: '中文' })` 会变成 `id: intl.t('中文')`（多套一层）？

因为工具规则是“遇到中文字符串就替换”，它不会理解 `formatMessage({ id })` 的字段语义；对象属性的 value（`id: '中文'`）属于可替换范围，所以会被替换。

建议：
- `formatMessage` 的 `id` 用稳定英文 key（中文放到语言包或 `defaultMessage`）。
- 或把 `formatMessage` 加进 `excludeFunction`（注意：这样该调用内部的中文既不会被替换，也不会进入语言包 JSON）。

### 2) 为什么会重复插入 import，或者没插入？

工具判断“是否已引入 i18n”的方式是：检查是否存在 `import ... from '<source>'`，且 `<source>` 能匹配 `new RegExp(i18nCallStack[0])`。它不会校验 import specifier，也不会识别 `require()`。

### 3) `excludeFunction` 应该填什么？

填“被调用的方法名”，例如：

- `console.log("中文")`：应写 `excludeFunction: ["log"]`
- `intl.formatMessage({ id: "中文" })`：应写 `excludeFunction: ["formatMessage"]`

## 注意事项与限制

- 语言包的“基准 key 集合”取自 `dataPath` 目录里读到的**第一个 JSON 文件**；如果你的语言包之间 key 集合不一致，可能出现意外覆盖，建议先统一 key。
- `.vue` 文件会被纳入扫描文件列表，但工具会把整文件当作 JS/TS 解析；典型 Vue SFC（带 `<template>`）可能解析失败。
- `src/conf/default.config.js` 里有 `nesting` 字段，但当前版本未在扫描/覆盖流程中使用。
