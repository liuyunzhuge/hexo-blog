---
title: vue-router源码：History.js
tags:
  - Vue
  - vue-router
  - vue-router源码
categories:
  - Javascript
  - Vue
  - vue-router
date: 2020-04-09 23:04:02
---

vue-router源码解析系列。这是第六篇。本篇介绍源码中的`History.js`，它是`vue-router`框架路由跳转的核心，属于重点内容。本系列解析的是官方git库中3.1.6的版本源码。

<!-- more -->
源码链接：[History.js](/code/vue-router/source-code/history/base.js)。源码里面用的是typescript，但是不影响阅读。
本篇学习的`History.js`，是`History`类的基类，在上上篇博客里面看到，`vue-router`分了好几个mode：`hash html5 abstract`，每个mode有一个子类。核心的功能，都是在基类中完成的，子类只对特定的方法做了覆盖，掌握基类里面的代码逻辑才是重点。

## 代码结构
以下是`History`类的结构，不算很复杂，实例属性和实例方法都不多：
```js
export class History {
  // Router实例
  router: Router 
  // 参考vue-router官方文档中对base这个option的技术
  base: string
  // 当前的路由对象
  current: Route
  // 正在处理的路由对象
  pending: ?Route
  // 这个回调函数会通过this.listen注册
  // 在Router类中可以看到它
  // UI更新是通过这个触发的
  cb: (r: Route) => void
  // 状态变量，是否已初始化好
  ready: boolean
  // 初始化成功时的回调函数数组
  readyCbs: Array<Function>
  // 初始化失败时的回调函数数组
  readyErrorCbs: Array<Function>
  // 路由失败时的回调函数数组
  errorCbs: Array<Function>

  // 以下几个都是子类来实现的
  // implemented by sub-classes
  +go: (n: number) => void
  +push: (loc: RawLocation) => void
  +replace: (loc: RawLocation) => void
  // 这个的作用是：更改浏览器地址，都在子类中实现
  +ensureURL: (push?: boolean) => void
  // 这个的作用是：从浏览器地址中获取当前的路由访问路径，都在子类中实现
  +getCurrentLocation: () => string

  constructor (router: Router, base: ?string) {
    this.router = router
    // 正规化base option
    this.base = normalizeBase(base)
    // start with a route object that stands for "nowhere"
    this.current = START
    this.pending = null
    this.ready = false
    this.readyCbs = []
    this.readyErrorCbs = []
    this.errorCbs = []
  }

  // 注册route updated成功时的回调函数
  // 外部借助这个回调函数更新UI
  listen (cb: Function) {
  }

  // 添加ready相关的回调函数
  onReady (cb: Function, errorCb: ?Function) {
  }

  // 添加失败时的回调函数
  onError (errorCb: Function) {
  }

  // 路由跳转
  transitionTo (
    location: RawLocation,
    onComplete?: Function,
    onAbort?: Function
  ) {
  }
  
  // 确认
  confirmTransition (route: Route, onComplete: Function, onAbort?: Function) {
  }

  // Route对象更新
  // 前面的this.cb会在这里面被调用
  updateRoute (route: Route) {
  }
}
```
一次路由最终走到`updateRoute`的调用堆栈：
<img src="{% asset_path "01.png" %}" width="500">

从中可以看到涉及到的调用还是非常多的，大部分都集中在`history`这个模块里面。

回顾到`router`的源码，`router的push和replace`方法，本质上都是利用`history`的实例方法完成的：
```js
  // 往下5个方法就是路由导航的所有方法
  push (location: RawLocation, onComplete?: Function, onAbort?: Function) {
    // $flow-disable-line
    if (!onComplete && !onAbort && typeof Promise !== 'undefined') {
      return new Promise((resolve, reject) => {
        this.history.push(location, resolve, reject)
      })
    } else {
      this.history.push(location, onComplete, onAbort)
    }
  }

  replace (location: RawLocation, onComplete?: Function, onAbort?: Function) {
    // $flow-disable-line
    if (!onComplete && !onAbort && typeof Promise !== 'undefined') {
      return new Promise((resolve, reject) => {
        this.history.replace(location, resolve, reject)
      })
    } else {
      this.history.replace(location, onComplete, onAbort)
    }
  }
```
所以前面的调用堆栈中，两个push的调用很好理解。在`history`里面，`transitionTo confirmTransition和那些guards的处理`是核心内容。

