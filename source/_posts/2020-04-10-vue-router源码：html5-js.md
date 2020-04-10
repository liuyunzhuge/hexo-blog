---
title: vue-router源码：html5.js
tags:
  - Vue
  - vue-router
  - vue-router源码
categories:
  - Javascript
  - Vue
  - vue-router
date: 2020-04-10 21:12:58
---


vue-router源码解析系列。这是第六篇。本篇介绍源码中的`html5.js`，它其实比较简单，是`vue-router`在`mode:history`模式下的`History`子类实现，`Histor`类是路由跳转的核心类，在上上篇博客中已有详细的解析。本系列解析的是官方git库中3.1.6的版本源码。

<!-- more -->
源码链接：[html5.js](/code/vue-router/source-code/history/html5.js)。源码里面用的是typescript，但是不影响阅读。

```js
// 声明HTML5History 继承自History
export class HTML5History extends History {
  constructor (router: Router, base: ?string) {
    // 调用父类
    super(router, base)

    // 与scroll相关的可以暂时不关注
    // 以后的博客会专门来分析vue-router对滚动行为的处理
    // expectScroll supportsScroll setupScroll handleScroll这些都是跟滚动行为有关的
    const expectScroll = router.options.scrollBehavior
    const supportsScroll = supportsPushState && expectScroll

    if (supportsScroll) {
      // 初始化滚动行为的逻辑
      setupScroll()
    }

    // 保存初始的访问地址  getLocation返回的是一个字符串，代表当前访问地址
    const initLocation = getLocation(this.base)

    // 监听popstate 目的有两个
    // 1：处理路由跳转
    // 2：处理滚动行为
    window.addEventListener('popstate', e => {
      const current = this.current

      // Avoiding first `popstate` event dispatched in some browsers but first
      // history route not updated since async guard at the same time.
      const location = getLocation(this.base)
      if (this.current === START && location === initLocation) {
        return
      }

      this.transitionTo(location, route => {
        if (supportsScroll) {
          handleScroll(router, route, current, true)
        }
      })
    })
  }

  go (n: number) {
    window.history.go(n)
  }

  push (location: RawLocation, onComplete?: Function, onAbort?: Function) {
    const { current: fromRoute } = this
    this.transitionTo(location, route => {
      // transtionTo完成了路由跳转之后会执行到这里
      // 而且这里执行的时机是位于this.updateRoute之后的
      // 调用pushState修改浏览器历史记录
      pushState(cleanPath(this.base + route.fullPath))
      // 处理滚动行为
      handleScroll(this.router, route, fromRoute, false)
      onComplete && onComplete(route)
    }, onAbort)
  }
 
  // 这个跟push差不多
  replace (location: RawLocation, onComplete?: Function, onAbort?: Function) {
    const { current: fromRoute } = this
    this.transitionTo(location, route => {
      replaceState(cleanPath(this.base + route.fullPath))
      handleScroll(this.router, route, fromRoute, false)
      onComplete && onComplete(route)
    }, onAbort)
  }

  // 这个函数用来检查当前访问地址，与current中的fullPath是否相同
  // 不同的话，用current.fullPath去刷新访问地址
  ensureURL (push?: boolean) {
    if (getLocation(this.base) !== this.current.fullPath) {
      const current = cleanPath(this.base + this.current.fullPath)
      push ? pushState(current) : replaceState(current)
    }
  }

  getCurrentLocation (): string {
    return getLocation(this.base)
  }
}

export function getLocation (base: string): string {
  let path = decodeURI(window.location.pathname)
  if (base && path.indexOf(base) === 0) {
    path = path.slice(base.length)
  }
  return (path || '/') + window.location.search + window.location.hash
}
```
其中`pushState`和`replaceState`是在其它源码中定义的：
```js
export function pushState (url?: string, replace?: boolean) {
  // 保存滚动位置 后面的博客再来解析
  saveScrollPosition()

  // 注意下面的注释
  // try...catch the pushState call to get around Safari
  // DOM Exception 18 where it limits to 100 pushState calls
  const history = window.history
  try {
    // stateKey也是跟滚动行为有关的，都会在后面的博客来解析
    if (replace) {
      // preserve existing history state as it could be overriden by the user
      const stateCopy = extend({}, history.state)
      stateCopy.key = getStateKey()
      history.replaceState(stateCopy, '', url)
    } else {
      history.pushState({ key: setStateKey(genStateKey()) }, '', url)
    }
  } catch (e) {
    window.location[replace ? 'replace' : 'assign'](url)
  }
}

export function replaceState (url?: string) {
  pushState(url, true)
}
```
从上面这段代码可以看到`pushState`本质上就是在利用`history pushstate`api来处理浏览器的地址修改和浏览器历史记录的修改，只不过做了一些额外的处理，来应对safari bug和与滚动行为相关的功能。