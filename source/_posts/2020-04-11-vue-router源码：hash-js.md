---
title: vue-router源码：hash.js
tags:
  - Vue
  - vue-router
  - vue-router源码
categories:
  - Javascript
  - Vue
  - vue-router
date: 2020-04-11 12:02:09
---



vue-router源码解析系列。这是第九篇。本篇介绍源码中的`hash.js`，它其实比较简单，是`vue-router`在`mode:hash`模式下的`History`子类实现，`Histor`类是路由跳转的核心类，在之前的博客中已有详细的解析。本系列解析的是官方git库中3.1.6的版本源码。

<!-- more -->
源码链接：[hash.js](/code/vue-router/source-code/history/hash.js)。源码里面用的是typescript，但是不影响阅读。

```js
export class HashHistory extends History {
  constructor (router: Router, base: ?string, fallback: boolean) {
    super(router, base)
    // check history fallback deeplinking
    if (fallback && checkFallback(this.base)) {
      return
    }

    ensureSlash()
  }


  // 下面的英文注释结合 router类中对history的初始化可知一二
  // setupHashListener 将在app进入的首次路由完成时才会初始化
      /* 
    if (history instanceof HashHistory) {
      const setupHashListener = () => {
        history.setupListeners()
      }
      history.transitionTo(
        history.getCurrentLocation(),
        setupHashListener,
        setupHashListener
      )
    } */
  // this is delayed until the app mounts
  // to avoid the hashchange listener being fired too early
  setupListeners () {
    const router = this.router
    const expectScroll = router.options.scrollBehavior
    const supportsScroll = supportsPushState && expectScroll

    if (supportsScroll) {
      setupScroll()
    }

    window.addEventListener(
      supportsPushState ? 'popstate' : 'hashchange',
      () => {
        const current = this.current
        if (!ensureSlash()) {
          return
        }
        this.transitionTo(getHash(), route => {
          if (supportsScroll) {
            handleScroll(this.router, route, current, true)
          }
          if (!supportsPushState) {
            replaceHash(route.fullPath)
          }
        })
      }
    )
  }

  push (location: RawLocation, onComplete?: Function, onAbort?: Function) {
    const { current: fromRoute } = this
    this.transitionTo(
      location,
      route => {
        pushHash(route.fullPath)
        handleScroll(this.router, route, fromRoute, false)
        onComplete && onComplete(route)
      },
      onAbort
    )
  }

  replace (location: RawLocation, onComplete?: Function, onAbort?: Function) {
    const { current: fromRoute } = this
    this.transitionTo(
      location,
      route => {
        replaceHash(route.fullPath)
        handleScroll(this.router, route, fromRoute, false)
        onComplete && onComplete(route)
      },
      onAbort
    )
  }

  go (n: number) {
    window.history.go(n)
  }

  // 见上上篇博客中对html5.js中的ensureURL的解析
  ensureURL (push?: boolean) {
    const current = this.current.fullPath
    if (getHash() !== current) {
      push ? pushHash(current) : replaceHash(current)
    }
  }

  getCurrentLocation () {
    return getHash()
  }
}

function checkFallback (base) {
  // getLocation是html5.js也就是Html5History那个子类里面定义的

  const location = getLocation(base)
  if (!/^\/#/.test(location)) {
    window.location.replace(cleanPath(base + '/#' + location))
    return true
  }
}

function ensureSlash (): boolean {
  const path = getHash()
  if (path.charAt(0) === '/') {
    return true
  }

  // 此处感觉有点问题
  // 如果当前访问的是http://localhost:8080/#abc
  // 会被改为http://localhost:8080/#/abc
  // 在history初始化的时候，这么做是有意义的，但是在setUpListener里面还这么做感觉就不对了
  replaceHash('/' + path)
  return false
}

// 这个函数是从浏览器当前地址中解析出路由地址
export function getHash (): string {
  // We can't use window.location.hash here because it's not
  // consistent across browsers - Firefox will pre-decode it!
  let href = window.location.href
  const index = href.indexOf('#')
  // empty path
  if (index < 0) return ''

  href = href.slice(index + 1)
  // decode the hash but not the search or hash
  // as search(query) is already decoded
  // https://github.com/vuejs/vue-router/issues/2708
  const searchIndex = href.indexOf('?')
  if (searchIndex < 0) {
    const hashIndex = href.indexOf('#')
    if (hashIndex > -1) {
      href = decodeURI(href.slice(0, hashIndex)) + href.slice(hashIndex)
    } else href = decodeURI(href)
  } else {
    href = decodeURI(href.slice(0, searchIndex)) + href.slice(searchIndex)
  }

  return href
}

function getUrl (path) {
  const href = window.location.href
  const i = href.indexOf('#')
  const base = i >= 0 ? href.slice(0, i) : href
  return `${base}#${path}`
}

// pushHash跟底部的replaceHash都是优先利用history api来更新访问地址
// 只有当pushstate不支持的时候，才会使用原始方法更新hash 如location.hash = 以及 location.replace
// pushHash会保证一定会添加新的浏览器历史记录
function pushHash (path) {
  if (supportsPushState) {
    pushState(getUrl(path))
  } else {
    window.location.hash = path
  }
}

