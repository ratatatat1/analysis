const fs = require('fs')
const babel = require('@babel/core');
const traverse = require('@babel/traverse').default;
const presetTypescript = require('@babel/preset-typescript');
const t = require('@babel/types');
const { transformOptions } = require('../conf/babel.parse.config')
const log = require('./log')


function getImportPath(config) {
    try {
        const { filePath, ext } = config
        const fileCode = fs.readFileSync(filePath, 'utf8')
        let presets = []
        let valueList = []
        if (['.ts', '.tsx'].includes(ext)) {
            presets = [
                [presetTypescript, { isTSX: true, allExtensions: true }],
            ];
        }
        const astTree = babel.parseSync(fileCode, Object.assign(transformOptions, {presets: presets}))
        traverse(astTree, {
            enter(path) {
                if(t.isImportDeclaration(path.node)) {
                    valueList.push(path.node.source.value)
                }
            },
        })
        return valueList

    } catch (error) {
        log.error(config, error)
        return []
    }

}

const getAnalysis = function(config) {
    const fileInfo = getImportPath(config)
    return fileInfo
}

module.exports = getAnalysis