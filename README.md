## 一些代码处理相关的功能脚本

### install
```sh
    npm install analysis-code --save--dev
```

### config
    文件地址:读取根目录下analysis.config.js
```js
const defaultConfig = {
    entry: ['src'], // 文件入口,扫描当前路径下的文件, required
    exclude: '**{/tes?/**/*,/*/*.test.*}', // 排除文件
    dataPath: 'path', // scan-i18n 导出文件目录
    requireMessage: 'string', // scan-i18n cover: 需要添加的引用
    rootPath: ['src/aaa/index.tsx'], // scan-no-import: 入口文件
    webpackPath: 'config/webpack.base.config.js' // scan-no-import: webpack地址,用于处理别名
}
module.exports = defaultConfig
```

### scan-i18n
```sh
    npm run analysis scan-i18n [scan|cover]
```
#### scan为扫描, cover为扫描+替换
#### 逻辑
* 扫描entry下所有文件(排除exclude)
* 解析文件中的内容,找到中文内容
* cover: 如果没有引用requireMessage则增加引用;替换中文为intlMessage.t('你好')
* 对比dataPath中的内容,如果没有,添加到文件中
### scan-noimport
```sh
    npm run analysis scan-noimport [1|2]
```
#### 逻辑
* 扫描entry下所有文件(排除exclude)
* 以rootPath为入口解析引用
* 通过rootPath获取alias,正确处理import路径
* 排除有引用的js获得未被使用部分
* type=2: 删除未被引用的文件
* 未被使用的文件写入no-import.json中
