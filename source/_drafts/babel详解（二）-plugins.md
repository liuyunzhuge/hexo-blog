---
title: 'babel详解（二）:plugins'
tags:
  - babel
  - 前端工程化
categories:
  - Javascript
  - babel
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


