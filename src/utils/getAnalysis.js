const fs = require('fs')
const pwd = process.cwd()
// const path = require('path')
const babel = require('@babel/core');
const traverse = require('@babel/traverse').default;
const pluginSyntaxJSX = require('@babel/plugin-syntax-jsx');
const pluginSyntaxProposalOptionalChaining = require('@babel/plugin-proposal-optional-chaining');
const pluginSyntaxClassProperties = require('@babel/plugin-syntax-class-properties');
const pluginSyntaxDecorators = require('@babel/plugin-syntax-decorators');
const pluginSyntaxObjectRestSpread = require('@babel/plugin-syntax-object-rest-spread');
const pluginSyntaxAsyncGenerators = require('@babel/plugin-syntax-async-generators');
const pluginSyntaxDoExpressions = require('@babel/plugin-syntax-do-expressions');
const pluginSyntaxDynamicImport = require('@babel/plugin-syntax-dynamic-import');
const pluginSyntaxExportExtensions = require('@babel/plugin-syntax-export-extensions');
const pluginSyntaxFunctionBind = require('@babel/plugin-syntax-function-bind');
const presetTypescript = require('@babel/preset-typescript');

function translateFn(config) {
    const { filePath, ext } = config
    const fileCode = fs.readFileSync(filePath, 'utf8')
    let presets = []
    let valueList = []
    if (['.ts', '.tsx'].includes(ext)) {
        presets = [
          [presetTypescript, { isTSX: true, allExtensions: true }],
        ];
    }
    const transformOptions = {
        sourceType: 'module',
        ast: true,
        presets,
        plugins: [
          pluginSyntaxJSX,
          pluginSyntaxProposalOptionalChaining,
          pluginSyntaxClassProperties,
          [pluginSyntaxDecorators, { legacy: true }],
          pluginSyntaxObjectRestSpread,
          pluginSyntaxAsyncGenerators,
          pluginSyntaxDoExpressions,
          pluginSyntaxDynamicImport,
          pluginSyntaxExportExtensions,
          pluginSyntaxFunctionBind,
        ],
    };
    const astTree = babel.parseSync(fileCode, transformOptions)
    traverse(astTree, {
        enter(path) {
            path.node.type === 'StringLiteral' && /[\u4e00-\u9fa5]/.test(path.node.value) && valueList.push({path: filePath.replace(pwd, ''), value: path.node.value})
            // path.node.type === 'StringLiteral' && ((path.parent.callee || {}).property || {}).name === 't' && valueList.push(path.node.value)
        }
    })
    return valueList
}

const getAnalysis = function(config) {
    const fileInfo = translateFn(config)
    return fileInfo
}

module.exports = getAnalysis