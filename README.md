### 配置
#### scan 扫描文件中的中文，与dataPath文件下的json做diff并添加到json中
#### cover 覆盖，包含scan功能，并查看中文是否被包裹，如果没有添加i18nCallStack中文件，并在需要时引入importMessage


### 配置文件 analysis.config.js
```js
  const defaultConfig = {
  entry: ['path'], // 解析路径
  exclude: '**{/tes?/**/*,/*/*.test.*}', // 排除文件
  dataPath: 'src/locale/', // 现有多语言json 如有en-us.json、zh-cn.json
  importMessage: "import { intl } from '@/intl';", // 如果cover 添加包裹后 
  i18nCallStack: ['intl', 't'], // 调用栈 intl.t('hello world') 默认：[intl, t]
  excludeFunction: ['log','error'], // 方法包裹字段不会被扫描
};

module.exports = defaultConfig;

```