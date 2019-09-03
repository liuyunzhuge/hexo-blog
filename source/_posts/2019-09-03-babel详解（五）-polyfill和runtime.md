---
title: 'babel详解（五）:polyfill和runtime'
tags:
  - babel
  - 前端工程化
categories:
  - Javascript
  - babel
date: 2019-09-03 21:37:46
---


本篇记录polyfill以及@babel/runtime的要点。
<!-- more -->

## polyfill
`@babel/polyfill`这个库原本是babel提供polyfill的独立库。 但是因为这个库本身等价于：
```js
import "core-js/stable";
import "regenerator-runtime/runtime";
```
所以它独立存在的价值不大。 babel7.4开始就不支持使用这个库来完成polyfill了。`@babel/polyfill`被废弃，还有另外一个更重要的原因跟`core-js`和`@babel/preset-env`有关。

首先babel提供的polyfill，都是通过间接引用`core-js`的模块来实现的，`core-js@3`现在是一个完全模块化的标准库，每个polyfill都是一个单独的文件，所以除了全部引入，还可以考虑单独引入，这样能够减少浏览器等运行环境已经实现了的特性的polyfill。`@babel/polyfill`是一个粗放的polyfill方式，它会无差别地引入所有的core-js的stable状态的特性，这是不符合未来浏览器等运行环境的。

然后`@babel/preset-env`这个preset，现在提供了`useBuiltIns: "entry"`和`useBuiltIns: "usage"`两种polyfill的方式，这两种方式可根据开发者配置的`browserslist`的目标运行环境，自动引入`core-js`最小化的`polyfill modules`组合，更加符合实际需求。

关于`@babel/preset-env`进行polyfill的要点，都在{% post_link "babel详解（三）-presets" "这一篇博客" %}中有详细的说明，本篇不会再赘述。

### 其它要点
现在`@babel/preset-env`在配置`corejs`option的时候，可以指定次要版本，从而支持`core-js`次要版本发布的新的polyfill。 比如现在core-js已经是3.2.1版本，那么`@babel/preset-env`就可以把`corejs`配置为`corejs: {version: '3.2'}`。

`@babel/preset-env`最重要的部分之一是需要有提供不同目标环境所支持的功能的数据源，以了解相应的特性是否需要由core-js进行polyfill。`caniuse` `mdn` [`compat-table`](http://kangax.github.io/compat-table/es6/) 这三个都是很好的学习资源，但是不能真正意义上提供`core-js`这种库需要的数据源支持：只有`compat-table`包含了一个比较好的ES兼容性数据集，所以`@babel/preset`依赖了这个库进行是否polyfill的判断；但是`compat-table`有以下一些限制：
1. 它只包含了ES特性的兼容性数据，不包含web standards的特性（如setImmediate, DOM collections)相关的数据。所以`@babel/preset-env`只能把有用到的web standards的polyfill，不做判断地直接引入，即使开发者配置的目标环境不需要这个polyfill。

2. 它没有包含任何已知的某些环境下存在的bug(甚至是严重的)的信息，比如safari 12里面的`Array#reverse broken`问题，它没有把这些环境下存在的问题标记为不支持。这会导致`@babel/preset-env`完全信赖它，导致`core-js`提供的专门针对这些问题做了修复的polyfill没有被引入。 

3. it contains only some basic and naive tests, which do not check that features work as they should in real-word cases. For example, old Safari has broken iterators without .next method, but compat-table shows them as supported because it just check that typeof of methods which should return iterators is "function". Some features like typed arrays are almost completely not covered.

4. `compat-table`的初衷不是为了给其它库提供数据支持。`core-js`的作者也是`compat-table`项目的参与者之一，他知道其它一些`compat-table`项目的参与者是反对给其它库提供数据支持的。

正是因为`compat-table`有以上的问题，所以`core-js`的作者，专门做了一个用于提供数据支持的库：`core-js-compat`。在`@babel/preset-env`里面，如果配置了`corejs:3`，那么`preset-env`就会用`core-js-compat`代替`compat-table`来做polyfill的环境判断。 总而言之，`core-js-compat`会更靠谱一点。

