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
date: 2020-03-21 18:34:48
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
`router-view`是`vue-router`提供的一个内置组件，用来渲染路由所匹配的`vue`组件，它所在的源码文件为：[components/views.js](/code/vue-router/source-code/components/view.js)。理解它的源码，对于深入掌握`vue-router`的用法有很多帮助。它的代码量也不多。

整体上的，它的结构为：
```js
import { warn } from '../util/warn'
import { extend } from '../util/misc'

export default {
  name: 'RouterView',
  functional: true,
  props: {
    name: {
      type: String,
      default: 'default'
    }
  },
  render (_, { props, children, parent, data }) {
    data.routerView = true
    const h = parent.$createElement

    // ...
    return h(component, data, children)
  }
}
```
`warn`是一个在别的源码中的定义的工具函数，用来打印日志；`extend`也是别的地方定义的一个工具函数，用来进行属性的拷贝，类似`Object.extend`。通过上面的代码结构可以看到，`router-view`其实是一个函数式组件，`functional`这个`option`设置为`true`，所以它本身不会进行实际渲染，而是通过`render`函数内部逻辑，渲染其它的`component`。 `router-view`的render函数写法，也是`vue`官方文档中对于`函数式组件`说明的标准的`render`函数写法，第二个参数是一个`context`对象，描述了函数式组件在被`render`时的上下文，只不过源码中采用了函数参数解构的方式来定义了`props children parent data`这几个参数。 这个几个参数的具体含义从名字也能知其一二，详细地说明，可前往`vue`官方文档进行了解。

`render`函数的最后调用了`h(component, data, children)`，说明`render`函数最终是通过创建其它`component`的`vnode`来完成渲染的，函数式组件就是这样，它一定是用来创建其它组件的vnode，而不是自己的，自己的意义不大。

另外从这段代码也能看到，`router-view`仅定义了一个属性`name`，这也是在使用`vue-router`中经常用的：
```html
<router-view name="main"></router-view>
```
这个`name`会传入到`props`中。在后续的`render`逻辑中有重要作用。


接下来分段解析`render`函数中的代码。
```js
data.routerView = true
```
从这里开始注意，`data`这个变量，在`render`函数中，代表的是`vnode`的数据对象，它不是`vue`实例的那个数据对象，在`vue`的render函数中，更多的是跟`vnode`的逻辑，而不是`vue`实例的逻辑。而且`vue`的核心数据结构，是`vnode`的树结构，而不是我们熟知的dom结构。app中的页面，是根据`vnode tree`渲染出来的。而`vnode tree`也不仅仅用于渲染dom，在官方的`devtools`中，有一个类似`elements`的调试面板，开发者工具中可见，它是以`vnode tree`结构来描述页面的，`data.routerView`的作用，可以在`devtools`中一目了然的看到哪个`vnode`是`router-view`所渲染出来的。
<img src="{% asset_path "03.png" %}" width="auto">

接下来是这段代码：
```js
// directly use parent context's createElement() function
// so that components rendered by router-view can resolve named slots
const h = parent.$createElement
const name = props.name
const route = parent.$route
const cache = parent._routerViewCache || (parent._routerViewCache = {})
```
首先明确`parent`是一个`vue`实例，而不是`vnode`对象。这段代码有很多的要点。 先来看第一行：
```js
const h = parent.$createElement
```
这行代码定义了一个`h`变量来作为`render`中函数中最终进行`vnode`创建的函数，而不是`render`函数的第一个参数。 根据注释我们能知道原因，说明如果不用`parent.$createElement`，`router-view`所渲染的组件，是不具备解析具名插槽的能力的。 这是一种什么样的使用场景呢？

原来在大多数场景中，我们使用`router-view`，都是把它当成一个单一标签来用的：
```html
<router-view></router-view>
```
殊不知，`router-view`是可以像下面一样的使用的：
```html
<!-- 定义router-view -->
<router-view title="test">
  <template #test="{avatar}">
    <img :src="avatar">
  </template>
  <p>流云诸葛</p>
</router-view>

<!-- 被上面的router-view渲染的某个component -->
<template>
  <div>
    <slot></slot>
    <slot name="test" :avatar="'http://...'"></slot>
  </div>
</template>
```
在这种使用过程中：`const h = parent.$createElement`是会起到作用的，因为`component`的vnode，是通过`router-view`父组件的`createElement`创建的。

