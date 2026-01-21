const fs = require('fs')
const pwd = process.cwd()
const path = require('path')
const analysisConfig = require('./config')
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
const JSON5 = require('json5');
const log = require('./log')

const { i18nCallStack, importMessage = '' } = analysisConfig
const importReg = new RegExp(i18nCallStack[0])

const { ESLint } = require("eslint");
const eslint = new ESLint({   
    // overrideConfigFile: true,
    overrideConfig: JSON5.parse(fs.readFileSync(path.join(pwd, './.eslintrc.json'))),
    fix: true });

function getCalleeName(callee) {
    if (!callee) return null
    if (callee.type === 'Identifier') return callee.name
    if (callee.type === 'MemberExpression' || callee.type === 'OptionalMemberExpression') {
        const prop = callee.property
        if (prop && prop.type === 'Identifier') return prop.name
        if (prop && prop.type === 'StringLiteral') return prop.value
    }
    return null
}

function getCalleeQualifiedName(callee) {
    if (!callee) return null
    if (callee.type === 'Identifier') return callee.name
    if (callee.type !== 'MemberExpression' && callee.type !== 'OptionalMemberExpression') return null
    const obj = callee.object
    const propName = getCalleeName(callee)
    if (!propName) return null
    const objName = getCalleeQualifiedName(obj)
    if (!objName) return null
    return `${objName}.${propName}`
}

function isInInvocationSet(invocationPath, functionSet) {
    if (!invocationPath || !invocationPath.node) return false
    const calleeName = getCalleeName(invocationPath.node.callee)
    const calleeQualifiedName = getCalleeQualifiedName(invocationPath.node.callee)
    return (calleeQualifiedName && functionSet.has(calleeQualifiedName)) || (calleeName && functionSet.has(calleeName))
}

function isInExcludedInvocation(path, excludeFunctionSet, includeFunctionSet) {
    let currentPath = path
    while (currentPath) {
        const invocationPath = currentPath.findParent(
            (p) => p.isCallExpression() || p.isNewExpression() || p.node.type === 'OptionalCallExpression'
        )
        if (!invocationPath) return false
        if (includeFunctionSet && includeFunctionSet.size && isInInvocationSet(invocationPath, includeFunctionSet)) return false
        if (excludeFunctionSet && excludeFunctionSet.size && isInInvocationSet(invocationPath, excludeFunctionSet)) return true
        currentPath = invocationPath.parentPath
    }
    return false
}

function isI18nCallee(callee, i18nCallStack) {
    if (!callee) return false
    if (callee.type !== 'MemberExpression' && callee.type !== 'OptionalMemberExpression') return false
    const obj = callee.object
    const prop = callee.property
    if (!obj || !prop) return false
    return obj.type === 'Identifier' &&
        obj.name === i18nCallStack[0] &&
        prop.type === 'Identifier' &&
        prop.name === i18nCallStack[1]
}

function isInI18nCall(path, i18nCallStack) {
    const callPath = path.findParent((p) => p.isCallExpression() || p.node.type === 'OptionalCallExpression')
    if (!callPath) return false
    return isI18nCallee(callPath.node.callee, i18nCallStack)
}

function fnReplace(value) {
    return t.callExpression(
        t.memberExpression(
          t.identifier(i18nCallStack[0]),
          t.identifier(i18nCallStack[1])
        ),
        [Object.assign(t.StringLiteral(value), {
            extra: {
              raw: `'${value}'`,
              rawValue: value,
            },
          })]
      )
}

function getNodeText(node) {
    if (!node) return null
    if (typeof node.value === 'string') return node.value
    if (t.isTemplateElement(node) && node.value) return node.value.cooked ?? node.value.raw
    return null
}

