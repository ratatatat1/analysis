const config = require('./utils/config')
const path = require('path')
const glob = require('glob')
const fs = require('fs')
const getAnalysis = require('./utils/getAnalysis')
const log = require('./utils/log')
const pwd = process.cwd()


function writeToFile(fileName, data) {
    fs.writeFile(fileName, JSON.stringify(data, '', ' '), 'utf-8', (error) => {
        if(error) {
            log.error(error)
            return false
        }
        log.success('success')
    })
}

function getSourceFiles({ entry, exclude }) {
    return entry.map(v => glob.sync(`${v}/**/*.{js,ts,tsx,jsx,vue}`, {
        ignore: exclude,
      })).flat();
}

async function scale(option) {
    const files = getSourceFiles({entry: config.entry, exclude: config.exclude}).map(v => ({
        filePath: v,
        ext: path.extname(v)
    }))
    const fileDataList = fs.readdirSync(config.dataPath)
    const defaultDataList = fileDataList.map(v => JSON.parse(fs.readFileSync(path.join(pwd, config.dataPath, v).toString('utf-8'))))
    const dataSet = new Set(Object.keys(defaultDataList[0]))
    const excludeFunctionSet = new Set([...config.excludeFunction, [config.i18nCallStack[config.i18nCallStack.length - 1]]].flat())
    const includeFunctionSet = new Set([...(config.includeFunction || [])].flat())
    const filei18nList = await files.reduce(async (pre, cur) => (await pre).concat(await getAnalysis(Object.assign({}, cur, option, {excludeFunctionSet, includeFunctionSet}))), [])
    fileDataList.forEach((v, i) => {
        const cur = defaultDataList[i]
        filei18nList.forEach(val => {
            if(!dataSet.has(val)) {
                cur[val] = val
            }
        })
        writeToFile(path.join(pwd, config.dataPath, v), cur)
    })
}

module.exports = scale
