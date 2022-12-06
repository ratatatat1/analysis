module.exports = {
    error: (v) => console.log('\x1B[31m%s\x1B[0m', v),
    info: (v) => console.log(v),
    warning: (v) => console.log('\x1B[33m%s\x1B[0m', v),
    success: (v) => console.log('\x1B[32m%s\x1B[0m', v),
}