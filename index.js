const program = require('commander')
const scale = require('./src/scale')
const getNoImport = require('./src/getNoImport')
const option = require('./package.json')

program
    .version(option.version, '-v, --version')

program
    .command('scan-i18n-file')
    .alias('scan-i18n')
    .argument('[type]', 'scan | cover', 'scan')
    .description('scan intl from code')
    .description('scan is default, cover will cover your code')
    .action(function (option){
        scale({type: 'scan'})
    })

program
    .command('scan-noimport')
    .alias('scni')
    .argument('[type]', '1 | 2', 1)
    .description('scan noimport file from code')
    .action(function (type){
        type = parseInt(type)
        getNoImport({type})
    })

program.parse(process.argv)