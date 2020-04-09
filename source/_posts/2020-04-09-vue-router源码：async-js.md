---
title: vue-router源码：async.js
tags:
  - Vue
  - vue-router
  - vue-router源码
categories:
  - Javascript
  - Vue
  - vue-router
date: 2020-04-09 13:41:24
---

vue-router源码解析系列。这是第五篇。本篇介绍源码中的`async.js`，它是`vue-router`框架里面跟那些守卫函数密切相关的一个工具，起到一个队列的作用，了解它之后对于下一篇学习`History`类比较有用。本系列解析的是官方git库中3.1.6的版本源码。

<!-- more -->
源码链接：[async.js](/code/vue-router/source-code/util/async.js)。源码里面用的是typescript，但是不影响阅读。
```js
/* @flow */
export function runQueue (queue: Array<?NavigationGuard>, fn: Function, cb: Function) {
  const step = index => {
    if (index >= queue.length) {
      // 整个回调队列完成执行时回调cb
      cb()
    } else {
      if (queue[index]) {
        fn(queue[index], () => {
          // 第二个参数作为一个回调函数，在fn的内部应该被主动调用
          // 以便执行下一个队列中的任务
          step(index + 1)
        })
      } else {
        // 没有queue[index]，则直接进入下一个
        step(index + 1)
      }
    }
  }
  step(0)
}
```
这是一个自动运行队列的函数，queue是队列数据结构，是一个数组，里面的每个元素要么为空，要么是一个回调函数，代表一个任务；fn是执行队列任务的函数，fn是外部定义的，fn调用时传入两个参数，第一个参数是当前从queue中读取出的任务:`queue[index]`，第二参数是这个回调函数：
```js
() => {
    // 第二个参数作为一个回调函数，在fn的内部应该被主动调用
    // 以便执行下一个队列中的任务
    step(index + 1)
}
```
fn是外部传入的，所以上面那个箭头回调函数，是给外部定义的fn内的代码用的，fn内部执行时应该要手动执行这个回调函数，来让队列在当前任务结束后，自动开启下一个任务的执行；第三个参数cb是一个回调函数，在队列所有的任务全部完成时执行。
如果`queue[index]`是空的，则自动执行下一个任务。

在`History`的源码当中，有一段对`runQueue`函数的使用：
```js
// queue是如何构造的细节暂时不用考虑
// queue最终里面存储的就是vue-router官方文档里面介绍的那些守卫函数
// queue每个元素要么是空的， 要么是一个函数
const queue = [].concat(
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
const iterator = (hook, next) => {
    if (this.pending !== route) {
        return abort()
    }
    try {
        hook(route, current, (to) => {
            if (to === false || isError(to)) {
                // next(false) -> abort navigation, ensure current URL
                this.ensureURL(true)
                abort(to)
            } else if (typeof to === 'string' ||
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
                next(to)
            }
        })
    } catch (e) {
        abort(e)
    }
}

runQueue(queue, iterator, () => {
    // 省略
    // queue执行完会执行这里
})
```
上面的代码中可以看到`iterator`就是`runQueue`这个文件源码里面的fn，`iterator`的第一个参数，就是`runQueue`内`fn`被调用时传入进来的`queue[index]`，`iterator`的第二个参数`next`，就是`fn`被调用时的第二个参数。  只要`iterator`里面，主动调用next，就会自动执行下一个队列任务。