## 一部分好理解的代码
```js
listen (cb: Function) {
    this.cb = cb
}

onReady (cb: Function, errorCb: ?Function) {
    if (this.ready) {
        cb()
    } else {
        this.readyCbs.push(cb)
        if (errorCb) {
        this.readyErrorCbs.push(errorCb)
        }
    }
}

onError (errorCb: Function) {
    this.errorCbs.push(errorCb)
}
```
以上3个分别是三个实例方法，代码简单，作用也很清晰，无需过多分析。

```js
function normalizeBase (base: ?string): string {
  if (!base) {
    if (inBrowser) {
      // respect <base> tag
      const baseEl = document.querySelector('base')
      base = (baseEl && baseEl.getAttribute('href')) || '/'
      // strip full URL origin
      base = base.replace(/^https?:\/\/[^\/]+/, '')
    } else {
      base = '/'
    }
  }
  // make sure there's the starting slash
  if (base.charAt(0) !== '/') {
    base = '/' + base
  }
  // remove trailing slash
  return base.replace(/\/$/, '')
}
```
以上这个是构造函数中对`base option`进行正规化处理的函数，在未指定`base option`时，它优先尝试去查找页面当中的`<base>`元素，从该元素上面读取base值，剩余逻辑也很简单。

## transitionTo
这个实例方法是路由跳转的入口，不过它在`base.js`里面并没有被直接调用，而是在子类的方法覆盖中才有用到。
```js
  transitionTo (
    location: RawLocation,
    onComplete?: Function,//路由完成时的回调
    onAbort?: Function//路由中断或出错时的回调
  ) {
    // 来了来了！
    // 之前的博客中学到的create-matcher的功能在这里开始用到
    // route变量就是即将要跳转的目标Route对象
    const route = this.router.match(location, this.current)

    // 调用confirmTransition完成跳转
    this.confirmTransition(
      route,
      () => {
        //路由成功

        // 调用this.updateRoute完成路由的更新
        this.updateRoute(route)
        onComplete && onComplete(route)

        // 调用this.ensureURL更新浏览器地址，利用BOM History API(pushstate replacestate hash)
        this.ensureURL()

        // fire ready cbs once
        // 下面仅执行一次
        if (!this.ready) {
          this.ready = true
          this.readyCbs.forEach(cb => {
            cb(route)
          })
        }
      },
      err => {//失败
        if (onAbort) {
          onAbort(err)
        }
        // 下面仅执行一次
        if (err && !this.ready) {
          this.ready = true
          this.readyErrorCbs.forEach(cb => {
            cb(err)
          })
        }
      }
    )
  }

  updateRoute (route: Route) {
    const prev = this.current
    this.current = route
    // 调用this.cb
    // 外部借此回调函数更新UI
    this.cb && this.cb(route)

    // 更新router上注册的所有afterEach守卫
    this.router.afterHooks.forEach(hook => {
      hook && hook(route, prev)
    })
  }
```
在子类`html5.js`中查看`push`这个方法覆盖，可以看到对`transitionTo`的调用：
```js
  // 这个代码解析会在学习`html5.js`中去介绍
  push (location: RawLocation, onComplete?: Function, onAbort?: Function) {
    const { current: fromRoute } = this
    this.transitionTo(location, route => {
      pushState(cleanPath(this.base + route.fullPath))
      handleScroll(this.router, route, fromRoute, false)
      onComplete && onComplete(route)
    }, onAbort)
  }
```

