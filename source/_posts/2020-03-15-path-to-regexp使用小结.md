---
title: path-to-regexp使用小结
date: 2020-03-15 22:19:40
tags:
  - path-to-regexp
  - vue-router
  - vue-router源码
categories:
  - Javascript
  - router
---


[path-to-regexp](https://github.com/pillarjs/path-to-regexp)是一个库，可用于路由的解析。它可以把`/user/:name`之类的字符串转化为一个常规的正则表达式。

<!--more-->
在前端路由场景中，往往会定义一些包含命名参数的路由，来让路由更加灵活。比如`/user/:id`这种，其中的`:id`被称为路由的命名参数，参数名为`id`，参数的值，则由具体的路由路径发生匹配时来决定。 比如`/user/1`和`/user/2`这两个路径，都是匹配`/user/:id`这个路由的，在两次匹配中`id`参数的值分别为1和2。

来看看`path-to-regexp`如何完成上面的功能。

## pathToRegexp
```js
import { pathToRegexp } from './index.js'

const keys = [];
const regexp = pathToRegexp("/user/:id", keys);

console.log(regexp) // /^\/user(?:\/([^\/#\?]+?))[\/#\?]?$/i
console.log(keys) // [{name: "id", prefix: "/", suffix: "", pattern: "[^\/#\?]+?", modifier: ""}]
```
如上所示，`path-to-regexp`提供的`pathToRegexp`函数把`/foo/:bar`这个字符串转换为了一个正则表达式`regexp`，并且能把这个字符串中的命名参数`:id`提取出来，存放到`pathToRegexp`调用时传入的第二个参数`keys`数组中。

## match
```js
import { match } from './index.js'

const mm = match("/user/:id", { decode: decodeURIComponent });

console.log(mm("/user/123")); // { path: '/user/123', index: 0, params: { id: '123' } }
console.log(mm("/invalid")); // false
console.log(mm("/user/caf%C3%A9")); // { path: '/user/caf%C3%A9', index: 0, params: { id: 'café' } }
```
通过`path-to-regexp`提供的`match`api，可以对一个路由字符串创建一个拥有路由解析能力的新函数`mm`（这只是个变量名），通过`mm`对不同的路径字符串如`/user/123`进行调用，就能很方便地判断该路径是否与路由匹配，如果匹配，相关的参数及参数值是什么。

PS:说明在`match`的内部，肯定是有`pathToRegexp`的处理的。

综合以上2点，不难看出，借助于`path-to-regexp`来定义路由规则，当你需要判断一个路径是否与某个路由匹配，并且提取路径中与路由的命名参数相应的值，是非常容易的。

`match`有一个需要注意的点，就是如果路由字符串是没有经过URL转义的，则可能导致一些未知的问题，所以在适当的时候，应该考虑对原始的路由串进行encode处理：
```js
mm = match("/user/café", { decode: decodeURIComponent });

console.log(mm("/user/caf%C3%A9")); // false

mm = match("/user/café", { encode: encodeURI, decode: decodeURIComponent });

console.log(mm("/user/caf%C3%A9")); // { path: '/user/caf%C3%A9', index: 0, params: { id: 'café' } }
```

## 命名参数
命名参数是`path-to-regexp`的核心处理能力，指的是在路由中以冒号开头的特殊子串。如下面示例中的`:foo`和`:bar`。
```js
import { pathToRegexp } from './index.js'

const keys = [];
const regexp = pathToRegexp("/:foo/:bar", keys);

console.log(keys) //解析出两个命名参数
// [{name: "foo", prefix: "/", suffix: "", pattern: "[^\/#\?]+?", modifier: ""},
// {name: "bar", prefix: "/", suffix: "", pattern: "[^\/#\?]+?", modifier: ""}]
```

默认情况下，命名参数部分在解析为正则表达式过程中，都是用`[^\/#\?]+?`来代替，如果想自定义某个命名参数的匹配规则，可以在命名参数后面加入`()`，在`()`中书写自定义的匹配规则，如：
```js
import { pathToRegexp } from './index.js'

let keys = [];
let regexp = pathToRegexp("/icon-:foo(\\d+).png", keys);

console.log(regexp) // /^\/icon-(\d+)\.png[\/#\?]?$/i
console.log(keys) // [{name: "foo", prefix: "", suffix: "", pattern: "\d+", modifier: ""}]

keys = [];
regexp = pathToRegexp("/to-(user|u)", keys);

console.log(regexp) // /^\/to-(user|u)[\/#\?]?$/i
console.log(keys) // [{name: 0, prefix: "", suffix: "", pattern: "user|u", modifier: ""}]
```
上面的示例中，第一个示例`:foo`这个命名参数，自定义了匹配规则`\d+`，所以到时候进行路由匹配时，如果路径中跟`:foo`对应的部分不匹配`\d+`则会导致匹配失败：
```js
let mm = match("/icon-:foo(\\d+).png", {decode: decodeURIComponent})
console.log(mm('/icon-123.png')) // {path: "/icon-123.png", index: 0, params: {foo: "123"}}
console.log(mm('/icon-abc.png')) // false
```
第二个示例，是一个匿名的命名参数，从打印出的`keys`也能看到，对应的`name`是一个数字0。如果匿名的参数有多个，则`name`属性按参数顺序来赋值：
```js
keys = [];
regexp = pathToRegexp("/to-(user|u)-(\\d+)", keys);

console.log(regexp)
console.log(keys)
// [{name: 0, prefix: "", suffix: "", pattern: "user|u", modifier: ""},
//  {name: 1, prefix: "", suffix: "", pattern: "\d+", modifier: ""}]
```
匿名参数在`match`的时候也能解析出来：
```js
mm = match("/to-(user|u)-(\\d+)", {decode: decodeURIComponent})
console.log(mm('/to-u-123')) // {path: "/to-u-123", index: 0, params: {0: "u", 1: "123"}}
```

命名参数可以添加前缀和后缀，只需要把命名参数放在`{}`中来定义，如：
```js
import { pathToRegexp, match } from './index.js'

let keys = [];
let regexp = pathToRegexp("/test{yes-:foo-no}", keys);

console.log(regexp) 
console.log(keys) // {name: "foo", pattern: "[^\/#\?]+?", prefix: "yes-", suffix: "-no", modifier: ""}

let mm = match("/test{yes-:foo-no}", {decode: decodeURIComponent});
console.log(mm('/testyes-123-no')); // {path: "/testyes-123-no", index: 0, params: {foo: "123"}}
console.log(mm('/testyes-123-noo')); // false
```
从这个示例打印出的`keys`能看到`prefix`和`suffix`两个属性，分别代表了命名参数的前缀和后缀，这正是通过`{}`在命名参数`:foo`前后添加的那两个字符串。

命名参数在路由中可以像添加修饰符来增强路由的灵活性。修饰符有三个：`?+*`，必须放置在命名参数的后面。从前面的内容总结，命名参数有以下几种形式：`/:foo` `/:foo(\\d+)` `/{yes-:foo-no}` `/{yes-:foo(\\d+)-no}` `/(\\d+)` `/{yes-(\\d+)-no}`，假设要加一个通配符，则必须位于前面几种形式的后面，如：`/:foo?` `/:foo(\\d+)?` `/{yes-:foo-no}?` `/{yes-:foo(\\d+)-no}?` `/(\\d+)?` `/{yes-(\\d+)-no}?`。

通配符三个的含义跟正则相似，`?`表示这个命名参数可以匹配0或1次，`+`表示这个命名参数可以匹配1次以上，`*`则表示这个命名参数可以匹配0次以上。示例如下：
```js
import { match } from './index.js'

let mm = match("/user/:foo", {decode: decodeURIComponent});

console.log(mm('/user/a')); //可匹配上
console.log(mm('/user')); // false

mm = match("/user/:foo?", {decode: decodeURIComponent});

console.log(mm('/user/a')); //可匹配上
console.log(mm('/user')); // 可匹配上

mm = match("/user/:foo*", {decode: decodeURIComponent});

console.log(mm('/user')); //可匹配上
console.log(mm('/user/a')); // 可匹配上 {path: "/user/a", index: 0, params: {foo: ["a"]}}
console.log(mm('/user/a/b/c')); // 可匹配上 {path: "/user/a", index: 0, params: {foo: ["a","b","c"]}}

mm = match("/user/:foo+", {decode: decodeURIComponent});

console.log(mm('/user')); //false
console.log(mm('/user/a')); // 可匹配上 {path: "/user/a", index: 0, params: {foo: ["a"]}}
console.log(mm('/user/a/b/c')); // 可匹配上 {path: "/user/a", index: 0, params: {foo: ["a","b","c"]}}
```
在`?`修饰符场景中，命名参数没有匹配到，即使它的`prefix`在路径中没有，也是可以匹配上的，如：
```js
mm = match("/user/:foo?", {decode: decodeURIComponent});

console.log(mm('/user/a')); //可匹配上
console.log(mm('/user')); // 可匹配上
```
上面`foo`这个参数的`prefix`是`/`，而`/user`这个路径后面没有`/`，但它还是能匹配成功，因为它满足`?`修饰符的功能。如果想要这种情况不成立，可以使用`{}`：
```js
mm = match("/user/{:foo}?", {decode: decodeURIComponent});

console.log(mm('/user/a')); //可匹配上
console.log(mm('/user')); // false
console.log(mm('/user/')); // 可匹配上
```
在这个场景中,`foo`的`prefix`被设置为了空串，而不是`/`。

路由中如果有普通的`?`字符，需要进行转义：
```js
const regexp = pathToRegexp("/search/:tableName\\?useIndex=true&term=amazing");

regexp.exec("/search/people?useIndex=true&term=amazing");
//=> [ '/search/people?useIndex=true&term=amazing', 'people', index: 0, input: '/search/people?useIndex=true&term=amazing', groups: undefined ]

// This library does not handle query strings in different orders
regexp.exec("/search/people?term=amazing&useIndex=true");
//=> null
```
从上个例子中还能看到，虽然`/search/people?useIndex=true&term=amazing`和`/search/people?term=amazing&useIndex=true`在被浏览器解析时是相同的`pathname`以及相同的query数据，但是在`path-to-regexp`中，无法解析这种无序的数据串，它不具备去解析`querystring`的能力，它的核心是处理`path`。
