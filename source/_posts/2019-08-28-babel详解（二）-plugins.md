---
title: 'babel详解（二）:plugins'
tags:
  - babel
  - 前端工程化
categories:
  - Javascript
  - babel
date: 2019-08-28 22:32:21
---


开箱即用的babel，什么也不做。如果要让它对代码进行转换，就得配置plugins才能有效。本篇说明babel的plugins的用法以及babel7中plugin的一些变化。
<!-- more -->

## babel-cli
为了学习plugin的用法，我们需要先掌握一种babel的使用方法，babel-cli是一个不错的选择，因为它足够简单。现在，随便新建一个文件夹，然后在这个文件夹下运行：
```bash
cnpm install @babel/core --save-dev
cnpm install @babel/cli --save-dev
```
就把babel的核心库以及babel的命令行管理工具`babel-cli`安装到项目的依赖里面了。可通过检查这个文件夹的package.json文件以及node_modules文件夹，来确认上面两个库的安装情况。

接着，在这个文件夹下，新建一个.babelrc.js文件，这是一个js文件，它是对babel进行配置的方式之一；本篇学习plugin的时候，会把plugin写到.babelrc.js里面，这样babel运行的时候，这个文件内配置的plugin就会启用。

最后为了有一个编写测试代码的地方以及有一个能够看到babel进行代码转换后的地方，在这个文件夹内，再添加两个子文件夹，分别是`src`和`dist`。最终建好的项目文件夹结构示意如下:
```bash
babel-plugin/
    dist/
    node_modules/
    src
    .babelrc.js
    package.json
```

为了演示`babel-cli`的用法，往`src`内添加一个js文件`test01.js`，并编写如下ES代码：
```js
let foo = () => {
    
};
```
接着在终端切换到`babel-plugin/`文件夹，运行以下命令（本篇后续执行`npx babel`命令，都是切换到`babel-plugin/`文件夹下执行)：
```bash
npx babel src --out-dir dist
```
这个命令会把`src`文件夹下的所有js，全部输入到babel，转换完成后，输出存储到`dist`文件夹。由于目前babel并没有做任何配置，所以上面的命令运行后，应该只能看到一个有一定的格式变化，但是代码内容没变的`dist/test01.js`。

接下来的内容，都将使用上面准备的这个小环境来测试。

## plugins的使用
当使用.babelrc.js文件来配置babel时，该文件配置结构通常是：
```js
const presets = [  ];
const plugins = [ ];

module.exports = { presets, plugins };
```
其中presets数组用来配置babel的presets，plugins数组用来配置babel的plugins。presets和plugins都可以配置多个。

### plugin的名称

在开始使用前，先说下plugin的名称。从babel7开始，babel所有的包，不仅是plugin的包，还有preset的包，都全部变为了`@babel`这个形式的scope包，这个scope在上一篇博客做过详细解释。如：
1. @babel/plugin-transform-arrow-functions 用于箭头函数转码
2. @babel/plugin-transform-block-scoping 块级作用域转码
3. @babel/plugin-transform-for-of for-of循环转码
4. etc

（查看全部：https://babeljs.io/docs/en/plugins。）

如果要准备使用babel7，在确定需要使用某一个plugin的时候，一定要先确定它是不是babel自己的包，如果是，就要通过`@babel`这个scope来安装，否则很有可能会安装到babel6的相关包；如果它不是babel自己的包，那肯定不能用`@babel`这个scope来安装，用它确定的名称即可。比如`transform-arrow-functions`这个plugin，如果是babel6，它的npm包名称则为：`babel-plugin-transform-es2015-arrow-functions`，如果是babel7，它的npm包名称则为：`@babel/plugin-transform-arrow-functions`。

babel7与babel6的plugin名称区别，基本就是把babel6的`babel-`前缀，替换为了`@babel/`作为前缀。 但也不绝对，比如前面`babel-plugin-transform-es2015-arrow-functions`这个包，在babel7里面，还去掉了`es2015`的字符。这也是babel7中对于plugin做出另外一个变化之一：
> Remove the year from package names
Some of the plugins had -es3- or -es2015- in the names, but these were unnecessary. `@babel/plugin-transform-es2015-classes` became `@babel/plugin-transform-classes`