直到babel7.3，`@babel/preset-env`在需要顺序引入一些polyfill时，还会有一些问题。从babel7.4开始，`@babel/preset-env`修复了这个问题。

## runtime
`babel`的runtime，包含两个部分。 其中一个部分，是这个插件：`@babel/plugin-transform-runtime`。 这个插件主要有两个方面的用途：
1. babel在转码过程中，会加入很多babel自己的helper函数，这些helper函数，在每个文件里可能都会重复存在，`transform-runtime`插件可以把这些重复的helper函数，转换成公共的、单独的依赖引入，从而节省转码后的文件大小；

2. 开发者在代码中如果使用了新的ES特性，比如Promise、generator函数等，往往需要通过core-js和regenerator-runtime给全局环境注入polyfill。 这种做法，在应用型的开发中，是非常标准的做法。 但是如果在开发一个独立的工具库项目，不确定它将会被其它人用到什么运行环境里面，那么前面那种扩展全局环境的polyfill就不是一个很好的方式。 `transform-runtime`可以帮助这种项目创建一个沙盒环境，即使在代码里用到了新的ES特性，它能将这些特性对应的全局变量，转换为对core-js和regenerator-runtime非全局变量版本的引用。这其实也应该看作是一种给代码提供polyfill的方式。


`@babel/plugin-transform-runtime`是一个开发环境的dependency。 另外一个部分，是`babel`的一个内部库：`@babel/runtime`，这是一个生产环境的dependency。 在`transform-runtime`作用的过程中，都会使用`@babel/runtime`内部的模块，来代替前面讲到的重复的helper函数、对全局空间有污染的`core-js`和`regenerator-runtime`相关变量。后面会通过实例，来说明这两个部分对于代码转换的结果。

如果使用runtime，需要安装上面提到的两个依赖：
```bash
npm install --save-dev @babel/plugin-transform-runtime
npm install --save @babel/runtime
```

默认情况下，`transform-runtime`是不启用对`core-js`的polyfill处理的，所以安装`@babel/runtime`就够了。  但是如果想启用`transform-runtime`对`core-js`的polyfill的话，就得使用`@babel/runtime`另外的两个版本。 core-js@2对应的`@babel/runtime`版本是：`@babel/runtime-corejs2`；core-js@3对应的`@babel/runtime`版本是：`@babel/runtime-corejs3`。 后面讲`transform-runtime`的options配置的时候，会来解释如何配置corejs。

所以根据是否启用`core-js`的polyfill，以及`core-js`的版本，实际使用`babel`的runtime，有三种安装类型：
```bash
# disable core-js polyfill
npm install --save-dev @babel/plugin-transform-runtime
npm install --save @babel/runtime

# enable core-js@2 polyfill
npm install --save-dev @babel/plugin-transform-runtime
npm install --save @babel/runtime-corejs2

# enable core-js@3 polyfill
npm install --save-dev @babel/plugin-transform-runtime
npm install --save @babel/runtime-corejs3
```
开发者只需根据自己的项目需要，启用一种方式即可。 在core-js的那篇博客里，已经提过不再关注core-js@2相关的知识点，所以本篇后面也不会再有跟core-js@2相关的内容。

接下来看看`babel`的`runtime`是如何作用的。

### helper函数相关的处理
首先安装：
```bash
npm install --save-dev @babel/plugin-transform-runtime
npm install --save @babel/runtime
npm install --save @babel/preset-env
```
如下配置babel:（为了仅观察`transform-runtime`的作用，所以关闭了preset-env的polyfill的功能）
```js
const presets = [ 
    [
        "@babel/preset-env",
        {
            useBuiltIns: false
        }
    ]
];
const plugins = [
];

module.exports = { presets, plugins };
```
上面是一个未启用`transform-runtime`的配置。 然后准备一个ES文件：
```js
class Foo {
    constructor() {
    }

    saySth(){
    }
}
```
运行babel，对该文件转码，最后结果为：
```js
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Foo =
/*#__PURE__*/
function () {
  function Foo() {
    _classCallCheck(this, Foo);
  }

  _createClass(Foo, [{
    key: "saySth",
    value: function saySth() {}
  }]);

  return Foo;
}();
```
上面转码后的结果中：`_classCallCheck`等都属于`babel`内部的helper函数。 这些函数在babel转码的每个文件中都会重复存在。

