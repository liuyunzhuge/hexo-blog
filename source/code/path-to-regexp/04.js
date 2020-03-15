import { pathToRegexp, match } from './index.js'

let keys = [];
let regexp = pathToRegexp("/icon-:foo(\\d+).png", keys);

console.log(regexp)
console.log(keys)

let mm = match("/icon-:foo(\\d+).png", {decode: decodeURIComponent})
console.log(mm('/icon-123.png')) // {path: "/icon-123.png", index: 0, params: {foo: "123"}}
console.log(mm('/icon-abc.png')) // false

keys = [];
regexp = pathToRegexp("/to-(user|u)-(\\d+)", keys);

console.log(regexp)
console.log(keys)

mm = match("/to-(user|u)-(\\d+)", {decode: decodeURIComponent})
console.log(mm('/to-u-123'))