---
title: vue-router源码：create-route-map
tags:
  - Vue
  - vue-router
  - vue-router源码
categories:
  - Javascript
  - Vue
  - vue-router
date: 2020-03-22 17:41:03
---


vue-router源码解析系列。这是第二篇。本篇介绍源码中的`create-route-map.js`，它在`vue-router`中的作用是将路由配置数据`routes`解析为路由匹配时需要的数据，了解它的源码之后，能够加强对于`routes`配置的理解和使用。本系列解析的是官方git库中3.1.6的版本源码。
<!-- more -->
源码链接：[create-route-map.js](/code/vue-router/source-code/create-route-map.js)。源码里面用的是typescript，但是不影响阅读。

## 预备知识
首先我们要知道，`vue-router`实例是通常在`router/index.js`这个文件中进行实例化的，如：
```js
import Vue from 'vue'
import Router from 'vue-router'

const Index = r => require.ensure([], () => r(require('../pages/Index.vue')), 'Index')
const List = r => require.ensure([], () => r(require('../pages/List.vue')), 'List')
const Detail = r => require.ensure([], () => r(require('../pages/Detail.vue')), 'Detail')

Vue.use(Router)

const router = new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      component: Index
    },
    {
      path: '/index',
      redirect: '/'
    },
    {
      name: 'list',
      path: '/list',
      component: List
    },
    {
      name: 'detail',
      path: '/detail/:id',
      component: Detail,
      alias: ['/query/:id'],
      children: [
        {
          name: 'detail_more',
          path: 'more',
          components: {
            bar: () => import(/* webpackChunkName: "group-bar" */ '../pages/Bar.vue')
          }
        }
      ]
    }
  ]
})
export default router
```
`vue-router`的实例所对应的源码是：`index.js`，在这个文件内，可以看到`Router`的构造函数：
```js
export default class VueRouter {
  // 省略了一部分代码

  constructor (options: RouterOptions = {}) {
    this.app = null
    this.apps = []
    this.options = options
    this.beforeHooks = []
    this.resolveHooks = []
    this.afterHooks = []
    this.matcher = createMatcher(options.routes || [], this)
    // 省略了一部分代码
  }

  // 省略了一部分代码
}
```
本篇还不涉及到学习`index.js`，所以不过多介绍。此处引入，只是为了说明`create-route-map`这个文件的生效入口。在`router`构造函数内，这行代码是`create-route-map`文件生效的入口：
```js
this.matcher = createMatcher(options.routes || [], this)
```
这个`createMatcher`对应的源码文件是：`create-matcher.js`，这个文件是下一步学习的内容，所以本篇也不深入。它的作用，顾名思义，应该跟路由匹配有关系，在它的代码里，有引用`create-route-map`的地方：
```js
import { createRouteMap } from './create-route-map'

// 省略了很多代码
export function createMatcher (
  routes: Array<RouteConfig>,
  router: VueRouter
): Matcher {
  const { pathList, pathMap, nameMap } = createRouteMap(routes)
  // 省略了很多代码
}
```
由此可见，`create-route-map`会返回一个对象，并且包含了`pathList pathMap nameMap`这三份数据。 这三个数据是什么呢，在分析之前，我们先看下结果：
<img src="{% asset_path "01.png" %}">
* `pathList`实际上是根据`route/index.js`文件内`routes`数组的配置，解析出的所有路径
* `pathMap`实际上是路径与`route记录`的映射表，路径作为键名
* `nameMap`实际上是路由名称（`route`配置上的`name`属性）与`route记录`的映射表，`name`作为键名