接下来把babel配置修改为：
```js
const presets = [ 
    [
        "@babel/preset-env",
        {
            useBuiltIns: false
        }
    ]
];
const plugins = [
    [
        "@babel/plugin-transform-runtime"
    ]
];

module.exports = { presets, plugins };
```
重新运行babel转码，结果为：
```js
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var Foo =
/*#__PURE__*/
function () {
  function Foo() {
    (0, _classCallCheck2.default)(this, Foo);
  }

  (0, _createClass2.default)(Foo, [{
    key: "saySth",
    value: function saySth() {}
  }]);
  return Foo;
}();
```
从这个结果可以清晰地看到，`transform-runtime`把helper函数，都转换成了对`@babel/runtime`内modules的引用。

### 对regenerator-runtime的polyfill
将上面的babel配置恢复为：
```js
const presets = [ 
    [
        "@babel/preset-env",
        {
            useBuiltIns: false
        }
    ]
];
const plugins = [
];

module.exports = { presets, plugins };
```
再准备一个包含generator函数的文件，用于测试：
```js
export default async function () {
    await 'hi';
}
```
运行`babel`，此时转码结果为：
```js
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _default() {
  return _ref.apply(this, arguments);
}

function _ref() {
  _ref = _asyncToGenerator(
  /*#__PURE__*/
  regeneratorRuntime.mark(function _callee() {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return 'hi';

          case 2:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _ref.apply(this, arguments);
}
```
上面结果中：`regeneratorRuntime`是一个全局变量，如果其它人引用你这段代码，同时又不知道要在运行环境里面添加`regenerator-runtime`的polyfill，这段代码别人引用过去运行就会报错。 `transform-runtime`可以帮助开发者，解决这个问题。

接下来，把babel配置修改为：
```js
const presets = [ 
    [
        "@babel/preset-env",
        {
            useBuiltIns: false
        }
    ]
];
const plugins = [
    [
        "@babel/plugin-transform-runtime"
    ]
];

module.exports = { presets, plugins };
```

重新运行`babel`，转码结果为：
```js
"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

function _default() {
  return _ref.apply(this, arguments);
}

function _ref() {
  _ref = (0, _asyncToGenerator2.default)(
  /*#__PURE__*/
  _regenerator.default.mark(function _callee() {
    return _regenerator.default.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return 'hi';

          case 2:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _ref.apply(this, arguments);
}
```
从这个转码结果可以看到，`transform-runtime`通过引用`@babel/runtime/regenerator`和`@babel/runtime/helpers/asyncToGenerator`这两个内部模块，消除了`regeneratorRuntime`这个全局变量。 这两个模块跟`regenerator-runtime`的功能是一样的，但是不会扩展到全局空间，所以别人引用这段代码，就不会出现问题。

### core-js相关polyfill的处理
将babel配置修改为：
```js
const presets = [ 
    [
        "@babel/preset-env",
        {
            useBuiltIns: false
        }
    ]
];
const plugins = [
];

module.exports = { presets, plugins };
```
准备一个文件用于测试：
```js
Promise.resolve().finally();
```
运行babel，转码结果为：
```js
"use strict";
Promise.resolve().finally();
```
将babel配置修改为：(通过配置`transform-runtime`的`corejs`option，启用了对core-js的polyfill)
```js
const presets = [ 
    [
        "@babel/preset-env",
        {
            useBuiltIns: false
        }
    ]
];
const plugins = [
    [
        "@babel/plugin-transform-runtime", 
        {
            "corejs": 3
        }
    ]
];

module.exports = { presets, plugins };
```
重新转码，结果为：
```js
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

_promise.default.resolve().finally();
```
跟`regenerator-runtime`类似，上面转换后的代码，引用了`@babel/runtime-corejs3`的内部模块，消除了Promise这个全局变量，同时提供了同样的core-js Promise的特性。`@babel/runtime-corejs3/core-js-stable`对应的是`core-js-pure/stable`的版本，所以也不会扩展全局空间。