另外还能看到除了`name`会作为`props`外，`router-view`组件还能定义其它`attributes`，比如上面的`title`。最终这些`attributes`和具名插槽，都会进入`router-view`函数中的`data`变量，而默认插槽，则会进入`children`变量，最后调用`h(component, data, children)`时，它们也就在实际渲染的`component`里面生效了。

再看第二行：
```js
const name = props.name
```
这个的话，拿到了当前`router-view`的名字，在后续逻辑中有重要作用，因为`vue-router`中，定义路由时，一个路由可以匹配到多个`router-view`组件，然后每个`router-view`组件，渲染不同的`component`：
```js
const router = new VueRouter({
  routes: [
    {
      path: '/',
      components: {
        default: Foo,
        a: Bar,
        b: Baz
      }
    }
  ]
})
```
那显然，一个`router-view`组件是只能渲染一个`component`的，那它该渲染谁呢？这个对应关系就是通过`name`属性建立的。

第三行代码：
```js
const route = parent.$route
```
这行代码拿到了`parent`节点实例的`$route`属性，这个属性在上面的`install.js`中已经知道它是干什么的，反正拿到它，就能拿到当前`vue-router`框架下，根据路径所匹配到的路由数据，也就是一个`route`对象。这行代码看起来很简单，实际上作用也非常大，暂时不介绍，到后面其它代码会与其有关。

第四行代码：
```js
const cache = parent._routerViewCache || (parent._routerViewCache = {})
```
这行代码在父组件实例上定义了一个`_routerViewCache`的对象，从名称就能看到，它的作用是用来做缓存管理的。那么什么场景需要这个对象呢？这个跟后面的代码有关，后面着重拿出来分析，并且会告诉你有哪个场景与它对应。 首先可以明确的是，`vue`是一个不断进行`render`的模式，每个`vue`实例都有自己的生命周期，这里面的`parent`也是，所以如果`parent._routerViewCache`要起到实际价值的话，`parent`实例本身就必须一直存活着才行，所以这个`_routerViewCache`是与`keep-alive`有关的。

接下来分析这段代码：
```js
// determine current view depth, also check to see if the tree
// has been toggled inactive but kept-alive.
let depth = 0
let inactive = false
// parent._routerRoot === parent 说明parent是app实例
while (parent && parent._routerRoot !== parent) {
  const vnodeData = parent.$vnode ? parent.$vnode.data : {}
  if (vnodeData.routerView) {
    depth++
  }
  if (vnodeData.keepAlive && parent._directInactive && parent._inactive) {
    inactive = true
  }
  parent = parent.$parent
}
// 估计也跟devtools有关，暂时没看到它的用途
data.routerViewDepth = depth
```
这段代码的作用就是为了得到两个状态：`depth`和`inactive`。

`depth`是个什么概念？当`router-view`位于app顶级组件中，这个`router-view`的`depth`就是0，但是如果`router-view`存在嵌套，那么嵌套的子`router-view`在执行`render`函数时，它的`depth`就不再是0了。如：
```html
<!-- App.vue -->
<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<!-- Foo.vue -->
<template>
  <div>
    <router-view></router-view>
  </div>
</template>

<!-- Bar.vue -->
<template>
  <div>
    <router-view></router-view>
  </div>
</template>
```
假如以上三个组件中的`router-view`存在嵌套关系，`App.vue -> Foo.vue -> Bar.vue`，我可以这么定义路由:
```js
{
  path: '/',
  name: 'index',
  component: import(/* webpackChunkName: "detail" */ '../page/Foo.vue'),
  children: [
    {
      path: 'foo',
      name: 'foo',
      component: import(/* webpackChunkName: "detail" */ '../pages/Bar.vue'),
      children: [
        {
          path: 'bar',
          name: 'bar',
          component: import(/* webpackChunkName: "detail" */ '../pages/Conent.vue'),
        }
      ]
    }
  ]
}
```
当你访问`/foo/bar`时，最终会按照`App.vue -> Foo.vue -> Bar.vue`的先后关系完成渲染，这样的话，一共会有三个`router-view`组件被渲染，第一个实际渲染的是`Foo.vue`，第二个实际渲染的是`Bar.vue`，第三个实际渲染的是`Content.vue`。 而这三个`router-view`在执行`render`函数时，运行到`depth`相关的那个`while`函数，最终`depth`的值分别就是`0 1 2`。
```js
const vnodeData = parent.$vnode ? parent.$vnode.data : {}
  if (vnodeData.routerView) {
    depth++
  }
```
`vnodeData`是拿到了父组件实例的`vnode`的数据对象，如果父组件实例是通过`router-view`渲染的，那么`vnodeData.routerView`一定为true，看`render`函数的第一行就知道了。

