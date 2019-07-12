---
title: Vue指南的要点笔记（八）
tags:
  - Vue指南要点笔记
  - Vue
categories:
  - Javascript
  - Vue
  - 指南要点
---

本篇记录动态组件和异步组件的要点。 包括：
1. component标签的使用
2. keep-alive标签的使用


<!-- more -->

## component标签的使用
component是一个虚拟标签，用来支持动态组件，在一些场景中，同一个数据可能有不同的展现形式，这个时候就很适合用动态组件来处理。它可以利用`is`这个prop，绑定需要真实渲染的组件id：
```html
<div id="vue">
    <component v-bind:is="component"></component>
</div>

<script type="text/javascript">
    Vue.component('card-a', {
        data(){
            return {}
        },
        template: `<div>1</div>`
    });
    Vue.component('card-b', {
        data(){
            return {}
        },
        template: `<div>2</div>`
    });

    let vue = new Vue({
        data: {
            component: 'card-a'
        },
        el: '#vue'
    });
</script>
```
`is`prop绑定的值，可以是像上面例子中展示的某个全局或局部注册的组件名称，也可以是一个可以表示组件定义的`javascript options`对象，比如这样：
```html
<div id="vue">
    <component v-bind:is="component"></component>
</div>

<script type="text/javascript">
    let vue = new Vue({
        data: {
            component: {
                data(){
                    return {}
                },
                template: `<div>1</div>`
            }
        },
        el: '#vue'
    });
</script>
```
还可以是某个组件的构造函数：
```html
<div id="vue">
    <component v-bind:is="component"></component>
</div>

<script type="text/javascript">
    let CardA = Vue.component('card-a', {
        data(){
            return {}
        },
        template: `<div>1</div>`
    });

    console.log(CardA === Vue.component('card-a'));//true

    let vue = new Vue({
        data: {
            component: CardA
        },
        el: '#vue'
    });
</script>
```
或者是：
```html
<div id="vue">
    <component v-bind:is="component"></component>
</div>

<script type="text/javascript">
    let CardA = Vue.extend({
        data(){
            return {}
        },
        template: `<div>1</div>`
    });

    let vue = new Vue({
        data: {
            component: CardA
        },
        el: '#vue'
    });
</script>
```
这是`is`prop在vue的api文档中的说明：
```
is - string | ComponentDefinition | ComponentConstructor
```

## keep-alive标签的使用