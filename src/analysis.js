const fs = require('fs')
const path = require('path')
const glob = require('glob')
const config = require('./utils/config')
const getAnalysis = require('./utils/getAnalysis')
const getApolloConfig = require('./utils/getApolloConfig')
const log = require('./utils/log')
const pwd = process.cwd()

function getSourceFiles({ entry, exclude }) {
    return glob.sync(`${entry}/**/*.{js,ts,tsx,jsx,vue}`, {
      ignore: exclude || [],
    });
}

function writeToFile(fileName, data) {
    fs.writeFile(fileName, JSON.stringify(data, '', '  '), 'utf-8', (error) => {
        if(error) {
            log.error(error)
            return false
        }
        log.success('success')
    })
}

const analysis = async function() {
    let apolloConfig = null
    let apolloData = {}
    const configPath = path.join(pwd, 'di18n.config.js')
    if(fs.existsSync(configPath)) {
        try {
            apolloConfig = require(configPath)
        } catch (error) {
            
        }
    }
    const files = getSourceFiles({entry: config.entry, exclude: config.exclude}).map(v => ({
        filePath: v,
        ext: path.extname(v)
    }))

    const filei18nList = files.reduce((pre, cur) => (
        pre.concat(getAnalysis(cur))
    ), [])
    if(apolloConfig) {
        apolloConfig.supportedLocales.map(async v => {
            try{
                apolloData = await getApolloConfig({...apolloConfig.localeConf, confName: v + '-test'})
                const apolloDataKey = Object.keys(apolloConfig)
                filei18nList.forEach(v => {
                    !apolloDataKey.find(val => val === v) && (apolloData[v] = v)
                })
                writeToFile(`${v}.data.json`, apolloData)
            }catch{
                log.info('please check your config!')
                writeToFile(`apollo.data.json`, filei18nList.reduce((pre, cur) => ({...pre, [cur]: cur}), {}))
            }
        })
        return
    }
    writeToFile(`apollo.data.json`, filei18nList.reduce((pre, cur) => ({...pre, [cur]: cur}), {}))
}

module.exports = analysis