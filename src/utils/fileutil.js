const fs = require('fs')
const glob = require('glob')
const log = require('./log')

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

module.exports = {
    writeToFile,
    getSourceFiles
}