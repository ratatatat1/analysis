const fs = require('fs')
const path = require('path')
const options = require('../conf/default.config')
const pwd = process.cwd()
const analysis = (function() {
    const configPath = path.join(pwd, 'analysis.config.js')
    let config = options
    if(fs.existsSync(configPath)) {
        try{
            config = require(configPath)
        } catch(err) {
            log.error(`请检查 ${configPath} 配置文件是否正确\n配置文件名为analysis.config.js\n`)
        }
        config = Object.assign(options, config)
    }
    return config
})()

module.exports = analysis