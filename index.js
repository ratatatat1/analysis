const program = require('commander')
const scale = require('./src/scale')
const option = require('./package.json')

program
    .version(option.version, '-v, --version')

program
    .command('scale-file')
    .alias('scale')
    .description('scale intl from code')
    .action(function (option){
        scale()
    })

program.parse(process.argv)