---
title: vue-router源码：create-matcher
tags:
  - Vue
  - vue-router
  - vue-router源码
categories:
  - Javascript
  - Vue
  - vue-router
date: 2020-04-08 14:58:24
---



vue-router源码解析系列。这是第三篇。本篇介绍源码中的`create-matcher.js`，它在`vue-router`中的作用是构造一个`matcher`对象，这个`matcher`对象的能力主要是两方面：一是进行路由匹配，二是动态添加路由定义。本系列解析的是官方git库中3.1.6的版本源码。
<!-- more -->
源码链接：[create-matcher.js](/code/vue-router/source-code/create-matcher.js)。源码里面用的是typescript，但是不影响阅读。

## matcher对象的使用时机
在`vue-router`的[类文件](/code/vue-router/source-code/index.js)中，可以看到`create-matcher`是在`vue-router`的构造函数中就被调用的（下面的第8行）：
```js
  constructor (options: RouterOptions = {}) {
    this.app = null
    this.apps = []
    this.options = options
    this.beforeHooks = []
    this.resolveHooks = []
    this.afterHooks = []
    this.matcher = createMatcher(options.routes || [], this)

    let mode = options.mode || 'hash'
    this.fallback = mode === 'history' && !supportsPushState && options.fallback !== false
    if (this.fallback) {
      mode = 'hash'
    }
    if (!inBrowser) {
      mode = 'abstract'
    }
    this.mode = mode

    switch (mode) {
      case 'history':
        this.history = new HTML5History(this, options.base)
        break
      case 'hash':
        this.history = new HashHistory(this, options.base, this.fallback)
        break
      case 'abstract':
        this.history = new AbstractHistory(this, options.base)
        break
      default:
        if (process.env.NODE_ENV !== 'production') {
          assert(false, `invalid mode: ${mode}`)
        }
    }
  }
```

## create-matcher文件的基本结构
```js
/* @flow */
import { resolvePath } from './util/path'
import { assert, warn } from './util/warn'
import { createRoute } from './util/route'
import { fillParams } from './util/params'
import { createRouteMap } from './create-route-map'
import { normalizeLocation } from './util/location'

export function createMatcher (
  routes: Array<RouteConfig>,
  router: VueRouter
): Matcher {
  const { pathList, pathMap, nameMap } = createRouteMap(routes)

  function addRoutes (routes) {
    createRouteMap(routes, pathList, pathMap, nameMap)
  }

  function match (
    raw: RawLocation,
    currentRoute?: Route,
    redirectedFrom?: Location
  ): Route {
   // ...省略很多代码 
  }
   // ...省略很多代码 

  return {
    match,
    addRoutes
  }
}
```
这个文件对外`export`了一个`createMatcher`函数，这个函数在`vue-router`的构造函数中被调用，将会返回一个包含两个方法：`match`和`addRoutes`的对象。

`addRoutes`比较简单，就是再次调用上一篇博客里面介绍的`create-route-map`的功能，用来进行路由配置的动态添加。

`match`方法是本篇学习的重点内容。

顶部有一堆的`import`这些`import`进来的接口，都有各自的作用，在学习`match`方法的过程中，涉及到哪个就会进入该接口学习。

从`create-matcher`的源码能看到，`createMatcher`函数执行时，所执行的代码实际上只有2条：
```js
  const { pathList, pathMap, nameMap } = createRouteMap(routes)

  return {
    match,
    addRoutes
  }
```
其它都是函数定义。第一行代码，就是根据`routes`的配置，解析出所有的路由对象`RouteRecord`，然后用`pathList pathMap nameMap`三个不同的结构来存储，在上一篇博客中有学习。这三个变量，会被`createMatcher`这个闭包所持有，当外部利用`addRoutes`动态添加路由配置时，他们三个还会被重复用到。