babel7去掉了plugin包名称里面跟es版本有关的部分，比如es3、es2015。关于plugin名称，另外一个比较大的变化是：
> Any plugin that isn't in a yearly release (ES2015, ES2016, etc) should be renamed to -proposal. This is so we can better signify that a proposal isn't officially in JavaScript.
> 
> Examples:
> 1. @babel/plugin-transform-function-bind is now @babel/plugin-proposal-function-bind (Stage 0)
> 2. @babel/plugin-transform-class-properties is now @babel/plugin-proposal-class-properties (Stage 3)
> 
> This also means that when a proposal moves to Stage 4, we should rename the package.

这个说的就是如果某个plugin要转换的不是ECMA-262每年正式发布的特性（ES2015, ES2016, etc)，这个plugin的名称就会被重名为`-proposal`修饰的名称。它这么做的目的，显然是为了让plugin的使用场景更加清晰；而且，一旦某个plugin要转换的特性，已经进入TC39工作流程的`Stage 4`这个状态，还会对plugin包的名称再做重命名（`Stage 4`意味着这个特性即将在下一年的ECMA-262中发布）。

综上所述，在以后使用babel7的plugin时，对包的名称得稍微谨慎一点，最好到它的npm主页或github主页上查看下readme说明，防止低级错误出现。

### plugin的分类
babel的plugin分为三类：
* syntax 语法类
* transform 转换类
* proposal 也是转换类，指代那些对ES Proposal进行转换的plugin。

通过查看babel的github代码结构，可以很清晰地看到以上三类插件的源码文件夹名称：
https://github.com/babel/babel/tree/master/packages。

syntax类plugin用于ES新语法的转换，其实也是使用的时候必须的，但是当使用某一个transform类或proposal类的插件时，如果需要做某个语法转换，则相应的syntax类插件，会自动启用，所以在使用babel的时候，syntax类plugin，不需要单独配置。比如说下面这个transform类plugin，是用来转换typescript的，从它源码的package.json可以看到，它依赖了`@babel/plugin-syntax-typescript`这个syntax类的plugin:
```json
{
  "name": "@babel/plugin-transform-typescript",
  "version": "7.5.5",
  "description": "Transform TypeScript into ES.next",
  "dependencies": {
    "@babel/helper-create-class-features-plugin": "^7.5.5",
    "@babel/helper-plugin-utils": "^7.0.0",
    "@babel/plugin-syntax-typescript": "^7.2.0"
  },
  "peerDependencies": {
    "@babel/core": "^7.0.0-0"
  },
  "devDependencies": {
    "@babel/core": "^7.5.5",
    "@babel/helper-plugin-test-runner": "^7.0.0"
  }
}
```

### 准备使用
打开小项目的.babelrc.js文件，把以下内容放进去：
```js
const presets = [];
const plugins = [];

module.exports = {presets, plugins}
```
我们准备往plugins里面添加点东西，来试试babel。

plugins是一个数组，它的每个元素代表一个单独的plugin：
```js
["pluginA", ["pluginA", {}]]
```
元素有两种类型：
1. 纯字符串，用来标识一个plugin
2. 另外一个数组，这个数组的第一个元素是字符串，用来标识一个plugin，第二个元素，是一个对象字面量，可以往plugin传递options配置

纯字符串形式的plugins元素，是数组形式的简化使用。因为plugin是可以配置option的，所以纯字符串的plugin元素，相当于全部使用options的默认值，不单独配置。

举例如下：
```js
const plugins = [
    '@babel/plugin-transform-arrow-functions',
    [
      "@babel/plugin-transform-async-to-generator",
      {
         "module": "bluebird",
         "method": "coroutine"
       }
    ]
];
```

如何用字符串标识一个plugin?
1. 如果plugin是一个npm包，则可以直接使用这个npm包的名称
2. 如果plugin是本地的一个文件，则可以相对路径或绝对路径引用这个文件，来作为plugin的标识

plugin标识的缩写？出于历史原因，babel为plugin的标识配置提供了缩写规则，只要一个plugin是以`babel-plugin-`开头的，就可以省略`babel-plugin-`，如以下两种方式都是等价的：
```js
const plugins = [
    [
        "myPlugin",
        "babel-plugin-myPlugin" // equivalent
    ]
];
```
如果一个plugin是一个scope包，以上缩写规则同样成立：
```js
const plugins = [
    "@org/babel-plugin-name",
    "@org/name" // equivalent
]
```

注意：`babel-plugin-myPlugin`不一定是babel自己的包；`@org`也不指`@babel`，别的机构也可以把自己开发的babel包作为scope包形式发布。

