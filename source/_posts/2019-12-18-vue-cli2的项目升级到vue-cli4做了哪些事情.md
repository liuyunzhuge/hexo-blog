---
title: vue-cli2的项目升级到vue-cli4做了哪些事情
date: 2019-12-18 21:12:59
tags:
  - vue-cli
  - Vue
categories:
  - Javascript
  - Vue
  - vue-cli
---

前阵子学babel的时候，因为babel升级到了babel7，我以前用vue-cli2创建的vue项目用的是babel6，哪怕是现在，继续使用vue-cli2创建新项目，创建的项目仍然是babel6，好在babel7提供了一个升级方案，所以在学习完之后，立马就用那个方案，对babel进行了升级，因为`@babel/preset-env`对polyfill的改进，升级完的项目，打包大小比之前有些许的减小。这几天有时间，正好在看vue-cli4，于是决定彻底把现在一个主要产品的构建升级到vue-cli4。 这篇文章记录这个过程里面做得一些工作。

<!-- more -->
## 准备工作
vue-cli2的项目结构:
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
代码和运行需要的文件集中在`src/`和`static/`目录。

先将vue-cli升级到4，然后使用`vue create`创建一个项目，选用`babel eslint less router`这几个原来项目中有的特性，最终新建的项目结构为：
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

删除掉新项目中`public`目录。将旧项目中的`static`目录复制到新项目，并重命名为public，将旧项目中的`index.html`复制到新项目中的`public`目录。删除掉新项目中的`src`目录，将旧项目中的`src`目录复制到新项目中来。

到此为止，新项目已经采用了新的构建配置，并集成了原有的代码和文件内容，接下来对其进行配置调整即可。

## 别名
直接在新项目中运行`npm run serve`遇到的第一个问题就是，别名的问题，因为旧项目里，我单独加了除`@`之外的别名，所以新项目为了不想改代码，也必须找到修改别名的方式，最终方案是：在项目内新建`vue.config.js`，并写入：
```js
const path = require('path')

function resolve (dir) {
    return path.join(__dirname, dir)
}

module.exports = {
    chainWebpack: (config) => {
        config.resolve.alias
            .set('@img', resolve('src/assets/img'))
    }
}

```

## 静态资源目录
因为原来项目里有在`static`目录直接放入几个图片文件，并且在代码中有`/static/img/logo.png`这样的引用，所以为了保证新项目构建后，原来的字符串还能访问到正确的图片，所以也必须把图片等静态资源构建到以前项目的形式，只需改进`vue.config.js`:
```js
const path = require('path')

function resolve (dir) {
    return path.join(__dirname, dir)
}

module.exports = {
    chainWebpack: (config) => {
        config.resolve.alias
            .set('@img', resolve('src/assets/img'))
    },
    assetsDir: 'static'
}
```
加入了`assetsDir`这个option。

## resource hint
vue-cli4自动加入了对资源的`prefetch`和`preload`，我认为`preload`当前是有益的，`prefetch`应该手动控制，而不是所有`chunk`都去做`prefetch`，所以先把`prefetch`关掉，继续改进`vue.config.js`:
```js
const path = require('path')

function resolve (dir) {
    return path.join(__dirname, dir)
}

module.exports = {
    productionSourceMap: false,
    chainWebpack: (config) => {
        config.plugins.delete('prefetch')

        config.resolve.alias
            .set('@img', resolve('src/assets/img'))
    },
    assetsDir: 'static'
}
```
另外生产环境，我不想要`sourceMap`，所以`productionSourceMap`也设置为了`false`。至此，`vue-cli`自身的配置就差不多了。

## babel
vue-cli4默认就是bable7，所以这次不用去管要`install`哪些babel插件的问题了，只需要把babel配置好即可，最终配置好的`babel.config.js`如下：
```js
module.exports = {
    presets: [
        [
            '@vue/cli-plugin-babel/preset',
            {
                modules: false,
                useBuiltIns: 'usage',
                corejs: 3, // @vue/cli-plugin-babel/preset内部默认也是3
                debug: false,
                polyfills: [// vue-breif-event-bus needs these polyfill
                    'es.symbol',
                    'es.symbol.description',
                    'es.symbol.iterator',
                    'es.array.concat',
                    'es.array.iterator',
                    'es.array.join',
                    'es.array.slice',
                    'es.array.sort',
                    'es.array.splice',
                    'es.date.to-string',
                    'es.function.name',
                    'es.map',
                    'es.object.define-property',
                    'es.object.to-string',
                    'es.regexp.constructor',
                    'es.regexp.exec',
                    'es.regexp.to-string',
                    'es.string.iterator',
                    'es.string.split',
                    'web.dom-collections.iterator',
                    'es.array.map',
                    'es.object.get-own-property-descriptor',
                    'es.string.replace'
                ]
            }
        ]
    ],
    plugins: [
        [
            '@babel/plugin-transform-runtime',
            {
                corejs: false,
                regenerator: false
            }
        ]
    ]
}
```
虽然这里用的是`@vue/cli-plugin-babel/preset`，而不是`@babel/preset-env`，但是给前者配置的`option`都会传递给`@babel/preset-env`。没有在`babel.config.js`里面加入`preset target`的配置，最好统一用`.browserslist`配置。`polyfills`这个option是`@vue/cli-plugin-babel/preset`单独加的，可以强制添加指定`es features`的`polyfill`，主要是给`dependencies`里面的包服务的。 我用了自己写的`vue-breif-event-bus`，这里面用了很多es新特性， 比如`map Symbol`，我根据我最终项目的`browserslist`，对`vue-breif-event-bus`相关的源代码，做了polyfill的检测，最终得到以上配置中的一个`es features`列表，所以我单独用vue-cli4提供的这种方式加进来了，否则我这个项目的babel是不会处于`node_modules`里面的`vue-breif-event-bus`添加polyfill的。