### confirmTransition
这个实例方法比较复杂，源码是：
```js
  confirmTransition (route: Route, onComplete: Function, onAbort?: Function) {
    const current = this.current
    const abort = err => {
      // after merging https://github.com/vuejs/vue-router/pull/2771 we
      // When the user navigates through history through back/forward buttons
      // we do not want to throw the error. We only throw it if directly calling
      // push/replace. That's why it's not included in isError
      if (!isExtendedError(NavigationDuplicated, err) && isError(err)) {
        if (this.errorCbs.length) {
          this.errorCbs.forEach(cb => {
            cb(err)
          })
        } else {
          warn(false, 'uncaught error during route navigation:')
          console.error(err)
        }
      }
      onAbort && onAbort(err)
    }
    if (
      isSameRoute(route, current) &&
      // in the case the route map has been dynamically appended to
      route.matched.length === current.matched.length
    ) {
      this.ensureURL()
      return abort(new NavigationDuplicated(route))
    }

    const { updated, deactivated, activated } = resolveQueue(
      this.current.matched,
      route.matched
    )

    const queue: Array<?NavigationGuard> = [].concat(
      // in-component leave guards
      extractLeaveGuards(deactivated),
      // global before hooks
      this.router.beforeHooks,
      // in-component update hooks
      extractUpdateHooks(updated),
      // in-config enter guards
      activated.map(m => m.beforeEnter),
      // async components
      resolveAsyncComponents(activated)
    )

    this.pending = route
    const iterator = (hook: NavigationGuard, next) => {
      if (this.pending !== route) {
        // pending代表一种路由处理的状态
        // 如果在调用过程pending不再等于外部闭包内的route，说明路由发生了变化
        // 所以原先的route就应该被取消掉
        return abort()
      }
      try {
        // hook就是guard
        // 所以hook的第三个参数，就是guard的第三个参数next
        // 如 beforeEnter: (to, from, next) => {...}
        hook(route, current, (to: any) => {
          if (to === false || isError(to)) {
            // next(false) -> abort navigation, ensure current URL
            this.ensureURL(true)
            abort(to)
          } else if (
            typeof to === 'string' ||
            (typeof to === 'object' &&
              (typeof to.path === 'string' || typeof to.name === 'string'))
          ) {
            // next('/') or next({ path: '/' }) -> redirect
            abort()
            if (typeof to === 'object' && to.replace) {
              this.replace(to)
            } else {
              this.push(to)
            }
          } else {
            // confirm transition and pass on the value
            // 下面的next参数实际上runQueue传进来的，调用它就能让runQueue自动调用下一个guard
            next(to)
          }
        })
      } catch (e) {
        abort(e)
      }
    }

    runQueue(queue, iterator, () => {
      //当queue对应的所有guard都完成了调用时，就会进入这里
      
      const postEnterCbs = []
      // 这个函数用来判断当前路由是否有效，主要是考虑一次路由还没完成，中间又切换到其它路由的场景
      const isValid = () => this.current === route
      // wait until async components are resolved before
      // extracting in-component enter guards
      const enterGuards = extractEnterGuards(activated, postEnterCbs, isValid)
      const queue = enterGuards.concat(this.router.resolveHooks)
      runQueue(queue, iterator, () => {
        if (this.pending !== route) {
          return abort()
        }
        this.pending = null
        onComplete(route)
        if (this.router.app) {
          this.router.app.$nextTick(() => {
            postEnterCbs.forEach(cb => {
              cb()
            })
          })
        }
      })
    })
  }
```
可以分为多个部分来解析：
* abort
* NavigationDuplicated
* resolveQueue
* queue
* iterator
* runQueue

### abort
`abort`内有调用通过`this.onError`注册的回调函数：
```js
    const current = this.current
    const abort = err => {
      // after merging https://github.com/vuejs/vue-router/pull/2771 we
      // When the user navigates through history through back/forward buttons
      // we do not want to throw the error. We only throw it if directly calling
      // push/replace. That's why it's not included in isError
      if (!isExtendedError(NavigationDuplicated, err) && isError(err)) {
        if (this.errorCbs.length) {
          this.errorCbs.forEach(cb => {
            cb(err)
          })
        } else {
          warn(false, 'uncaught error during route navigation:')
          console.error(err)
        }
      }
      onAbort && onAbort(err)
    }
```
上面这段代码，定义了一个`abort`逻辑，在后续的处理中，有以下几种场景会导致`abort`执行：
* 跳转重复，触发NavigationDuplicated
* 在执行guards函数过程中，检测到路由发生了变化，要中断之前的路由
* 在guards函数执行时，用户在guards函数内调用了`next(false)`手工中断了路由
* 在guards函数执行时，用户在guards函数内调用了`next(newLocation: RawLocation)`切换了路由
* 捕获到异常

