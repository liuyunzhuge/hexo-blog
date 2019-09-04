---
title: 'babel详解（六）:options'
tags:
  - babel
  - 前端工程化
categories:
  - Javascript
  - babel
---

本篇将尽可能详细地总结babel的配置options中各个选项的含义和作用。

<!-- more -->
## Primary options
这个部分包含以下options:
* cwd
* caller
* filename
* filenameRelative
* code
* ast

这些选项仅允许作为Babel程序选项的一部分，因此它们主要供包裹Babel的工具或直接调用babel.transform的人使用。 Babel的集成用户，如babel-loader或@babel/register，不太可能使用这些。

### cwd
> Type: string
  Default: process.cwd()

cwd = current working directory。 所有跟路径有关的其它options，都会相对`cwd`option的值来解析。

### caller
> Type: Object with a string-typed "name" property.

调用`babel.transform`的工具，可能会传递一个`caller`对象，作为它们在babel运行过程中的标识，并且会传递功能相关的`flag`，以便在配置文件、preset和plugins中使用。举例：
```js
babel.transformFileSync("example.js", {
  caller: {
    name: "my-custom-tool",
    supportsStaticESM: true
  },
});
```
上面的`caller`对象传递到plugins和presets之后，它们就知道这次转码的代码是支持ES modules特性的，所以它们可以跳过将ES modules编译为CommonJS modules的过程。

这个option，我觉得在自定义plugin的时候，应该能用到。

### filename
> Type: string

这个是指定与当前正在编译的代码关联的文件名（如果有）。 文件名是可选的，但是当文件名未知时，并不是所有Babel的功能都可用，因为有一些options依赖于文件名来实现其功能。

用户会遇到的三个主要场景需要filename:
1. 有一些插件可能需要filename才能正常完成它的功能；
2. 类似`test` `exclude` `ignore`这些option，都需要filename才能做字符串和正则匹配；
3. `.babelrc`文件是相对被转码的文件加载的。如果`filename`这个option没有设置，`babel`就会默认`babelc`被设置为`false`继续处理。

从文档描述来看，`filename`option应该是很重要的。 babel底层应该不会省略掉这个option。 那既然这个option这么重要，为什么还要开放这个option呢？这是因为babel是可以直接对代码字符串进行转码，如果是代码字符串，没有要求这个字符串一定是从某个文件读取的，也有可能是动态生成，或者是数据库加载出来的呢？所以不是每次转码，都可以给babel提供`filename`的。能提供的情况下，filename得提供；如果提供不了，那可能有些功能就会缺失了。

### filenameRelative
> Type: string
  Default: path.relative(opts.cwd, opts.filename) (if "filename" was passed)
 
用作Babel的`sourceFileName`这个option的默认值，并用作生成AMD/UMD/SystemJS模块转换的文件名的一部分。

### code
> Type: boolean
  Default: true
  
`babel.transform`默认的返回值，包含`code`和`map`属性、以及生成的代码。 在对Babel进行多次调用的某些上下文中，禁用代码生成可能会更有用，取而代之的是可以启用`ast: true`来直接获取`AST`，从而避免没必要的处理。

### ast
> Type: boolean
  Default: false
  
与code是一个互斥的option。

准备一个直接使用`babel.transform`文件`build.js`：
```js
let fs = require('fs');
let babel = require('@babel/core');

let code = fs.readFileSync('src/test01.js').toString();

babel.transform(code, {
    presets: [
        [
            '@babel/preset-env'
        ]
    ]
}, function(err, result) {
    let { code, ast } = result;

    console.log(code);
    console.log(ast);
});
```
跟准备一个跟`build.js`同级的`src/test01.js`:
```js
let foo = () => {

};
```
运行`node build.js`，将得到以下输出：
```bash
"use strict";

var foo = function foo() {};
null
```
如果把build.js修改为：(禁用code,启用ast)
```js
let fs = require('fs');
let babel = require('@babel/core');

let code = fs.readFileSync('src/test01.js').toString();

babel.transform(code, {
    presets: [
        [
            '@babel/preset-env'
        ]
    ]
}, function(err, result) {
    let { code, ast } = result;

    console.log(code);
    console.log(ast);
});
```
再次运行`node build.js`，输出为：
```bash
null
Node {
  type: 'File',
  start: 0,
  end: 22,
  loc:
   SourceLocation {
     start: Position { line: 1, column: 0 },
     end: Position { line: 4, column: 0 } },
  program:
   Node {
     type: 'Program',
     start: 0,
     end: 22,
     loc: SourceLocation { start: [Position], end: [Position] },
     sourceType: 'script',
     interpreter: null,
     body: [ [Node] ],
     directives: [ [Object] ] },
  comments: [] }
```
说明`{code: false, ast: true}`的设置下，将从`transform`结果中得到AST，而不是代码。

Babel的默认设置是生成一个字符串和一个源映射，但在某些情况下，获取AST本身会很有用。 例如下面这种使用babel的工作流：
```js
const filename = "example.js";
const source = fs.readFileSync(filename, "utf8");

// Load and compile file normally, but skip code generation.
const { ast } = babel.transformSync(source, { filename, ast: true, code: false });

// Minify the file in a second pass and generate the output code here.
const { code, map } = babel.transformFromAstSync(ast, source, {
  filename,
  presets: ["minify"],
  babelrc: false,
  configFile: false,
});
```

## Plugin and Preset configuration
这部分在以前的博客中，已经都介绍过了。

## Config Merging options

## Config Loading options

## Source Map options

## Misc options

## Code Generator options

## AMD / UMD / SystemJS options

## Option concepts