## match函数的解析
这是match的源码：
```js
function match (
    raw: RawLocation,
    currentRoute?: Route,
    redirectedFrom?: Location
  ): Route {
    const location = normalizeLocation(raw, currentRoute, false, router)
    const { name } = location

    if (name) {
      const record = nameMap[name]
      if (process.env.NODE_ENV !== 'production') {
        warn(record, `Route with name '${name}' does not exist`)
      }
      if (!record) return _createRoute(null, location)
      const paramNames = record.regex.keys
        .filter(key => !key.optional)
        .map(key => key.name)

      if (typeof location.params !== 'object') {
        location.params = {}
      }

      if (currentRoute && typeof currentRoute.params === 'object') {
        for (const key in currentRoute.params) {
          if (!(key in location.params) && paramNames.indexOf(key) > -1) {
            location.params[key] = currentRoute.params[key]
          }
        }
      }

      location.path = fillParams(record.path, location.params, `named route "${name}"`)
      return _createRoute(record, location, redirectedFrom)
    } else if (location.path) {
      location.params = {}
      for (let i = 0; i < pathList.length; i++) {
        const path = pathList[i]
        const record = pathMap[path]
        if (matchRoute(record.regex, location.path, location.params)) {
          return _createRoute(record, location, redirectedFrom)
        }
      }
    }
    // no match
    return _createRoute(null, location)
  }
```
这份代码看似简单，实际上背后依托的代码非常多，分为以下几个点来解析：
* `normalizeLocation`的解析
* 没有`name`定义的路由匹配解析，也就是第34-40行
* 有`name`定义的路由匹配解析，也就是第10-32行
* `_createRoute`的解析
* 参数部分的解析，也就是第2-4行

### `normalizeLocation`的解析
[normalizeLocation](/code/vue-router/source-code/util/location.js)的基本结构:
```js
export function normalizeLocation (
  raw: RawLocation,
  current: ?Route,
  append: ?boolean,
  router: ?VueRouter
): Location {
 
  return {
    _normalized: true,
    path,
    query,
    hash
  }
}
```
这个函数的作用是对`RawLocation`的数据进行正规化处理，返回一个对象，主要包含`path query hash`三份数据，这三份数据在一个app中，是非常核心的三个与访问地址有关的数据，另外这个返回值有一个`_normalized`属性，用来标识它是否已经是做过`normalize`处理。

这个函数接收4个参数：
* 必要参数：raw: RawLocation, 要进行正规化处理的原始数据
* 可选参数：current: ?Route, 当前的路由对象
* 可选参数：append: ?boolean, 是否为追加模式，与`path`解析相关，主要是给`router-link`提供的
* 可选参数：router: ?VueRouter，`vue-router`的实例对象

从接触`vue-router`源码有一段时间了，我发现了`typescript`的好处，通过参数类型、返回值类型，我们看到一份变量，就能知道这份变量是哪个位置产生的。 目前为止，我认为`vue-router`有以下的一些核心类型值得有一个准确的认知:
* RouteConfig 这个代表的就是使用`vue-router`时`routes`这个数组中的每一个条目的数据类型
* RouteRecord 这个代表的就是`create-route-map`这个源码中主要创建出的数据，它是根据`RouteConfig`创建出来的，能够代表一条路由配置的对象
* VueRoute 这个类型代表`vue-router`自己
* RawLocation 这个类型代表了要进行路由匹配的原始对象，它也是`match`函数和`normalizeLocation`函数的第一个参数的类型，下一部分主要介绍这个类型几种数据形式。
* Location 这个类型是`normalizeLocation`函数的返回值类型
* Route 这个类型就是我们在开发中经常打交道的那个路由对象的数据类型

从上到下，可以看到一个路由数据在`vue-router`的数据变化的流程。

在学习`normalizeLocation`之前，了解`RawLocation`有哪些使用形式是有必要的，主要有：
* 包含`name`，不含`path`的对象，如`{name: 'detail', params: {id: 1}}`
* 不含`path`和`name`，但是含有`params`的对象，这种路由形式用来进行仅params发生变化的相对路由，如`{params: {id: 1}}`
* 字符串形式，如`'/'`，就是直接用路径进行路由的场景
* 不含`name`，含`path`的对象，如`{path: '/detail', query: {id: 1}}`

