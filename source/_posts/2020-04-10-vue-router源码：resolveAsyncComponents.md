---
title: vue-router源码：resolveAsyncComponents
tags:
  - Vue
  - vue-router
  - vue-router源码
categories:
  - Javascript
  - Vue
  - vue-router
date: 2020-04-10 12:56:31
---


vue-router源码解析系列。这是第七篇。本篇介绍源码中的`resolve-components.js`，它是`vue-router`里面解析异步组件的函数。本系列解析的是官方git库中3.1.6的版本源码。

<!-- more -->
源码链接：[resolve-components.js](/code/vue-router/source-code/util/resolve-components.js)。源码里面用的是typescript，但是不影响阅读。

代码解析如下：
```js
/* @flow */

import { _Vue } from '../install'
import { warn, isError } from './warn'

export function resolveAsyncComponents (matched: Array<RouteRecord>): Function {
  return (to, from, next) => {
    let hasAsync = false
    let pending = 0
    let error = null

    // matched 可能包含多个RouteRecord
    // 每个RouteRecord可能有多个component的定义
    // flatMapComponents的价值就是要处理所有
    flatMapComponents(matched, (def, _, match, key) => {
      // if it's a function and doesn't have cid attached,
      // assume it's an async component resolve function.
      // we are not using Vue's default async resolving mechanism because
      // we want to halt the navigation until the incoming component has been resolved.
      if (typeof def === 'function' && def.cid === undefined) {
        hasAsync = true
        pending++

        // 这个函数在def被调用
        // 并且关联的异步组件已经完成加载时会被调用
        // 最终把解析到的异步组件用来添加到match.components中
        const resolve = once(resolvedDef => {
          if (isESModule(resolvedDef)) {
            resolvedDef = resolvedDef.default
          }
          // save resolved on async factory in case it's used elsewhere
          def.resolved = typeof resolvedDef === 'function'
            ? resolvedDef
            : _Vue.extend(resolvedDef)
          match.components[key] = resolvedDef
          pending--
          if (pending <= 0) {
            next()
          }
        })

        // 这个函数在异步组件解析失败时调用
        const reject = once(reason => {
          const msg = `Failed to resolve async component ${key}: ${reason}`
          process.env.NODE_ENV !== 'production' && warn(false, msg)
          if (!error) {
            error = isError(reason)
              ? reason
              : new Error(msg)
            next(error)
          }
        })

        let res
        try {
          // 调用def，resolve和reject作为回调函数传入进去
          // 至于resolve和reject会不会在def内部被调用
          // 取决于def
          res = def(resolve, reject)
        } catch (e) {
          reject(e)
        }
        if (res) {
          // 以下的情况处理的是def返回的含有Promise实例时
          // 通过Promise来触发resolve和reject
          if (typeof res.then === 'function') {
            res.then(resolve, reject)
          } else {
            // new syntax in Vue 2.3
            const comp = res.component
            if (comp && typeof comp.then === 'function') {
              comp.then(resolve, reject)
            }
          }
        }
      }
    })

    if (!hasAsync) next()
  }
}

const hasSymbol =
  typeof Symbol === 'function' &&
  typeof Symbol.toStringTag === 'symbol'

function isESModule (obj) {
  return obj.__esModule || (hasSymbol && obj[Symbol.toStringTag] === 'Module')
}

// in Webpack 2, require.ensure now also returns a Promise
// so the resolve/reject functions may get called an extra time
// if the user uses an arrow function shorthand that happens to
// return that Promise.
function once (fn) {
  let called = false
  return function (...args) {
    if (called) return
    called = true
    return fn.apply(this, args)
  }
}
```
以上代码不是很难理解，补充一点使用上的内容：
要在`vue-router`中使用异步组件，有两种做法：
```js
const Index = () => import(/* webpackChunkName: "Index" */ '../pages/Index.vue')
const List = r => require.ensure([], () => r(require('../pages/List.vue')), 'List')
```
这两种做法，有一个共同点，就是`Index List`都是一个函数，所以在上面的代码中，判断一个组件是否为异步组件，是根据`def`是否为一个函数来判断的，如果`def`不是函数，那么`resolveAsyncComponents`的并没有什么作用。

