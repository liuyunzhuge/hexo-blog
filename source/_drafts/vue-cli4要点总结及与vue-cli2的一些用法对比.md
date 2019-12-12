---
title: vue-cli4要点总结及与vue-cli2的一些用法对比
tags:
---

这篇文章帮助你了解vue-cli4，深入学习还是依赖于更多的实际运用。

vue-cli4，npm包名称由`vue-cli`改成了`@vue/cli`，跟babel一样，采用了`scope`包。
## 安装
```bash
npm install -g @vue/cli
```
检查：
```bash
vue --version
@vue/cli 4.1.1
```

## 功能服务
vue-cli4提供的主要功能服务有：
* 项目脚手架
* 快速原型开发
* 运行时依赖
* 官方插件集合
* 图形化管理vue项目

现在vue-cli4的包也采用了`scope`包，它的源码组织结构，跟babel很相似：[源代码](https://github.com/vuejs/vue-cli/tree/dev/packages/%40vue)，打开源码列表，基本可看到这些包名都是以`vue-cli`开头的，前面提供的五大功能服务，都是由这些单独的包来完成的。

### 项目脚手架
帮助你构建vue的项目。由`@vue/cli`这个包提供。

### 快速原型开发
零配置快速写vue程序。由`@vue/cli`和`@vue/cli-service-global`提供。有了它，想快速地写一个vue程序就跟写网页一样容易。现在要快速写一个vue程序，只需要写`.vue`文件，利用vue-cli提供的快速原型开发服务，就能让一个单独的`.vue`文件运行起来。

### 运行时依赖
提供vue项目的构建能力，它的内核是使用`webpack`和`webpack-dev-server`。 由`@vue/cli-service`这个包提供。

### 官方插件集合
vue-cli4提供了类似babel一样的`plugins and presets`方式来简化对项目的构建工作。插件的名字以`@vue/cli-plugin-(内建插件)`或`vue-cli-plugin-(社区插件)`开头，也跟babel很相似。vue项目中曾经需要用到的`babel` `eslint`等任务，现在都可以交由vue-cli自己的插件来完成。当然本质上，vue自己的这些插件，还是依赖于`babel`等自身提供的包。

### 图形化管理vue项目
提供一个`vue ui`命令，会打开浏览器页面，让创建vue项目，完全变为可视化的操作方式。 由`@vue/cli`以及`@vue/cli-ui开头`的包提供。