接下来对normalizeLocation的解析，我就直接写到注释里面了：
```js
export function normalizeLocation (
  raw: RawLocation,
  current: ?Route,
  append: ?boolean,
  router: ?VueRouter
): Location {
  // 判断了raw为字符串的场景
  // 比如 this.$router.push('/detail')这种
  // 直接转换为一个含`path`的对象再进行后续处理
  let next: Location = typeof raw === 'string' ? { path: raw } : raw
  // named target
  if (next._normalized) {
    // 如果raw是一个对象，则next就是raw
    // 如果raw含有_normalized，就没有后续处理
    return next
  } else if (next.name) {
    // 如果raw是一个含name的对象 就会进入这个分支处理

    // 拷贝了raw到一个新对象
    next = extend({}, raw)
    const params = next.params
    if (params && typeof params === 'object') {
      // 拷贝params 
      next.params = extend({}, params)
    }

    // 这里直接返回了没有后续处理
    return next
  }

  // relative params
  // 这里就是处理相对路由，如this.$router.push({params: {id: 2}})
  // 但是相对路由比较严格的
  // 1. next不含path
  // 2. next不含name，有name就不会执行到这
  // 3. 必须有current，current是谁？Route对象
  // 4. next必须含params
  // 为什么一定要有current?没有current，怎么叫相对路由呢？
  if (!next.path && next.params && current) {
    next = extend({}, next)
    // 设置_normalized
    next._normalized = true
    const params: any = extend(extend({}, current.params), next.params)
    if (current.name) {
      // 这个分支处理的是current有name的情况
      // 比较简单，有name的话，外面的match函数，走含name的路由匹配逻辑就行了
      next.name = current.name
      next.params = params
    } else if (current.matched.length) {
      // 进入到这里，说明current没有name
      // 那就麻烦点了，必须找到current的path才行

      // 这行代码比较关键
      // current.matched[current.matched.length - 1]
      // 它得到的是一个RouteRecord对象，实际上就是
      // 与当前访问地址所匹配的那个RouteRecord对象
      // 拿到这个对象，就可以拿到它的path属性
      // 这个path属性，是经过path-to-regexp处理过得到的正则表达式
      // 为什么current.matched.length - 1这个位置的就是
      // 当前访问地址对应的RouteRecord对象呢？
      // 这个在本篇后面的其它源码会有解析
      const rawPath = current.matched[current.matched.length - 1].path

      // 下面这行代码构造next.path
      // fillParams就是来完成这个构造的
      // fillParams简单来说，第一个参数是RouteRecord的正则表达式path
      // 第二个参数是一个对象，用来填充正则表达式中的命名参数
      // fillParams内部的核心逻辑是在使用path-to-regexp的compile功能
      // 详见：https://github.com/pillarjs/path-to-regexp#compile-reverse-path-to-regexp
      next.path = fillParams(rawPath, params, `path ${current.path}`)
    } else if (process.env.NODE_ENV !== 'production') {
      warn(false, `relative params navigation requires a current route.`)
    }
    return next
  }

  // 调用parsePath对path进行解析，
  // 它会返回一个对象，包含path query hash三个部分
  // 比如 next.path是'/some/detail?id=1&name=2#abc
  // 那么parsedPath就是： {path: '/some/detail', query: 'id=1&name=2', hash: '#abc'}
  // 非常像window.location.pathname window.location.search window.location.hash
  const parsedPath = parsePath(next.path || '')

  // 以当前路由的path作为basePath
  const basePath = (current && current.path) || '/'

  // 这个主要是为了对parsedPath.path作resolvePath的处理
  // resolvePath是为了处理相对路径用的，它会把相对路径变为绝对路径
  // 比如next.path: '../../detail?id=1#abc'
  // 如果next.path是一个/开头的路径，resolvePath是不会处理的
  // 注意append || next.append这个用法
  // resolvePath的第三个参数，首先是以normalizeLocation的第三个参数为准，它为falsy，才会降级使用
  // next.append，那这个又是哪里会用呢？
  // 比如<router-link :to="../a/c" append></router-link> 或者是this.$router.push({path: '../a', append: true})
  const path = parsedPath.path
    ? resolvePath(parsedPath.path, basePath, append || next.append)
    : basePath

  // resolveQuery是把querystring变为一个js对象用的
  const query = resolveQuery(
    parsedPath.query,
    next.query,
    router && router.options.parseQuery
  )

  let hash = next.hash || parsedPath.hash
  if (hash && hash.charAt(0) !== '#') {
    hash = `#${hash}`
  }

  // 经过前面的处理，path query hash就都经过vue-router内部的标准化处理了
  // 最终得到一个包含path query hash的Location对象
  return {
    _normalized: true,
    path,
    query,
    hash
  }
}
```
注释里面包含了很多重要的解析，`normalizeLocation`引用到了其他的一些源码：
* fillParams
* parsePath
* resolvePath
* resolveQuery

下面一一解析。
#### fillParams
[源码文件](/code/vue-router/source-code/util/params.js)
```js
import { warn } from './warn'
import Regexp from 'path-to-regexp'

// $flow-disable-line
const regexpCompileCache: {
  [key: string]: Function
} = Object.create(null)

