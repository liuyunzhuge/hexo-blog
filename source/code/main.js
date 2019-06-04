let m = require('./module.js');

// 在module加载&执行完以后，立即访问val和getVal接口
console.log('check immediately', m.value);// check immediately undefined
console.log('check immediately', m.getValue());// check immediately undefined

// 1500ms以后再访问一次
setTimeout(()=>{
    console.log('check after 1.5s', m.value);// check immediately undefined
    console.log('check after 1.5s', m.getValue());// check immediately not empty
}, 1500);