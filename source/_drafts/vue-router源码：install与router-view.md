---
title: vue-router源码：install与router-view
tags:
  - Vue
  - vue-router
  - vue-router源码
categories:
  - Javascript
  - Vue
  - vue-router
---

vue-router源码解析系列。这是第一篇。本篇介绍源码中的`install.js`和`components/view.js`（也就是`router-view`）。即使对vue-router全部源码不敢兴趣，本篇内容也能帮助你更深入理解`router-view`。跟其它对vue-router源码的解读不一样，我是先从`router-view`着手的。本系列解析的是官方git库中3.1.6的版本源码。要学好源码，必须先掌握`vue-router`的运用。

<!-- more -->
## install.js
`vue-router`是需要以插件的形式，安装到基于`vue`的app中的。这里的app以及以后的app，指的不是安卓和ios的app，而是指`vue`开发的网页应用。`install.js`就是`vue-router`源码中按照`vue`插件开发要求写的插件实现。源码链接：[install.js](/code/vue-router/source-code/install.js)。

代码不多，我拆分要点总结。在看他人源码分析前，其实自己应该要先去做学习，可能你自己本身就能学好，看别人的东西，更多的作用是查漏补缺。

```js
export let _Vue

export function install (Vue) {
  if (install.installed && _Vue === Vue) return
  install.installed = true

  _Vue = Vue

  // ...
}
```
这段是避免重复安装。 说实话没有它也没关系，只是框架开发者从自身角度，在帮助开发者减少错误。

```js
  const registerInstance = (vm, callVal) => {
    let i = vm.$options._parentVnode
    if (isDef(i) && isDef(i = i.data) && isDef(i = i.registerRouteInstance)) {
      i(vm, callVal)
    }
  }

  Vue.mixin({
    beforeCreate () {
      if (isDef(this.$options.router)) {
        this._routerRoot = this
        this._router = this.$options.router
        this._router.init(this)
        Vue.util.defineReactive(this, '_route', this._router.history.current)
      } else {
        this._routerRoot = (this.$parent && this.$parent._routerRoot) || this
      }
      registerInstance(this, this)
    },
    destroyed () {
      registerInstance(this)
    }
```
这一段是有核心作用的。首先`this.$options.router`这个数据，是指在构建`vue`实例的时候传入的`options.router`，一般app都是下面的方式实例化并且传入`router`实例：
```js
new Vue({
  router, // vue-router实例，按照vue-router的使用方式构建，通常在router/index.js文件
  render(h) {
    return h(App)
  }
}).$mount('#app')
```
从`beforeCreate`的代码可以看到，这段代码：
```js
this._routerRoot = this
this._router = this.$options.router
this._router.init(this)
Vue.util.defineReactive(this, '_route', this._router.history.current)
```
只在实例化时传入了`router`这个option的`vue`实例内才会执行，而这种实例通常都是app实例；普通的实例则通过下面这样代码：
```js
this._routerRoot = (this.$parent && this.$parent._routerRoot) || this
```
依赖vue实例的`parent`引用，一级一级地引用至根级别的vue实例（也就是app实例上）的`_routerRoot`属性，从而保证了app实例范围内，所有的vue实例都能通过`_routerRoot`访问到同一个对象。
```js
this._routerRoot = this
this._router = this.$options.router
this._router.init(this)
Vue.util.defineReactive(this, '_route', this._router.history.current)
```
这四行代码有四个作用：
* 在app实例上定义了一个`_routerRoot`属性，指向自己
* 在app实例上定义了一个`_router`属性，指向`vue-router`实例
* 执行了`router`的初始化，也就是路由的初始化，这样app的路由能力就起来了
* 在app实例上定义了一个响应式属性`_route`，初值为`this._router.history.current`，也就是当前的`route`对象；route对象是什么，route对象是`vue-router`在内部做了路径匹配之后创建的一个对象，包含了当前路由相关的所有信息；这个`_route`是响应式的，意味着对这个属性的修改，将引发`app`实例的`render`。 这点非常重要！

在前面代码中，可以看到在`beforeCreate`和`destroyed`两个钩子函数中，都最后调用了这个函数：
```js
  const registerInstance = (vm, callVal) => {
    let i = vm.$options._parentVnode
    if (isDef(i) && isDef(i = i.data) && isDef(i = i.registerRouteInstance)) {
      i(vm, callVal)
    }
  }
```
这个函数有它关键性的作用，它表面上其实就是为了调用最终得到一个`registerRouteInstance`方法，而这个方法是在`router-view`的源码中定义的，所以在学`route-view`的时候，反过来解释比较好。

`install.js`还有以下一段代码，值得解析：
```js
  Object.defineProperty(Vue.prototype, '$router', {
    get () { return this._routerRoot._router }
  })

  Object.defineProperty(Vue.prototype, '$route', {
    get () { return this._routerRoot._route }
  })
```
它的作用是在`vue`的原型对象上，分别定义了两个属性`$router`和`$route`，这就是我们在使用`vue-router`的时候，为什么在所有`.vue`文件里，都能通过`this.$route`和`this.$router`拿到当前的`route`对象和`vue-router`实例的根本原因。而`$route`的本质，其实就是前面代码中定义的那个响应式属性`_route`，`$router`本质上就是在`beforeCreate`里面通过`options.router`传到app实例上的`vue-router`实例。 

## router-view