export function fillParams (
  path: string,
  params: ?Object,
  routeMsg: string
): string {
  params = params || {}
  try {
    const filler =
      regexpCompileCache[path] ||
      (regexpCompileCache[path] = Regexp.compile(path))

    // Fix #2505 resolving asterisk routes { name: 'not-found', params: { pathMatch: '/not-found' }}
    // and fix #3106 so that you can work with location descriptor object having params.pathMatch equal to empty string
    if (typeof params.pathMatch === 'string') params[0] = params.pathMatch

    return filler(params, { pretty: true })
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      // Fix #3072 no warn if `pathMatch` is string
      warn(typeof params.pathMatch === 'string', `missing param for ${routeMsg}: ${e.message}`)
    }
    return ''
  } finally {
    // delete the 0 if it was added
    delete params[0]
  }
}
```
这段代码其实不难理解，如果你学过`path-to-regexp`的[用法](https://github.com/pillarjs/path-to-regexp#compile-reverse-path-to-regexp)的话。不过我才发现`vue-router`用的`path-to-regexp`还是1.7的版本，而它现在已经是6.x的版本了，所以如果你学最新的`path-to-regexp`，会跟`vue-router`里看到的用法有差异。

上面值得重点解析的是`pathMatch`的作用，这个作用，要跟`vue-router`的官方文档联系起来，才能知道它的用途：
<img src="{% asset_path "01.png" %}" width="800">

假设有一个这样的路由配置：
```js
    {
      path: '/index/*',
      component: Index,
      name: 'index'
    },
```
然后这样跳转路由：
```js
      this.$router.push({
        name: 'index',
        params: {
          pathMatch: "abc"
        }
      });
```
则可以看到`fillParams`中`pathMatch`如何发挥作用：
<img src="{% asset_path "02.png" %}" width="800">
<img src="{% asset_path "03.png" %}" width="300">

说白了`pathMatch`是`vue-router`为了与`path-to-regexp`搭配使用用到的一个属性，在`vue-router`中，它代表的是与`通配符`所匹配的部分，而`path-to-regexp`里面，需要用`0`来表示这个部分。


#### parsePath
比较简单：
```js
/**
 * 解析出一个路径中的querystring hash pathname三个信息
 * 如 /list?id=1#abc
 * 最终query: id=1
 * hash: #abc
 * path: /list
 * @param {*} path 
 */
export function parsePath (path: string): {
  path: string;
  query: string;
  hash: string;
} {
  let hash = ''
  let query = ''

  const hashIndex = path.indexOf('#')
  if (hashIndex >= 0) {
    hash = path.slice(hashIndex)
    path = path.slice(0, hashIndex)
  }

  const queryIndex = path.indexOf('?')
  if (queryIndex >= 0) {
    query = path.slice(queryIndex + 1)
    path = path.slice(0, queryIndex)
  }

  return {
    path,
    query,
    hash
  }
}
```
#### resolvePath
```js
/**
 * 这个函数用来解析路径
 * 绝对路径会直接返回
 * 它的主要作用是解析相对路径
 * @param {*} relative 
 * @param {*} base 
 * @param {*} append 
 */
