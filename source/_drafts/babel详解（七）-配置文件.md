---
title: 'babel详解（七）:配置文件'
tags:
  - babel
  - 前端工程化
categories:
  - Javascript
  - babel
---

本篇记录babel配置文件相关的要点。

<!-- more -->
## 概述
babel7目前来说有以下四种配置的方式：
1. `babel.config.js`
在项目的root目录，新建一个`babel.config.js`文件，然后就可以把这个配置应用到整个项目范围内。
```js
module.exports = function (api) {
  api.cache(true);

  const presets = [  ];// 类似.babelrc.js中的presets
  const plugins = [  ];// 类似.babelrc.js中的plugins

  return {
    presets,
    plugins
  };
}
```

2. `.babelrc`
在项目的`package.json`同目录，新建`.babelrc`文件，然后用json格式来编写配置：
```json
{
  "presets": [],
  "plugins": []
}
```
    与`.babelrc`等效的还有两种形式。第一种是之前博客中一直在用的`.babelrc.js`文件，它们的区别，就是`.babelrc.js`是通过js编写的，所以具备动态配置的能力。第二种形式，是直接在项目的package.json文件中编写配置，如：
```json
{
  "name": "my-package",
  "version": "1.0.0",
  "babel": {
    "presets": [  ],
    "plugins": [  ]
  }
}
```

3. 直接通过cli命令行传递配置
举例：
```bash
babel --plugins @babel/plugin-transform-arrow-functions script.js
```

4. 使用api: `babel.transform`
举例：
```js
require("@babel/core").transform("code", {
  plugins: ["@babel/plugin-transform-arrow-functions"]
});
```
    通过@babel/core，可以对代码进行动态转码。

第1、2种是babel配置方式的重点，所以后面重点解释。

## 项目范围的配置
Babel7开始，Babel具有“根”目录的概念，默认为当前工作目录。对于项目范围的配置，Babel将自动在此根目录中搜索`babel.config.js`。 或者用户可以使用显式指定`configFile`option来覆盖默认的配置文件搜索行为。

由于项目范围的配置文件与配置文件的物理位置是分开的，因此它们非常适合必须广泛应用的配置，甚至允许plugins和presets轻松应用于`node_modules`或`symlinked packages`中的文件。

`babel.config.js`的配置，有两种情况会启用。第一种，就是在`babel.config.js`所在目录运行babel，会自动去寻找babel的root目录下有没有`babel.config.js`。假如有以下项目结构：
```
repo-root/
    src/
        main.js
    babel.config.js
```
如果在`repo-root`目录运行`npx babel src -d dist`，则`src/main.js`会被成功转码。如果先`cd src/`，然后再运行`npx babel . -d dist`转码，则babel此时的root目录为`repo-root/src`，无法找到`repo-root/babel.config.js`，导致无法转码。

第二种，是通过`configFile`这个option，明确地指定`babel.config.js`文件的位置。假如有以下项目结构：
```
repo-root/
    src/
        main.js
        build.js
    babel.config.js
```
`main.js`是一段很简单的ES代码：
```js
let foo = () => {
};
```
`build.js`是一个将被node运行的文件，它会调用`babel.transform`进行编程式转码：
```js
let fs = require('fs');
let babel = require('@babel/core');

console.log(process.env.NODE_ENV);

let code = fs.readFileSync('./main.js').toString();

babel.transform(code, {
    configFile: '../babel.config.js'
}, function(err, result) {
    let { code, ast } = result;

    console.log(code);
    console.log(ast);
});
```
这个文件内通过`configFile`option，启用了`repo-root/babel.config.js`这个配置文件。 运行`cd src && node build.js`，将能看到正确的转码输出，说明`configFile`option已生效。

`babel.config.js`的其它作用，就是它可以对`node_modules`和`symlinked packages`内的文件进行转码。为了测试这个功能，可以运行`npm install lodash-es --save`，把这个ES modules版本的lodash安装到项目中。 然后在项目的根目录添加一个`.babelrc.js`，把正常的配置写进去；然后运行`npx babel ./node_modules/lodash-es/array.js -d dist`，会发现`array.js`不会被转码。 接着删除`.babelrc.js`，然后在项目根目录创建一个`babel.config.js`并做好相同配置，然后再次运行`npx babel ./node_modules/lodash-es/array.js -d dist`，此时就会看到`array.js`被babel转码了。 

`symlinked packages`也是类似的。 为了测试这个特性，先建立一个如下结构的文件夹：
```
/home/learn/some-package
    bar.js
    package.json
```
在`bar.js`里编写一些简单的ES代码：
```js
export default 'bar';
```
然后再新建一个如下结构的文件夹：（通过软连接，把src/outer-package链接到/home/learn/some-package)
```
/home/learn/repo-root
    src
        outer-package/   # symlinked to `/home/learn/some-package`
        main.js
    package.json
    .babelrc.js
```
在`main.js`里写点简单的ES代码：
```js
let foo = () => {
};
```
为了验证`babel.config.js`的作用，先把babel配置放到.babelrc.js里面：
```js
module.exports = {
    presets: [
        [
            '@babel/preset-env'
        ]
    ]
}
```
运行`npx babel src -d dist`，会发现`src/main.js`被转码，而`src/outer-package/bar.js`没有被转码。 

如果把`.babelrc.js`替换为`babel.config.js`：
```js
module.exports = function(api){
    api.cache(true);

    return {
        presets: [
            [
                '@babel/preset-env'
            ]
        ]
    };
};
```
再次运行`npx babel src/outer-package -d dist`，会发现`src/outer-package/bar.js`和`src/main.js`都被转码了。这就说明`babel.config.js`，是会把babel的转码范围扩大到`symlinked packages`内的。曾经babel6，要想包含对`node_modules`和`symlinked packages`内的文件进行处理，似乎是很麻烦的，babel7简化了这些工作。

`babel.config.js`会成为未来babel主要的配置方式，这也是向`webpack`等工具看齐的举措吧！

另外，babel自动搜索`babel.config.js`作为配置文件的行为，可以明确地指定`configFile: false`来关闭。

## 相对文件的配置