// replaceHash会保证一定不会添加浏览器历史记录
function replaceHash (path) {
  if (supportsPushState) {
    replaceState(getUrl(path))
  } else {
    window.location.replace(getUrl(path))
  }
}
```
## 为什么还是优先使用history而不是纯hash
这是因为hash模式，本身就是可以用history来实现的，不一定是`hashchange`这种比较旧的方式，通常选择hash模式，只是单纯地为了让应用能够兼容更早的浏览器版本，那如果一个浏览器已经完成支持`history pushState relaceState`和`popstate`事件了，那用最新的api去实现hash模式，显然更合适。

为什么能这么做呢？最重要的是为什么能用`popstate`事件取代`hashchange`事件呢，难道改变hash的时候除了触发`hashchange`，还会触发`popstate`事件吗？

确实如此，看了自己一篇16年的旧博客，发现一些对`hashchange popstate`事件有用的知识点：[理解浏览器历史记录（2）-hashchange、pushState](https://www.cnblogs.com/lyzg/archive/2016/10/21/5960609.html)
> window.onpopstate事件
> 这个事件触发的时机比较有特点：
> 一、history.pushState和history.replaceState都不会触发这个事件
> 二、仅在浏览器前进后退操作、history.go/back/forward调用、hashchange的时候触发

这就明白为啥`HashHistory`里面在`supportsPushState`为真的情况下，可以用`popstate`事件代替`hashchange`事件的原因了。

## 构造函数中的要点
在构造函数中，有一段：
```js
    if (fallback && checkFallback(this.base)) {
      return
    }
```
首先`fallback`是`Router`类中传进来的：
```js
    // 以下代码有简化

    let mode = options.mode || 'hash'
    this.fallback = mode === 'history' && !supportsPushState && options.fallback !== false
    // 向后兼容
    if (this.fallback) {
      mode = 'hash'
    }

    switch (mode) {
      case 'hash':
        this.history = new HashHistory(this, options.base, this.fallback)
        break
    }
```
`fallback`代表了兼容的意思，那就意味着有可能当前的访问地址还是非hash的模式，所以在`HashHistory`的构造函数中，在检测到`fallback`的情况下加了一个`checkFallback`的处理，这个会将当前非hash的访问地址，变为hash模式的访问地址。比如一开始访问的是`http://localhost:8080/`会被修改为`http://localhost:8080/#/`。

构造函数中还有1个`this.ensureSlash`的调用，这个也是修正访问地址的作用，比如你访问的是`http://localhost:8080/#list`，则会被换成`http://localhost:8080/#/list`，然后才去执行初始化路由跳转，否则跟`http://localhost:8080/#list`去访问，是匹配不到路由的。

## pushHash和replaceHash会导致`hashchange`被触发吗
经过测试`supportsPushState`为`true`的情况下，那么`pushHash`和`replaceHash`最终是通过`history.pushState`和`history.replaceState`完成的hash更新，这两个api不会触发`hashchange`事件，所以`popstate`事件也不会触发。

但是在`supportsPushState`为`false`的情况下，就不一样了：`pushHash`和`replaceHash`最终是通过`location.hash赋值`和`location.replace`完成的hash更新，这两个方法完成的hash更新。 那么问题来了？如果代码中通过`this.push`和`this.replace`触发路由，那么由于`hashchange`也会执行，所以会导致listener中的`this.transitionTo`也会执行，会有问题吗？
不会。最终即使进入了回调，执行到this.transitionTo的调用，最终也会因为NavigationDuplicated取消掉由于hashchange事件触发的路由。

## setupListeners
```js
    window.addEventListener(
      supportsPushState ? 'popstate' : 'hashchange',
      () => {
        const current = this.current
        if (!ensureSlash()) {
          return
        }
        this.transitionTo(getHash(), route => {
          if (supportsScroll) {
            handleScroll(this.router, route, current, true)
          }
          if (!supportsPushState) {
            replaceHash(route.fullPath)
          }
        })
      }
    )
```
首先是这个`this.ensureSlash`的调用，它不单是返回`true false`，里面还有`replaceHash`的处理，如果手动修改`hash`为一个非`/`开始的字符串，就会发现`this.ensureSlash`返回`false`，路由中止，同时浏览器访问地址中的hash会自动以`/`开头。如果它`this.ensureSlash`不返回`false`，而是在保证了hash的`/`开头的逻辑后，继续走`this.transitionTo`的处理，我感觉更有用一点。现在直接`return`了，就看不出作用了。

这个`ensureSlash`也有别人对它的疑问：[参见issue](https://github.com/vuejs/vue-router/issues/2183)

然后是这个调用：
```js
          if (!supportsPushState) {
            replaceHash(route.fullPath)
          }
```
为啥在纯hash模式下，最后还有加`replaceHash`的调用呢？因为在每个路由成功后，都有`this.ensureURL`的处理阿，个人认为它是多余的。