## createRouteMap
先看第一段代码，重要的后面单独拆分解析，不重要的直接写注释：
```js
// 这是一个库，做路径解析的库，github搜“path-to-regexp”
import Regexp from 'path-to-regexp'
// cleanPath是个很简单的函数，就是将字符串双斜线替换为单斜线，如//asd 替换为 /asd
import { cleanPath } from './util/path'
// assert warn都是与调试、日志有关
import { assert, warn } from './util/warn'

export function createRouteMap (
  routes: Array<RouteConfig>,
  oldPathList?: Array<string>,
  oldPathMap?: Dictionary<RouteRecord>,
  oldNameMap?: Dictionary<RouteRecord>
): {
  pathList: Array<string>,
  pathMap: Dictionary<RouteRecord>,
  nameMap: Dictionary<RouteRecord>
} {
  // the path list is used to control path matching priority
  const pathList: Array<string> = oldPathList || []
  // $flow-disable-line
  const pathMap: Dictionary<RouteRecord> = oldPathMap || Object.create(null)
  // $flow-disable-line
  const nameMap: Dictionary<RouteRecord> = oldNameMap || Object.create(null)

  routes.forEach(route => {
    addRouteRecord(pathList, pathMap, nameMap, route)
  })

  // ensure wildcard routes are always at the end
  for (let i = 0, l = pathList.length; i < l; i++) {
    if (pathList[i] === '*') {
      pathList.push(pathList.splice(i, 1)[0])
      l--
      i--
    }
  }

  if (process.env.NODE_ENV === 'development') {
    // warn if routes do not include leading slashes
    const found = pathList
    // check for missing leading slash
      .filter(path => path && path.charAt(0) !== '*' && path.charAt(0) !== '/')

    if (found.length > 0) {
      const pathNames = found.map(path => `- ${path}`).join('\n')
      warn(false, `Non-nested routes must include a leading slash character. Fix the following routes: \n${pathNames}`)
    }
  }

  return {
    pathList,
    pathMap,
    nameMap
  }
}
```
`Array<RouteConfig> Dictionary<RouteRecord>`这些都是参数的类型声明，这是`typescript`语言特有的写法。`createRouteMap`函数有四个参数： `routes oldPathList oldPathMap oldNameMap`，它的返回值是一个包含`pathList pathMap nameMap`的对象，这些都是从这个函数的声明部分可以读出来的信息。

`oldPathList oldPathMap oldNameMap`三个参数都是可选的，它们有什么作用呢？一般情况下它们没什么用，但如果在app中需要动态添加route配置，它们就有用了。因为createRouteMap一旦被调用过一次，那么就已经创建好了`pathList pathMap nameMap`并且返回去了，当app需要动态添加路由时，意味着就要做新的路由配置解析，也就是重新调用`createRouteMap`，那一个app实例，肯定只需要一份`pathList pathMap nameMap`，所以再次调用`createRouteMap`时，再把app里面已经持有的数据，带回来就行了。

```js
  routes.forEach(route => {
    addRouteRecord(pathList, pathMap, nameMap, route)
  })
```
这是核心逻辑，遍历`routes`的配置，然后依次调用`addRouteRecord`，进行配置解析，把配置记录，解析为`route record`，并关联存储到`pathList pathMap nameMap`。后面介绍。

```js
  // ensure wildcard routes are always at the end
  for (let i = 0, l = pathList.length; i < l; i++) {
    if (pathList[i] === '*') {
      pathList.push(pathList.splice(i, 1)[0])
      l--
      i--
    }
  }
```
这段注释写清楚了，就是把`pathList`里面，通配符的记录，移动到数组最后，应该是`vue-router`路由匹配时的优先级有关。 `vue-router`的路由匹配，是按照定义的先后顺序来匹配的，谁先匹配到就用谁，所以把通配符的移动到最后，就保证了只有在通配符路由，前面所有的路由都没有匹配到，才会匹配到通配符路由。

