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

function scale() {
    const files = getSourceFiles({entry: config.entry, exclude: config.exclude}).map(v => ({
        filePath: v,
        ext: path.extname(v)
    }))
    const filei18nList = files.reduce((pre, cur) => (
        pre.concat(getAnalysis(cur))
    ), [])
    writeToFile('intl.data.json', filei18nList)
}

module.exports = scale