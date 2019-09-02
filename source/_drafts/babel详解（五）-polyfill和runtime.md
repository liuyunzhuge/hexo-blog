---
title: 'babel详解（五）:polyfill和runtime'
tags:
  - babel
  - 前端工程化
categories:
  - Javascript
  - babel
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

关于`@babel/preset-env`进行polyfill的要点，都在{% post_link "babel详解（三）-presets" "这一篇博客" %})中有详细的说明，本篇不会再赘述。

### 其它要点
现在`@babel/preset-env`在配置`corejs`option的时候，可以指定次要版本，从而支持`core-js`次要版本发布的新的polyfill。 比如现在core-js已经是3.2.1版本，那么`@babel/preset-env`就可以把`corejs`配置为`corejs: {version: '3.2'}`。

`@babel/preset-env`最重要的部分之一是提供有关不同目标引擎支持的功能的数据源，以了解某些内容是否需要由core-js进行polyfill。`caniuse` `mdn` [`compat-table`](http://kangax.github.io/compat-table/es6/) 这三个都是很好的学习资源，但是不能真正意义上提供`core-js`这种库需要的数据源支持：只有`compat-table`包含了一个比较好的ES兼容性数据集，所以`@babel/preset`依赖了这个库进行是否polyfill的判断；但是`compat-table`有以下一些限制：、
1. 它只包含了ES特性的兼容性数据，不包含web standards的特性（如setImmediate, DOM collections)相关的数据。所以`@babel/preset-env`只能把有用到的web standards的polyfill，不做判断地直接引入，即使开发者配置的目标环境不需要这个polyfill。

2. 它没有包含任何已知的某些环境下存在的bug(甚至是严重的)的信息，比如safari 12里面的`Array#reverse broken`问题，它没有把这些环境下存在的问题标记为不支持。这会导致`@babel/preset-env`完全信赖它，导致`core-js`提供的专门针对这些问题做了修复的polyfill没有被引入。 

3. it contains only some basic and naive tests, which do not check that features work as they should in real-word cases. For example, old Safari has broken iterators without .next method, but compat-table shows them as supported because it just check that typeof of methods which should return iterators is "function". Some features like typed arrays are almost completely not covered.

4. `compat-table`的初衷不是为了给其它库提供数据支持。`core-js`的作者也是`compat-table`项目的参与者之一，他知道其它一些`compat-table`项目的参与者是反对给其它库提供数据支持的。

正是因为`compat-table`有以上的问题，所以`core-js`的作者，专门做了一个用于提供数据支持的库：`core-js-compat`。在`@babel/preset-env`里面，如果配置了`corejs:3`，那么`preset-env`就会用`core-js-compat`代替`compat-table`来做polyfill的环境判断。 总而言之，`core-js-compat`会更靠谱一点。

直到babel7.3，`@babel/preset-env`在需要顺序引入一些polyfill时，还会有一些问题。从babel7.4开始，`@babel/preset-env`修复了这个问题。

## runtime