```js
  if (process.env.NODE_ENV === 'development') {
    // warn if routes do not include leading slashes
    const found = pathList
    // check for missing leading slash
      .filter(path => path && path.charAt(0) !== '*' && path.charAt(0) !== '/')

    if (found.length > 0) {
      const pathNames = found.map(path => `- ${path}`).join('\n')
      warn(false, `Non-nested routes must include a leading slash character. Fix the following routes: \n${pathNames}`)
    }
  }
```
这段是对`pathList`进行一遍数据检查，要求我们在配置`routes`的时候，非`children`内的配置，在配置`path`的时候，除了`*`开头的`path`，其它`path`都要有`/`开头。

## addRouteRecord
代码是这些：
```js
function addRouteRecord (
  pathList: Array<string>,
  pathMap: Dictionary<RouteRecord>,
  nameMap: Dictionary<RouteRecord>,
  route: RouteConfig,
  parent?: RouteRecord,
  matchAs?: string
) {

  // 解构出route里面的path和name数据
  const { path, name } = route

  // 下面做了些断言检测
  // 可以没有name，但是不能没有path
  // 而且component不能是字符串
  if (process.env.NODE_ENV !== 'production') {
    assert(path != null, `"path" is required in a route configuration.`)
    assert(
      typeof route.component !== 'string',
      `route config "component" for path: ${String(
        path || name
      )} cannot be a ` + `string id. Use an actual component instead.`
    )
  }

  const pathToRegexpOptions: PathToRegexpOptions =
    route.pathToRegexpOptions || {}
  const normalizedPath = normalizePath(path, parent, pathToRegexpOptions.strict)

  if (typeof route.caseSensitive === 'boolean') {
    pathToRegexpOptions.sensitive = route.caseSensitive
  }

  const record: RouteRecord = {
    path: normalizedPath,
    regex: compileRouteRegex(normalizedPath, pathToRegexpOptions),
    components: route.components || { default: route.component },
    instances: {},
    name,
    parent,
    matchAs,
    redirect: route.redirect,
    beforeEnter: route.beforeEnter,
    meta: route.meta || {},
    props:
      route.props == null
        ? {}
        : route.components
          ? route.props
          : { default: route.props }
  }

  if (route.children) {
    // Warn if route is named, does not redirect and has a default child route.
    // If users navigate to this route by name, the default child will
    // not be rendered (GH Issue #629)
    if (process.env.NODE_ENV !== 'production') {
      if (
        route.name &&
        !route.redirect &&
        route.children.some(child => /^\/?$/.test(child.path))
      ) {
        warn(
          false,
          `Named Route '${route.name}' has a default child route. ` +
            `When navigating to this named route (:to="{name: '${
              route.name
            }'"), ` +
            `the default child route will not be rendered. Remove the name from ` +
            `this route and use the name of the default child route for named ` +
            `links instead.`
        )
      }
    }
    route.children.forEach(child => {
      const childMatchAs = matchAs
        ? cleanPath(`${matchAs}/${child.path}`)
        : undefined
      addRouteRecord(pathList, pathMap, nameMap, child, record, childMatchAs)
    })
  }

  if (!pathMap[record.path]) {
    pathList.push(record.path)
    pathMap[record.path] = record
  }

  if (route.alias !== undefined) {
    const aliases = Array.isArray(route.alias) ? route.alias : [route.alias]
    for (let i = 0; i < aliases.length; ++i) {
      const alias = aliases[i]
      if (process.env.NODE_ENV !== 'production' && alias === path) {
        warn(
          false,
          `Found an alias with the same value as the path: "${path}". You have to remove that alias. It will be ignored in development.`
        )
        // skip in dev to make it work
        continue
      }

      const aliasRoute = {
        path: alias,
        children: route.children
      }
      addRouteRecord(
        pathList,
        pathMap,
        nameMap,
        aliasRoute,
        parent,
        record.path || '/' // matchAs
      )
    }
  }

  if (name) {
    if (!nameMap[name]) {
      nameMap[name] = record
    } else if (process.env.NODE_ENV !== 'production' && !matchAs) {
      warn(
        false,
        `Duplicate named routes definition: ` +
          `{ name: "${name}", path: "${record.path}" }`
      )
    }
  }
}
```
先来看它的参数：
```
  pathList: Array<string>,
  pathMap: Dictionary<RouteRecord>,
  nameMap: Dictionary<RouteRecord>,
  route: RouteConfig,
  parent?: RouteRecord,
  matchAs?: string
