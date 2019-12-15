---
title: vue-cli4的plugins和presets使用介绍
tags:
---

本篇介绍vue-cli4里面plugins和presets的用法。

## plugins
为了体验plugins的用法，当使用`vue create app-name`创建项目的时候，最好什么特性都不要启用，这样的话就能一步步体验每个插件的添加过程了。

### 插件名称及解析
vue-cli4管理插件，可直接使用插件的简称，无须使用全称的npm包的形式，cli底层会自动按照规则进行全名称的包名称解析。假如有一个包的名称为：`some`，那么解析规则如下：
* 如果这个插件是官方插件，则会被完整地解析为`@vue/vue-cli-plugin-some`
* 如果这个插件是社区插件，则会被完整地解析为`vue-cli-plugin-some`
* 特殊地，如果是一个社区的`scope`插件，名称为:`@org/some`，那么会被完整地解析为：`@org/vue-cli-plugin-some`。

这意味着虽然插件的npm包可能很长，但是我们使用vue-cli4提供的命令来使用这些插件时，只需要使用简称即可，就是上面的`some`或者`@org/some`的形式。

### 插件的安装
使用`vue add plugin-name`的命令来安装新的插件。

如：
```bash
vue add babel
```
该命令将会给项目添加`babel`的cli插件，集成babel的服务。

官方提醒：
> 我们推荐在运行 vue add 之前将项目的最新状态提交，因为该命令可能调用插件的文件生成器并很有可能更改你现有的文件。

就比如刚才的`vue add babel`命令，执行完以后很明显地就在项目里添加了`babel.config.js`的配置文件，这就是插件的生成器干的。 类似的比如`router vuex eslint`这些特性的相关插件，也必然会在项目通过自身的生成器来生成必要的文件，如果我们之前项目中已存在同名的文件，就有被覆盖的风险。

因为`vue add`命令会调用`npm`等包工具安装依赖，如果想使用淘宝npm，得给这个命令添加`--registry`这个option：
```bash
vue add babel --registry=https://registry.npm.taobao.org
```

有的插件在`add`的过程中，有控制台的交互提示，因为只有插件的使用者，才能决定插件的一些作用选项，比如`router`插件，得由开发者决定它是否启用`history mode`。 安装`router`插件，出现的提示如下：
```bash
+ @vue/cli-plugin-router@4.1.1
updated 1 package in 11.258s
✔  Successfully installed plugin: @vue/cli-plugin-router

? Use history mode for router? (Requires proper server setup for index fallback in production) Yes
```

同时在安装`router`完后，还能看到这个插件对于文件改变的提示信息：
```bash
added 1 package from 1 contributor in 9.899s
✔  Successfully invoked generator for plugin: @vue/cli-plugin-router
   The following files have been updated / added:

     src/router/index.js
     src/views/About.vue
     src/views/Home.vue
     package-lock.json
     package.json
     src/App.vue
     src/main.js

   You should review these changes with git diff and commit them.
```

如果想在安装plugin的时候，直接指定相关option的值，只需要这么做：
```bash
vue add router --historyMode 
```
`historyMode`是一个`boolean option`，只要有这个option，就表示为true。而一旦使用这种方法，就表示插件的选项都会通过命令的`option`直接配置，那么前面提到的命令交互提示，在此种使用方式下就不会有了。

如何查看一个plugin可以在`vue add`时候的option呢？最好是去看这个插件源码里面的`prompts.js`这个文件，这个文件按照官方插件开发指南的规定，它是用来完成插件安装过程中的交互提示服务的，所以交互提示里面出现的那些问题，每一个都是插件被`add`时相关的option。

比如刚才的`router`插件，查看它的源码中的`prompts.js`:
```js
const { chalk } = require('@vue/cli-shared-utils')

module.exports = [
  {
    name: 'historyMode',
    type: 'confirm',
    message: `Use history mode for router? ${chalk.yellow(`(Requires proper server setup for index fallback in production)`)}`,
    description: `By using the HTML5 History API, the URLs don't need the '#' character anymore.`
  }
]
```
可看到`historyMode`这个option。

再看另外一个`eslint`插件(`@vue/vue-cli-plugin-eslint`)，查看它源码中的`prompts.js`：
```js
onst { chalk, hasGit } = require('@vue/cli-shared-utils')

module.exports = [
  {
    name: 'config',
    type: 'list',
    message: `Pick an ESLint config:`,
    choices: [
      {
        name: 'Error prevention only',
        value: 'base',
        short: 'Basic'
      },
      {
        name: 'Airbnb',
        value: 'airbnb',
        short: 'Airbnb'
      },
      {
        name: 'Standard',
        value: 'standard',
        short: 'Standard'
      },
      {
        name: 'Prettier',
        value: 'prettier',
        short: 'Prettier'
      }
    ]
  },
  {
    name: 'lintOn',
    type: 'checkbox',
    message: 'Pick additional lint features:',
    choices: [
      {
        name: 'Lint on save',
        value: 'save',
        checked: true
      },
      {
        name: 'Lint and fix on commit' + (hasGit() ? '' : chalk.red(' (requires Git)')),
        value: 'commit'
      }
    ]
  }
]
```
可看到`config`和`lintOn`两个option。

所以如果想添加`eslint`这个插件，不想使用交互命令提示，那么就可以这么安装：
```bash
vue add eslint --config airbnb --lintOn save
```

## presets
```bash
▶ vue create vue-cli-start
Vue CLI v4.1.1

? Please pick a preset: Manually select features
? Check the features needed for your project: 
 ◉ Babel
 ◯ TypeScript
 ◯ Progressive Web App (PWA) Support
 ◉ Router
 ◯ Vuex
❯◉ CSS Pre-processors
 ◉ Linter / Formatter
 ◯ Unit Testing
 ◯ E2E Testing
? Check the features needed for your project: Babel, Router, CSS Pre-processors,
 Linter
? Use history mode for router? (Requires proper server setup for index fallback 
in production) Yes
? Pick a CSS pre-processor (PostCSS, Autoprefixer and CSS Modules are supported 
by default): Less
? Pick a linter / formatter config: Airbnb
? Pick additional lint features: (Press <space> to select, <a> to toggle all, <i
> to invert selection)Lint on save
? Where do you prefer placing config for Babel, ESLint, etc.? In dedicated confi
g files
? Save this as a preset for future projects? Yes
? Save preset as: normal
```

{
    "useConfigFiles": true,
    "plugins": {
    "@vue/cli-plugin-babel": {},
    "@vue/cli-plugin-router": {
        "historyMode": true
    },
    "@vue/cli-plugin-eslint": {
        "config": "airbnb",
        "lintOn": [
        "save"
        ]
    }
    },
    "cssPreprocessor": "less"
}