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

本篇围绕babel的思想来做一些总结。

## babel的核心职责
简单来说，babel就是一个js代码的转换器。最常见的，它可以：
1. 把ES6的代码转换为ES5代码，这样即使代码最终的运行环境（常见：浏览器）不支持ES6，在开发期间也能使用最新语法提升开发效率和质量；
2. 有些ES6最新api，目标运行环境（常见：浏览器）还没有普遍提供实现，babel借助core-js对可以自动给js代码添加polyfill，以便最终在浏览器运行的代码能够正常使用那些api；babel始终能提供对最新es提案的支持；
3. 因为babel可以对代码进行处理，有些大厂团队，利用babel在做源码方面的处理(codemods)，因为大厂人多，每个人开发习惯都有差异，为了规范代码风格，提高代码质量，借助babel，将每个人的源码做一定的标准化转换处理，能够提升团队整体的开发质量；
4. vue框架推荐使用单文件`.vue`格式的方式来编写组件，它也是借助babel，将`.vue`文件，转换为标准的ES代码；
5. react框架普遍使用JSX语法来编写模板，当然vue框架也可以使用jsx，借助babel，jsx也能被正确地转换为ES代码；
6. js本身是弱类型语言，但是在大厂里面，人多特别容易因为语言本身一些小错误导致出现严重bug，所以如果在代码上线之前，借助强类型的语言静态分析能力，对js代码做一些检查的话，就能规避不少问题，flow和typescript目前是两种主流的强类型js的编程方式，babel能够将flow和typescript的代码，转换为标准的ES代码；
7. babel因为会对代码进行转换，所以可选地能够生成代码的sourcemap，便于排查特殊问题；
8. babel尽可能地在遵守ES的规格，当在学习babel的presets和plugins的时候，可能会看到有spec这个option，只要这个option启用了，相应presets和plugins就会按照更加符合规格的方式，对ES代码进行转换，只不过这个option一般是false，表示不启用，这样babel的转换速度会快一些；
9. node运行环境，目前对es6的modules支持不是很好，babel提供了另外解决方案，可以把es6编写的modules在被require的时候，自动进行代码转换，虽然没法评定这个方案的优劣，但是也能感受到babel为了让开发人员能够使用最新ES语法这方面确实很努力；

以上这些总结，都是从babel官方文档中收集到的一些babel使用场景，跟babel实际在大公司的应用中比起来，这些应该还只是冰山一角。在babel官方网站中有一个页面，专门介绍babel的思想，我觉得这些理论内容可以看到更多babel的内涵，下面一起来看看。[roadmap](https://babeljs.io/docs/en/roadmap)




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