```
前三个不用解释了，第四个`route`表示当前要处理的那条配置对象，`parent`则代表的是一个`route record`，`addRouteRecord`就是创建`route record`的函数，如果某个`route record`被创建后，发现它的`route`配置里面有`children`，则会对`children`也进行`addRouteRecord`的处理，而它自身会作为一个`parent`参数传入到`children`的`addRouteRecord`处理；`matchAs`跟路由别名有关，后面用实例来解析。

下面这段代码是创建`route record`的过程：
```js
const pathToRegexpOptions: PathToRegexpOptions =
    route.pathToRegexpOptions || {}
  const normalizedPath = normalizePath(path, parent, pathToRegexpOptions.strict)

  if (typeof route.caseSensitive === 'boolean') {
    pathToRegexpOptions.sensitive = route.caseSensitive
  }

  const record: RouteRecord = {
    path: normalizedPath,
    regex: compileRouteRegex(normalizedPath, pathToRegexpOptions),
    components: route.components || { default: route.component },
    instances: {},
    name,
    parent,
    matchAs,
    redirect: route.redirect,
    beforeEnter: route.beforeEnter,
    meta: route.meta || {},
    props:
      route.props == null
        ? {}
        : route.components
          ? route.props
          : { default: route.props }
  }
```
从这里可以看到在`routes`配置中，还可以添加`pathToRegexpOptions caseSensitive`这些option，这些options是干什么的呢？它与`path-to-regexp`有关，在`vue-router`的官方文档有介绍过：
<img src="{% asset_path "02.png" %}">
`pathToRegexpOptions`就是给`path-to-regexp`这个库用的。这个库怎么用呢，可以去看github，也可以去看我写的另外一篇博客：
> {% post_link path-to-regexp使用小结 %}

这里有一行代码，对`path`进行了一些处理：
```js
const normalizedPath = normalizePath(path, parent, pathToRegexpOptions.strict)
```
它调用了这个函数：
```js
function normalizePath (
  path: string,
  parent?: RouteRecord,
  strict?: boolean
): string {
  if (!strict) path = path.replace(/\/$/, '')
  if (path[0] === '/') return path
  if (parent == null) return path
  return cleanPath(`${parent.path}/${path}`)
}
```
其实也比较简单，在js中`normalize`这个词的含义都是`正规化`，比如ES6开始有了对于字符串的正规化处理，所以`normalizePath`也就是一个对`path`进行正规化处理的作用。注意最后那个`${parent.path}/${path}`，假如你有一个这个route：
```js
    {
      name: 'detail',
      path: '/detail/:id',
      component: Detail,
      alias: ['/query/:id'],
      children: [
        {
          name: 'detail_more',
          path: 'more',
          components: {
            bar: () => import(/* webpackChunkName: "group-bar" */ '../pages/Bar.vue')
          }
        }
      ]
    }
```
在`children`中，`path`不需要把`parent`的`path`加上，因为在`normalizePath`里通过`${parent.path}/${path}`，为你处理好了。

接下来看`RouteRecord`的结构：
```js
const record: RouteRecord = {
    path: normalizedPath, 
    regex: compileRouteRegex(normalizedPath, pathToRegexpOptions),
    components: route.components || { default: route.component },
    instances: {},
    name,
    parent,
    matchAs,
    redirect: route.redirect,
    beforeEnter: route.beforeEnter,
    meta: route.meta || {},
    props:
      route.props == null
        ? {}
        : route.components
          ? route.props
          : { default: route.props }
  }
