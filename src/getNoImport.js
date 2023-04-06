const config = require('./utils/config')
const path = require('path')
const fs = require('fs')
const getAnalysis = require('./utils/getImport')
const log = require('./utils/log')
const pwd = process.cwd()
const webpackConfig = require(path.join(pwd, config.webpackPath)).resolve.alias
const { getSourceFiles, writeToFile } = require('./utils/fileutil')

// 处理config别名路径
function aliasParsePath(filePath) {
    const reg = new RegExp(`^${Object.keys(webpackConfig).sort((a, b) => b.length - a.length).join('|')}`)
    // const reg = new RegExp(`^@(point|ngiq/pnt-component)?`)
    return filePath.replace(reg, function(a) {
      return webpackConfig[a]
    })
}
// 处理路径
function relative2absolute(filepath, impPath) {
    const reg = /\.\.\//g
    const regReplace = /^(\.{1,2}\/)+/
    const len = (impPath.match(reg) || []).length
    const a = filepath.split('/')
    return impPath.replace(regReplace, path.join(pwd, a.slice(0, a.length - (len + 1)).join('/') + '/'))
}

const fileMap = new Map()
const stepSet = new Set()

const getFilesByTree = (filePath, ext = 'ts') => {
    try {
        if(ext && filePath) {
            getAnalysis({filePath, ext}).forEach(v => {
                v = aliasParsePath(relative2absolute(filePath, v)).replace(/(\.ts|\.tsx|\.js|\.jsx)$/, '')
                
                if(stepSet.has(v) && !fileMap.delete(v)) {
                    return
                }
                stepSet.add(v)
                let isFloder
                try {
                    isFloder = !fs.statSync(v).isFile()
                } catch (error) {
                    isFloder = false
                }               
                
                // 如果是文件夹,说明有index等配置引用,查找子文件
                if(isFloder) {
                    fs.readdirSync(v).filter(v => /(\.ts|\.tsx|\.js|\.jsx)$/.test(path.extname(v))).map(val => 
                        {
                            fileMap.delete(path.join(v, val).replace(/(\.ts|\.tsx|\.js|\.jsx)$/, ''))
                            getFilesByTree(path.join(v, val).replace(pwd + '/', ''), path.extname(val))
                        }
                    )
                } else {
                    if(fileMap.has(v)) {
                        const { filePath, ext } = fileMap.get(v)
                        fileMap.delete(v)
                        getFilesByTree(filePath, ext)
                    }
                }
            })
        }
    } catch (error) {
        log.error(error, filePath)
    }

}

function getNoImport(option) {
    const { type = 1 } = option
    getSourceFiles({entry: config.entry, exclude: config.exclude}).forEach(v => {
        // 引用可能无后缀, 所以去掉后缀当key
        const regex = /^(.*)\.[^.]+$/;
        const result = v.replace(regex, '$1')
        fileMap.set(path.join(pwd, result), {filePath: v,
            ext: path.extname(v), 
        })
        return {
            filePath: v,
            ext: path.extname(v),
            name: result
        }
        
    })
    const cur = [];
    const pointList = config.rootPath
    // const pointList = ['src/main/main.ts', 'src/renderer/app.tsx', 'src/pnt-component/packages/containers/groupAnalysis/groupRoutes.tsx', 'src/pnt-component/packages/lib/intl/flattenMessages.js', 'src/pnt-component/seeg/component/plan/planVolumeViewer/safety.worker.js']
    pointList.forEach(v => {
        const regex = /^(.*)\.[^.]+$/;
        const result = v.replace(regex, '$1')
        fileMap.delete(path.join(pwd, result))
    })
    pointList.forEach(v => getFilesByTree(v, '.ts'));
    fileMap.forEach(v => {
       if(!/\.d\.ts/.test(v.filePath)){
        cur.push(v.filePath)
        if(type & 2) fs.rmSync(path.join(pwd, v.filePath))
       }
    })
    writeToFile(path.join(pwd, 'no-import.json'), cur)
}

module.exports = getNoImport