如果使用了`@vue/cli-plugin-babel/preset`，vue-cli4自动会添加`@babel/runtime`的插件，但是为了配置`corejs:false,regenerator:false`，所以此处单独做了配置，进行覆盖。

至此babel也配置好了。

## eslint
新项目建好以后，eslint的特性自动添加了以下文件：
```
.editorconfig
.eslintrc.js
```
其中`.editorconfig`我改为了：
```
[*.{js, jsx, ts, tsx, vue}]
indent_style = space
indent_size = 4
end_of_line = lf
trim_trailing_whitespace = true
insert_final_newline = true
max_line_length = 100
```
只改了`indent_size`，我个人不喜欢2，喜欢4。

`.eslintrc.js`原本为:
```js
module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:vue/essential',
    '@vue/standard'
  ],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
  },
  parserOptions: {
    parser: 'babel-eslint'
  }
}
```
我改为了：
```js
module.exports = {
    root: true,
    env: {
        node: true
    },
    extends: [
        'plugin:vue/essential',
        '@vue/standard'
    ],
    rules: {
        'no-console': 'off',
        'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
        indent: ['off'],
        'vue/no-use-v-if-with-v-for': 'off'
    },
    parserOptions: {
        parser: 'babel-eslint'
    }
}
```
* 首先我用的是`standard`这个config，相对宽松一些，本来想用`airbnb`那个config，太严格，报错太多，代码改不完，如果是新项目，可以考虑用
* `no-console`我关掉了，因为线上有的时候还得靠这个查bug
* `indent`我关掉了，喜欢webstorm提供的格式化，现在编码都习惯了
* `vue/no-use-v-if-with-v-for`不应该关，将来会改

可通过`npm run lint`进行自动检查和修复，最后按照这个配置，改了将近200个错误，可见曾经项目中的代码确实没啥规范，改好这一次，看到运行`npm run lint`显示`done`也就感到知足了。

## browerslist
`.browserslistrc`配置为：
```
Android >= 4
iOS >= 8
```
polyfill和autoprefixer都依赖于它。

## 环境变量
旧项目一些环境变量的配置放置在`config`目录下，分别有`dev.env.js`和`prod.env.js`这样的文件，最后通过WebpackDefinePlugin，能将这些变量注入到客户端的脚本，所以项目的逻辑代码里面也能访问这些环境变量，vue-cli4换了一种方式，这次按照[官方文档的说明](https://cli.vuejs.org/zh/guide/mode-and-env.html#%E6%A8%A1%E5%BC%8F)，进行调整，改了代码中的不少地方。

这部分因人而已，最好按照官方文档来调整自己的代码，改代码是一定少不少的，因为这次vue-cli4强制约定只有`VUE_APP_`开头的环境变量，客户端脚本内才可访问。

另外新项目中新方式定义的环境变量，在构建相关的脚本中都是可访问到的，比如`vue.config.js`里面，这样方便进行一些测试啥的。

## 构建配置
生成环境构建使用的是：
```
vue-cli-service build
```
这个等同于：
```
vue-cli-service build --mode production
```
假如我们想使用`--mode production`的构建方式，但是使用其它的`mode`，必须这样做(windows开发环境)
```
set NODE_ENV=production&&vue-cli-service build --mode mini
```
注意`production`与后面的`&&`之间不要有空格！！！
因为在vue-cli4内部配置webpack的时候，是根据`NODE_ENV === 'production'`来作为生产环境构建的判断条件的。

## editor
这次还对webstorm做了一些设置，以便与eslint进行结合。截图如下：
<img src="{% asset_path "01.png" %}" width="700">
<img src="{% asset_path "02.png" %}" width="700">
<img src="{% asset_path "03.png" %}" width="400">
<img src="{% asset_path "04.png" %}" width="700">
<img src="{% asset_path "05.png" %}" width="700">
第3张其实如何对现有文件的`line separators`进行修改的方法。