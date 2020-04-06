import { pathToRegexp, match, parse, compile } from './index.js'

const mm = match("/user/:id", { decode: decodeURIComponent });

console.log(mm("/user/123")); // { path: '/user/123', index: 0, params: { id: '123' } }
console.log(mm("/invalid")); // false
console.log(mm("/user/caf%C3%A9")); // { path: '/user/caf%C3%A9', index: 0, params: { id: 'café' } }