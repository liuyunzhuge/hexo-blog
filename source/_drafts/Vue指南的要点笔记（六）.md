---
title: Vue指南的要点笔记（六）
tags:
  - Vue指南要点笔记
  - Vue
categories:
  - Javascript
  - Vue
  - 指南要点
---

本篇开始重点学习组件开发的要点：
1. 非prop的特性
2. 自定义事件

<!-- more -->
## 非prop的特性
prop类型的特性用的比较多，也很好理解，所以不重复记录学习内容。非prop特性用得少，不是很熟悉，所以本篇也重点学习。一个非 prop 特性是指传向一个组件，但是该组件并没有相应 prop 定义的特性。如：
```html
<checkbox :value="agree" label="是否同意"></checkbox>
```
checkbox这个组件，可能定义了value这个prop，所以value是一个prop类型的特性；而不一定定义了label这个prop，label是一个非prop类型的特性。

**非prop的特性，会自动添加到组件的根元素上。**

### 替换/合并已有的特性
假设有一个自定义的`bootstrap-date-input`组件，模板为：
```html
<input type="date" class="form-control">
```
如果外部使用的时候，加了下面的特性：
```html
<bootstrap-date-input
  data-date-picker="activated"
  class="date-picker-theme-dark"
></bootstrap-date-input>
```
在外部使用组件时，附加了class这个特性，同时组件内部也有自带的class特性。**对于大部分特性，如果同时存在于：外部使用的组件元素和组件定义内部的根元素，那么外部特性值会覆盖内部根元素上定义的值，比如`type="text"`如果附加到外部使用的组件元素上，组件内部的`type="date"`就会被替换掉；class和style除外，vue会采用合并的机制，保证这两个特性的内外部值都能存在。**

### 禁用非prop特性继承
假如不想根元素，自动继承非prop的特性，可以将组件定义的`inheritAttrs`设置为false。
```js
Vue.component('my-component', {
  inheritAttrs: false,
  // ...
})
```
根元素不想继承的特性，可以转移到需要的子元素上面去，这对于编写更加与标准html元素具备一致性的页面组件很有意义：
```js
Vue.component('base-input', {
  inheritAttrs: false,
  props: ['label', 'value'],
  template: `
    <label>
      {{ label }}
      <input
        v-bind="$attrs"
        v-bind:value="value"
        v-on:input="$emit('input', $event.target.value)"
      >
    </label>
  `
})
```
这样编写出来的自定义组件，在使用起来更像在使用原生元素一样：
```html
<base-input
  v-model="username"
  required
  placeholder="Enter your username"
></base-input>
```

## 自定义事件