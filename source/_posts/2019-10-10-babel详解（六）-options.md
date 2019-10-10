---
title: 'babel详解（六）:options'
tags:
  - babel
  - 前端工程化
categories:
  - Javascript
  - babel
date: 2019-10-10 22:53:49
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
 
用作Babel的sourceFileName选项的默认值，并用作AMD / UMD / SystemJS模块转换的文件名生成的一部分。

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

## Config Loading options
加载配置可能会变得有些复杂，因为环境可以具有多种类型的配置文件，并且这些配置文件可以具有各种嵌套的配置对象，这些对象根据配置而适用。

### root
> Type: string
  Default: opts.cwd
  Placement: Only allowed in Babel's programmatic options
  
首先注意：`root`option不允许在配置文件中指定。
`root`option的初始值是由`rootMode`决定的，见后面`rootMode`的说明。`root`option有两个作用：
1. 用来查找`babel.config.js`这个项目级别的配置文件；
2. 用来作为`babelrcRoots`的默认值。

### rootMode
> Type: "root" | "upward" | "upward-optional"
  Default: "root"
  Placement: Only allowed in Babel's programmatic options

首先注意：`rootMode`option不允许在配置文件中指定。
该选项与`root`值结合使用，定义了Babel如何选择其项目根目录。 不同的模式定义了Babel处理`root`值以获得最终项目根目录的不同方式。
* root：使用`root`option的默认值。
* upward：从`root`option默认值对应的目录开始，往上查找包含babel.config.js文件的目录，如果找到了则将该目录设置为`root`option的值，如果未找到babel.config.js，则引发错误。
* upward-optional：从`root`option默认值对应的目录开始，往上查找包含babel.config.js文件的目录，如果找到了则将该目录设置为`root`option的值，如果未找到babel.config.js，则退回到使用`root`option的默认值。

`upward`这个值在babel应用于monorepos的构建时，可能会被用到，在后面的博客中，有相关的使用介绍。

### envName
> Type: string
  Default: process.env.BABEL_ENV || process.env.NODE_ENV || "development"
  Placement: Only allowed in Babel's programmatic options
 
首先注意：`envName`option不允许在配置文件中指定。
`envName`这个option通常不需要修改，跟NODE_ENV公用一个环境变量即可。

### configFile
> Type: string | boolean
  Default: path.resolve(opts.root, "babel.config.js"), if it exists, false otherwise
  Placement: Only allowed in Babel's programmatic options

首先注意：`configFile`option不允许在配置文件中指定。
这个option用来手动指定用来起到项目范围配置作用的文件，通常是`babel.config.js`。在`babel.config.js`默认的搜索规则不满足使用需求的情况下，这个option是有用的。
默认要传递的是一个babel.config.js文件，但可以传递任何JS或JSON5配置文件的路径。
注意：此选项不会影响.babelrc文件的加载，因此虽然可能很想执行`configFile：“ ./foo/.babelrc”`，但不建议这样做。 如果给定的.babelrc是通过相对于文件的标准逻辑加载的，则最终将加载相同的配置文件两次，并将其与自身合并。如果要`configFile`option链接特定的配置文件，建议坚持使用与“ babelrc”名称无关的命名方案。

### babelrc
> Type: boolean
  Default: true as long as the filename option has been specified
  Placement: Allowed in Babel's programmatic options, or inside of the loaded "configFile". A programmatic option will override a config file one.
 
这个option可以在`babel.config.js`中配置，或者是在`babel.transform`的api中配置；api中的配置会覆盖`babel.config.js`文件中的配置值。
`true`将允许搜索与提供给Babel的`filename`相关的配置文件。
注意：仅当当前`filename`在与`babelrcRoots`配置的packages中有匹配的package时，才会加载.babelrc文件。

### babelrcRoots
> Type: boolean | MatchPattern | Array<MatchPattern>
  Default: opts.root
  Placement: Allowed in Babel's programmatic options, or inside of the loaded configFile. A programmatic option will override a config file one.
  
这个option可以在`babel.config.js`中配置，或者是在`babel.transform`的api中配置；api中的配置会覆盖`babel.config.js`文件中的配置值。

这个option的作用在下一篇博客中有介绍，通常应用于monorepos的构建。

## Plugin and Preset configuration
这部分在以前的博客中，已经都介绍过了。

## Config Merging options
这部分的option都是进行有效范围控制的。

### extends
> Type: string
  Placement: Not allowed inside of presets
  
利用这个option，当前的配置文件，可以基于另外一个配置文件进行扩展。  被扩展的文件的内容，会与当前的配置文件，进行合并。
    
### env
> Type: { [envKey: string]: Options }
  Placement: May not be nested inside of another env block.

这个option比较常见，常常应用于需要针对development以及production等不同的运行环境做不同的babel配置时使用。  
注意：`env[envKey]`的options会在配置文件根对象的options之上合并。

### overrides
> Type: Array<Options>
  Placement: May not be nested inside of another overrides object, or within an env block.

允许用户提供一系列额外的options，这些options将一次合并到当前配置中。 此功能需要与后面的`test` `include` `exclude`结合使用，它们可以给`overrides`option提供生效条件。
eg:
```js
overrides: [{
  test: "./vendor/large.min.js",
  compact: true,
}]
```
上例中，`compact`option，只会应用于`./vendor/large.min.js`这个文件。

