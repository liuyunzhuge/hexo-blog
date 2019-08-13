---
title: babel详解（一）
tags:
---

## babel是什么
babel是一个js的转码工具，能够：
1. 把最新的js语法，转换为可在不支持最新语法环境中运行的旧语法；
2. 提供旧语法环境中不支持的语言层面的补丁，比如最新的Promise API、Generate函数、Async函数；
3. 源码转换，将js代码自动转成统一风格的代码；
4. 支持JSX和react
5. 支持Flow和Typescript
6. 支持最新的甚至还在实验阶段的js语法，只需要引入专门的插件即可
7. ...



## babel一系列npm包前面的@符号是什么含义
这个跟babel没关系，是npm包的一种形式。详细得介绍可参考下面的引用地址。
> https://docs.npmjs.com/misc/scope

简而言之，@符号开始的包，如`@babel/preset-env`，代表的是一类有scope限定的npm包。scope通常的含义代表的就是一个公司或者一个机构、甚至个人，它的作用就是将同一个主体的相关包都集中在一个范围内来组织和管理，这个范围就是scope。这类有scope的包，最大的好处就是只有scope的主体公司、机构和个人，才能往这个scope里面添加新的包，别人都不行；也就是说以@开头的npm包，一定是官方自己推出或者官方认可推出的包，比较有权威性质。

这类包的安装，与普通的包安装没有太大区别，就是前面要加上scope限定而已`@myorg`:
```bash
npm install @myorg/mypackage
```
或者是：
```json
{
    "dependencies": {
      "@myorg/mypackage": "^1.3.0"
    }
}
```
普通的包，安装在`node_modules/packagename`这个文件夹下，而scope包，则安装在`node_modules/@myorg/mypackage`这个文件夹下，相比之下，scope包多了一层`@myorg`的文件夹。所以引入scope包的时候，必须带上这个scope文件夹：
```js
require('@myorg/mypackage');
```
nodejs并没有对scope进行特殊处理，之所以要写成`require('@myorg/mypackage')`，也仅仅是因为这个包放在`node_modules/@myorg`文件夹下而已。
