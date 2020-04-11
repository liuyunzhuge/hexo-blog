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


vue-router源码解析系列。这是第七篇。本篇介绍源码中的`html5.js`，它其实比较简单，是`vue-router`在`mode:history`模式下的`History`子类实现，`Histor`类是路由跳转的核心类，在上上篇博客中已有详细的解析。本系列解析的是官方git库中3.1.6的版本源码。

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

      // 参照mdn对popstate事件的描述 部分浏览器在重新打开一个页面时可能会触发popstate事件
      // 那这个popstate事件触发就会与history的初始路由跳转可能会发生不一致
      // 尤其是初始路由如果有异步组件，那就会出现popstate事件比初始路由完成时机要更早触发
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

## ensureURL的作用
在`base.js`中，一共有三处`ensureURL`的调用：
一处是在`confirmTransition`的成功回调中，位于`updateRoute`之后:
```js
this.confirmTransition(
      route,
      () => {//成功
        this.updateRoute(route)
        onComplete && onComplete(route)
        this.ensureURL()  // 这个！

        // fire ready cbs once
        if (!this.ready) {
          this.ready = true
          this.readyCbs.forEach(cb => {
            cb(route)
          })
        }
      },

      // 省略
```
一处是检测到相同路由跳转的时候：
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
第三处是在`iterator`函数中调用`hook`的时候：
```js
        hook(route, current, (to: any) => {
          if (to === false || isError(to)) {
            // next(false) -> abort navigation, ensure current URL
            this.ensureURL(true)
            abort(to)
          }
```
为什么在这几个场景里面需要调用`ensureURL`呢，观看`ensureURL`的源码可以看到它是从`window.location`中提取地址与`this.current.fullPath`比较，不同的话，就以`this.current.fullPath`去覆盖`window.location`，有这个必要性吗？

先来看第三处为什么有这个必要，第三处的调用`ensureURL`传入了`true`，代表执行`pushState`的逻辑。什么场景下会触发这样的情况呢？假设你有一个`beforeRouteLeave`的钩子：
```js
beforeRouteLeave(to, from, next) {
  next(false)
}
```
这个钩子将会阻止浏览器离开当前页面。那么浏览器离开当前页面的方式有几种？其实就是两种，一是通过`this.push`和`this.replace`这两个途径主动前往其他页面；二是通过浏览器的前进或后退（用户通过浏览器交互或者是window.history.go）。第一种离开方式，最终对浏览器历史记录的修改，是受代码控制的，并且是在路由完成之后才修改，所以`beforeRouteLeave`中的`next(false)`执行时，浏览器历史记录并未发生变化，`this.updateRoute`也没有执行，所以`this.ensureURL(true)`等于没做什么事情；但是第二种离开方式，就不一样了，是浏览器的行为先触发，也就是说历史记录是先被浏览器修改了，然后再借助`popstate`事件通知`vue-router`，那么当`beforeRouteLeave`触发时，浏览器历史记录已经被修改了，此时`next(false)`中断了路由，如果不做`this.ensureURL(true)`的处理，就会导致浏览器的历史记录，与`vue-router`中的路由页面不一致，而借助`this.ensureURL(true)`可以在这种情况，自动把浏览器回退的那条记录添加回来，就保证浏览器记录与`vue-router`的`hook`控制的一致性。

那么前两个`ensureURL`调用有什么作用呢？我目前理解的是为了保证浏览器访问地址与`this.current.fullPath`的一致性，因为在路由过程中，不排除有其它js代码他通过`history.replaceState`修改了浏览器地址，导致浏览器访问地址出现与`this.current.fullPath`不一致的情况，从正常角度来说，如果一个app内只有`vue-router`在使用`history api`，那前两处`ensureURL`的调用就是多余的，但是加了也没什么关系，因为它大部分情况下，都不会执行，有这个if逻辑在呢：
```js
if (getLocation(this.base) !== this.current.fullPath) {
      const current = cleanPath(this.base + this.current.fullPath)
      push ? pushState(current) : replaceState(current)
}
```
`ensureURL`的作用就如`ensure`的含义一样，是为了保证浏览器访问地址与`vue-router`内的状态保持一致，所在`vue-route`在3处意味着路由终止的位置都有加入这个调用。