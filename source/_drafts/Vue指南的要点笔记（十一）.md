---
title: Vue指南的要点笔记（十一）
tags:
  - Vue指南要点笔记
  - Vue
categories:
  - Javascript
  - Vue
  - 指南要点
---

本篇开始学习Vue可复用性编程的内容，主要要点：
* mixin
* 插件
* 过滤器

<!-- more -->

## mixin
混入是一种常见的代码复用方式，前端成为mixin，php里面叫做traits。在vue里面，混入是一个普通的javascript对象：
```js
// 定义一个混入对象
var myMixin = {
  created: function () {
    this.hello()
  },
  methods: {
    hello: function () {
      console.log('hello from mixin!')
    }
  }
}
```
这个普通的对象，可以使用Vue的选项对象`options`定义的所有属性，参见vue的官方文档[选项相关的内容](https://cn.vuejs.org/v2/api/#%E9%80%89%E9%A1%B9-%E6%95%B0%E6%8D%AE)。**注意`data`属性在mixin对象里面，也要定义为一个函数**。
Vue的选项对象里面，有一个特殊的属性`mixins`，用来给Vue组件输入mixin对象，以达到复用mixin对象功能的目的。这个`mixins`属性是一个数组属性，所以可以接收多个mixin对象，所有mixin对象的功能最终在构造vm实例的时候，都会被复制给vm。
```js
// 定义一个使用混入对象的组件
var Component = Vue.extend({
  mixins: [myMixin]
})

var component = new Component() // => "hello from mixin!"
```
由于mixin对象和Vue的选项对象，完全使用相同的属性名称，且Vue选项对象的`mixins`属性是一个数组，所以很容易在mixin对象之间、以及mixin对象与Vue选项对象之间存在同名属性的冲突，Vue按照如下规则来处理冲突：
* 数据对象在内部会进行递归合并，并在发生冲突时以组件数据优先
```js
var mixin = {
  data: function () {
    return {
      message: 'hello',
      foo: 'abc'
    }
  }
}

new Vue({
  mixins: [mixin],
  data: function () {
    return {
      message: 'goodbye',
      bar: 'def'
    }
  },
  created: function () {
    console.log(this.$data)
    // => { message: "goodbye", foo: "abc", bar: "def" }
  }
})
```
* 同名钩子函数将合并为一个数组，因此都将被调用。另外，混入对象的钩子将在组件自身钩子之前调用。
```js
var mixin = {
  created: function () {
    console.log('混入对象的钩子被调用')
  }
}

new Vue({
  mixins: [mixin],
  created: function () {
    console.log('组件钩子被调用')
  }
})

// => "混入对象的钩子被调用"
// => "组件钩子被调用"
```
* 值为对象的选项，例如 methods、components 和 directives，将被合并为同一个对象。两个对象键名冲突时，取组件对象的键值对。
```js
var mixin = {
  methods: {
    foo: function () {
      console.log('foo')
    },
    conflicting: function () {
      console.log('from mixin')
    }
  }
}

var vm = new Vue({
  mixins: [mixin],
  methods: {
    bar: function () {
      console.log('bar')
    },
    conflicting: function () {
      console.log('from self')
    }
  }
})

vm.foo() // => "foo"
vm.bar() // => "bar"
vm.conflicting() // => "from self"
```

以上选项合并策略，除了发生在mixin对象与vue选项对象之间，还可能发生在`Vue.extend`所创建的Vue子类之上。示例如下：
```js
let FadeComp = Vue.extend({
    data: function () {
        return {
            message: 'goodbye',
            bar: 'def'
        }
    },
    template: `<transition name="fade"><slot></slot></transition>`
});

new FadeComp({
    data: function () {
        return {
            message: 'hello',
            foo: 'abc'
        }
    },
    created(){
        console.log(this.$data);
        // => { message: "goodbye", foo: "abc", bar: "def" }
    }
});
```
通过这个例子可以看到`Vue.extend`定义一个Vue子类时传入的`options`对象，可以看作是一个mixin对象，当对这个子类进行实例化的时候，传入的`options`对象，才是组件的选项对象，优先级更高，且会自动采用类似mixin对象的合并策略。

### 全局mixin
Vue提供了一个静态方法：`Vue.mixin`，可以定义全局的mixin对象，不需要通过`mixins`属性注入，所有的Vue实例都会应用。这个api威力强大，但是也很危险，需慎用。

### 自定义选项的合并策略
不管是mixin对象，还是Vue.extend使用的`options`对象，最终都会组件的选项对象发生合并，Vue默认的合并策略，可能不满足项目的需求，所以Vue提供了自定义选项的合并策略，选项对象的任意属性都能自定义它的合并策略，只需要在`Vue.config.optionMergeStrategies`这个配置对象上，为选项对象的属性定义一个函数：
```js
Vue.config.optionMergeStrategies.myOption = function (parent, child, vm) {
  // 返回合并后的值
}
```
合并策略选项分别接收在父实例和子实例上定义的该选项的值作为第一个和第二个参数，Vue实例上下文被作为第三个参数传入。
```js
Vue.config.optionMergeStrategies._my_option = function (parent, child, vm) {
  return child + 1
}

const Profile = Vue.extend({
  _my_option: 1
})

// Profile.options._my_option = 2
```

## 插件
## 过滤器