### test
> Type: MatchPattern | Array<MatchPattern> (MatchPattern)

如果所有模式均不匹配，则当前配置对象被认为是非活动的，并且在配置处理期间将被忽略。 在`overrides`中使用时，此选项最有用，实际上它可以在任何地方使用。

### include
`include`等价于`test`。

### exclude
`exclude`与`test`的作用是相反的。

### ignore
> Type: Array<MatchPattern> (MatchPattern)
  Placement: Not allowed inside of presets
  
这个option，用来忽略对某些文件的处理。

### only
> Type: Array<MatchPattern> (MatchPattern)
  Placement: Not allowed inside of presets

这个option，用来设置仅处理某些文件。

## Source Map options
这个部分的option跟source map生成有关。

### inputSourceMap
> Type: boolean | SourceMap
  Default: true

这个option默认是true，babel会从要转码的文件末尾，尝试去寻找`//# sourceMappingURL=...`的相关注释，以便直接使用被转码文件原本就有的source map。 如果没找到，或找到的有问题，这个默认逻辑就相当于啥也没干。  

### sourceMaps
> Type: boolean | "inline" | "both"
  Default: false
  
这个option控制source map的生成方式。
* true 会开启生成source map，并把source map添加到transfrom的result中，`babel.transfrom`这种api调用转码，它的结果里有一个map属性，就是指source map
* "inline" 会开启生成soure map，并且会把source map添加到代码的末尾，但是不会把map添加到转码结果中
to generate a sourcemap and append it as a data URL to the end of the code, but not include it in the result object.
* "both" 相当于同时启用了`true`和`inline`


### sourceMap
等价于`sourceMaps`。

### sourceFileName
> Type: string
  Default: path.basename(opts.filenameRelative) when available, or "unknown"

这个有默认值的，一般不用设置。

### sourceRoot
> Type: string

一般不改动。

## Misc options
### sourceType
> Type: "script" | "module" | "unambiguous"
  Default: "module"

* "script" - Parse the file using the ECMAScript Script grammar. No import/export statements allowed, and files are not in strict mode.
* "module" - Parse the file using the ECMAScript Module grammar. Files are automatically strict, and import/export statements are allowed.
* "unambiguous" - Consider the file a "module" if import/export statements are present, or else consider it a "script".

这个option，对于babel的处理过程是比较重要的，因为plugins需要明确地知道当前被转码的文件到底是cjs还是es modules的文件类型，才能决定在转码过程中到底是使用require还是import/export的调用。

例如，`@babel/plugin-transform-runtime`依赖于当前文档的类型来决定是插入import还是require调用。 `@babel/preset-env`的`useBuiltIns`选项也执行相同的操作。 由于Babel默认将文件视为ES模块，因此通常这些插件/预设将插入import语句。 设置正确的sourceType可能很重要，因为错误的类型可能导致Babel会将import语句插入到本应为CommonJS文件的文件中。 这在正在执行node_modules依赖关系的编译的项目中尤其重要，因为插入import语句可能导致Webpack和其他工具将文件视为ES模块，从而破坏了原本可以正常工作的CommonJS文件。

这个option不影响`.mjs`文件，因为`.mjs`文件被硬编码地认为是es module类型的文件。

### highlightCode
> Type: boolean
  Default: true
    
在Babel错误消息中的代码片段中突出显示标记，以使其更易于阅读。不用改。

### wrapPluginVisitorMethod
> Type: (key: string, nodeType: string, fn: Function) => Function

允许用户在每个访问者上添加包装，以便在Babel执行插件时检查访问者进程。

key是一个简单的不透明字符串，表示正在执行的插件。
nodeType是当前正在访问的AST节点的类型。
fn是访问者函数本身。
用户可以返回替换函数，该替换函数在执行他们希望执行的任何日志记录和分析之后应调用原始函数。

应该是一个类似探针作用的函数。

### parserOpts
> Type: {}

用于单独给parser添加配置的。

### generatorOpts
> Type: {}

用于单独给code generator添加配置的。

## Code Generator options
这些option用于控制代码生成的一些细节。

### retainLines
> Type: boolean
  Default: false

Babel将努力生成代码，以便将项目打印在原始文件中的同一行上。 存在此选项是为了使无法使用源映射的用户可以获得模糊有用的错误行号，但这只是尽力而为的，不能在所有情况下都保证使用所有插件。

### compact
> Type: boolean | "auto"
  Default: "auto"

"auto" will set the value by evaluating code.length > 500_000。在该模式下生成代码时，将忽略所有可选的换行符和空格。

### minified
> Type: boolean
  Default: false

`minified`如果为true，则`compact`会被设置为true。 它的作用，就是尽可能地使代码更加简短。

### auxiliaryCommentBefore
babel不建议使用。

### auxiliaryCommentAfter
babel不建议使用。

### comments
> Type: boolean
  Default: true

给下一个option的默认值中使用的。

### shouldPrintComment
> Type: (value: string) => boolean
  Default without minified: (val) => opts.comments || /@license|@preserve/.test(val)
  Default with minified: () => opts.comments

这个option决定了代码中哪些注释要保留。

## AMD / UMD / SystemJS options
这个部分的options，我个人认为不用去学习，因为这些工作webpack会比babel做得更好。