`isExtendedError(NavigationDuplicated, err)`这段代码是在判断`err`是否为`NavigationDuplicated`的实例。`isExtendedError`的源码是：
```js
// 判断err是否是constructor的实例
// 用于判断err对象是否为constructor指定的错误类型
export function isExtendedError (constructor: Function, err: any): boolean {
  return (
    err instanceof constructor ||
    // _name is to support IE9 too
    (err && (err.name === constructor.name || err._name === constructor._name))
  )
}
```
### NavigationDuplicated
`NavigationDuplicated`是一个自定义的错误类：
```js
export class NavigationDuplicated extends Error {
  constructor (normalizedLocation) {
    super()
    this.name = this._name = 'NavigationDuplicated'
    // passing the message to super() doesn't seem to work in the transpiled version
    this.message = `Navigating to current location ("${
      normalizedLocation.fullPath
    }") is not allowed`
    // add a stack property so services like Sentry can correctly display it
    Object.defineProperty(this, 'stack', {
      value: new Error().stack,
      writable: true,
      configurable: true
    })
    // we could also have used
    // Error.captureStackTrace(this, this.constructor)
    // but it only exists on node and chrome
  }
}

// support IE9
NavigationDuplicated._name = 'NavigationDuplicated'
```
这个错误类在`confirmTransition`中是这么被使用的：
```js
    if (
      isSameRoute(route, current) &&
      // in the case the route map has been dynamically appended to
      route.matched.length === current.matched.length
    ) {
      this.ensureURL()
      return abort(new NavigationDuplicated(route))
    }
```
`isSameRoute`是判断两个路由是否相同，是`vue-router`其它源码中提供的用来判断路由是否重复的工具函数：
```js

// 判断两个路由是否相同
export function isSameRoute (a: Route, b: ?Route): boolean {
  if (b === START) {
    return a === b
  } else if (!b) {
    return false
  } else if (a.path && b.path) {
    return (
      a.path.replace(trailingSlashRE, '') === b.path.replace(trailingSlashRE, '') &&
      a.hash === b.hash &&
      isObjectEqual(a.query, b.query)
    )
  } else if (a.name && b.name) {
    return (
      a.name === b.name &&
      a.hash === b.hash &&
      isObjectEqual(a.query, b.query) &&
      isObjectEqual(a.params, b.params)
    )
  } else {
    return false
  }
}

// 判断对象是否相等，深入对象的数据内容
function isObjectEqual (a = {}, b = {}): boolean {
  // handle null value #1566
  if (!a || !b) return a === b
  const aKeys = Object.keys(a)
  const bKeys = Object.keys(b)
  if (aKeys.length !== bKeys.length) {
    return false
  }
  return aKeys.every(key => {
    const aVal = a[key]
    const bVal = b[key]
    // check nested equality
    if (typeof aVal === 'object' && typeof bVal === 'object') {
      return isObjectEqual(aVal, bVal)
    }
    return String(aVal) === String(bVal)
  })
}
```
### resolveQueue
这段代码调用`resolveQueue`这个函数，并传入了当前路由对象的`matched`数组，和即将跳转的路由对象的`matched`数组：
```js
    const { updated, deactivated, activated } = resolveQueue(
      this.current.matched,
      route.matched
    )