```
先看这个`regex`，它是调用`compileRouteRegex`返回的一个正则表达式，这个进行路由匹配时，肯定是要用到的，`compileRouteRegex`内部其实就是使用`path-to-regexp`的过程：
```js
function compileRouteRegex (
  path: string,
  pathToRegexpOptions: PathToRegexpOptions
): RouteRegExp {
  // Regexp就是path-to-regexp 顶部有import
  const regex = Regexp(path, [], pathToRegexpOptions)
  if (process.env.NODE_ENV !== 'production') {
    const keys: any = Object.create(null)
    regex.keys.forEach(key => {
      warn(
        !keys[key.name],
        `Duplicate param keys in route with path: "${path}"`
      )
      keys[key.name] = true
    })
  }
  return regex
}
```
它加了一个命名参数不允许重复的处理，比如这样的`path`:`/some/:name/:name`，是会触发警告的。其它的属性作用如下：
* `path`是当前路由正规化处理之后的路径
* `component`是当前路由配置的组件定义，从`route.components || { default: route.component }`可以看到，路由视图默认的名字之所以是`default`的原因
* `instances`是最终要用来存放当前渲染的节点实例的，理解完上一篇博客，对这个`instances`的数据就不会陌生了
* `name`是路由配置的名字
* `parent`是父级的`route record`引用，只有当前是`children`中的路由才会有值
* `matchAs`是传递进来的参数，只有别名路由才会有
* `redirect` `beforeEnter` `meta`都是从`route`上直接读取的配置数据
* `props`本质上也是要从`route`上读取的配置数据，但是做了些额外的处理，也比较好懂

后面还有些处理：
```js
  if (!pathMap[record.path]) {
    pathList.push(record.path)
    pathMap[record.path] = record
  }

  if (name) {
    if (!nameMap[name]) {
      nameMap[name] = record
    } else if (process.env.NODE_ENV !== 'production' && !matchAs) {
      warn(
        false,
        `Duplicate named routes definition: ` +
          `{ name: "${name}", path: "${record.path}" }`
      )
    }
  }
```
这两段实际上就是完成了`pathList nameMap pathMap`这三个数据的关联和填充。在`nameMap`那里，额外做了一些开发提示，最终的作用就是为了检查是否有`name`相同的路由配置，如果有，就给出警告提醒开发者。

以上的一些代码，在一些基础路由配置处理的时候，就已经够了，比如这些：
```js
[
    {
      path: '/',
      component: Index
    },
    {
      path: '/index',
      redirect: '/'
    },
    {
      name: 'list',
      path: '/list',
      component: List
    }
]
```
只要路由配置里面，没有别名和`children`，`addRouteRecord`的其它代码就不会执行。

下面就来看有别名和有`children`的代码处理。先看别名的：
```js
  if (route.alias !== undefined) {
    const aliases = Array.isArray(route.alias) ? route.alias : [route.alias]
    for (let i = 0; i < aliases.length; ++i) {
      const alias = aliases[i]
      if (process.env.NODE_ENV !== 'production' && alias === path) {
        warn(
          false,
          `Found an alias with the same value as the path: "${path}". You have to remove that alias. It will be ignored in development.`
        )
        // skip in dev to make it work
        continue
      }

      const aliasRoute = {
        path: alias,
        children: route.children
      }
      addRouteRecord(
        pathList,
        pathMap,
        nameMap,
        aliasRoute,
        parent,
        record.path || '/' // matchAs
      )
    }
  }
```
如果`route.alias`不为`undefined`，以上代码就会执行。从代码看到，原来`route.alias`是可以配置数组的，并且别名不能与`path`配置相同，而且别名跟`redirect`不一样，别名必须跟`path`一样，是路径字符串，不能写配置为`alis: {name: 'some'}`这种。

最关键就是这段处理：
```js
      const aliasRoute = {
        path: alias,
        children: route.children
      }
      addRouteRecord(
        pathList,
        pathMap,
        nameMap,
        aliasRoute,
        parent,
        record.path || '/' // matchAs
      )
