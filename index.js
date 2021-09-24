const program = require('commander')
const { analysis } = require('./src')

const option = require('./package.json')

program
    .version(option.version, '-v, --version')
   
program
    .command('analysis')
    .alias('a')
    .description('analysis string from the code')
    // .option('-p', 'nothing')
    .action(function (option){
        analysis()
    })

program.parse(process.argv)