```
`matched`数组里面是什么呢？前面博客学过这个数组的创建过程，它里面存放的是与route对象关联的`RouteRecord`记录。`resolveQueue`函数的作用是从两个matched数组中，解析出哪些`RouteRecord`接下来是要做`updated`处理的，哪些是接下来要进行`deactivated`处理的，哪些接下来是要进行`activated`处理的。它解析的逻辑是什么呢：
```js
function resolveQueue (
  current: Array<RouteRecord>,
  next: Array<RouteRecord>
): {
  updated: Array<RouteRecord>,
  activated: Array<RouteRecord>,
  deactivated: Array<RouteRecord>
} {
  // current 和 next 分别是当前的Route对象的matched数组和新匹配的Route对象的matched数组
  let i
  // max是两个数组的最大值
  const max = Math.max(current.length, next.length)

  // 接下来的这个for循环，是为了得到一个i值
  // 从0开始遍历，直到两个matched数组，相同的i，对应的元素不是同一个为止
  // 这里用的是全不等号，所以判断的是元素的引用是否相同，也就是判断它们是否为同1个RouteRecord对象
  // 如果current与next不存在嵌套关系，那么这个i值一般来说就是0
  // 如果它们存在嵌套关系，那么这个值就不一定是0了
  for (i = 0; i < max; i++) {
    if (current[i] !== next[i]) {
      break
    }
  }
  return {
    updated: next.slice(0, i),//next数组中[0,i)这个部分是属于被update的RouteRecords
    activated: next.slice(i),//next数组中[i, next.length)这个元素对应的恰好是要被激活的RouteRecords
    deactivated: current.slice(i)//current数组中[i,next.length)这个部分属于被deactived的RouteRecords
  }
}
```
`current`与`next`分别代表的是两个matched数组，两个数组在没有嵌套路由的时候，各自长度肯定是1。上述函数中的`for`循环为了得到一个`i`值，如果`current`和`next`不是同一条路由的嵌套关系上的话，这个`i`肯定是0。举例来说，假如有这么一个routes:
```js
const routes = [
    {
        path: '/a',
        component: A,
        children: [
            {
                path: 'b',
                component: B
                children: [
                    {
                        path: 'c',
                        component: C
                    }
                ]
            },
            {
                path:'d',
                component: D
            }
        ]
    }
]
```
假如当前地址是`/a/b/c`，那么当前matched大概是：`[a, b, c]`；接下来如果要访问的是`/a/d`，那么目标matched应该是：`[a,d]`，按照resolveQueue的处理，最后结果就是：
```
updated: [a],
activated: [d],
deactivated: [b,c]
```
之所以能这么处理，还是因为`matched`这个数组的元素顺序，与路由嵌套顺序是一致的。

### queue
`queue`是个数组，存放了大部分的guards（官方文档介绍的那些守卫函数）。这个数组是这么构造出来的：
```js
    const queue: Array<?NavigationGuard> = [].concat(
      // in-component leave guards
      extractLeaveGuards(deactivated),
      // global before hooks
      this.router.beforeHooks,
      // in-component update hooks
      extractUpdateHooks(updated),
      // in-config enter guards
      activated.map(m => m.beforeEnter),
      // async components
      resolveAsyncComponents(activated)
    )
```
`queue`一共是由五个部分组成的：
* extractLeaveGuards(deactivated) 也就是官方文档中介绍的路由导航守卫`beforeRouteLeave`
* this.router.beforeHooks 也就是官方文档中介绍的全局前置守卫`beforeEach`
* extractUpdateHooks(updated) 也就是官方文档中介绍的路由导航守卫`beforeRouteUpdate`
* activated.map(m => m.beforeEnter) 也就是官方文档中介绍的路由独享的守卫`beforeEnter`
* resolveAsyncComponents(activated) 异步组件解析

`queue`里面的每个元素要么是空的，要么是一个回调函数，如果是一个回调函数的话，还满足这个形式：
```js
(to, from, next) => {
    // ...
}
```
当这些回调函数通过下一步的runQueue跑起来的时候，会传入上述示意中的三个参数。

上面`queue`的构造过程，暂时不考虑`resolveAsyncComponents`，如何理解`extractLeaveGuards(deactivated)`和`extractUpdateHooks(updated)`，其实`extractLeaveGuards`和`extractUpdateHooks`本质上是一样的，只不过各自从`RouteRecord`中解析出的钩子函数不一样，它们的代码是：
```js
function extractLeaveGuards (deactivated: Array<RouteRecord>): Array<?Function> {
  // 为什么最后一个参数要传true，代表最后要把guards逆序处理
  // deactivated这个数组的元素顺序实际上代表的是组件的嵌套关系
  // 在beforeRouteLeave这个guard处理时，显然应该先执行子组件的beforeRouteLeave guard，再执行父级的
  // 这个顺序跟deactivated数组的元素顺序是相反的，所以需要逆序
  return extractGuards(deactivated, 'beforeRouteLeave', bindGuard, true)
}

