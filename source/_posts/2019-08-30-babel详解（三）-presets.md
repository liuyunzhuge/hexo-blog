---
title: 'babel详解（三）:presets'
tags:
  - babel
  - 前端工程化
categories:
  - Javascript
  - babel
date: 2019-08-30 18:11:04
---


babel的presets是用来简化plugins的使用的。本篇介绍babel presets相关的内容。

<!-- more -->

## 官方推荐的preset
目前官方推荐的preset，有下面四个：
* @babel/preset-env 所有项目都会用到的
* @babel/preset-flow flow需要的
* @babel/preset-react react框架需要的
* @babel/preset-typescript typescript需要的

其它的preset，如state-2, state-3, es2015这些从babel7开始已经不推荐使用了。

## 自定义一个preset
要创建一个自己的preset，很简单，创建一个下面形式的模块：
```js
module.exports = function() {
  return {
    plugins: [
      "pluginA",
      "pluginB",
      "pluginC",
    ]
  };
}
```
上面这个简单的文件，就可以作为一个babel的preset。当babel的配置中，引用上面这个preset时，这个preset内定义的plugins就会生效。另外preset除了可以包含plugins，还可以包含其它的presets，只要类似下面的形式定义就可以了：
```js
module.exports = () => ({
  presets: [
    require("@babel/preset-env"),
  ],
  plugins: [
    [require("@babel/plugin-proposal-class-properties"), { loose: true }],
    require("@babel/plugin-proposal-object-rest-spread"),
  ],
});
```
仔细看一下，preset对外export的这个函数返回值，是不是跟.babelrc.js里面的配置很像呢！其实就一样的，我们在.babelrc.js里面怎么配置preset和plugin，这个地方就怎么配置preset和plugin。

所以要定义一个仅仅是plugin集合作用的preset还是很简单的。