`depth`有什么作用呢？它跟`const route = parent.$route`得到的`route`变量使用有关，后面有一行代码：
```js
const matched = route.matched[depth]
```
这里就是`depth`起作用的地方，`route`变量是`vue-router`内部核心代码所创建的一个描述路由信息的数据对象，它有一个`matched`属性，这是一个数组，存放`vue-router`经过路由匹配解析之后的route信息。 像上面举例的那种路由配置结构，当访问`/foo/bar`时，所对应的`route.matched`会包含三个元素：
<img src="{% asset_path "04.png" %}" width="auto">
由此可见`depth`与`route.matched`中的元素顺序正好是对应的，所以通过`route.matched[depth]`就能找到与当前`router-view`组件对应的`route`配置信息。 至于为什么它们有这种关联，显然跟`route`对象的创建过程有关，这就是`vue-route`其它代码的功劳了。

`inactive`这个变量也是在前面这个`while`循环中赋值的，因为它跟`depth`状态一样，都是网上遍历`tree`得出的。`inactive`为`true`的含义是，当前的`router-view`组件，正处于一个`keep-alive`模式下且当前是非激活状态的`tree`当中。 后面单独来介绍它的应用场景。

接下来看这段代码：
```js
const matched = route.matched[depth]
const component = matched && matched.components[name]

// render empty node if no matched route or no config component
if (!matched || !component) {
  cache[name] = null
  return h()
}

// cache component
cache[name] = { component }

const configProps = matched.props && matched.props[name]
// save route and configProps in cachce
if (configProps) {
  extend(cache[name], {
    route,
    configProps
  })
  fillPropsinData(component, data, route, configProps)
}

return h(component, data, children)
```
以上是`render`函数的创建`component`的`vnode`的基础代码，为了不受其它代码的干扰，我暂时把其它不相干的代码移除掉了，它们会在后面的部分来单独说明。

首先：
```js
const matched = route.matched[depth]
const component = matched && matched.components[name]
```
`cache`是`parent._routerViewCache`，前面代码已经定义了的。通过`route`和`depth`能拿到当前`route-view`所匹配的相关`route`配置，也就是`matched`变量所指向的，这个`matched`包含的就是类似下面的数据：
<img src="{% asset_path "05.png" %}" width="auto">
`matched`上面的`components`和`instances`都是在`router-view`源码中要用到的。而`matched.components`实际上就是路由配置时定义的组件配置，如：
```js
{
  path: '/',
  components: {
    default: Foo,
    a: Bar,
    b: Baz
  }
}
```
上面这个配置距离是单路由多视图的配置，如果是单视图配置，component名称默认就是`default`。 所以最后通过这行代码：`const component = matched && matched.components[name]`就拿到了当前`router-view`实际要渲染的组件了。

剩下这段就好理解：
```js
// 没有匹配到路由，或者匹配到路由，没有当前的router-view定义相应的component
if (!matched || !component) {
  cache[name] = null
  return h()
}

// 将当前要渲染的component以name为键名，缓存在父节点内
cache[name] = { component }
```

