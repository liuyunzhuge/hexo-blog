---
title: 'babel详解（四）:core-js'
tags:
  - babel
  - 前端工程化
categories:
  - Javascript
  - babel
date: 2019-09-02 13:10:31
---

本篇了解与babel高度集成的[core-js](https://github.com/zloirock/core-js)的要点。

<!-- more -->
## 概述
core-js是完全模块化的javascript标准库。 包含ECMA-262至今为止大部分特性的polyfill，如promises、symbols、collections、iterators、typed arrays、etc，以及一些跨平台的`WHATWG / W3C`特性的polyfill，如`WHATWG URL`。 它可以直接全部注入到全局环境里面，帮助开发者模拟一个包含众多新特性的运行环境，这样开发者仅需简单引入core-js，仍然使用最新特性的ES写法编码即可；也可以不直接注入到全局对象里面，这样对全局对象不会造成污染，但是需要开发者单独引入core-js的相关module，并可能还需要通过手工调用module完成编码，没法直接使用最新ES的写法。它是一个完全模块化的库，所有的polyfill实现，都有一个单独的module文件，既可以一劳永逸地把所有polyfill全部引入，也可以根据需要，在自己项目的每个文件，单独引入需要的core-js的modules文件。

core-js大部分的polyfill都是针对ESMAScript实现的，但是有几个polyfill是针对`W3C / WHATWG`这两个机构制定的web standards实现的，包括：
* setTimeout and setInterval -- whatwg: [link](https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#timers)
* setImmediate -- w3c: [link](http://w3c.github.io/setImmediate/)
* queueMicrotask -- whatwg: [link](https://html.spec.whatwg.org/multipage/timers-and-user-prompts.html#dom-queuemicrotask)
* URL and URLSearchParams -- whatwg: [link](https://url.spec.whatwg.org/)
* iterable DOM collections -- w3c: [link](https://github.com/zloirock/core-js#iterable-dom-collections)

其中`URL and URLSearchParams`也被加入到了ECMA的proposals当中，目前是stage-0阶段，该proposal的git地址：[点此查看](https://github.com/jasnell/proposal-url)。

core-js目前最新版是v3，v2还在用，但是不推荐继续用，v3才是未来的主流。core-js@提供了三个版本：
```bash
// global version
npm install --save core-js@3.2.1
// version without global namespace pollution
npm install --save core-js-pure@3.2.1
// bundled global version
npm install --save core-js-bundle@3.2.1
```
第一个版本是最简单的使用版本，会直接把core-js所有的polyfill，直接扩展到代码运行的全局环境中。第二个版本core-js-pure，不会把polyfill注入全局环境，但是在使用的时候，需要单独引入polyfill的module，不能直接使用最新ES的写法；第三个版本是一个编译打包好的版本，包含全部的polyfill特性，适合在浏览器里面通过script直接加载。 前两个版本适合跟构建工具一起使用，第三个直接在浏览器里面用即可。

1. 如果使用第一个版本，可以在代码中这样使用core-js：
```js
import 'core-js'; // <- at the top of your entry point

Array.from(new Set([1, 2, 3, 2, 1]));          // => [1, 2, 3]
[1, [2, 3], [4, [5]]].flat(2);                 // => [1, 2, 3, 4, 5]
Promise.resolve(32).then(x => console.log(x)); // => 32
```
    只要在项目的入口文件中，引入`core-js`一次，就能把所有的polyfill注入到运行环境中。`Array.from Array.prototype.flat Promise`这些新的ES特性，在编码时可以放心大胆地编写，就好像运行环境原生支持了它们一样。

    也可以仅引入部分特性的polyfill：
```js
import 'core-js/features/array/from'; // <- at the top of your entry point
import 'core-js/features/array/flat'; // <- at the top of your entry point
import 'core-js/features/set';        // <- at the top of your entry point
import 'core-js/features/promise';    // <- at the top of your entry point

Array.from(new Set([1, 2, 3, 2, 1]));          // => [1, 2, 3]
[1, [2, 3], [4, [5]]].flat(2);                 // => [1, 2, 3, 4, 5]
Promise.resolve(32).then(x => console.log(x)); // => 32
```
    以上部分引入的polyfill，依然会直接扩展到全局环境中。

2. 如果使用第二个版本，需要在代码中这样使用core-js:
```js
import from from 'core-js-pure/features/array/from';
import flat from 'core-js-pure/features/array/flat';
import Set from 'core-js-pure/features/set';
import Promise from 'core-js-pure/features/promise';

from(new Set([1, 2, 3, 2, 1]));                // => [1, 2, 3]
flat([1, [2, 3], [4, [5]]], 2);                // => [1, 2, 3, 4, 5]
Promise.resolve(32).then(x => console.log(x)); // => 32
```
    这个方式，不能一次性引入所有的polyfill，必须根据每个文件的需要，单独引入需要的modules。 除了Promise这种属于新构造函数的polyfill，像`Array.from Array.prototype`这种在内置对象或内置类上扩展出的新的实例方法或静态方法，都不能按照实例方法或静态方法直接调用，必须类似`from(new Set([1, 2, 3, 2, 1])); `这样手工使用。这个使用方式，会让我们编码时使用最新的ES、web特性变得不符合规范，仅仅是帮助我们得到了一个工具库、工具函数而已。

## core-js的modules组织方式

### 整体引用
core-js有很多种使用的方式，可以根据每个场景的需要来选择：
```js
// polyfill all `core-js` features - ES and web standards:
import "core-js"; // equivalent to `import "core-js/es; import "core-js/web; import "core-js/proposals"`;

// polyfill all stable `core-js` features - ES and web standards:
import "core-js/stable"; // equivalent to `import "core-js/es; import "core-js/web";

// polyfill all stable `core-js` features - only ES:
import "core-js/es";

// polyfill all stable `core-js` features - only web standards:
import "core-js/web";

// polyfill all `core-js` proposal features - ES and web standards:
import "core-js/proposals";

// polyfill all `core-js` proposal features - ES and web standards:
import "core-js/stage"; // equivalent to ` import "core-js/proposals"

// polyfill all `core-js` stage0+ proposal features - ES and web standards:
import "core-js/stage/0";

// polyfill all `core-js` stage1+ proposal features - ES and web standards:
import "core-js/stage/1";

// polyfill all `core-js` stage2+ proposal features - ES and web standards:
import "core-js/stage/2";

// polyfill all `core-js` stage3+ proposal features - ES and web standards:
import "core-js/stage/3";

// polyfill all `core-js` stage4+ proposal features - ES and web standards:
import "core-js/stage/4";

// polyfill all `core-js` features - ES and web standards:
import "core-js/features"; // equivalent to ` import "core-js";
```
上面的引入有一些等价关系，在注释中有说明。再补充一些：
1. `import "core-js";`等价于：
```js
import "core-js/es";
import "core-js/web";
import "core-js/proposals";
```
    也等价于:
```js
import "core-js/stable";
import "core-js/proposals";
```
    还等价于:
```js
import "core-js/features"; 
```
2. `import "core-js/proposals";`等价于:
```js
import "core-js/stage"; 
```
3. 注意：`import "core-js/stage"`不等价于`import "core-js/stage/0"`。

core-js的modules分为两类：es和web standards。core-js的proposals都是针对es的，web standards没有所谓的proposals。core-js的stable，跟ECMA-262的标准规范不是一个等价的概念，core-js的stable要宽泛一些：
1. core-js里所有web的modules，都属于stable，而这些web modules，现在在`w3c和whatwg`的工作流程中，也有的还处于draft阶段；那core-js为什么会认为这些modules应该划分到stable里面呢？这应该是根据这些modules的长远发展来考虑的。 到mdn查询`setImmediate`的文档，显示这个特性还属于不完全标准化的阶段：
> 该特性是非标准的，请尽量不要在生产环境中使用它！

2. core-js会把ECMA里面处于stage-4的proposals归类到stable里面。
> Stage 4 proposals already marked in core-js as stable ECMAScript, they will be removed from proposals namespace in the next major core-js version

### 单独引用
`features`是core-js包含所有modules(ES | Web Standards)的命名空间，如果想单独引入某些polyfill，都可以通过`features`空间下子的module或者子的空间来引用，如：
```js
import 'core-js/features/set';        // polyfill all `set` features of (ES | Web Standards), and proposals of ES
```
上面这个引用了`set`相关的所有polyfill。再比如：
```js
import 'core-js/features/array/flat'; // polyfill only `Array.prototype.flat` feature
```
这个仅引用了数组新的原型方法`flat`的polyfill。

`es`是仅提供stable的ES的polyfill的命名空间。它跟`features`一样，也可以通过子空间或者子module来引用。它与`features`的区别就是`es`能提供的polyfill要少一些。

`web`是提供web standards的polyfill的命名空间。它下面目前没有子module，可以通过它引用特定的web standards polyfill:
```js
import "core-js/web/timers";
import "core-js/web/dom-collections";
import "core-js/web/immediate";
import "core-js/web/queue-microtask";
import "core-js/web/url";
import "core-js/web/url-search-params";
```

`stable`是提供stable的es和web standards的polyfill的命名空间。 它跟`es`、`features`是类似的，范围介于`es`和`features`之间，使用举例：
```js
import "core-js/stable/set-immediate";
import "core-js/stable/array";
import "core-js/stable/array/flat";
```

`stage`也是一个命名空间。 它的子modules比较少，在前面的整体引用中，已经全部都展现出来了。

`proposals`是一个仅包含es proposals的polyfill的命名空间，它没有子空间，只有子modules，引用举例：
```js
import "core-js/proposals/global-this";
import "core-js/proposals/observable";
```

### 重点
`core-js`这个直接扩展全局空间的版本，适合与preset-env一起使用。 而下面的`core-js-pure`不适合。

## core-js-pure的modules组织方式
core-js-pure与core-js在引用polyfill时的主要区别就是core-js-pure需要采用带有接口名称的import语法，如`import Array from "core-js-pure/features/array"`。

### 整体引用
在core-js-pure里面还存在整体引用吗？core-js大部分的整体引用在core-js-pure里面，已经没有什么意义了。
```js
import "core-js";
```
上面这个在core-js里面是有用的，所有polyfill直接扩展到全局空间里。但是：
```js
import "core-js-pure";
```
这个就没有用了，因为它不对全局空间做扩展，所以只能通过直接使用模块的方式才能拿到module内部定义好的api。

### 单独引用
core-js-pure只能通过两种形式来引用polyfill。
1. 直接引用一个类，如：
```js
import Set from 'core-js-pure/features/set';
import Promise from 'core-js-pure/features/promise';
```

2. 直接引用一个方法，如：
```js
import from from 'core-js-pure/features/array/from';
import flat from 'core-js-pure/features/array/flat';
```

在单独引用时，上面core-js里面学到的命名空间，只有：`web` `es` `features` `stable`这四个命名空间可用，要点与上面介绍的一致。 说白了，某个module能不能在core-js-pure里面import出来，取决于这个module，有没有明确地对外定义了module.exports。 在core-js-pure的源码里面，`stage` 与 `proposal`命名空间下的module文件，都没有`module.exports`的定义，所以它们没法在core-js-pure里面被import使用。


### 使用core-js-pure引入的polyfill
有两种使用方式，第一种：
```js
import from from 'core-js-pure/features/array/from';
import flat from 'core-js-pure/features/array/flat';
import Set from 'core-js-pure/features/set';
import Promise from 'core-js-pure/features/promise';

from(new Set([1, 2, 3, 2, 1]));                // => [1, 2, 3]
flat([1, [2, 3], [4, [5]]], 2);                // => [1, 2, 3, 4, 5]
Promise.resolve(32).then(x => console.log(x)); // => 32
```
这种就是把polyfill当工具函数用，虽然可以用，但是写法不符合ES的语言规范。

第二种：
> In the pure version, we can't pollute prototypes of native constructors. Because of that, prototype methods transformed into static methods like in examples above. But with transpilers, we can use one more trick - bind operator and virtual methods. Special for that, available /virtual/ entry points. Example:
```js
import { fill, findIndex } from 'core-js-pure/features/array/virtual';

Array(10)::fill(0).map((a, b) => b * b)::findIndex(it => it && !(it % 8)); // => 4
```
这个写法也不符合标准。

我觉得在代码中，直接引用`core-js-pure`这个版本，是一件比较麻烦的事情，会让编码变得复杂。 所以`core-js-pure`不适合用到preset-env里面去做polyfill。 但是在后面与babel集成的内容里面，会介绍借助babel/runtime来简化使用`core-js-pure`的例子。

## core-js的源码结构
core-js对应的package源码：[package](https://github.com/zloirock/core-js/tree/master/packages/core-js);
从core-js的源码结构，可以很清晰的看到前面提到的那些命名空间对应的文件夹：
<img src="{% asset_path "1.png" %}" width="200">
`core-js/index.js`等同于`import "core-js"`对应的模块文件。每个命名空间的文件夹下面也都有一个`index.js`文件，会依赖这个空间下，其它所有应该包含的modules。

`core-js/index.js`的源码：
```js
require('./es');
require('./proposals');
require('./web');

module.exports = require('./internals/path');
```
所以就这就是为啥上面介绍等价关系时，有`import "core-js"`等价于：
```js
import "core-js/es";
import "core-js/web";
import "core-js/proposals";
```
其它的等价关系，都可以从源码里看的一清二楚。

`stage/`命名空间下的modules之间的关系实际上很简单，首先`stage/index.js`:
```js
module.exports = require('./pre');
```
`stage/pre.js`:
```js
require('../proposals/reflect-metadata');

module.exports = require('./0');
```
`stage/0.js`:
```js
require('../proposals/efficient-64-bit-arithmetic');
require('../proposals/string-at');
require('../proposals/url');

module.exports = require('./1');
```
...

只有`es` `features` `stable`下面才有子文件夹，所有只有它们三个才有子的命名空间：
<img src="{% asset_path "2.png" %}" width="200">

有文件夹的，只要看看它下面有没有独立的index.js文件，有则代表它可以被直接引入。

`internals`和`modules`是core-js内部使用的文件夹，不建议在项目中直接引用：
<img src="{% asset_path "3.png" %}" width="200">

所有core-js的polyfill，底层的机制都是由`internals`和`modules`内部的module来完成的。core-js官方不推荐直接引用这两个文件夹的module，因为它们是内部实现，很可能在版本迭代中发生变化。

`proposals`文件夹下的都是ES proposals阶段的特性的polyfill，但是其中有一个`url.js`：
```js
require('../modules/web.url');
require('../modules/web.url.to-json');
require('../modules/web.url-search-params');
```
这个`url`polyfill按理应该属于web standards的polyfill。为什么会放在这？本篇前面的内容也有介绍，这是因为ECMA把`whatwg`的`URL`也纳入了自己的proposals，当前阶段为stage-0。

## core-js-pure的源码结构
core-js-pure对应的package源码：[package](https://github.com/zloirock/core-js/tree/master/packages/core-js-pure);

core-js-pure的源码与core-js仅仅只有`internals`和`modules`两个文件夹有区别，其它的都是一样的。打开上面的源码库看到core-js-pure里面只有一个overrides文件夹，包含了`internals`和`modules`两个文件夹。很容易就能猜到，core-js-pure这个包是在复制了core-js的包基础上，然后覆盖了`internals`和`modules`之后得到的。

从core-js官方的构建文件配置可以验证上面这一点：[core-js的构建文件](https://github.com/zloirock/core-js/blob/master/Gruntfile.js)

## 与babel的集成使用
有三方面：
1. @babel/polyfill
已经废弃，不继续学习。

2. @babel/preset
在{% post_link "babel详解（三）-presets" "上一篇博客" %}中对preset-env与core-js结合使用的方法和要点都记录地非常清晰了。在掌握了本篇的内容后，现在对于preset-env为什么会自动注入那些`core-js/modules/es.array.iterator`等等polyfill，就很好理解了。

    为什么preset-env可以直接注入modules下的文件，而我们不建议直接引用呢？这是因为当core-js升级的时候，preset-env也会升级，所以能调整要注入的polyfill。 这一层都是babel在做的，开发者无需关心。

3. @babel/runtime
通过@babel/runtime，可以简化对于`core-js-pure`的使用。 下面的代码，是直接引入`core-js-pure`，然后在代码中使用的方式：
```js
import from from 'core-js-pure/stable/array/from';
import flat from 'core-js-pure/stable/array/flat';
import Set from 'core-js-pure/stable/set';
import Promise from 'core-js-pure/stable/promise';

from(new Set([1, 2, 3, 2, 1]));
flat([1, [2, 3], [4, [5]]], 2);
Promise.resolve(32).then(x => console.log(x));
```
  有了@babel/runtime，上面的代码可以简化为下面的写法，完全遵循标准的ES写法：
```js
Array.from(new Set([1, 2, 3, 2, 1]));          // => [1, 2, 3]
[1, [2, 3], [4, [5]]].flat(2);                 // => [1, 2, 3, 4, 5]
Promise.resolve(32).then(x => console.log(x)); // => 32
```
  这个写法连`core-js-pure`的引用都不需要。 babel/runtime会把这份代码转换为：
```js
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

var _flat = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/instance/flat"));

var _set = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/set"));

var _from = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/array/from"));

var _context;

(0, _from.default)(new _set.default([1, 2, 3, 2, 1])); // => [1, 2, 3]

(0, _flat.default)(_context = [1, [2, 3], [4, [5]]]).call(_context, 2); // => [1, 2, 3, 4, 5]

_promise.default.resolve(32).then(function (x) {
  return console.log(x);
}); // => 32
```
  要做到这个转换，需要执行以下依赖的安装：
```bash
npm install --save-dev @babel/plugin-transform-runtime
npm install --save @babel/runtime-corejs3
```
  并配置好`transform-runtime`插件:
```js
const presets = [ 
];
const plugins = [
    [
        "@babel/plugin-transform-runtime", {
            corejs: 3
        }
    ]
];

module.exports = { presets, plugins };
```
  上面转换的结果中：`@babel/runtime-corejs3/core-js-stable`等价于`core-js-pure`。 通过查看源码，会看到@babel/runtime-corejs3的这个包依赖了`core-js-pure`。 所以`core-js-pure`不需要单独安装。
  **更多babel runtime的介绍，请前往阅读下一篇博客。**

    
## 其它
1. core-js能够提供哪些polyfill，以及它们与features的对应关系，都可以从[官方的entry points列表](https://github.com/zloirock/core-js#features)中检阅，那里详细地列出了每一个polyfill的作用和引用方式。

2. In core-js@3 all stable ECMAScript features are prefixed with es., while ECMAScript proposals with esnext. 这个可以通过源码的modules文件内的module来验证。

3. 如果在每个细节中都无法按照规范实现某个功能，则core-js会向polyfill添加.sham属性。 例如，在IE11中，Symbol.sham为true。

4. [core-js-builder](http://npmjs.com/package/core-js-builder)这个也是core-js提供的一个库，它是一个工具，可以基于browserslist配置，构建一个只支持指定环境的core-js版本。 这相当于就是提供给开发者一个可以自定义core-js-bundle的方法。

5. [core-js-compat](http://npmjs.com/package/core-js-compat)是core-js提供的一个类似compat-table一样的库，基于它，能知道core-js的每个polyfill在不同的环境里面的兼容情况。  core-js-builder就是依赖于core-js-compat实现的。  另外在@babel/preset-env里面，如果使用了core-js@3，也会使用core-js-compat，而不是compact-table。

6. 为什么要有core-js-compact，compact-table存在的问题：
  * 它只包含了ES特性的兼容性数据，不包含web standards的特性（如setImmediate, DOM collections)相关的数据。所以`@babel/preset-env`只能把有用到的web standards的polyfill，不做判断地直接引入，即使开发者配置的目标环境不需要这个polyfill。

  * 它没有包含任何已知的某些环境下存在的bug(甚至是严重的)的信息，比如safari 12里面的`Array#reverse broken`问题，它没有把这些环境下存在的问题标记为不支持。这会导致`@babel/preset-env`完全信赖它，导致`core-js`提供的专门针对这些问题做了修复的polyfill没有被引入。 

  * it contains only some basic and naive tests, which do not check that features work as they should in real-word cases. For example, old Safari has broken iterators without .next method, but compat-table shows them as supported because it just check that typeof of methods which should return iterators is "function". Some features like typed arrays are almost completely not covered.

  * `compat-table`的初衷不是为了给其它库提供数据支持。`core-js`的作者也是`compat-table`项目的参与者之一，他知道其它一些`compat-table`项目的参与者是反对给其它库提供数据支持的。
