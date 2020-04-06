import { match } from './index.js'

let mm = match("/user/:foo", {decode: decodeURIComponent});

console.log(mm('/user/a')); //可匹配上
console.log(mm('/user')); // false

mm = match("/user/:foo?", {decode: decodeURIComponent});

console.log(mm('/user/a')); //可匹配上
console.log(mm('/user')); // 可匹配上

mm = match("/user/{:foo}?", {decode: decodeURIComponent});

console.log(mm('/user/a')); //可匹配上
console.log(mm('/user')); // false
console.log(mm('/user/')); // 可匹配上

mm = match("/user/:foo*", {decode: decodeURIComponent});

console.log(mm('/user')); //可匹配上
console.log(mm('/user/a')); // 可匹配上 {path: "/user/a", index: 0, params: {foo: ["a"]}}
console.log(mm('/user/a/b/c')); // 可匹配上 {path: "/user/a", index: 0, params: {foo: ["a","b","c"]}}

mm = match("/user/:foo+", {decode: decodeURIComponent});

console.log(mm('/user')); //false
console.log(mm('/user/a')); // 可匹配上 {path: "/user/a", index: 0, params: {foo: ["a"]}}
console.log(mm('/user/a/b/c')); // 可匹配上 {path: "/user/a", index: 0, params: {foo: ["a","b","c"]}}

mm = match("/user/café", { decode: decodeURIComponent });

console.log(mm("/user/caf%C3%A9")); // false

mm = match("/user/café", { encode: encodeURI, decode: decodeURIComponent });

console.log(mm("/user/caf%C3%A9")); // { path: '/user/caf%C3%A9', index: 0, params: { id: 'café' } }