```
当路由配置了别名，就会把所有的别名遍历一遍，挨个调用`addRouteRecord`，也就是把每个别名，都创建额外一条的`route record`。只不过这个创建过程，有两个特殊的地方：
1. `aliasRoute`是这里单独定义的，不是`routes`里面那种配置，只保留了原有的`children`配置，以便`children`也能全部支持别名
2. `record.path || '/'`也就是当前`route record`的路径，被设置为了别名的`route record`的`match as`，猜想一下，在后续路由匹配的时候，如果匹配到了某个路由，发现它有`matchAs`，接下来只要拿`matchAs`，重新做一次路由匹配，就能找到原始的路由了。

正因为以上代码的作用，如果你有这个routes：
```js
[
    {
      path: '/',
      component: Index,
      alias: '/index'
    }
  ]
```
则会生成两条`route record`:
<img src="{% asset_path "03.png" %}">

如果路由配置`chidlren`，则下面的代码会运行：
```js
if (route.children) {
    // Warn if route is named, does not redirect and has a default child route.
    // If users navigate to this route by name, the default child will
    // not be rendered (GH Issue #629)
    if (process.env.NODE_ENV !== 'production') {
      if (
        route.name &&
        !route.redirect &&
        route.children.some(child => /^\/?$/.test(child.path))
      ) {
        warn(
          false,
          `Named Route '${route.name}' has a default child route. ` +
            `When navigating to this named route (:to="{name: '${
              route.name
            }'"), ` +
            `the default child route will not be rendered. Remove the name from ` +
            `this route and use the name of the default child route for named ` +
            `links instead.`
        )
      }
    }
    route.children.forEach(child => {
      const childMatchAs = matchAs
        ? cleanPath(`${matchAs}/${child.path}`)
        : undefined
      addRouteRecord(pathList, pathMap, nameMap, child, record, childMatchAs)
    })
  }
```
中间那段是为了应对下面这种配置场景：
```js
    {
      name: 'detail',
      path: '/detail/:id',
      component: Detail,
      children: [
        {
          name: 'detail_more',
          path: '',
          components: {
            bar: () => import(/* webpackChunkName: "group-bar" */ '../pages/Bar.vue')
          }
        }
      ]
    }
```
`detail_more`是一个`path`为空的子路由，可被看成是`detail`的默认路由，当在app中使用`{name: 'detail'}`的方式访问时，这个情形下，尽管`detail_more`是`detail`的默认路由，它对应的component也不会被渲染，所以`vue-router`给出了开发期间的警告提醒。可以改用`{name: 'detail_more'}`的方式访问。

接下来这段:
```js
    route.children.forEach(child => {
      const childMatchAs = matchAs
        ? cleanPath(`${matchAs}/${child.path}`)
        : undefined
      addRouteRecord(pathList, pathMap, nameMap, child, record, childMatchAs)
    })
```
主要是那个`childMatchAs`的处理，当`matchAs`为空的时候，上面的代码是很好理解的，就是遍历`children`，挨个创建`route record`的过程。假如有`matchAs`，说明当前是正在进行别名的`route record`的创建过程，而且这个别名路由，还是有一个有`children`的别名路由。 假如这个`route`是这样的：
```js
    {
      name: 'detail',
      path: '/detail/:id',
      component: Detail,
      alias: ['/query/:id'],
      children: [
        {
          name: 'detail_more',
          path: 'more',
          components: {
            bar: () => import(/* webpackChunkName: "group-bar" */ '../pages/Bar.vue')
          }
        }
      ]
    }
```
最终一共会添加4条路由，非别名的路由两条，其中1条是另外1条的子路由；别名的路由也是2条，其中1条是另外1条的子路由:
<img src="{% asset_path "04.png" %}">
`childMatchAs`的作用，就是让`children`里的路由，也有了别名，比如`/detail/:id/more`会有一条`/query/:id/more`。

（完）