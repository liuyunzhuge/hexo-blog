---
title: Vue指南的要点笔记（十四）
tags:
  - Vue指南要点笔记
  - Vue
categories:
  - Javascript
  - Vue
  - 指南要点
---

本篇继续Vue render函数的内容。主要要点有：
1. 使用 JavaScript 代替模板功能
2. JSX
3. 函数式组件


<!-- more -->

## 使用 JavaScript 代替模板功能

### v-if和v-for
只要在原生的 JavaScript 中可以轻松完成的操作，Vue 的渲染函数就不会提供专有的替代方法。比如，在模板中使用的 v-if 和 v-for。因为render函数是纯js，所以v-if和v-for没有替代的必要了。

### v-model
在渲染函数中使用v-model，本质是没有变的，只不过没有原来的模板中那么方便。简单地举例：
```html
<div id="vue">
    <custom-input v-model="name"></custom-input>
    <p>{{name}}</p>
</div>
<script type="text/javascript">

    Vue.component('custom-input', {
        model: {
            event: 'model',
            value: 'value',
        },
        props: ['value'],
        render(createElement) {
            return createElement('input', {
                attrs: this.$attrs,
                domProps: {
                    value: this.value
                },
                on: {
                    input: ($event) => {
                        this.$emit('model', $event.target.value);
                    }
                }
            })
        }
    });

    let vm = new Vue({
        el: '#vue',
        data() {
            return {
                name: '1111'
            }
        }
    });
</script>
```
[点此查看演示](/code/vue/render/10.html)

## JSX
利用babel插件，vue的render函数可以像react那样用jsx来编写。[参考](https://cn.vuejs.org/v2/guide/render-function.html#JSX)

## 函数式组件
函数式组件就是无状态（无响应式数据)，无实例（无this），无生命周期的特殊组件。它的作用就是利用render函数来创建真正需要的组件，可以把它看成一个组件渲染的中转代理层。

函数式组件如何使用？核心：
1. 配置`funcitonal: true`，标识一个组件是一个函数式组件
2. 使用render函数的第二个参数`context`，因为函数式组件本身无状态、无实例、那怎么访问到外部传入的props，怎么访问父子标签对应的节点呢，通通借助context对象。

简而言之，在函数式组件里面，最多只需要三个option: `functional` `props` `render()`。

context对象的属性：
* props：提供所有 prop 的对象
* children: VNode 子节点的数组
* slots: 一个函数，返回了包含所有插槽的对象
* scopedSlots: (2.6.0+) 一个暴露传入的作用域插槽的对象。也以函数形式暴露普通插槽。
* data：传递给组件的整个数据对象，作为 createElement 的第二个参数传入组件
* parent：对父组件的引用
* listeners: (2.3.0+) 一个包含了所有父组件为当前组件注册的事件监听器的对象。这是 data.on 的一个别名。
* injections: (2.3.0+) 如果使用了 inject 选项，则该对象包含了应当被注入的属性。

接下来一一了解。

### props
函数组件会声明自己的props，当函数组件的标签用于模板中或其她组件的render函数中，如果函数组件的vnode被传递props，那么都会反馈到context.props里面来。说白了，就是通过这个可以访问到函数组件props的值。
```html
<div id="vue">
    <layout direction="horizontal" width="100px" height="200px">
    </layout>
</div>
<script type="text/javascript">
    Vue.component('layout', {
        functional: true,
        props: ['direction', 'width', 'height'],
        render(createElement, context) {
            console.log(context.props);
            // {height: "200px", width: "100px", direction: "horizontal"}
        }
    });

    let vm = new Vue({
        el: '#vue'
    });
</script>
```
这是模板中使用函数组件时传递props的结果。

```html
<div id="vue">
</div>
<script type="text/javascript">
    Vue.component('layout', {
        functional: true,
        props: ['direction', 'width', 'height'],
        render(createElement, context) {
            console.log(context.props);
            // {height: "200px", width: "100px", direction: "horizontal"}
        }
    });

    let vm = new Vue({
        el: '#vue',
        render(createElement) {
            return createElement('layout', {
                props: {
                    direction: 'horizontal',
                    width: '100px',
                    height: '200px'
                }
            }, 'vue');
        }
    });
</script>
```
这是在别的组件中使用render函数的结果。

