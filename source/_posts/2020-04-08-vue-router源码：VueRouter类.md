---
title: vue-router源码：VueRouter类
tags:
  - Vue
  - vue-router
  - vue-router源码
categories:
  - Javascript
  - Vue
  - vue-router
date: 2020-04-08 17:35:54
---


vue-router源码解析系列。这是第四篇。本篇介绍源码中的`index.js`，它是`vue-router`的类文件，可以得到`VueRouter`实例。本系列解析的是官方git库中3.1.6的版本源码。

<!-- more -->
源码链接：[index.js](/code/vue-router/source-code/index.js)。源码里面用的是typescript，但是不影响阅读。

这份代码不难理解，所以就主要在源码里用注释解析：
```js
/* @flow */

import { install } from './install'
import { START } from './util/route'
import { assert } from './util/warn'
import { inBrowser } from './util/dom'
import { cleanPath } from './util/path'
import { createMatcher } from './create-matcher'
import { normalizeLocation } from './util/location'
import { supportsPushState } from './util/push-state'

import { HashHistory } from './history/hash'
import { HTML5History } from './history/html5'
import { AbstractHistory } from './history/abstract'

import type { Matcher } from './create-matcher'

export default class VueRouter {
  static install: () => void;
  static version: string;

  app: any;
  apps: Array<any>;
  ready: boolean;
  readyCbs: Array<Function>;
  options: RouterOptions;
  mode: string;
  history: HashHistory | HTML5History | AbstractHistory;
  matcher: Matcher;
  fallback: boolean;
  beforeHooks: Array<?NavigationGuard>;
  resolveHooks: Array<?NavigationGuard>;
  afterHooks: Array<?AfterNavigationHook>;

  constructor (options: RouterOptions = {}) {
    // 存放第一个调用init的app实例
    this.app = null
    // 存放所有调用init的app实例
    this.apps = []
    this.options = options

    // 底下三个都是数组，存放官方文档中介绍的那些在Router级别定义的守卫
    this.beforeHooks = []
    this.resolveHooks = []
    this.afterHooks = []

    // 创建macther对象  用来给外部提供路由匹配服务
    this.matcher = createMatcher(options.routes || [], this)

    let mode = options.mode || 'hash'
    // supportsPushState表示是否支持浏览器historyApi
    // this.fallback是一个状态，用来判断是否自动兼容到hash模式
    this.fallback = mode === 'history' && !supportsPushState && options.fallback !== false
    // 向后兼容
    if (this.fallback) {
      mode = 'hash'
    }

    // 如果不是浏览器，则开启abstract模式
    // 这个感觉跟SSR有关
    if (!inBrowser) {
      mode = 'abstract'
    }
    this.mode = mode

    // 下面是根据不同的模式来实例化不同的History实例
    // 这个是后续博客学习的重点，它是vue-router这个框架进行路由处理的核心
    // HTML5History HashHistory AbstractHistory是History类的子类
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

  // 代理matcher对象的match方法
  // 这样外部就能通过router实例来进行路由匹配
  // 主要是那些History类中会用它
  match (
    raw: RawLocation,
    current?: Route,
    redirectedFrom?: Location
  ): Route {
    return this.matcher.match(raw, current, redirectedFrom)
  }

  // 获取当前的Route对象
  // 通过this.hisotry.current
  get currentRoute (): ?Route {
    return this.history && this.history.current
  }

  // 这个代码在install.js那份源码里有被调用
  // 它用来完成vue-router框架与app的初始化
  init (app: any /* Vue component instance */) {
    process.env.NODE_ENV !== 'production' && assert(
      install.installed,
      `not installed. Make sure to call \`Vue.use(VueRouter)\` ` +
      `before creating root instance.`
    )

    
    // 为什么这个地方会有一个this.apps的数组
    // vue-router是服务于vue app的
    // 而vue app的单位可能很小，可能只是页面中的某个div，那页面如果有多个vue app呢
    // 它们可能公用同一个router实例
    this.apps.push(app)

    // 哪个app销毁的时候，就要从router中移除掉
    // hook:destroyed是vue内部的一个事件名称
    // vue实例的生命周期里那个destroyed的钩子函数，在内部应该就是通过hook:destroyed来注册的
    // set up app destroyed handler
    // https://github.com/vuejs/vue-router/issues/2639
    app.$once('hook:destroyed', () => {
      // clean out app from this.apps array once destroyed
      const index = this.apps.indexOf(app)
      if (index > -1) this.apps.splice(index, 1)
      // ensure we still have a main app or null if no apps
      // we do not release the router so it can be reused
      if (this.app === app) this.app = this.apps[0] || null
    })

    // 英文注释已有解释
    // main app previously initialized
    // return as we don't need to set up new history listener
    if (this.app) {
      return
    }

    this.app = app

    const history = this.history

    // 路由初始化
    // 底下的代码等学习了history自然就明白了
    // 目前看，它的作用是2个
    // 一是完成初始化路由的跳转
    // 二是完成history的监听
    if (history instanceof HTML5History) {
      history.transitionTo(history.getCurrentLocation())
    } else if (history instanceof HashHistory) {
      const setupHashListener = () => {
        history.setupListeners()
      }
      history.transitionTo(
        history.getCurrentLocation(),
        setupHashListener,
        setupHashListener
      )
    }

    // 监听路由变化，更新所有app实例的_route对象，触发UI更新
    history.listen(route => {
      this.apps.forEach((app) => {
        app._route = route
      })
    })
  }

  // 往下五个方法 用来注册回调函数
  beforeEach (fn: Function): Function {
    return registerHook(this.beforeHooks, fn)
  }

  beforeResolve (fn: Function): Function {
    return registerHook(this.resolveHooks, fn)
  }

  afterEach (fn: Function): Function {
    return registerHook(this.afterHooks, fn)
  }

  onReady (cb: Function, errorCb?: Function) {
    this.history.onReady(cb, errorCb)
  }

  onError (errorCb: Function) {
    this.history.onError(errorCb)
  }

  // 往下5个方法就是路由导航的所有方法
  // 最终都是通过History实例来完成的
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

  go (n: number) {
    this.history.go(n)
  }

  back () {
    this.go(-1)
  }

  forward () {
    this.go(1)
  }

  // 这个方法目前在源码的其它位置没有调用它的
  // 为了得到路由对象中的components定义
  getMatchedComponents (to?: RawLocation | Route): Array<any> {
    const route: any = to
      ? to.matched
        ? to
        : this.resolve(to).route
      : this.currentRoute
    if (!route) {
      return []
    }
    return [].concat.apply([], route.matched.map(m => {
      return Object.keys(m.components).map(key => {
        return m.components[key]
      })
    }))
  }

  // 提供给外部用来解析一个路由  目前只有router-link这个组件使用
  // 里面用到的函数基本都是上一篇博客学过的
  resolve (
    to: RawLocation,
    current?: Route,
    append?: boolean
  ): {
    location: Location,
    route: Route,
    href: string,
    // for backwards compat
    normalizedTo: Location,
    resolved: Route
  } {
    current = current || this.history.current
    const location = normalizeLocation(
      to,
      current,
      append,
      this
    )
    const route = this.match(location, current)
    const fullPath = route.redirectedFrom || route.fullPath
    const base = this.history.base
    const href = createHref(base, fullPath, this.mode)
    return {
      location,
      route,
      href,
      // for backwards compat
      normalizedTo: location,
      resolved: route
    }
  }

  // 提供给外部动态添加路由
  addRoutes (routes: Array<RouteConfig>) {
    this.matcher.addRoutes(routes)
    if (this.history.current !== START) {
      this.history.transitionTo(this.history.getCurrentLocation())
    }
  }
}