function extractUpdateHooks (updated: Array<RouteRecord>): Array<?Function> {
  return extractGuards(updated, 'beforeRouteUpdate', bindGuard)
}
```
这两个函数的本质是通过`extractGuards`和`bindGuard`函数完成的，相关源码如下：
```js
function extractGuards (
  records: Array<RouteRecord>,
  name: string,
  bind: Function,
  reverse?: boolean
): Array<?Function> {
  const guards = flatMapComponents(records, (def, instance, match, key) => {
    // def, instance, match, key这四个参数都是在flatMapComponents这个函数内部从records里面解析出来的
    // def是组件定义的对象
    // instance是从record.instances数组内读出的vue实例
    // match是RouteRecord本身
    // key对应到的就是router-view的name属性

    // def是组件定义的对象，调用extractGuard抽取name对应的hook option
    const guard = extractGuard(def, name)
    if (guard) {
      // 这个地方返回的是数组的话，导致flatMapComponents返回值还是存在嵌套数组的情况
      return Array.isArray(guard)
        ? guard.map(guard => bind(guard, instance, match, key))
        : bind(guard, instance, match, key)
    }
  })

  // 此处再做一次flatten处理 就能让返回值彻底是一维数组
  return flatten(reverse ? guards.reverse() : guards)
}

function extractGuard (
  def: Object | Function,
  key: string
): NavigationGuard | Array<NavigationGuard> {
  if (typeof def !== 'function') {
    // extend now so that global mixins are applied.
    // _Vue.extend是vue官方用法，得到一个可用于实例vue的子类
    def = _Vue.extend(def)
  }
  return def.options[key]
}

// 这个函数的作用实际上是为了把instance绑定到guard的上下文中
// 当guard被调用时，里面的this指向的就是instance
function bindGuard (guard: NavigationGuard, instance: ?_Vue): ?NavigationGuard {
  if (instance) {
    return function boundRouteGuard (to, from, next) {
      return guard.apply(instance, [to, from, next])
    }
  }
}

export function flatMapComponents (
  matched: Array<RouteRecord>,
  fn: Function
): Array<?Function> {
  return flatten(matched.map(m => {
    // Object.keys得到是m.components这个对象的key数组
    // Object.keys(m.components).map返回的肯定是一个数组，所以外面才有加flatten函数处理
    // 返回的这个数组的每个元素是fn的返回值
    // fn的参数：第1个是component 第2个是instance 第3个是RouteRecord 第4个是route-view对应的name
    return Object.keys(m.components).map(key => fn(
      m.components[key],
      m.instances[key],
      m, key
    ))
  }))
}

/**
 * flatten([[1],[2]]) ==> [1,2]
 * @param {*} arr 
 */
export function flatten (arr: Array<any>): Array<any> {
  return Array.prototype.concat.apply([], arr)
}
```
上面这几个函数的代码只要花点时间看，其实不难理解。

回顾`queue`的结构：
```js
    const queue: Array<?NavigationGuard> = [].concat(
      // in-component leave guards
      extractLeaveGuards(deactivated),
      // global before hooks
      this.router.beforeHooks,
      // in-component update hooks
      extractUpdateHooks(updated),
      // in-config enter guards
      activated.map(m => m.beforeEnter),
      // async components
      resolveAsyncComponents(activated)
    )