export function resolvePath (
  relative: string,
  base: string,
  append?: boolean
): string {
  const firstChar = relative.charAt(0)
  // 判断如果是绝对路径直接就返回了
  if (firstChar === '/') {
    return relative
  }

  // 如果relative是query或hash的形式
  // 如： ?a=1  #abc
  // 则直接把base 和 relative拼接起来
  // 这个反映的是访问地址不变，只是参数和hash发生变化的那种路由
  if (firstChar === '?' || firstChar === '#') {
    return base + relative
  }

  const stack = base.split('/')

  // remove trailing segment if:
  // - not appending
  // - appending to trailing slash (last segment is empty)

  // a/b/c/ 这个串被split后stack[stack.length - 1]为
  // ['a','b','c',''] 最后一个空的会被去掉
  // 非append模式，也会把最后一个去掉，差异在哪？
  // base=a/b/c,relative=d,
  // 如果append为真，则最后拼接为a/b/c/d，
  // 如果append为假，则拼接为a/b/d
  // 也就是说非append模式会把base的最后一层给去掉
  if (!append || !stack[stack.length - 1]) {
    stack.pop()
  }

  // resolve relative path
  const segments = relative.replace(/^\//, '').split('/')
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    if (segment === '..') {
      // '..'代表一个上层目录，遇到一个这个，就要把stack的最后一个目录给弹出
      stack.pop()
    } else if (segment !== '.') {
      // '.'代表当前目录，遇到一个，就表示继续在当前的目录后面构造路径
      stack.push(segment)
    }
  }

  // ensure leading slash
  // 保证最终函数返回的路径前面有/
  if (stack[0] !== '') {
    stack.unshift('')
  }

  return stack.join('/')
}
```
把上面这个函数放到浏览器控制台运行，就可以在控制台测试了，示例如下：
<img src="{% asset_path "04.png" %}" width="500">


#### resolveQuery
```js
const encodeReserveRE = /[!'()*]/g
const encodeReserveReplacer = c => '%' + c.charCodeAt(0).toString(16)
const commaRE = /%2C/g

// 原版注释说的比较清楚了
// fixed encodeURIComponent which is more conformant to RFC3986:
// - escapes [!'()*]
// - preserve commas
const encode = str => encodeURIComponent(str)
  .replace(encodeReserveRE, encodeReserveReplacer)
  .replace(commaRE, ',')

const decode = decodeURIComponent

// 这个函数比较简单
export function resolveQuery (
  query: ?string,
  extraQuery: Dictionary<string> = {},
  _parseQuery: ?Function
): Dictionary<string> {
  const parse = _parseQuery || parseQuery
  let parsedQuery
  try {
    parsedQuery = parse(query || '')
  } catch (e) {
    process.env.NODE_ENV !== 'production' && warn(false, e.message)
    parsedQuery = {}
  }
  for (const key in extraQuery) {
    parsedQuery[key] = extraQuery[key]
  }
  return parsedQuery
}

function parseQuery (query: string): Dictionary<string> {
  const res = {}

  query = query.trim().replace(/^(\?|#|&)/, '')

  if (!query) {
    return res
  }

  query.split('&').forEach(param => {
    const parts = param.replace(/\+/g, ' ').split('=')
    const key = decode(parts.shift())
    const val = parts.length > 0
      ? decode(parts.join('='))
      : null

    if (res[key] === undefined) {
      res[key] = val
    } else if (Array.isArray(res[key])) {
      res[key].push(val)
    } else {
      res[key] = [res[key], val]
    }
  })

  return res
}
```
<img src="{% asset_path "05.png" %}" width="500">

#### 小结
`normalizeLocation`是进行路由匹配的前置工作，它会准备好路由匹配时所需要的`params query hash path`这四个非常关键的信息，只有这些信息明确了，下一步做匹配才能准确地处理。

### 有`name`定义的路由匹配解析
下面就开始看`match`的代码，首先是这段：
```js
    // 调用normalizeLocation处理raw
    const location = normalizeLocation(raw, currentRoute, false, router)
    // 尝试结构name属性
    const { name } = location

    // 处理name有值的情况
    if (name) {
      // 直接从nameMap解析出RouteRecord对象：record变量
      // nameMap是create-route-map这个源码中创建出的数据
    
      const record = nameMap[name]
      if (process.env.NODE_ENV !== 'production') {
        warn(record, `Route with name '${name}' does not exist`)
      }
      // record为空，则创建一个空的Route对象
      if (!record) return _createRoute(null, location)

      // record.regex拿到的是经过path-to-regexp处理过的RouteConfig上的path正则表达式
      // record.regex.keys也是path-to-regexp处理后才有的，命名参数的数组
      // filter(key=>!key.optional)去掉可选参数
      // paramNames得到的是record这个路由中定义的动态参数名数组
      const paramNames = record.regex.keys
        .filter(key => !key.optional)
        .map(key => key.name)

      if (typeof location.params !== 'object') {
        location.params = {}
      }

      // 底下这一段把currentRoute上有的动态参数，但是这些参数不在paramNames中，给复制出来
      // 为什么要有这个呢？对于那种有chidren配置的routes非常有用
      // 假如当前匹配的路径是 /list/:type 已经有一个参数type
      // 即将匹配的是路径是一个子路由，比如 /list/:type/detail/:id， 显然这个子路由需要把父路径中的参数type
      // 给同步进来，这样匹配的路由就包含type和id两个参数了
      if (currentRoute && typeof currentRoute.params === 'object') {
        for (const key in currentRoute.params) {
          if (!(key in location.params) && paramNames.indexOf(key) > -1) {
            location.params[key] = currentRoute.params[key]
          }
        }
      }

      // 这一步是构造path
      // 调用的是normalizeLocation里面学过的fillParams函数
      // 为什么要调用？因为根据name匹配的路由，实际上没有和当前访问的路径关联
      // 拿到的record.path也只是一个正则表达式，不是真正的访问地址
      // 所以需要用fillParams填充到record.path里面，得到一个真正的访问地址
      location.path = fillParams(record.path, location.params, `named route "${name}"`)

      // 调用_createRoute来创建Route对象来完成路由匹配
      return _createRoute(record, location, redirectedFrom)
    } 
```
这部分要点都写在注释里面了，还有一个点`_createRoute`在后面的部分会介绍。

### 没有`name`定义的路由匹配解析
源码部分：
```js
    if(name) {
        // 省略
    } else if (location.path) {
       // 如果前面normalizeLocation返回的Location数据有path
       // 则会进入这个分支
      location.params = {}
     // 这个for循环遍历的是谁？
     // 是pathList
     // pathList是create-route-map在另外一个角度构造的RouteRecord数组
     // for循环按照先后循序，对location.path进行匹配
     // 这就是vue-router官方文档中解释的路由匹配的优先级是按照RouteConfig的先后关系来处理的根本原因
      for (let i = 0; i < pathList.length; i++) {
        const path = pathList[i]
        const record = pathMap[path]
        // 通过matchRoute这个函数来判断当前遍历的RouteRecord是否与location.path匹配，
        // 如果匹配则会调用_createRoute来创建Route对象
        // matchRoute还有另外一个作用，就是会解析出location.path里面的动态参数的值，然后放到location.params对象里面
        // 所以matchRoute调用时，第三个参数传入的是location.params
        if (matchRoute(record.regex, location.path, location.params)) {
          return _createRoute(record, location, redirectedFrom)
        }
      }
    }
```
#### matchRoute
源码部分：
```js
function matchRoute (
  regex: RouteRegExp,
  path: string,
  params: Object
): boolean {
  const m = path.match(regex)

  if (!m) {
    return false
  } else if (!params) {
    // 这个分支似乎没有可能被执行 matchRoute函数只在当前文件中被调用，且只存在一处调用
    // 而该处必传params
    return true
  }

  for (let i = 1, len = m.length; i < len; ++i) {
    const key = regex.keys[i - 1]
    // 为什么要加 typeof m[i] === 'string' 呢
    // 从正则match出来的，难道还会有非string的东西吗
    const val = typeof m[i] === 'string' ? decodeURIComponent(m[i]) : m[i]
    if (key) {
      // Fix #1994: using * with props: true generates a param named 0
      // 如果路由的path中用了*号，则*号会被path-to-regxp生成一个名为0的参数
      // 参考官方文档：https://github.com/pillarjs/path-to-regexp/tree/v1.7.0#asterisk
      params[key.name || 'pathMatch'] = val
    }
  }

  return true
}
```
这个`matchRoute`里面对`params`的处理，跟`fillParams`有点相反的味道，那边是需要传入`{params: {pathMatch: 'aa'}}`，这样就能把正则表达式里面的通配符，替换为`pathMatch`所对应的值；而`matchRoute`里面，当`key.name ===  0`时，则是在`params`中添加一个名为`pathMatch`的数据。
```js
params[key.name || 'pathMatch'] = val
```
为什么`key.name`会为0？这也是跟`path-to-regexp`有关，它会把通配符解析为一个`named 0`的参数，在`regex.keys`中可以看到这个。
调试示意，下面的调试中最终params会变为`{pathMatch: 'abc'}`:
<img src="{% asset_path "06.png" %}" width="800">

`pathMatch`有什么好处呢？在app中通过`this.$route.params.pathMatch`就能拿到通配符匹配的路径部分了。

### _createRoute的解析
`_createRoute`是创建Route对象的入口：
```js
  function _createRoute (
    record: ?RouteRecord,
    location: Location,
    redirectedFrom?: Location
  ): Route {
    if (record && record.redirect) {
      return redirect(record, redirectedFrom || location)
    }
    if (record && record.matchAs) {
      return alias(record, location, record.matchAs)
    }
    return createRoute(record, location, redirectedFrom, router)
  }
```
源码其实很简单。 它是分三个逻辑来走的，分别是：
* 正常的
* 带别名的
* 带重定向的

#### 正常的
这种直接就进入
```js
return createRoute(record, location, redirectedFrom, router)
```
重点就是学习`createRoute`这个函数，这个函数的作用是构造Route对象，相关的代码解析如下：
```js
import { stringifyQuery } from './query'

const trailingSlashRE = /\/?$/

// 注意这几个参数的类型
// 之前的代码分析都已经学过了
export function createRoute (
  record: ?RouteRecord,
  location: Location,
  redirectedFrom?: ?Location,
  router?: VueRouter
): Route {
  // stringifyQuery是前面resolveQuery的逆操作
  // resolveQuery把querystring变为对象
  // stringifyQuery把对象变为querystring
  const stringifyQuery = router && router.options.stringifyQuery

  let query: any = location.query || {}
  try {
    query = clone(query)
  } catch (e) {}

  // 下面几个数据属性应该都很熟悉
  // 只要vue-router用的多的话
  const route: Route = {
    name: location.name || (record && record.name),
    meta: (record && record.meta) || {},
    path: location.path || '/',
    hash: location.hash || '',
    query,
    params: location.params || {},
    fullPath: getFullPath(location, stringifyQuery),//构造出带querystring和hash的全路径
    matched: record ? formatMatch(record) : [] // formatMatch很关键，matched是Route对象上用来存储所匹配的RouteRecord对象的数组
  }
  if (redirectedFrom) {
    // 重定向的路由会进入这里
    // 看到route.redirectedFrom也是一个带querystring和hash的全路径
    route.redirectedFrom = getFullPath(redirectedFrom, stringifyQuery)
  }
  // 最后返回一个被freeze的对象，就是最终的Route对象
  return Object.freeze(route)
}

// 深层拷贝
function clone (value) {
  if (Array.isArray(value)) {
    return value.map(clone)
  } else if (value && typeof value === 'object') {
    const res = {}
    for (const key in value) {
      res[key] = clone(value[key])
    }
    return res
  } else {
    return value
  }
}

// the starting route that represents the initial state
export const START = createRoute(null, {
  path: '/'
})

// 对于嵌套子路由来说，子路由匹配到的RouteRecord除了自己，还有上级的
// formatMatch构造出了一个数组，通过record与parent record的关系
// 按照嵌套关系，把子路由关联的所有RouteRecord存到了数组里面
function formatMatch (record: ?RouteRecord): Array<RouteRecord> {
  const res = []
  while (record) {
    res.unshift(record)
    record = record.parent
  }
  return res
}

function getFullPath (
  { path, query = {}, hash = '' },
  _stringifyQuery
): string {
  const stringify = _stringifyQuery || stringifyQuery
  return (path || '/') + stringify(query) + hash
}
```
`formatMatch`构造出的这个数组，第一元素一定是嵌套路由中最顶层的那个路由对应的RouteRecord对象，而最后一个则代表当前匹配的路由所对应的RouteRecord。这就是其他代码里，为啥总是用`route.matched[route.matched.length - 1]`来查找当前route对应的`RouteRecord`的原因。

`stringifyQuery`源码：
```js
export function stringifyQuery (obj: Dictionary<string>): string {
  const res = obj ? Object.keys(obj).map(key => {
    const val = obj[key]

    if (val === undefined) {
      return ''
    }

    if (val === null) {
      return encode(key)
    }

    if (Array.isArray(val)) {
      const result = []
      val.forEach(val2 => {
        if (val2 === undefined) {
          return
        }
        if (val2 === null) {
          result.push(encode(key))
        } else {
          result.push(encode(key) + '=' + encode(val2))
        }
      })
      return result.join('&')
    }

    return encode(key) + '=' + encode(val)
  }).filter(x => x.length > 0).join('&') : null
  return res ? `?${res}` : ''
}
```
#### 带别名的
这种走的是：
```js
    if (record && record.matchAs) {
      return alias(record, location, record.matchAs)
    }
```
`record.matchAs`实际上就是当前这个路由，真正匹配到的路由，所对应的path regexp。在学习`create-route-map`了解了`routeRecord`的构造之后，就知道matchAs是个啥了。
```js
  function alias (
    record: RouteRecord,
    location: Location,
    matchAs: string
  ): Route {
    // 用params填充matchAs，得到真正的访问路径
    const aliasedPath = fillParams(matchAs, location.params, `aliased route with path "${matchAs}"`)
    // 再用aliasedPath做一次match
    const aliasedMatch = match({
      _normalized: true,
      path: aliasedPath
    })
    if (aliasedMatch) {
      const matched = aliasedMatch.matched
      const aliasedRecord = matched[matched.length - 1]
      location.params = aliasedMatch.params
     
      //为啥前面得到了aliasedMatch还要进这个if分支处理呢
      //为了得到aliasedRecord
      //然后aliasedRecord和location来创建最终的Route对象
      //这个Route对象的与aliasedMatch的主要区别就是
      //这个Route对象内的path信息，都是跟浏览器当前访问地址一致的，而aliasedMatch内的是不一致的
      //这就是vue-router官方文档所说的：
      // /a 的别名是 /b，意味着，当用户访问 /b 时，URL 会保持为 /b，但是路由匹配则为 /a，就像用户访问 /a 一样。
      return _createRoute(aliasedRecord, location)
    }
    return _createRoute(null, location)
  }
```
#### 带重定向的
这个场景的进入：
```js
    if (record && record.redirect) {
      //这里为什么是redirectedFrom || location
      //在一开始的时候redirectedFrom肯定是没有的，location将会作为第一层重定向的原始Location对象
      //但是如果有多层重定向呢？
      //要始终维护最开始的那个Location对象作为最终的Route对象创建时需要的那个
      //就要借助于redirect与match函数，在内部将最原始的location传来传去了
      return redirect(record, redirectedFrom || location)
    }
```
`redirect`对应的源码：
```js
  function redirect (
    record: RouteRecord,
    location: Location
  ): Route {
    
    //从下面两行代码可以看到routes配置中，redirect是可以配置为函数的
    const originalRedirect = record.redirect
    let redirect = typeof originalRedirect === 'function'
      ? originalRedirect(createRoute(record, location, null, router))
      : originalRedirect

    if (typeof redirect === 'string') {
      redirect = { path: redirect }
    }

    if (!redirect || typeof redirect !== 'object') {
      if (process.env.NODE_ENV !== 'production') {
        warn(
          false, `invalid redirect option: ${JSON.stringify(redirect)}`
        )
      }
      return _createRoute(null, location)
    }

    const re: Object = redirect
    const { name, path } = re
    let { query, hash, params } = location
    // 从这里可以看到，重定向的时候，query hash params如果在redirect配置时有，
    // 也会取代当前的location中对应的数据
    query = re.hasOwnProperty('query') ? re.query : query
    hash = re.hasOwnProperty('hash') ? re.hash : hash
    params = re.hasOwnProperty('params') ? re.params : params

    if (name) {
      // 下面比较简单，就是通过nameMap找到重定向的目标RouterRecord
      // 再做一次match

      // resolved named direct
      const targetRecord = nameMap[name]
      if (process.env.NODE_ENV !== 'production') {
        assert(targetRecord, `redirect failed: named route "${name}" not found.`)
      }

      // 注意match的四个参数是location，不是空值了
      // 所以这次match如果还遇到重定向，那_createRoute里面的redirectFrom就有值
      return match({
        _normalized: true,
        name,
        query,
        hash,
        params
      }, undefined, location)
    } else if (path) {
      // 1. resolve relative redirect
      // resolveRecordPath内部还是在调用resolvePath
      // 但是调用resolvePath的第二个参数 也就是那个base参数，是用record.parent.path
      // 说明重定向的path，如果是相对路径的话，是根据record.parent.path来进行相对的
      // 当然前提是record.parent是存在的
      const rawPath = resolveRecordPath(path, record)
      // 2. resolve params
      const resolvedPath = fillParams(rawPath, params, `redirect route with path "${rawPath}"`)
      // 3. rematch with existing query and hash
      return match({
        _normalized: true,
        path: resolvedPath,
        query,
        hash
      }, undefined, location)
    } else {
      if (process.env.NODE_ENV !== 'production') {
        warn(false, `invalid redirect option: ${JSON.stringify(redirect)}`)
      }
      return _createRoute(null, location)
    }
  }

function resolveRecordPath (path: string, record: RouteRecord): string {
  return resolvePath(path, record.parent ? record.parent.path : '/', true)
}
```
注意，`recorde.redirect`的几种情况：
* 字符串，如 `{redirect: '/'}`
* 对象，如 `{redirect: {name: 'index'}}`或`{redirect: {path: '/'}}`
* 函数，如 `{redirect: function(){ return {name: 'index'} }}`

### 参数部分的解析
回看`match`函数的参数部分：
```js
  function match (
    raw: RawLocation,
    currentRoute?: Route,
    redirectedFrom?: Location
  )
```
第三个参数其实只有在`redirect`场景中才会存在，而且只有在发生`redirect`导致进入了`redirect`函数，在`redirect`函数内部再次发生`match`调用时，才会有值。看了`vue-router`其它所有的代码，有依赖`match`函数的地方， 直接调用`match`时，第三个参数都是不传的。