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
帮助你构建vue的项目。由`@vue/cli`这个包提供。在安装完vue-cli之后，使用`vue create project-name`命令来创建项目。

### 快速原型开发
零配置快速写vue程序。由`@vue/cli`和`@vue/cli-service-global`提供。有了它，想快速地写一个vue程序就跟写网页一样容易。现在要快速写一个vue程序，只需要写`.vue`文件，利用vue-cli提供的快速原型开发服务，就能让一个单独的`.vue`文件运行起来。使用`vue serve`和`vue build`命令，且必须在全局安装`@vue/cli-service-global`这个包之后，才能使用`vue server`和`vue build`命令。

### 运行时依赖
这是vue-cli的核心能力，它主要作用有：
* 加载其它 CLI 插件的核心服务；
* 一个针对绝大部分应用优化过的内部的 webpack 配置；
* 项目内部的`vue-cli-service`命令，提供`serve、build和inspect`命令

它构建于`webpack`和`webpack-dev-server`基础之上，由`@vue/cli-service`这个包提供。它会被局部安装在每个项目当中，内部的`vue-cli-service`命令可以通过`npx`来执行。如：
* `npx vue-cli-service serve` 用于开发环境使用
* `npx vue-cli-service build` 用于生产环境构建
* `npx vue-cli-service inspect` 用于检查webpack的配置

为什么会有`npx vue-cli-service inspect`，因为从vue-cli3开始，不再是直接通过webpack.config.js来设置webpack，而是借由vue-cli提供的服务来间接配置webpack，为了检查这种方式配置的正确性，所以需要一个命令来做校验。

其实不单是webpack，其它的在vue-cli2里面也会用到的前端工具，如babel, eslint等，现在也都是经由vue-cli提供的官方插件，进行管理。从vue-cli的角度来说，它这么做显然是为了进一步降低使用vue开发项目的难度，让开发者更关注于项目本身，而无需考虑项目构建这种前置工作任务。也正是因为这一点，从vue-cli3开始，它模仿babel推出了自己的plugins和presets。


### 官方插件集合
`项目脚手架`和`运行时依赖`的很多集成其它工具的工作都是由一系列新开发的vue-cli插件来完成的，vue-cli提供了官方插件，与vue-cli集成，覆盖了前端生态最好的工具集合，如：`babel eslint typescript mocha jest`等。同时它还提供了插件开发指南，所以自此也诞生了很多社区工具，用于扩展vue-cli的项目构建能力。

官方文档对插件功能的描述是：
> 插件可以修改`webpack`的内部配置，也可以向`vue-cli-service`注入命令。在项目创建的过程中，绝大部分列出的特性都是通过插件来实现的。

官方插件的名字以`@vue/cli-plugin-`开头（同属于`@vue`这个`scope`，社区插件以`vue-cli-plugin-`开头。官方插件一览：
* cli-plugin-babel
* cli-plugin-e2e-cypress
* cli-plugin-e2e-nightwatch
* cli-plugin-eslint
* cli-plugin-pwa
* cli-plugin-router
* cli-plugin-typescript
* cli-plugin-unit-jest
* cli-plugin-unit-mocha
* cli-plugin-vuex

`cli-plugin-babel`帮你在项目脚手架和`vue-cli-service`命令中，加入babel工具的服务；`cli-plugin-router`帮助你在项目中集成`vue-router`，等等。

### 图形化管理vue项目
提供一个`vue ui`命令，会打开浏览器页面，让创建和管理vue项目，完全变为可视化的操作方式。 由`@vue/cli`以及`@vue/cli-ui开头`的包提供。

### 小结
从以上内容可以看出vue-cli本质上的核心能力只有两个：`项目脚手架`和`运行时依赖`。 因为快速原型开发和图形化管理项目，你完全可以不用。 而所谓的插件集合，本身就是`项目脚手架`和`运行时依赖`的核心内容。 所以学习vue-cli4，应该学运行时依赖和那些插件。

### vue-cli2
如果还想使用vue-cli2提供的`vue init`命令，来创建项目，需全局安装一个桥接工具：
```bash
npm install -g @vue/cli-init
```
因为vue-cli4提供的vue命令，覆盖了vue-cli2提供的vue命令。安装了上面的包之后，就可以通过`vue init project-name`来创建符合vue-cli2模板的项目了。

不过已经不提倡这么做了，vue-cli2应该是不再更新了，我测试了这个方式，拉取到的项目模板，使用两个核心工具`webpack`和`babel`都还停留在老版本，如果要继续使用这样的模板，那就得手工自己做webpack和babel的升级。