## preset配置与使用
preset的配置方式与plugin完全一致。[查看官方对plugin/preset配置项的说明](https://babeljs.io/docs/en/options#plugin-preset-entries)

继续利用上一篇用到的那个小项目，并在项目根目录新建一个文件`my-preset.js`:
```js
module.exports = () => ({
  plugins: [
    ['@babel/plugin-transform-arrow-functions'],
    ['@babel/plugin-transform-classes', {spec: false}],
    ['@babel/plugin-transform-computed-properties'],
    ['@babel/plugin-proposal-object-rest-spread', {loose: true, useBuiltIns: true}]
  ]
});
```
把上一篇文章里面，在.babelrc.js里配置的所有plugins，全部都移动到`my-preset.js`，我想把这个文件等会作为一个preset，配置到.babelrc.js里面，试试babel转码的结果。`.babelrc.js`最终修改为：
```js
const presets = [
    './my-preset.js'
];
const plugins = [
];

module.exports = {presets, plugins}
```
然后运行`npx babel src --out-dir dist`，即可查看这个自定义preset配置后的转码结果。

### preset名称
上一篇介绍plugin名称的时候，我尝试从自己的角度来说明这个东西的规律。但实际上babel官方文档对plugin/preset的名称，有一个部分很详细的说明了这里面的规则，而且这个部分有一个专门的名称叫做Name Normalization，包含各种名称类型，如相对路径、绝对路径、npm包、scope npm包以及名称的简写规则的。[详情请参考](https://babeljs.io/docs/en/options#name-normalization)

### preset的顺序
上一篇也介绍过，presets是可以配置多个的，但是preset的启用顺序，与它在presets配置数组中的索引顺序是相反的。

### preset options
不同的preset支持不同的options，options的配置方式跟plugin是一样的，例如：
```json
{
  "presets": [
    ["@babel/preset-env", {
      "loose": true,
      "modules": false
    }]
  ]
}
```

## @babel/preset-env
这是当前babel最重要的一个preset，而且功能比上面自定义的preset要复杂的多，所以有必要详细的学习。这个preset，可以根据我们对`browserslist`的配置，在转码时自动根据我们对转码后代码的目标运行环境的最低版本要求，采用更加“聪明”的转码，如果我们设置的最低版本的环境，已经原生实现了要转码的ES特性，则会直接采用ES标准写法；如果最低版本环境，还不支持要转码的特性，则会自动注入对应的polyfill。

browserslist，应该已经不陌生了， 前端构建工具里面，很多都跟它有关系。除了[browserslist](https://github.com/browserslist/browserslist)，@babel/preset-env，还依赖了另外两个库来完成它的实现：[compat-table](https://github.com/kangax/compat-table), and [electron-to-chromium](https://github.com/Kilian/electron-to-chromium)。后面两个帮助preset-env，知道ES6的特性，在不同的平台、不同的运行环境中，都是从哪个版本开始原生支持的。

### important
@babel/preset-env不支持所有stage-x的plugins。通过查看preset-env的package.json文件，就能知道它需要哪些plugins:
```json
{
  "name": "@babel/preset-env",
  "version": "7.5.5",
  "dependencies": {
    "@babel/helper-module-imports": "^7.0.0",
    "@babel/helper-plugin-utils": "^7.0.0",
    "@babel/plugin-proposal-async-generator-functions": "^7.2.0",
    "@babel/plugin-proposal-dynamic-import": "^7.5.0",
    "@babel/plugin-proposal-json-strings": "^7.2.0",
    "@babel/plugin-proposal-object-rest-spread": "^7.5.5",
    "@babel/plugin-proposal-optional-catch-binding": "^7.2.0",
    "@babel/plugin-proposal-unicode-property-regex": "^7.4.4",
    "@babel/plugin-syntax-async-generators": "^7.2.0",
    "@babel/plugin-syntax-dynamic-import": "^7.2.0",
    "@babel/plugin-syntax-json-strings": "^7.2.0",
    "@babel/plugin-syntax-object-rest-spread": "^7.2.0",
    "@babel/plugin-syntax-optional-catch-binding": "^7.2.0",
    "@babel/plugin-transform-arrow-functions": "^7.2.0",
    "@babel/plugin-transform-async-to-generator": "^7.5.0",
    "@babel/plugin-transform-block-scoped-functions": "^7.2.0",
    "@babel/plugin-transform-block-scoping": "^7.5.5",
    "@babel/plugin-transform-classes": "^7.5.5",
    "@babel/plugin-transform-computed-properties": "^7.2.0",
    "@babel/plugin-transform-destructuring": "^7.5.0",
    "@babel/plugin-transform-dotall-regex": "^7.4.4",
    "@babel/plugin-transform-duplicate-keys": "^7.5.0",
    "@babel/plugin-transform-exponentiation-operator": "^7.2.0",
    "@babel/plugin-transform-for-of": "^7.4.4",
    "@babel/plugin-transform-function-name": "^7.4.4",
    "@babel/plugin-transform-literals": "^7.2.0",
    "@babel/plugin-transform-member-expression-literals": "^7.2.0",
    "@babel/plugin-transform-modules-amd": "^7.5.0",
    "@babel/plugin-transform-modules-commonjs": "^7.5.0",
    "@babel/plugin-transform-modules-systemjs": "^7.5.0",
    "@babel/plugin-transform-modules-umd": "^7.2.0",
    "@babel/plugin-transform-named-capturing-groups-regex": "^7.4.5",
    "@babel/plugin-transform-new-target": "^7.4.4",
    "@babel/plugin-transform-object-super": "^7.5.5",
    "@babel/plugin-transform-parameters": "^7.4.4",
    "@babel/plugin-transform-property-literals": "^7.2.0",
    "@babel/plugin-transform-regenerator": "^7.4.5",
    "@babel/plugin-transform-reserved-words": "^7.2.0",
    "@babel/plugin-transform-shorthand-properties": "^7.2.0",
    "@babel/plugin-transform-spread": "^7.2.0",
    "@babel/plugin-transform-sticky-regex": "^7.2.0",
    "@babel/plugin-transform-template-literals": "^7.4.4",
    "@babel/plugin-transform-typeof-symbol": "^7.2.0",
    "@babel/plugin-transform-unicode-regex": "^7.4.4",
    "@babel/types": "^7.5.5",
    "browserslist": "^4.6.0",
    "core-js-compat": "^3.1.1",
    "invariant": "^2.2.2",
    "js-levenshtein": "^1.1.3",
    "semver": "^5.5.0"
  }
}
```
上一篇说过babel的plugin，现在把还在处于proposal阶段的plugin都命名为了`-proposal`形式的plugin。 非proposal的plugin都变为`-transform`形式的plugin了。为什么上面的package.json还会包含几个`-proposal`的plugin呢？这是因为以上几个`-proposal`的plugin在我写文这个时间已经进展到`stage-4`了，它变为`-trasform`的plugin是早晚的事，所以preset-env才会包含它们。

由于proposal会不断地变化，意味着preset-env也会跟着调整，所以保持preset-env的更新，在平常的项目中也是比较重要的一项工作。

**因为这一点，所以preset-env不是万能的。 如果我们用到某一个新的ES特性，还是proposal阶段，而且preset-env不提供转码支持的话，就得自己单独配置plugins了。**

### important2
stage-x的preset已经不再推荐使用了，而且preset-env不支持stage-x的plugin，但是曾经的vue项目，还使用了stage-2这个preset，意味着stage-2里面的一些plugin还是vue项目需要的，如何用plugin单独配置的方式来取代stage-2呢？babel官方提供了一个替代的说明文件：[如何替代stage-x的preset](https://github.com/babel/babel/blob/master/packages/babel-preset-stage-0/README.md)

### browserslist
@babel/preset-env，需要像autoprefixer那样，配置一个browserslist，以便确认目标运行环境。虽然官方推荐我们使用跟autoprefixer一样的配置方式，借助.browserslistrc这个文件配置。我个人认为，preset-env的browserslist还是应该在preset-env里面独立配置，因为又不见得别的工具跟preset-env，对于目标环境的需求是完全相同的。preset-env的options里面有一个target option，就可以用来单独为它配置browserslist。

browserlist的配置方式需阅读它们的[官方文档](https://github.com/browserslist/browserslist#query-composition)。

写好一个browserlist字符串，可以通过`npx browserlist string`来检测，如：`npx browserslist 'iOS > 8, Android > 4'`：
```bash
> npx browserslist 'iOS > 8, Android > 4'
npx: installed 5 in 4.052s
android 67
android 4.4.3-4.4.4
android 4.4
android 4.2-4.3
android 4.1
ios_saf 12.2-12.3
ios_saf 12.0-12.1
ios_saf 11.3-11.4
ios_saf 11.0-11.2
ios_saf 10.3
ios_saf 10.0-10.2
ios_saf 9.3
ios_saf 9.0-9.2
ios_saf 8.1-8.4
```

### options

#### target
用来配置目标运行环境。
> string | Array<string> | { [string]: string }, defaults to {}.

target如果是一个string，则应该写成browserlist的query形式([什么是browserlist query](https://github.com/browserslist/browserslist#query-composition))，如
```json
{
  "target":"iOS > 8, Android > 4"
}
```
target如果是一个对象，则可以把browserlist的browsers直接配置到对象上（[什么是browserlist browser](https://github.com/browserslist/browserslist#browsers))，如：
```json
{
  "target": {
    "iOs": "8",
    "Android": "4"
  }
}
```
这种形式配置的browser代表的是它的最低版本。

除了以上两种形式，targets还有其它的一些配置方式，但是我觉得不常用，所以不打算仔细介绍了。[详情请查看](https://babeljs.io/docs/en/babel-preset-env#targets)

#### spec
这个在上一篇讲过的，这个option会传递到preset内部的plugin，如果plugin支持这个option, spec就会传给它。

#### loose
这个在上一篇讲过的，这个option会传递到preset内部的plugin，如果plugin支持这个option, loose就会传给它。

#### modules
> "amd" | "umd" | "systemjs" | "commonjs" | "cjs" | "auto" | false, defaults to "auto".

这个用于配置是否启用将ES6的模块转换其它规范的模块。在vue项目里，这个option被显示的配置为了false。

#### debug
这个用于开启转码的调试。我觉得很有用，能够看到很多有用的提示，尤其是polyfill相关的处理结果。

#### corejs
> 2, 3 or { version: 2 | 3, proposals: boolean }, defaults to 2.

这个option，用来指定preset-env进行polyfill时，要使用的corejs版本。 core-js是第三方写的不支持的浏览器环境，也能支持最新ES特性的库，该作者称其为standard library。 core-js现在有2个版本在被人使用：v2和v3。 所以preset-env的corejs这个option，可以支持配置2或者3。 但是从未来的角度来说，我认为不应该再关注core-js v2，它始终会被v3代替，慢慢地大家都会升级到v3上面来。 所以本篇在学习preset-env对core-js的polyfill行为，不再关注core-js v2了。

如果仅考虑core-js v3的话，preset-env的corejs 这个option，有两种配置：
1. `corejs: 3`
2. `corejs: {version: 3, proposals: boolean}`

默认情况下，对corejs的polyfill，只会注入那些stabled的ES特性，还处于proposal状态的polyfill则不会注入。 如果需要注入proposals的polyfill，则可以考虑将corejs配置为：`corejs: {version: 3, proposals: true}`。

`corejs: {version: 3, proposals: true}`往往搭配下面的`useBuiltIns: 'usage'`一起使用。

#### useBuiltIns
> "usage" | "entry" | false, defaults to false.

由于@babel/polyfill在babel7.4开始，也不支持使用了。 所以现在要用preset-env，必须是得单独安装core-js v3：
```bash
npm install core-js@3 --save
```
并且是要安装到dependences。

`useBuiltIns`，主要有两个value: `entry`和`usage`。 这两个值，不管是哪一个，都会把core-js的modules注入到转换后的代码里面，充当polyfill。 什么是core-js的module? 这个需要专门去学习core-js的文档，后面的博客学习core-js时，我也会专门记录。

##### entry
先来看entry的作用机制。 假如.babelrc.js如下配置：
```js
const presets = [ 
    [
    "@babel/preset-env",
            {
                "targets": {
                    ios: 8,
                    android: 4
                },
                useBuiltIns: "entry",
                corejs: 3,
                debug: true//方便调试
            }
        ]
];
const plugins = [
];

module.exports = { presets, plugins };
```
准备如下一段代码：
```js
Promise.resolve().finally();

let obj = {...{}};

globalThis.obj = obj;
```
运行`npx babel src --out-dir dist`对它进行转码。 因为有debug，控制台会打印出：
```
Using polyfills with `entry` option:

[D:\babel\src\main.js] Import of core-js was not found.
Successfully compiled 1 file with Babel.
```
这就提示我们需要在代码里，加入对core-js的import调用，以便注入core-js作为polyfill。

将代码修改如下：
```js
import "core-js";

Promise.resolve().finally();

let obj = {...{}};

globalThis.obj = obj;
```
运行`npx babel src --out-dir dist`对它进行转码。 此时不会再有`Import of core-js was not found`提示。 最后转码结果如下：
```js
"use strict";

require("core-js/modules/es.symbol");

require("core-js/modules/es.symbol.description");

// 中间省略了几百行require

require("core-js/modules/esnext.global-this");

require("core-js/modules/web.immediate");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

Promise.resolve().finally();

var obj = _objectSpread({}, {});

globalThis.obj = obj;
```
这个结果有做省略，累计有500多行。 在`useBuiltIns: 'entry'`模式下，代码中对core-js的import：`import "core-js"`，会全部被替换为core-js的`modules`引用，如`require("core-js/modules/es.symbol")`。 core-js有很多个module，所以源代码只有一行`import "core-js"`，转换后的代码有500多行`require("core-js/modules/...")`。

如果你想在项目中继续使用以前babel/polyfill的方式，那么上面这个形式，跟以前的babel/polyfill就是类似的。 只要把如下的两行代码加入到：
```js
import "core-js";
import "regenerator-runtime/runtime";
```
加入到你项目运行时的第1个文件中，就会在babel对转码后，将polyfill全部注入到运行环境中，而且这些polyfill的代码，会先与项目的其它代码执行，这样就能达到整体polyfill的目的。

这个方式有问题吗？有的，就是使用的polyfill太多了，有的可能整个项目的逻辑都不需要它，这个方式最后生成代码比较大，对前端性能肯定是有影响的；唯一的优点就是省心，不要去考虑哪个文件需要引入哪些core-js的modules来作为polyfill。

如何改进呢？
在自身对当前文件所用到的ES特性非常熟悉的情况下，可以选择手工地引入core-js的modules，来避免整体的引用。 将代码修改为：
```js
import "core-js/es/promise";
import "core-js/es/array";

Promise.resolve().finally();

let obj = {...{}};

globalThis.obj = obj;
```
运行`npx babel src --out-dir dist`对它进行转码。 最终结果为：
```js
"use strict";

require("core-js/modules/es.array.concat");

require("core-js/modules/es.array.copy-within");

// 省去几十行

require("core-js/modules/es.array.unscopables.flat");

require("core-js/modules/es.array.unscopables.flat-map");

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.promise");

require("core-js/modules/es.promise.finally");

require("core-js/modules/es.string.iterator");

require("core-js/modules/web.dom-collections.iterator");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

Promise.resolve().finally();

var obj = _objectSpread({}, {});

globalThis.obj = obj;
```
这个结果虽然还是有很多，但是比直接import core-js要减少好多了。 它的机制也是类似的，就是把对core-js的import，转换为core-js的最小单位：modules。这两个：
```js
import "core-js/es/promise";
import "core-js/es/array";
```
实际上代表的是core-js的两个命名空间：promise和array。 它们分别可能包含多个modules。 所以转码后，还是有好几十个core-js module的require语句。

虽然单独引用core-js的某一部分，能够减少最终的转码大小，但是要求开发人员对core-js和ES特性特别熟悉，否则你怎么知道当前文件需不需要polyfill，以及要哪些呢？ 所以这个做法，真正使用的时候，难度较大。

假如把配置文件调整一下：
```js
const presets = [ 
    [
    "@babel/preset-env",
            {
                "targets": {
                    ios: 12
                },
                useBuiltIns: "entry",
                corejs: 3,
                debug: true
            }
        ]
];
const plugins = [
];

module.exports = { presets, plugins };
```
我把targets设置为非常新的环境，然后重新对：
```js
import "core-js/es/promise";
import "core-js/es/array";

Promise.resolve().finally();

let obj = {...{}};

globalThis.obj = obj;
``` 
运行`npx babel src --out-dir dist`转码，最终结果为：
```js
"use strict";

require("core-js/modules/es.array.reverse");

require("core-js/modules/es.array.unscopables.flat");

require("core-js/modules/es.array.unscopables.flat-map");

require("core-js/modules/web.dom-collections.iterator");

Promise.resolve().finally();
let obj = { ...{}
};
globalThis.obj = obj;
```
因为有browserslist等的加成，而且targets配置的很新，所以最终这个转码，也还是变的小了不少。

##### usage
usage比起entry，最大的好处就是，它会根据每个文件里面，用到了哪些es的新特性，然后根据我们设置的targets判断，是否需要polyfill，如果targets的最低环境不支持某个es特性，则这个es特性的core-js的对应module会被注入。

配置文件修改为：
```js
const presets = [ 
    [
    "@babel/preset-env",
            {
                "targets": {
                    ios: 8,
                    android: 4.1
                },
                useBuiltIns: "usage",
                corejs: 3,
                debug: true
            }
        ]
];
const plugins = [
];

module.exports = { presets, plugins };
```
代码修改为：
```js
Promise.resolve().finally();

let obj = {...{}};

globalThis.obj = obj;
```
运行`npx babel src --out-dir dist`转码，最终结果为：
```js
"use strict";

require("core-js/modules/es.symbol");

require("core-js/modules/es.array.filter");

require("core-js/modules/es.array.for-each");

require("core-js/modules/es.object.define-properties");

require("core-js/modules/es.object.define-property");

require("core-js/modules/es.object.get-own-property-descriptor");

require("core-js/modules/es.object.get-own-property-descriptors");

require("core-js/modules/es.object.keys");

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.promise");

require("core-js/modules/es.promise.finally");

require("core-js/modules/web.dom-collections.for-each");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

Promise.resolve().finally();

var obj = _objectSpread({}, {});

globalThis.obj = obj;
```
最终这个文件转码结果，就只有这么多，比使用`entry`简化了不少，而且很智能，不需要自己去操心需要哪些polyfill。 这也是为啥`usage`被推荐在项目中使用的原因。

观察上面的源码和转码后的代码，其实有个小地方没有被转换，就是：`globalThis`，这是es的一个提案，当前是stage-3阶段，这个没有被注入polyfill。这是因为preset-env默认不会对proposals进行polyfill，所以如果需要对proposals进行polyfill，可以把配置文件做一点点修改：
```js
const presets = [ 
    [
    "@babel/preset-env",
            {
                "targets": {
                    ios: 8,
                    android: 4.1
                },
                useBuiltIns: "usage",
                corejs: {version: 3, proposals: true},
                debug: true
            }
        ]
];
const plugins = [
];

module.exports = { presets, plugins };
```
然后重新运行`npx babel src --out-dir dist`转码，最终结果为：
```js
"use strict";

require("core-js/modules/es.symbol");

require("core-js/modules/es.array.filter");

require("core-js/modules/es.array.for-each");

require("core-js/modules/es.object.define-properties");

require("core-js/modules/es.object.define-property");

require("core-js/modules/es.object.get-own-property-descriptor");

require("core-js/modules/es.object.get-own-property-descriptors");

require("core-js/modules/es.object.keys");

require("core-js/modules/es.object.to-string");

require("core-js/modules/es.promise");

require("core-js/modules/es.promise.finally");

require("core-js/modules/esnext.global-this");

require("core-js/modules/web.dom-collections.for-each");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

Promise.resolve().finally();

var obj = _objectSpread({}, {});

globalThis.obj = obj;
```
多了一条`require("core-js/modules/esnext.global-this");`，这就是globalThis proposal的polyfill。

#### 其它options
[其它的options](https://babeljs.io/docs/en/babel-preset-env#include)，建议有需要在学习。

## 结束语
本篇对presets的介绍就是上面这些内容了，其实从babel官方文档中还能够再总结出一些东西的，但是这样就太费时间了，好多信息散落在blog github以及各个preset的单独介绍页面中，不好整理。 本篇的内容包含了preset最重要的知识点，对于加强preset的认识，已经够了。