接下来这段代码：
```js
const configProps = matched.props && matched.props[name]
// save route and configProps in cachce
if (configProps) {
  extend(cache[name], {
    route,
    configProps
  })
  fillPropsinData(component, data, route, configProps)
}

return h(component, data, children)
```
`configProps`是解析出路由配置中的`props`数据，`vue-router`中有这块的[文档说明](https://router.vuejs.org/zh/guide/essentials/passing-props.html#%E5%B8%83%E5%B0%94%E6%A8%A1%E5%BC%8F)，通过这处代码，我们能更加清晰地理解官方的文档说明。

只有`configProps`为trusy，下面的代码才会继续：
```js
extend(cache[name], {
  route,
  configProps
})
fillPropsinData(component, data, route, configProps)
```
`extend`的作用，就是把当前的`route`和`configProps`数据，也添加到缓存中去，这样`cache[name]`里缓存的就有：`component route configProps`。

`fillPropsinData`是解析`props`数据，并把这些数据，放入到`data.props`，这样就完成路由参数到组件`props`的解耦。 它依赖的是`fillPropsinData`、`resolveProps`这2个函数：
```js
function fillPropsinData (component, data, route, configProps) {
  // resolve props
  let propsToPass = data.props = resolveProps(route, configProps)
  if (propsToPass) {
    // clone to prevent mutation
    propsToPass = data.props = extend({}, propsToPass)
    // pass non-declared props as attrs
    const attrs = data.attrs = data.attrs || {}
    for (const key in propsToPass) {
      if (!component.props || !(key in component.props)) {
        attrs[key] = propsToPass[key]
        delete propsToPass[key]
      }
    }
  }
}

function resolveProps (route, config) {
  switch (typeof config) {
    case 'undefined':
      return
    case 'object':
      return config
    case 'function':
      return config(route)
    case 'boolean':
      return config ? route.params : undefined
    default:
      if (process.env.NODE_ENV !== 'production') {
        warn(
          false,
          `props in "${route.path}" is a ${typeof config}, ` +
          `expecting an object, function or boolean.`
        )
      }
  }
}
```
这两个函数不难理解，所以不过多说明，补充2个要点：
* 从resolveProps就能理解[官方文档](https://router.vuejs.org/zh/guide/essentials/passing-props.html#%E5%B8%83%E5%B0%94%E6%A8%A1%E5%BC%8F)里面提到了那些布尔模式、函数模式和对象模式了
* fillPropsinData内部，会根据`component.props`的定义，来决定把哪些数据放到`data.props`，未在`component.props`里定义的`configProps`解析出的数据，将会放入`data.attrs`

最后一行代码：
```js
return h(component, data, children)
```
就是创建好了实际component的`vnode`节点，下一步就是实例化相应的`component`，并且执行它的`render`方法完成最终渲染了。

接下来看这段代码，为了引用方便，给它起个代号A：
```js
if (inactive) {
  const cachedData = cache[name]
  const cachedComponent = cachedData && cachedData.component
  if (cachedComponent) {
    // #2301
    // pass props
    if (cachedData.configProps) {
      fillPropsinData(cachedComponent, data, cachedData.route, cachedData.configProps)
    }
    return h(cachedComponent, data, children)
  } else {
    // render previous empty view
    return h()
  }
}
```
这段代码把前面暂时性挂起的一些内容，全部关联起来了：`inactive`和`cache`的作用。从表面上看，它不难理解，就是在`inactive`为`true`时，从父节点读缓存，如果命中缓存，则以缓存的数据调用`h(cachedComponent, data, children)`并返回，否则就创建空白节点。难点在于：
1. 什么场景下会导致以上代码执行
2. 什么时候会进入h(cachedComponent, data, children)
3. `#2301`指的是什么

实际问题比上面还多些，我一一来解析。先来看`什么场景下会导致以上代码执行`，我给你准备下面这个配置：
```js
import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)
const Home = {
  render(h) {
    return h('div', [
      h('h1', ['Home']),
      h('p', [h('router-link', { props: { to: '/home/info' } }, ['Info'])]),
      h('router-view', {
        props:{
          name: 'sub'
        }
      })
    ])
  },
  created() {
    console.log(this.test)
  },
  props: {
    test: {
      required: true,
      type: String
    }
  }
}
const Foo = {
  render(h) {
    return h('div', ['Foo'])
  }
}
const Info = {
  render(h) {
    return h('div', ['Info'])
  },
  props: {
    test: {
      required: true,
      type: String
    }
  },
  created() {
    console.log(this.test)
  }
}

const router = new VueRouter({
  mode: 'history',
  routes: [
    {
      path: '/home',
      component: Home,
      props: {
        test: 'Test'
      },
      children: [
        {
          path: 'info',
          components: {
            sub: Info
          },
          props: {
            sub: {
              test: 'Test'
            }
          }
        }
      ]
    },
    { path: '/foo', component: Foo }
  ]
})

export default router
```
`App.vue`:
```html
<template>
  <div id="app">
    <router-link to="/home">/home</router-link>
    <router-link to="/foo">/foo</router-link>
    <keep-alive>
      <router-view></router-view>
    </keep-alive>
  </div>
</template>
```
你可以拿去做demo测试。这里面有三个路由：`/home /home/info /foo`，且app内使用了`keep-alive`，当你运行起来后，先访问`/home/info`，然后再访问`/foo`，就会触发我们要分析那段源码A的执行。因为`/home`跟`/home/info`是一个嵌套关系，涉及到两个`route-view`组件，当你访问`/home/info`时，两个`route-view`组件的`render`都会执行，并且都会把当前的`component`缓存到父级节点实例内，这是我们前面所有的代码学习已经明确了的。当你通过链接访问到`/foo`时，这两个`router-view`会发生什么：
1. 第一个`router-view`会执行`render`，但是它会创建一个新的`vnode`，用来渲染`Foo`组件；
2. 第二个`router-view`会执行`render`，但是它会执行源码A，而不是渲染什么新的component。

第二个`router-view`执行过程的逻辑是：
```js
  const cachedData = cache[name]
  const cachedComponent = cachedData && cachedData.component
  if (cachedComponent) {
    // #2301
    // pass props
    if (cachedData.configProps) {
      fillPropsinData(cachedComponent, data, cachedData.route, cachedData.configProps)
    }
    return h(cachedComponent, data, children)
  }
```
这个过程里，`cache`发挥了作用，如果从缓存中读取了`component route configProps`，就可以按照渲染新component的逻辑，来调用`h(cachedComponent, data, children)`创建节点。`cachedComponent`有值很重要，说明在这种嵌套的`router-view`加`keep-alive`场景中，只有被嵌套的`router-view`发生过渲染才会执行，假如前面的测试顺序是先访问`/foo`，再访问`/home/info`，就不会触发源码A的执行。

接下来有个非常关键的问题，为什么在`keep-alive`变为`inactive`时，第二个`router-view`的`render`函数会执行呢？一个被inactive的组件实例的`render`方法被执行，这不符合常理阿！经过一段时间的代码分析和调试，最终发现原因是这行代码：
```js
const route = parent.$route
```
为什么呢？因为`parent.$route`并不是一个简单的属性，而是在访问前面`install.js`中定义的那个响应式属性`_route`:
```js
Vue.util.defineReactive(this, '_route', this._router.history.current)
```
在`vue`的内部代码中，定义响应式属性的过程，实际上是重新定义`setter`和`getter`的过程。`parent.$route`最终访问的是`_route`这个响应式数据的`getter`，而`vue`在定义响应式数据时的`getter`源码是这样的：
<img src="{% asset_path "06.png" %}" width="auto">
我框出了关键性的代码，此处不会深入去分析它，正是因为框出的这段代码的作用，导致`parent.$route`的访问，会建立`parent`与`_route`之间的依赖关系，当`_route`变化的时候，`parent`就会`render`！这才是`router-view`组件只要渲染过一次，在route变化时，`router-view`组件无论是什么情况，都会重新`render`的根本原因。

下面一个问题：为什么不直接返回`h()`，而是要利用缓存呢，反正在源码A执行后所返回的这个vnode也是`inactive`的，就是不可见的。因为如果直接返回h()，则会导致cachedComponent本应该保持的状态丢失，也就是会把`inactive`的节点实例给销毁了。当cachedComponent从inactive恢复到active时，之前的状态就都丢了。从devtools调试发现，当直接return h()，router-view对应的节点已经不再是之前的component了。这会导致keep-alive的不一致性。

最后来看看`#2301`是什么回事，这个其实是一个`issue`的id，你访问: [https://github.com/vuejs/vue-router/issues/2301](https://github.com/vuejs/vue-router/issues/2301)就能查看详情，下面这段代码：
```js
    if (cachedData.configProps) {
      fillPropsinData(cachedComponent, data, cachedData.route, cachedData.configProps)
    }
```
是为了解决`#2301`提到的bug的。我翻了以前的一些版本源码，上面这段是没有的，这是后期做bug修复添加的。

来看最后一部分源码：
```js
    // attach instance registration hook
    // this will be called in the instance's injected lifecycle hooks
    data.registerRouteInstance = (vm, val) => {
      // val could be undefined for unregistration
      const current = matched.instances[name]
      if (
        (val && current !== vm) ||
        (!val && current === vm)
      ) {
        matched.instances[name] = val
      }
    }

    // also register instance in prepatch hook
    // in case the same component instance is reused across different routes
    ;(data.hook || (data.hook = {})).prepatch = (_, vnode) => {
      matched.instances[name] = vnode.componentInstance
    }

    // register instance in init hook
    // in case kept-alive component be actived when routes changed
    data.hook.init = (vnode) => {
      if (vnode.data.keepAlive &&
        vnode.componentInstance &&
        vnode.componentInstance !== matched.instances[name]
      ) {
        matched.instances[name] = vnode.componentInstance
      }
    }
```
这个部分的代码作用是一样的，只是场景不同的。 首先是`data.registerRouteInstance`，这个钩子函数，要跟`install.js`中的这段结合起来看：
```js
  const registerInstance = (vm, callVal) => {
    let i = vm.$options._parentVnode
    if (isDef(i) && isDef(i = i.data) && isDef(i = i.registerRouteInstance)) {
      i(vm, callVal)
    }
  }
```
`registerInstance`在vue实例的`beforeCreate`和`destroyed`两个生命周期钩子函数中调用，最终调用的是`router-view`所渲染vnode节点的数据对象上注册的`registerRouteInstance`钩子。 这个钩子有什么意义呢？它的作用就是在`router-view`创建的vnode节点最终渲染的实例对象，它被`beforeCreate`的时候关联到`matched.instances`这个对象上面去，它被`destroyed`的时候又从`matched.instances`里面移除。

然后是`data.hook.prepatch`这个钩子函数，在`vue`内部被调用，它是什么场景被调用呢？在vue-router的使用场景中，当路由相同，只是`params`不同时，路由组件实例会被重用，而不是重新`render`，此时`data.hook.prepatch`就会被调用，这个回调函数会传入两个参数，第一个参数是重用前的`vnode`，第二参数新创建的`vnode`。 在上面的源码中，在`prepatch`内部，通过第二个回调参数，更新了`matched.instances`。

最后是`data.hook.init`这个钩子函数，它的被调用场景是，当路由变化，组件位于keep-alive模式下，并且从`inactive`恢复到`active`时。 上面的源码中，在`init`函数内部，也是更新了`matched.instances`。

总结一下，就会看到，上面这三个钩子函数，本质上都做一件事情，就是维护`matched.instances`，让`matched.instances`始终能够指向的是与当前路由匹配的、实际被用户所看到的`vue`实例对象。 为什么要这么做呢？还记得`vue-router`那些守卫函数吧，`vue-router`是怎么完成那些实例上的守卫函数调用的呢？原因就在这里，就是因为`vue-router`总是知道当前渲染的节点是什么，所以在路由切换时，它就能在要离开的以及要渲染进来的节点实例上去调用对应的钩子函数！其它源码会告诉我们更多细节，敬请期待~

（完）。