babel7因为包都变为scope包了，所以有了新的缩写规则：
```js
const plugins = [
    '@babel/transform-arrow-functions',// 等价于@babel/plugin-transform-arrow-functions
    [
      "@babel/transform-async-to-generator",// 等价于@babel/plugin-transform-async-to-generator
      {
         "module": "bluebird",
         "method": "coroutine"
       }
    ]
];
```

不过似乎babel的作者，也并不觉得plugin缩写是很有必要的事情，说不定将来缩写规则就会取消了，所以实际使用中的话，要引用一个plugin，还是直接用完整的npm包名称比较稳妥，反正也没多几个字。

### 开始使用
为了演示plugin的作用，我们可以选用几个有代表性的ES6特性，来应用相应的plugin：
* @babel/plugin-transform-classes 这个plugin可以转换ES6的class
* @babel/plugin-transform-arrow-functions 这个plugin可以转换ES6的箭头函数
* @babel/plugin-transform-computed-properties 这个plugin可以转换ES6的属性名表达式

运行下面的命令来安装它们：
```bash
cnpm install @babel/plugin-transform-classes --save-dev
cnpm install @babel/plugin-transform-arrow-functions --save-dev
cnpm install @babel/plugin-transform-computed-properties --save-dev
```

安装成功后，把它们配置到.babelrc.js文件中：
```js
const presets = [];
const plugins = [
    '@babel/plugin-transform-arrow-functions',
    ['@babel/plugin-transform-classes'],
    '@babel/plugin-transform-computed-properties'
];

module.exports = {presets, plugins}
```

接下来在`src`目录下，继续编辑`test01.js`，并将其替换为：
```js
// 箭头函数
let foo = () => {

};

// ES6 class
class List {
    constructor(pi = 1, ps = 10) {
        this.pi = 1;
        this.ps = 10;
    }

    loadData() {

    }

    static genId(){
        return ++this.id;
    }
}

let name = 'lyzg';

let obj = {
    baseName: name,
    [name + '_id']: 'baseName'
};
```
这是一段包含箭头函数、class和属性名表达式等ES6特性的代码。接着运行`npx babel src --out-dir dist`，执行完之后，打开`dist/01.js`，应该能查看到如下转换后的代码：
```js
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

// 箭头函数
let foo = function () {}; // ES6 class


let List =
/*#__PURE__*/
function () {
  function List(pi = 1, ps = 10) {
    _classCallCheck(this, List);

    this.pi = 1;
    this.ps = 10;
  }

  _createClass(List, [{
    key: "loadData",
    value: function loadData() {}
  }], [{
    key: "genId",
    value: function genId() {
      return ++this.id;
    }
  }]);

  return List;
}();

let name = 'lyzg';

let obj = _defineProperty({
  baseName: name
}, name + '_id', 'baseName');
```

以上就是babel插件的核心用法。

细心观察的话，可以看到`dist/test01.js`中还包含有`let`关键字，说明我用的三个插件并不具备`let`声明转码的功能，所以当我们选择自己配置插件，来进行代码转换的时候，就得对自己所需的插件非常清楚才行。以ES6的class来说，相关的转码插件不止`@b所以abel/plugin-transform-classes`一个，因为ES6class的特性，不全都是ES2015发布的，现在也还有它的新特性还处于proposal阶段，所以想使用全面的ES6class，就得了解更多相关插件才行。正是因为自己组合plugin，会比较麻烦，所以babel推出了presets，来简化plugins的使用。


