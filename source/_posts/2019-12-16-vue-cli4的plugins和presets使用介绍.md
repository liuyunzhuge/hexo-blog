---
title: vue-cli4的plugins和presets使用介绍
tags:
  - vue-cli
  - Vue
categories:
  - Javascript
  - Vue
  - vue-cli
date: 2019-12-16 23:00:54
---


本篇介绍vue-cli4里面plugins和presets的用法。
<!-- more -->

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
presets可以简化以后的项目创建过程。 拿以下这个例子为例：
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
上面这个`create`过程，采用了`Manually select features`的方式来处理，所以可以自由选择要启用哪些前端的`features`。由于每一个`feature`对应了不同的plugin，每个plugin都有各自的命令行交互提示，所以上述过程能看到已选择的那些`feature`触发的提示，让开发者自己设置相关的`option`。最重要的是最后，按照cli的提示，把当前这次创建项目的过程保存为了一个本地的preset并命名为了`normal`。 这样当下次在本机继续创建vue项目的时候，即可直接选择这个normal：
```bash
Vue CLI v4.1.1
? Please pick a preset: (Use arrow keys)
❯ normal (less, babel, router, eslint) 
  default (babel, eslint) 
  Manually select features
```
cli把`normal`保存在了`~/.vuerc`文件中：
```json
{
  "useTaobaoRegistry": true,
  "presets": {
    "normal": {
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
  }
}
```
`normal`的这个结构反映了一个常规的preset的内容形式：
```json
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
```
其中：
* `useConfigFiles`决定了项目构建过程中一些工具的配置是否要启用单独的配置文件，如果不启用，则会添加至package.json，一般都设置为true。比如bable、eslint，它们作为独立的构建工具，一般都使用自己单独的配置文件；
* `plugins`配置要启用哪些插件，这个直接决定了要构建的项目会开启哪些特性。同时可以在配置插件的时候，直接指定插件所需`option`的值，这样在`create`的时候就不会需要命令行提示了。如果仍然想在`preset`中启用`plugin`的命令行提示，可以把`option`的键值对去掉，加上`"prompts": true`，例如：
```json
    "@vue/cli-plugin-eslint": {
      "prompts": true
    }
```
  这样当使用这个preset进行`create`的时候，执行`eslint`插件时，仍然会有命令行提示来设置`option`。
* `cssPreprocessor`设置css预处理器
* 跟`"prompts": true`类似的，preset里还可以通过`vertion`来指定构建时plugin相应的版本，这样`create`的时候，`npm`就会去下载该版本条件的plugin包：
```json
    "@vue/cli-plugin-eslint": {
      "version": "^3.0.0",
      // ... 该插件的其它选项
    }
```
  > 注意对于官方插件来说这不是必须的——当被忽略时，CLI 会自动使用 registry 中最新的版本。不过我们推荐为 preset 列出的所有第三方插件提供显式的版本范围。

除了`plugins useConfigFiles cssPreprocessor`，preset的配置中还可以加入为集成工具预添加的配置：
```json
{
  "useConfigFiles": true,
  "plugins": {...},
  "configs": {
    "vue": {...},
    "postcss": {...},
    "eslintConfig": {...},
    "jest": {...}
  }
}
```
以`configs.vue`为例，其实是预先添加的vue-cli的配置，最终如果`useConfigFiles`为true，则它们会被合并到`vue.config.js`里面。

为了测试这个效果，我将`normal`这个preset修改为：
```json
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
  "cssPreprocessor": "less",
  "configs": {
    "vue": {
      "outputDir": "www",
      "assetsDir": "assets"
    }
  }
}
```
然后尝试用这个preset构建一个项目，看看最后项目中的`vue.config.js`会不会包含我上面单独配置的`outputDir和assetsDir`这两个option。
```bash
vue create vue-cli-demo01
Vue CLI v4.1.1
? Please pick a preset: normal (less, babel, router, eslint)#这里已经选择了normal
...#creating
...
...
```
接下来去`vue-cli-demo01`项目中，查看下`vue.config.js`文件，现在它是：
```js
module.exports = {
  outputDir: 'www',
  assetsDir: 'assets',
};
```
说明preset生效了。

但是到这里，还是可以看到一个问题，vue-cli的官方文档介绍并不是很仔细，比如前面的configs里用下面的四个key来表示对相关四个工具的配置:
```
  "configs": {
    "vue": {...},
    "postcss": {...},
    "eslintConfig": {...},
    "jest": {...}
  }
```
那其它的工具呢？比如babel，虽然大概率应该是用`babel`这个单词作为key，但是还有其它工具是不明确的。另外`eslintConfig`为啥是用`eslintConfig`而不是`eslint`呢，毕竟在plugin的部分，只需要`eslint`就够了。

如果你也想在preset里面预先加入这样一些集成工具的配置，还是得好好琢磨测试下先。

### 远程preset
preset除了保存在`~/.vuerc`本地文件里面，还可以发布到git上面，这样不管在哪台机器都可以使用这个git这个远程的preset来创建项目。 使用形式为：
```bash
vue create --preset liuyunzhuge/vue-project-preset new-project
```
[了解更多](https://cli.vuejs.org/zh/guide/plugins-and-presets.html#%E8%BF%9C%E7%A8%8B-preset)