```
可以看到它与`vue-router`官方文档中关于守卫解析流程的这部分是对应的：
<img src="{% asset_path "02.png" %}" width="500">

### iterator
下面定义的函数叫`iterator`，这个将会被上一篇博客介绍的`async.js`中的函数所使用到，简单来说，接下来`conformTranstion`的代码会利用`async.js`提供的`runQueue`这个接口，利用`iterator`将`queue`中的所有回调函数按照先后顺序，1个执行完自动执行下一个策略的，将`queue`内的回调函数全部执行完，相关代码如下：
```js
    this.pending = route
    const iterator = (hook: NavigationGuard, next) => {
      if (this.pending !== route) {
        // pending代表一种路由处理的状态
        // 如果在调用过程pending不再等于外部闭包内的route，说明路由发生了变化
        // 所以原先的route就应该被取消掉
        return abort()
      }
      try {
        // hook就是guard
        // 所以hook的第三个参数，就是gurad的第三个参数next
        // 如 beforeEnter: (to, from, next) => {...}
        hook(route, current, (to: any) => {
          if (to === false || isError(to)) {
            // next(false) -> abort navigation, ensure current URL
            this.ensureURL(true)
            abort(to)
          } else if (
            typeof to === 'string' ||
            (typeof to === 'object' &&
              (typeof to.path === 'string' || typeof to.name === 'string'))
          ) {
            // next('/') or next({ path: '/' }) -> redirect
            abort()
            if (typeof to === 'object' && to.replace) {
              this.replace(to)
            } else {
              this.push(to)
            }
          } else {
            // confirm transition and pass on the value
            // 下面的next参数上runQueue传进来的，调用它就能让runQueue自动调用下一个guard
            next(to)
          }
        })
      } catch (e) {
        abort(e)
      }
    }
    runQueue(queue, iterator, () => {
      //此处在queue内所有函数执行完才会进入
      //暂时省略 下一个部分介绍
      })
    })
```
只要理解了`runQueue`的源码，也就是上一篇文章的`async.js`，上面的`iterator`函数，也很好理解。看了上面的`hook`调用代码，现在就很清楚在app开发中，那些守卫函数的第三个参数该怎么用了:
```js
export default {
    beforeRouteLeave(to, from, next) {
        // eg1 中断路由
        next(false)

        // eg2 跳转其它路由
        next({path: '/other'})
    }
}
```

### runQueue
`runQueue`是用来执行队列任务的，也就是`queue`:
```js
    runQueue(queue, iterator, () => {
      //当queue对应的所有guard都完成了调用时，就会进入这里
      
      // 这个数组用来存放所有的beforeRouteEnter这类guard
      const postEnterCbs = []
      // 这个函数用来判断当前路由是否有效，主要是考虑一次路由还没完成，中间又切换到其它路由的场景
      const isValid = () => this.current === route
      // wait until async components are resolved before
      // extracting in-component enter guards
      const enterGuards = extractEnterGuards(activated, postEnterCbs, isValid)
      const queue = enterGuards.concat(this.router.resolveHooks)
      runQueue(queue, iterator, () => {
        if (this.pending !== route) {
          return abort()
        }
        this.pending = null
        onComplete(route)
        if (this.router.app) {
          this.router.app.$nextTick(() => {
            postEnterCbs.forEach(cb => {
              cb()
            })
          })
        }
      })
    })
```
外部的`runQueue`的第三个参数，会在第一个参数`queue`内所有回调函数都执行完才会执行。里面定义了一个`postEnterCbs`，这个是什么？它是一个数组，将用来存放与一个特殊守卫相关的回调函数，就是`beforeRouterEnter`这个守卫。 `beforeRouteEnter`这个守卫的第三个参数，是可以接收一个回调函数的，这个回调函数被处理后会存放在`postEnterCbs`，如：
```js
beforeRouteEnter (to, from, next) {
  next(vm => {
  })
}
```
而`postEnterCbs`的执行时机特别晚，它是借助`router.app`拿到app实例，利用`$nextTick`来进行处理的，保证`postEnterCbs`内的回调函数被执行时，this指向到对应的vue实例。

上面在外层`runQueue`的回调内，还构造了一个新的queue:
```js
      // 这个函数用来判断当前路由是否有效，主要是考虑一次路由还没完成，中间又切换到其它路由的场景
      const isValid = () => this.current === route
      // wait until async components are resolved before
      // extracting in-component enter guards
      const enterGuards = extractEnterGuards(activated, postEnterCbs, isValid)
      const queue = enterGuards.concat(this.router.resolveHooks)