## transform plugins
babel的transform plugins主要分为以下一些类别：
* ES3 对ES3的一些特性做转换
* ES5 对ES5的一些特性做转换
* ES2015 对ES6的特性做转换，大部分plugin都是这个类别的
* ES2016 对ES7的特性做转换
* ES2017 对ES8的特性做转换
* ES2018 对ES9的特性做转换
* Modules 自动转换代码的模块组织方式
* Experimental 提案中的特性转换
* Minification 压缩代码体积，这个类别下的插件，没有部署在`@babel`里面，而是作为一个独立的库来管理的：[babel/minify](https://github.com/babel/minify)，而且这个库还是一个实验性的项目，没有发布正式版，所以babel没有推荐在生产环境中使用
* React 用于react代码转换
* Other 其它

[点击了解以上分类的明细](https://babeljs.io/docs/en/plugins#transform-plugins)

## syntax plugins
babel的syntax plugins不是用来转换代码的，而是用来对ES6新的语法特性进行解析的，如果直接使用syntax plugin，代码不会有任何转换。要对新语法进行转换，就必须使用对应的transform plugins。syntax plugin会被transform plugin依赖，用于语法解析。

## plugin的启用顺序
前面了解到babel是基于plugin来使用的，plugin可以配置多个；同时babel还提供了preset，preset基本上可以看作是一组plugin。如果有这么多个plugin，对源代码进行解析，肯定要有一个处理的先后顺序，前一个plugin的处理结果，将作为下一个plugin的输入。所以babel规定了plugin的启用顺序：
1. 配置中plugins内直接配置的plugin，先于presets中的plugin；
2. 配置中plugins数组内的plugin，按照数组索引顺序启用；
3. 配置中presets数组内的presets，按照数组索引顺序逆序启用，也就是先应用后面的presets，再应用前面的preset。

如：
```json
{
  "plugins": ["transform-decorators-legacy", "transform-class-properties"]
}
```
先启用`transform-decorators-legacy`，然后才是`transform-class-properties`。
```json
{
  "presets": ["es2015", "react", "stage-2"]
}
```
preset的启用顺序：`stage-2` `react` `es2015`

## plugin的options
前面介绍plugins如何配置时，简化了这个部分的说明，babel官方文档对plugin和preset的配置，有明确的声明，而且plugin和preset的配置方式是一致的：
* EntryTarget - Individual plugin
* [EntryTarget, EntryOptions] - Individual plugin w/ options
* [EntryTarget, EntryOptions, string] - Individual plugin with options and name (see merging for more info on names)
* ConfigItem - A plugin configuration item created by babel.createConfigItem()

> EntryTarget
> Type: string | {} | Function
> 见后面举例中的形式

> EntryOptions
> Type: undefined | {} | false
> undefined会被替换为一个empty object；所以undefined与{}是等效的；
> false，表示不启用这个plugin。在一些场合下会有用，比如：
```js
plugins: [
  'one',
  ['two', false],
  'three',
],
overrides: [{
  test: "./src",
  plugins: [
    'two',
  ]
}]
```
> 上面这个场景中，two在默认情况下不启用，但是当babel转换的是`test`目录下的文件，则会被启用。

举例如下：
```js
let plugins = [
  // EntryTarget
  '@babel/plugin-transform-classes',

  // [EntryTarget, EntryOptions]
  ['@babel/plugin-transform-arrow-functions', { spec: true }],

  // [EntryTarget, EntryOptions, string]
  ['@babel/plugin-transform-for-of', { loose: true }, "some-name"],

  // ConfigItem
  babel.createConfigItem(require("@babel/plugin-transform-spread"))
];

module.exports = {plugins};
```

每个plugin的options其实都不一样，本文记录几个在babel官方文档中经常出现的option:
* loose
    启用松散式的代码转换，假如某个插件支持这个option，转换后的代码，会更加简单，代码量更少，但是不会严格遵循ES的规格，通常默认是false
* spec
    启用更加符合ES规格的代码转换，默认也是false，转换后的代码，会增加很多helper函数，代码量更大，但是代码质量更好
* legacy
    启用旧的实现来对代码做转换。详见后面举例
* useBuiltIns
    如果为true，则在转换过程中，会尽可能地使用运行环境已经支持的实现，而不是引入polyfill
    
举例来说：`@babel/plugin-proposal-object-rest-spread`这个插件，在babel7里面，默认转换行为等同于`spec: true`，所以它不再提供`spec`这个option，它下面这段代码：
```js
let bar = {...obj};
```
转换为：
```js
function ownKeys(object, enumerableOnly) { ...; }

function _objectSpread(target) { ...; }

function _defineProperty() { ...; }

let bar = _objectSpread({}, obj);
```

这个插件支持`loose`和`useBuiltIns`这两个option。如果启用`loose`则代码会转换为：
```js
function _extends() { ...; }

let bar = _extends({}, obj);
```
如果同时启用`loose`和`useBuiltIns`，则代码会转换为：
```js
let bar = Object.assign({}, obj);
```
看！`loose`和`useBuiltIns`会让转换后的代码越来越简单，但是也跟ES规格表达的需求偏离地越来越远。

### legacy
由于ES6的decorators语法有了新的编写方式，所以babel7把`@babel/plugin-proposal-decorators`插件默认对ES6 decorators语法的转换，启用了新写法的转码，如果在编码时，还在使用旧的ES6的decorators语法，则在使用这个插件的时候，应该启用`legacy`option，以便这个插件，仍能对旧语法进行转码。
