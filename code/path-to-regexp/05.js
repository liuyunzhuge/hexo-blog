import { pathToRegexp, match } from './index.js'

let keys = [];
let regexp = pathToRegexp("/test{yes-:foo-no}", keys);

console.log(regexp) 
console.log(keys) // {name: "foo", pattern: "[^\/#\?]+?", prefix: "yes-", suffix: "-no", modifier: ""}

let mm = match("/test{yes-:foo-no}", {decode: decodeURIComponent});
console.log(mm('/testyes-123-no')); // {path: "/testyes-123-no", index: 0, params: {foo: "123"}}
console.log(mm('/testyes-123-noo')); // false