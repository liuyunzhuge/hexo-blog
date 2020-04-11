---
title: vue-router源码：abstract.js
tags:
  - Vue
  - vue-router
  - vue-router源码
categories:
  - Javascript
  - Vue
  - vue-router
date: 2020-04-11 16:01:59
---


vue-router源码解析系列。这是第八篇。本篇介绍源码中的`abstract.js`，是`vue-router`在非浏览器环境如node提供的`History`子类实现，`Histor`类是路由跳转的核心类，在之前的博客中已有详细的解析。本系列解析的是官方git库中3.1.6的版本源码。

<!-- more -->
源码链接：[abstract.js](/code/vue-router/source-code/history/abstract.js)。源码里面用的是typescript，但是不影响阅读。

`AbstractHistory`是个比较特别的实现，因为它不是浏览器环境，所以它没有`window.history`，它不需要再去考虑`popstate hashchange`事件，不需要去管浏览器的地址栏，但是它需要自己管理路由历史记录。所在`AbstractHistory`里面，设置了`stack`数组来存储访问的路由对象，设置了一个`index`实例属性，来表示当前访问的路由位置。

解析如下：
```js
/* @flow */

import type Router from '../index'
import { History } from './base'
import { NavigationDuplicated } from './errors'
import { isExtendedError } from '../util/warn'

export class AbstractHistory extends History {
  index: number
  stack: Array<Route>

  constructor (router: Router, base: ?string) {
    super(router, base)
    this.stack = []
    this.index = -1
  }

  push (location: RawLocation, onComplete?: Function, onAbort?: Function) {
    this.transitionTo(
      location,
      route => {
        // 注意这里是slice(0, this.index+1)调用
        // 所以[0, this.index]这个区间的元素都被slice出来了，然后拼接一个route
        // 得到一个新数组作为浏览器的历史记录数组
        // 这个逻辑处理方式，跟浏览器对历史记录的管理是相似的
        this.stack = this.stack.slice(0, this.index + 1).concat(route)
        this.index++
        onComplete && onComplete(route)
      },
      onAbort
    )
  }

  replace (location: RawLocation, onComplete?: Function, onAbort?: Function) {
    this.transitionTo(
      location,
      route => {
        // 注意这里是slice(0, this.index)调用
        // this.index这个位置的元素不会被包含在slice的返回结果里面
        // 所以这样就能达到把this.index的元素替换为route
        // 但是另一方面的话，this.index+1 这个位置开始之后的所有Route对象就都被丢弃了
        this.stack = this.stack.slice(0, this.index).concat(route)
        onComplete && onComplete(route)
      },
      onAbort
    )
  }

  go (n: number) {
    const targetIndex = this.index + n
    if (targetIndex < 0 || targetIndex >= this.stack.length) {
      return
    }
    const route = this.stack[targetIndex]
    this.confirmTransition(
      route,
      () => {
        this.index = targetIndex
        this.updateRoute(route)
      },
      err => {
        if (isExtendedError(NavigationDuplicated, err)) {
          this.index = targetIndex
        }
      }
    )
  }

  // 这个函数在AbstractHistory中被实现了
  // 但是在vue-router的其它源码中看不到对它的调用
  getCurrentLocation () {
    const current = this.stack[this.stack.length - 1]
    return current ? current.fullPath : '/'
  }

  // 这个函数没必要实现了，因为非浏览器环境，没有地址栏需要去关注
  ensureURL () {
    // noop
  }
}
```

## go的处理
不同于`Html5History HashHistory`可以直接使用`window.history.go`来实现`go`这个方法，`AbstractHistory`必须自己来实现`go`方法。不过看`go`的代码，不太明白一点：为什么不直接用`transitionTo`这个统一的路由跳转入口，而是要使用更加底层的`confirmTranstion`方法。

还有这行代码:
```js
        if (isExtendedError(NavigationDuplicated, err)) {
          this.index = targetIndex
        }
```
感觉可以不加，因为触发了`NavigationDuplicated`，说明路由被`abort`了，路由被`abort`的话，`index`为啥需要改变呢。

不过`go`里面的处理有一点是对的，就是不改变`stack`数组的内容，只调整访问的指针`index`。这是与浏览器历史记录管理的特点相符的。曾经写过一篇跟浏览器记录访问相关的文章，可以帮助了解这一点：[理解浏览器的历史记录](https://www.cnblogs.com/lyzg/p/5941919.html)

## replace处理
`replace`方法看起来对于历史记录的管理，跟浏览器的管理方式不同，就是它会删除掉当前记录之后的记录，而不是仅仅替换当前记录，这一点在注释中有说明。

## 后记
这个类暂时没看到它的具体用处，所以以上还存在一些不明朗的地方。