```
这个`queue`是由`beforeRouteEnter`和`beforeResolve`两类守卫构成的。后面紧接着又来一次`runQueue`来执行新构造的`queue`：
```js
      runQueue(queue, iterator, () => {
        if (this.pending !== route) {
          return abort()
        }
        this.pending = null
        onComplete(route)
        if (this.router.app) {
          this.router.app.$nextTick(() => {
            postEnterCbs.forEach(cb => {
              cb()
            })
          })
        }
      })
```
还是利用`iterator`，第三个参数在新的`queue`全部任务执行完时会执行，调用了`onComplete`来完成路由跳转，最后调用了`postEnterCbs`。结合上述代码，就能够官方文档中路由解析流程的这部分对应上了：
<img src="{% asset_path "03.png" %}" width="500">

最后来理解下`extractEnterGuards`的处理，它被调用时的传入是：
```js
      // 这个函数用来判断当前路由是否有效，主要是考虑一次路由还没完成，中间又切换到其它路由的场景
      const isValid = () => this.current === route
      // wait until async components are resolved before
      // extracting in-component enter guards
      const enterGuards = extractEnterGuards(activated, postEnterCbs, isValid)
```
里面有个`isValid`被传入了`extractEnterGuards`，应该是用来判断路由是否有发生变化的。`extractEnterGuards`的相关源码是：
```js
// extractEnterGuards与前面的两个extract函数有点相似
// 就是在内部调用extractGuards时第三个参数有所不同
// 调用了一个新的bindEnterGuard函数，而不是原来的bindGuard
// 因为bindGuard使用instance可以被直接访问到的场景
// 而beforeRouteEnter是新渲染的组件上定义的函数
// 它被调用时，新渲染的组件实例无法通过instance访问到
function extractEnterGuards (
  activated: Array<RouteRecord>,
  cbs: Array<Function>,
  isValid: () => boolean
): Array<?Function> {
  return extractGuards(
    activated,
    'beforeRouteEnter',
    (guard, _, match, key) => {
      // _是instance
      // match是RouteRecord
      return bindEnterGuard(guard, match, key, cbs, isValid)
    }
  )
}

function bindEnterGuard (
  guard: NavigationGuard,
  match: RouteRecord,
  key: string,
  cbs: Array<Function>,
  isValid: () => boolean
): NavigationGuard {
  // routeEnterGuard就是存放在外部queue数组中的元素
  return function routeEnterGuard (to, from, next) {
      // guard才是真正的守卫函数
    return guard(to, from, cb => {
      if (typeof cb === 'function') {
          // cbs就是外面的postEnterCbs数组
        cbs.push(() => {
          // #750
          // if a router-view is wrapped with an out-in transition,
          // the instance may not have been registered at this time.
          // we will need to poll for registration until current route
          // is no longer valid.
          poll(cb, match.instances, key, isValid)
        })
      }
      // 当beforeRouteEnter被调用时，它的第三个参数next，如果传入了一个回调函数，就是
      // 上面的cb，这个cb会被添加进cbs，也就是postEnterCbs
      
      // 下一步调用next，继续下一个队列任务处理
      // 这个cb参数可以不传
      next(cb)
    })
  }
}

// poll函数是一个轮询的作用，每隔16s去检查instance是否已经可以访问
// 可以访问时，则立即调用cb，也就是beforeRouteEnter的第三个参数next所传入的回调函数
// instance是直接通过RouteRecord对象的instances对象访问到的
// instance是如何绑定到RouteRecord对象的instances对象上的？这就跟router-view的源码有关了
// 以前的博客中有关于router-vier的源码解析
function poll (
  cb: any, // somehow flow cannot infer this is a function
  instances: Object,
  key: string,
  isValid: () => boolean
) {
  if (
    instances[key] &&
    !instances[key]._isBeingDestroyed // do not reuse being destroyed instance
  ) {
    cb(instances[key])
  } else if (isValid()) {
    setTimeout(() => {
      poll(cb, instances, key, isValid)
    }, 16)
  }
}

```