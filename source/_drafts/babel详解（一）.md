---
title: babel详解（一）
tags:
---

babel已经推出7.x版本，与babel紧密关联的core-js也推出了3.x版本，与babel7.x和core-js3.x对应的是babel6.x和core-js2.x。babel7.x和core-js3.x有很多新变化，值得学习，并且考虑在现有项目中对babel6.x进行升级处理。

从本篇开始，我将尝试从细节方面来总结最新版本babel(7.x)的作用及用法。经过这几天了解babel和core-js的最新文档，我认为熟练地掌握babel7.x有以下一些要点：
<!-- more -->
1. babel核心职责是什么
2. babel的plugins有什么作用
3. babel的presets有什么作用
4. babel/polyfill做什么用，现在有什么变化
5. 什么是babel/runtime
6. core-js是什么，它是怎么与babel集成使用的，core-js@3与core-js@2有什么变化
7. 什么是babel/register
8. 如何选择babel的配置方式？各个配置方式的应用场景是怎样的
9. babel的配置options中各个选项的含义和作用
10. 常见的babel使用方式都有哪些
11. 如何升级babel7.x，目前其它与babel结合使用的工具，如webpack，对babel7.x的支持情况咋样？
12. babel的api能做什么

以上要点涉及内容非常多，所以会分为n篇文章来处理，而且因为个人能力有限，每个内容在学习过程中，一定会遇到自己不熟悉的问题或场景，需要耗费时间去琢磨，所以这一系列内容能够更新完的时间也没法保证。


本篇补充一个内容：
## 最新babel相关的npm包前面的@符号是什么含义
从babel7.0开始，babel一系列的包都以`@babel`开头，这个跟babel没关系，是npm包的一种形式。详细得介绍可参考下面的引用地址。
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
