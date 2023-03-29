const fs = require('fs')
const pwd = process.cwd()
// const path = require('path')
const babel = require('@babel/core');
const traverse = require('@babel/traverse').default;
const generate = require('@babel/generator').default;
const t = require('@babel/types');
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
const requireMessage = `import { intlMessage } from '@/renderer/hocComponent/intlMessage'`
const log = require('./log')

function translateFn(config) {
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
            generatorOpts: {
                jsescOption: {
                    minimal: true
                }
            },
        };
        const astTree = babel.parseSync(fileCode, transformOptions)
        let hasImport = false
        traverse(astTree, {
            enter(path) {
                if(t.isImportDeclaration(path.node)) {
                    if(/intlMessage/.test(path.node.source.value)) {
                        hasImport = true
                    }
                }
                if(/[\u4e00-\u9fa5]/.test(path.node.value)) { 
                    valueList.push(path.node.value.replace(/[\n| ]/g, ''))
                    if(((path.parent.callee || {}).property || {}).name !== 't') {
                        if(t.isJSXText(path.node)) {
                            path.node.value = (`{intlMessage.t('${path.node.value.trim()}')}`)
                        }else {
                            path.replaceWith(t.callExpression(
                                t.memberExpression(
                                  t.identifier('intlMessage'),
                                  t.identifier('t')
                                ),
                                [Object.assign(t.StringLiteral(path.node.value), {
                                    extra: {
                                      raw: `'${path.node.value}'`,
                                      rawValue: path.node.value,
                                    },
                                  })]
                              ))
                              path.skip();

                        }
                    }
                }
            },
        })
        if(valueList.length) {
            let { code } = generate(astTree, { retainLines: false, decoratorsBeforeExport: true, jsescOption: {minimal: true} }, fileCode);
            if(!hasImport) {
                code = `${requireMessage}\n${code}`
            }
            fs.writeFileSync(filePath, `${code}\n`)
        }
        return valueList

    } catch (error) {
        log.error(config.filePath)
        return []
    }

}

const getAnalysis = function(config) {
    const fileInfo = translateFn(config)
    return fileInfo
}

module.exports = getAnalysis