function replaceTemplateElement(templateElementPath, value) {
    const templateLiteralPath = templateElementPath.parentPath
    if (!templateLiteralPath || !templateLiteralPath.isTemplateLiteral()) return false
    const quasiIndex = templateElementPath.key
    if (typeof quasiIndex !== 'number') return false

    const normalized = value.replace(/[\n]/g, '')
    if (!normalized.trim()) return false

    const templateLiteralNode = templateLiteralPath.node
    const targetQuasi = templateLiteralNode.quasis[quasiIndex]
    if (!targetQuasi || !t.isTemplateElement(targetQuasi)) return false

    targetQuasi.value.raw = ''
    targetQuasi.value.cooked = ''

    templateLiteralNode.expressions.splice(quasiIndex, 0, fnReplace(normalized))
    templateLiteralNode.quasis.splice(quasiIndex + 1, 0, t.templateElement({ raw: '', cooked: '' }, false))
    templateLiteralNode.quasis.forEach((q, i) => {
        q.tail = i === templateLiteralNode.quasis.length - 1
    })

    templateLiteralPath.skip()
    return true
}

async function translateFn(config) {
    try {
        const { filePath, ext, type, excludeFunctionSet, includeFunctionSet } = config
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
        let needReplace = false
        traverse(astTree, {
            enter(path) {
                if(t.isImportDeclaration(path.node)) {
                    if(!hasImport && importReg.test(path.node.source.value)) {
                        hasImport = true
                    }
                }
                const nodeText = getNodeText(path.node)
                if(nodeText && /[\u4e00-\u9fa5]/.test(nodeText)) { 
                    if(isInI18nCall(path, i18nCallStack)) {
                        if(path.node.type === 'JSXText') {
                            valueList.push(path.node.value.replace(/[\n| ]/g, ''))
                        }else {
                            valueList.push(nodeText.replace(/[\n]/g, ''))
                        }
                        path.skip();
                        return
                    }
                    if(!isInExcludedInvocation(path, excludeFunctionSet, includeFunctionSet)) {
                        if(path.node.type === 'JSXText') {
                            valueList.push(path.node.value.replace(/[\n| ]/g, ''))
                        }else {
                            valueList.push(nodeText.replace(/[\n]/g, ''))
                        }
                        if(t.isJSXText(path.node)) {
                            const value = path.node.value.trim()
                            if (value) {
                                needReplace = true
                                path.replaceWith(t.JSXExpressionContainer(fnReplace(value)))
                            }
                        }else if (t.isTemplateElement(path.node)) {
                            if (type === 'cover') {
                                const replaced = replaceTemplateElement(path, nodeText)
                                if (replaced) needReplace = true
                            }
                        }else {
                            if(t.isJSXAttribute(path.parent)) {
                                const value = path.node.value
                                needReplace = true
                                path.replaceWith(t.JSXExpressionContainer(fnReplace(value)))
                            }else {
                                const isObjectKey =
                                    t.isObjectProperty(path.parent) &&
                                    path.parentKey === 'key' &&
                                    path.parent.computed !== true
                                if (!isObjectKey) {
                                    needReplace = true
                                    path.replaceWith(fnReplace(path.node.value))
                                }
                            }
                        }
                    }
                    path.skip();
                }
            },
        })

        if(needReplace && valueList.length && type === 'cover') {
            let { code } = generate(astTree, {  retainLines: true,  // 尽可能保留原始代码的行号
                compact: false,     // 不生成紧凑代码
                concise: false,     // 不生成简洁代码
                minified: false,    // 不生成最小化代码
                comments: true,      // 保留注释
                sourceFileName: filePath
              });
            if(importMessage && !hasImport) {
                code = `${importMessage}\n${code}`
            }
            const results = await eslint.lintText(code, {filePath});
            const fixedCode = results?.find(r => r.filePath === filePath)?.output
            fs.writeFileSync(filePath, (typeof fixedCode === 'string' && fixedCode) ? fixedCode : code, 'utf8')
        }
        return valueList

    } catch (error) {
        log.error(error)
        log.error(config.filePath)
        return []
    }

}

const getAnalysis = async function(config) {
    const fileInfo = await translateFn(config)
    return fileInfo
}

module.exports = getAnalysis
