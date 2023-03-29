const program = require('commander')
const scale = require('./src/scale')
const option = require('./package.json')

program
    .version(option.version, '-v, --version')

program
    .command('scale-file')
    .alias('cover')
    .description('scale intl from code')
    .action(function (option){
        scale({type: 'cover'})
    })
program
    .command('scale-file')
    .alias('scan')
    .description('scale intl from code')
    .action(function (option){
        scale({type: 'scan'})
    })

program.parse(process.argv)