// 这是个工具函数，用来添加回调函数
// 不过它调用后返回一个函数
// 返回的这个函数被调用时，能把之前添加的回调函数删除
// 这个设计还是不错的
function registerHook (list: Array<any>, fn: Function): Function {
  list.push(fn)
  return () => {
    const i = list.indexOf(fn)
    if (i > -1) list.splice(i, 1)
  }
}

// 这个用来创建router-link实际的href
// 里面区分hash模式和非hash模式
function createHref (base: string, fullPath: string, mode) {
  var path = mode === 'hash' ? '#' + fullPath : fullPath
  return base ? cleanPath(base + '/' + path) : path
}

VueRouter.install = install
VueRouter.version = '__VERSION__'

if (inBrowser && window.Vue) {
  window.Vue.use(VueRouter)
}
```
其它两个相关的源码是这样的：
```js
export const supportsPushState =
  inBrowser &&
  (function () {
    const ua = window.navigator.userAgent

    if (
      (ua.indexOf('Android 2.') !== -1 || ua.indexOf('Android 4.0') !== -1) &&
      ua.indexOf('Mobile Safari') !== -1 &&
      ua.indexOf('Chrome') === -1 &&
      ua.indexOf('Windows Phone') === -1
    ) {
        // 安卓2.0或安卓4.0
        // 且ua中含有Mobile Safari
        // 不含Chrome且不含Windows Phone
        // 就直接判定为不支持pushStateApi
      return false
    }

    return window.history && 'pushState' in window.history
  })()
```
```js
export const inBrowser = typeof window !== 'undefined'
```