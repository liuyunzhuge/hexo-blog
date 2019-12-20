---
title: vue-cli4要点总结及与vue-cli2的一些用法对比
tags:
  - vue-cli
  - Vue
categories:
  - Javascript
  - Vue
  - vue-cli
date: 2019-12-19 14:01:41
---


这篇文章帮助你了解vue-cli4，深入学习还是依赖于更多的实际运用。

<!-- more -->

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

## VS. vue-cli2
总的来说，vue-cli不管是哪个版本，它都只是一个项目构建管理的工具。 vue-cli2到vue-cli4变的只是项目的构建逻辑，而怎么开发应用，也就是怎么写代码这件事情并没有变化，所以即使要对vue-cli2的项目，做vue-cli4的升级，也是一件比较清晰的任务。 这其实vue-cli4是现在这样一种使用方式的原因，说到底还是为了让使用者更关注怎么做产品，而不要耽误时间去研究如何把项目构建做得与众不同。

4与2的区别，首先体现在项目的结构上。vue-cli2曾经是这样的：
```
config/
build/
src/
static/
.eslintignore
.eslintrc.js
.editorconfig
package.json
index.html
.postcssrc.js
.gitignore
```
而4新建的结构，一般是这样的：
```
public/
src/
.browserslistrc
.editorconfig
.eslintrc.js
.gitignore
babel.config.js
package.json
```
2里面的`index.html`移动到了4的`public`目录，2的`static`目录，被4的`public`目录替代了。2的`build`目录，被移除掉了，曾经要通过`build`目录下的所有文件才能完成的构建配置，现在统一到`vue.config.js`里面来完成。2的`config`目录移除掉，转而用的新环境变量文件的模式来完成（`.env .env.local .env.production 等`）。

其它区别如下：

### webpack
4里面的webpack，不能像2一样直接修改`webpack.config.js`了，现在统一在`vue.config.js`里面，通过`vue-cli`提供的api来修改，所以这一块的内容是有新的学习成本的。

### babel
4仍然使用`babel`配置文件的方式来使用，但是像最常用的`preset`，不是直接使用`@babel/preset-env`，而是使用`vue-cli`专门提供的`preset`：`@vue/cli-plugin-babel/preset`，这个`preset`的使用与`@babel/preset-env`大同小异。

### eslint
使用方式有些变化，但是一般使用4创建的项目，自动就完成了eslint的配置，所以没有新的成本。

### browserslist
未变化，在项目目录下提供`.browserslistrc`文件做`browsers`配置即可。

### 环境变量
变化很大。2以前的项目，都是配置在`config`目录下，4现在采用了新的模式。所以需要学习和调整，如果2升级到4，还得花时间改原来的代码。这个工作利用查找替换，还是比较好完成的，而且不容易出错。

4新增了一个模式的概念，默认有：`development production test`三种。

### 静态资源
4新增了`resource hint`，做`chunk`文件的`prefetch preload`，这在2里面默认是没有的，有手动和自动添加两种方式，对于前端优化有好处，可以根据实际情况，确认是否使用。

处理静态资源的方式，跟2没啥太大变化，不管是绝对路径、相对路径，都支持；支持配置别名；支持`img[src] video[src]`这样一些专门跟资源地址有关的属性自动转换成有效的资源加载方式。

这个部分看下官方文档，如果从2升级到4，调整变化也不是很大。

### 现代模式
4新增了现代模式的构建方式，会构建出两份文件，一份在较新的浏览器里，会启用；一份在旧版浏览器里会启用；适用于较新浏览器的版本，文件大小比正常打包的小一点，也是对于vue项目体验优化的一种有力方式。

### 构建
4的构建命令使用起来比较简单，但与2是不同的。

4提供了构建目标的概念，vue-cli4不单是可以用于开发web app，还可以用于完成工具库开发的打包任务。这是因为`vue-cli-service`提供`--target`选项，可以用来定义要构建的目标。

### 小结
整体而言，vue-cli4一开始给人的认知是变化了很多东西，改啥都要通过vue-cli自身的api去改，不如以前vue-cli2那么灵活；但实际上，真正用它构建完一个项目之后，发现它比2进步了不少，我作为一个开发者，真的感受到了它想简化我们日常开发产品的那种初衷，我看着自己的项目，不用去关注以前`build`目录里，那么多的配置文件了，现在非常干净，日常的开发，我几乎只需要关注`src`目录记录即可，而且整个构建的体验，也比原来更加简洁，我只需要关心最终的构建结果是否是我想要的，不需要去考虑这个结果是怎么来的。

以上提到的与vue-cli2的区别，可能还不完善，毕竟每个人经验所致，对vue-cli2的认识也是有差异的，但是综合上面总结的那些差异来看，还是开始说的那个观点，vue-cli2能够解决的问题，vue-cli4都有相同的方式进行处理，就是这个过程的转换，需要开发者花一定的时间去学习和调整。



