---
title: Vue指南的要点笔记（七）
tags:
  - Vue指南要点笔记
  - Vue
categories:
  - Javascript
  - Vue
  - 指南要点
---

本篇的要点是：插槽。 Vue3.0要出来了，2.0曾经的插槽语法已被废弃，现在是全新的知识点。

<!-- more -->

## 插槽的基本认识
自定义组件会经常遇到模板内容不固定的场景，插槽可以帮助我们把不固定的模板内容，变为灵活的形式，这样在使用自定义组件的其它文件中，就能根据特定逻辑的需求使用新的模板内容。插槽通过slot这个元素来定义，假设有一个navigation-url的自定义组件，它的模板内容可能是这样的：
```html
<a
  v-bind:href="url"
  class="nav-link"
>
  <slot></slot>
</a>
```
其中的slot表示为一个插槽。当外部使用navigation-url组件的时候，`navigation-url`标签之间的内容就会取代组件定义中slot位置进行渲染：
```html
<navigation-url>查看主页</navigation-url>
```
`查看主页`这个文本会替换掉组件原有定义中的slot的位置。`navigation-url`标签之间可以是任何形式的有效的Vue模板内容。如果在自定义组件里面没有slot定义，那么在使用自定义组件时，自定义组件标签之间的所有内容都会被忽略。

自定义组件有自己的模板，所以有自己的作用域；外部使用自定义组件的时候，可能想要使用自定义组件所拥有的作用域的数据，比如这样的：
```html
<navigation-link url="/profile">
  Clicking here will send you to: {{ url }}
</navigation-link>
```
但这样是不行的。url是自定义组件的一个prop数据，在使用自定义组件的时候，它的标签之间的模板内容，其实是访问不到自定义组件实例内部的作用域数据的。这是因为它标签之间的模板内容，不是与自定义组件定义的模板一起编译的，而是与使用自定义组件标签的模板一起编译的，Vue规定：
> 父级模板里的所有内容都是在父级作用域中编译的；子模板里的所有内容都是在子作用域中编译的。
所以自定义组件标签之间的模板内容，能够访问到自定义组件标签所在的整体模板中的作用域数据，但是访问不到自定义组件实例本身的数据。

比如这样，假设user是自定义组件使用时所在模板中的一个数据：
```html
<navigation-link url="/profile">
  Logged in as {{ user.name }}
</navigation-link>
```
这样是可以的。

自定义组件定义中的slot可以包含模板内容：
```html
<a
  v-bind:href="url"
  class="nav-link"
>
  <slot>Summit</slot>
</a>
```
这样当外部使用这个组件，且组件标签之间没有内容的时候，`Submit`会成为这个slot的默认替换内容。 slot之间也可以是任意形式的有效的模板内容，且能正常访问到组件实例的数据。

## 具名插槽





