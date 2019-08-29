---
title: 'babel详解（三）:presets'
tags:
  - babel
  - 前端工程化
categories:
  - Javascript
  - babel
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
@babel/preset-env不支持所有stage-x的plugins。上一篇说过babel的plugin，现在把还在处于proposal阶段的plugin都命名为了`-proposal`形式的plugin。这就意味着preset-env不包含`-proposal`形式的plugin。这就说明，preset-env默认不支持对proposal的ES特性进行转码。

同时还有，即使是`-proposal`格式的plugin，也可能会因为proposal进展到了stage-4，从而变为`-transform`形式的plugin，那个时候，preset-env应该也会重新调整自己包含的plugin组合。 所以关注babel，关注proposal的变化，更新preset-env，可能是隔一段时间，就要做的检查工作了。

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

#### include

#### exclude

