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

const transformOptions = {
    sourceType: 'module',
    ast: true,
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

module.exports = {
    transformOptions
}