### children
context.children返回函数组件的子节点数组。
```html
<div id="vue">
    <layout direction="horizontal" width="100px" height="200px">
        <aside>aside</aside>
        <main>main</main>
    </layout>
</div>
<script type="text/javascript">
    Vue.component('layout', {
        functional: true,
        props: ['direction', 'width', 'height'],
        render(createElement, context) {
            console.log(context.children);
            // [VNode, VNode, VNode]
        }
    });

    let vm = new Vue({
        el: '#vue'
    });
</script>
```

### slots
是一个函数，调用后，返回函数组件标签内所有的slots内容。类似非函数组件的this.$slots属性，不过函数组件里面，必须通过context.slots()函数调用后才能访问到。

```html
<div id="vue">
    <layout direction="horizontal" width="100px" height="200px">
        <template v-slot:aside>aside</template>
        <main>main</main>
        <template v-slot:footer></template>
        <template v-slot:popup="user">
            <img :src="user.avatar" alt="">
        </template>
    </layout>
</div>
<script type="text/javascript">
    Vue.component('layout', {
        functional: true,
        props: ['direction', 'width', 'height'],
        render(createElement, context) {
            console.log(context.slots());
            // {default: ..., aside: ..., footer: ...}
        }
    });

    let vm = new Vue({
        el: '#vue'
    });
</script>
```
上面这个例子演示了，context.slots()调用后可以返回三个slots节点数组。

### children vs slots
看这个例子就明白了：
```html
<div id="vue">
    <layout direction="horizontal" width="100px" height="200px">
        <side v-slot:aside>aside</side>
        <main>main</main>
        <template v-slot:footer></template>
        <template v-slot:popup="user">
            <img :src="user.avatar" alt="">
        </template>
    </layout>
</div>
<script type="text/javascript">
    Vue.component('side', {
        render(h){
            return h('div', this.$slots.default);
        }
    });

    Vue.component('layout', {
        functional: true,
        props: ['direction', 'width', 'height'],
        render(createElement, context) {
            console.log(context.slots());
            // {default: ..., aside: ..., footer: ...}

            console.log(context.children);
            // [vnode(vue-component-1-side), vnode, vnode(main)]
        }
    });

    let vm = new Vue({
        el: '#vue'
    });
</script>
```
slots()返回的是插槽相关的内容；而children返回的是真实有效的子节点。

### scopedSlots
上层组件传给函数组件，或者是在模板中函数组件标签内定义的所有作用域插槽，都可以通过context.scopedSlots访问到。
```html
<div id="vue">
    <layout direction="horizontal" width="100px" height="200px">
        <side v-slot:aside="item">{{item.menus}}</side>
        <main>main</main>
        <template v-slot:footer></template>
        <template v-slot:popup="user">
            <img :src="user.avatar" alt="">
        </template>
    </layout>
</div>
<script type="text/javascript">
    Vue.component('side', {
        render(h){
            return h('div', this.$slots.default);
        }
    });

    Vue.component('layout', {
        functional: true,
        props: ['direction', 'width', 'height'],
        render(createElement, context) {
            console.log(context.scopedSlots);
            // {default() ..., footer() ..., aside() ...};
        }
    });

    let vm = new Vue({
        el: '#vue'
    });
</script>
```

### data
函数组件被上层组件createElement调用创建时，传入的整个data对象。context.data可在函数组件创建其他组件时，直接传入createElement第二个参数，这样函数组件就在中间只起到中转的作用，上层传给函数组件的data，全部都传给函数组件要创建得最终组件。

```html
<div id="vue">
    <layout direction="horizontal" width="100px" height="200px" @click.native.stop="expand" affix></layout>
</div>
<script type="text/javascript">
    Vue.component('side', {
        render(h){
            return h('div', this.$slots.default);
        }
    });

    Vue.component('layout', {
        functional: true,
        props: ['direction', 'width', 'height'],
        render(createElement, context) {
            console.log(context.data);
            // {attrs:{affix:""},nativeOn:{click: expand}}
        }
    });

    let vm = new Vue({
        el: '#vue',
        methods: {
            expand(){
            }
        }
    });
</script>
```
从上面例子可以看到，函数组件接收到的事件监听、attrs，全部都可以通过context.data访问到。

### listeners
data.on的别名

### parent

### injections