## 注意事项
上面的测试中，没有开启preset-env的polyfill。 如果把配置修改为：(同时开启preset-env和transform-runtime的polyfill功能)
```js
const presets = [ 
    [
        "@babel/preset-env",
        {
            "targets": {
                ios: 8,
                android: 4.1
            },
            useBuiltIns: 'usage'
        }
    ]
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
然后对：
```js
Promise.resolve().finally();
```
进行转码，结果为：
```js
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs3/helpers/interopRequireDefault");

var _promise = _interopRequireDefault(require("@babel/runtime-corejs3/core-js-stable/promise"));

require("core-js/modules/es6.promise");

require("core-js/modules/es6.object.to-string");

require("core-js/modules/es7.promise.finally");

_promise.default.resolve().finally();
```
会出现：preset-env的polyfill与transform-runtime的polyfill并存的现象。 这样的转码结果肯定是有问题的，这两个属于不同的polyfill做法，有不同的应用场景。 **所以这两种polyfill不能同时启用**。 在开发应用时，应该通过下面的方式关闭掉transform-runtime对core-js和regenerator的polyfill:
```js
    [
        "@babel/plugin-transform-runtime", {
            corejs: false,
            regenerator: false
        }
    ]
```

还有一点，transform-runtime的polyfill，对目标环境是不做判断的，只要它识别到代码里有用到新的ES特性，就会进行替换。

## runtime跟core-js-pure
在上一篇学习core-js的时候，讲到如果使用core-js-pure的版本，那么代码就需要这么写：
```js
import from from 'core-js-pure/features/array/from';
import flat from 'core-js-pure/features/array/flat';
import Set from 'core-js-pure/features/set';
import Promise from 'core-js-pure/features/promise';

from(new Set([1, 2, 3, 2, 1]));                // => [1, 2, 3]
flat([1, [2, 3], [4, [5]]], 2);                // => [1, 2, 3, 4, 5]
Promise.resolve(32).then(x => console.log(x)); // => 32
```
`from`是一个Array的静态方法，flat是一个Array的实例方法，本该通过`Array.from`或`数组实例.flat`的方法调用。 但是上面的代码不允许这么写。

借助`transform-runtime`，上面的代码，可以将写法换为标准写法：
```js
// 省略import语句

Array.from(new Set([1, 2, 3, 2, 1]));          // => [1, 2, 3]
[1, [2, 3], [4, [5]]].flat(2);                 // => [1, 2, 3, 4, 5]
Promise.resolve(32).then(x => console.log(x)); // => 32
```
只要使用如下babel配置：
```js
const presets = [ 
    [
        "@babel/preset-env",
        {
            useBuiltIns: false
        }
    ]
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
上面的标准代码就可以转换为:
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
通过这个例子，就能明白，为什么说babel/runtime也能提供polyfill的能力了吧。  但是一定要注意三点：
1. 它跟preset-env提供的polyfill适用的场景是完全不同，runtime适合开发库，preset-env适合开发application
2. runtime与preset-env的polyfill不能同时启用
3. runtime的polyfill不判断目标运行环境

## runtime的options

### corejs
> false, 2, 3 or { version: 2 | 3, proposals: boolean }, defaults to false.
这个option，决定了是否对`core-js`进行polyfill，以及用哪个版本的`core-js`进行polyfill。 除了通过`version`配置版本，还能通过`proposals`指定对`core-js`的proposals特性也提供polyfill支持。如果这个option没配置，或设置为false，则不会对`core-js`进行polyfill。

同时它也决定了到底安装哪个runtime的版本，前面有记录过的。

### helpers
> boolean, defaults to true.
这个option决定了是否对helpers函数进行优化处理。默认为true，如果为false，`transform-runtime`就不会对helpers函数进行去重提取的处理了。

### regenerator
> boolean, defaults to true.
这个option决定了是否对`regenerator-runtime`进行polyfill。 默认为true，与preset-env搭配使用时，应该设置false。
