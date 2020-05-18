---
title: WebComponents入门
tags:
  - WebComponents
categories:
  - Javascript
  - WebApi
date: 2020-05-18 12:03:21
---


`WebComponents`是一项在网页里面直接进行组件化开发的标准，帮助你在不使用任何框架的前提下，进行自定义组件开发。

<!-- more -->

## 开发流程
要开发一个自定义组件，非常简单，尤其在你使用过`vue`等框架，对组件化概念有一定认识之后：
1. 创建一个类或函数来定义`web`组件
2. 使用`CustomElementRegistry.define()`这个api来注册第一步定义的组件
3. 组件内部可使用`ShadowDom`技术来实现内部细节
4. 通过`template`和`slot`元素，在组件内部与外部之间构建灵活的内容替换方式
5. 在页面其它位置，像普通`html`元素一样使用前面开发好的自定义组件。

## 创建自定义组件的类
有两种方式创建自定义组件的类：
1. 创建一个独立的自定义组件类

示例：
```js
class PopUpInfo extends HTMLElement {
  constructor() {
    // 必须首先调用 super方法 
    super(); 

    // 其它构造写在这里
  }
}
```
这个方式中，通过继承`HTMLElement`得到一个`PopUpInfo`类，这个类代表了一个新的自定义组件。 `HTMLElement`接口，是所有`html`元素都间接或直接继承的接口。 所以直接继承这个类的方式，得到的自定义组件，是一个完全独立的新组件，可以把它当成一个新的`html`元素来看待。

2. 基于已有的标准`html`元素继承

示例：
```js
class WordCount extends HTMLParagraphElement {
  constructor() {
    // 必须首先调用 super方法 
    super(); 

    // 其它构造写在这里
  }
}
```
这个方式中，通过继承`HTMLParagraphElement`得到一个`WordCount`类，`HTMLParagraphElement`从字面含义可知，它代表的是`p`元素。 `WordCount`类继承了`p`元素之后，将具备`p`元素的自身的特性。 这样得到的一个自定义组件，在注册和使用时，与前面一种方式得到的自定义组件，是有区别的。

**前面总结的两种方式都有共同点：必须有明确的`extend`目标，必须有`constructor`函数，必须调用`super()`函数。**

## 注册和使用自定义组件
使用`CustomElementRegistry.define()`这个api来注册自定义组件，也有两种方式。通过`window.customElements`可以得到一个`CustomElementRegistry`的实例。
1. 注册独立使用的自定义组件

```js
customElements.define('popup-info', class PopUpInfo extends HTMLElement {
  constructor() {
    // 必须首先调用 super方法 
    super(); 

    // 其它构造写在这里
  }
});
```
以上把`PopUpInfo`注册为了一个自定义组件，并且可以在`html`中通过`popup-info`标签来直接使用。如：
```html
<popup-info>
```
在`document.createElement`中，也可以直接使用：
```js
document.createElement('popup-info')
```

2. 注册继承了标准元素的自定义组件

```js
customElements.define('expanding-list', class ExpandingList extends HTMLUListElement {
  constructor() {
    // 必须首先调用 super方法 
    super();

    // 其它构造逻辑写在这里
  }
}, { extends: "ul" });
```
这类组件不能直接用注册的标签名称使用，而是要基于它扩展的标准元素、结合`is`这个`html`属性来使用。如：
```html
<ul is="expanding-list">
</ul>
```
在`document.createElement`中，也要做调整，使用`is`option：
```js
document.createElement('ul', {is: 'expanding-list'})
```

**两种组件注册时的共同要求**：标签名称必须是用短横线分割的多个单词，且必须符合`DOMString`标准。

## 使用ShadowDom
在自定义组件的内部，通过`ShadowDom`来构造内部的细节。 从编程的角度来说，组件要与外部进行职责分离，内部细节应该对外不可见；从`html`元素的角度来说，元素最终都是通过`dom`结构来展现的。所以`ShadowDom`就出现了。首先它就是一份普通的`dom`结构，但与我们常规看到的`dom`不一样的是，它在它所依附的元素外部，是不可见的。而且，它不是一个新技术概念，浏览器在过去，就已经在使用`ShadowDom`来封装内部标准元素。比如说`video`元素，我们在页面中使用的时候，它都自带控制栏，这个控制栏就是`ShadowDom`完成的。

`ShadowDom`通过附加在某个常规的`dom`节点上，间接地参与了整个页面的渲染，这个被附加的`dom`节点称为`ShadowHost`。`ShadowDom`内部就跟普通`dom`没有区别，它也有跟`document`一样的跟节点，称为`ShadowRoot`。我们把`document`结构称为`document tree`，`ShadowDom`结构称为`ShadowTree`。 这是它们的关系：
<img src="{% asset_path "01.png" %}" width="600" style="border: none">

### 使用实践
通过`Element.attachShadow()`，可以给任意元素附加一个`ShadowDom`。
```js
let shadow = elementRef.attachShadow({mode: 'open'});
let shadow = elementRef.attachShadow({mode: 'closed'});
```
这个方法调用后偶返回了`ShadowDom`的`ShadowRoot`引用。`attachShow`使用时，有一个`mode`的option，它可以配置为：`closed`或`open`。当它是`open`的时候，回头这个附加了`ShadowDom`的元素，可以通过下面的方式访问`ShadowDom`：
```js
elementRef.shadowRoot
```
而`closed`option则不可以。所以`closed`option特别适合用在自定义组件里面。

当你拿到`ShadowRoot`之后，就可以往`ShadowDom`里面，添加普通的`DOM`节点了：
```js
class PopUpInfo extends HTMLElement {
  constructor() {
    super();

    // 附件shadowdom
    const shadow = this.attachShadow({mode: 'open'});

    // 创建常规dom节点
    const wrapper = document.createElement('span');
    wrapper.setAttribute('class', 'wrapper');
    shadow.appendChild(wrapper);
  }
}
```
自定义元素可以通过`html`的`attribute`往组件内部传递外部的数据：
```js
class PopUpInfo extends HTMLElement {
  constructor() {
    super();

    // 附件shadowdom
    const shadow = this.attachShadow({mode: 'open'});

    // 创建常规dom节点
    const wrapper = document.createElement('span');
    wrapper.setAttribute('class', 'wrapper');

    const info = document.createElement('span');
    // 获取自定义元素在页面中注册的属性
    const text = this.getAttribute('data-text');
    info.textContent = text;

    wrapper.appendChild(info);
    shadow.appendChild(wrapper);
  }
}
```
```html
<popup-info data-text="...">
```
还可以在`ShadowDom`里面编写`css`：
```js
class PopUpInfo extends HTMLElement {
  constructor() {
    super();

    // Create a shadow root
    const shadow = this.attachShadow({mode: 'open'});

    const style = document.createElement('style');

    style.textContent = `
        .wrapper {
            position: relative;
        }

        .info {
            font-size: 0.8rem;
            width: 200px;
            display: inline-block;
            border: 1px solid black;
            padding: 10px;
            background: white;
            border-radius: 10px;
            opacity: 0;
            transition: 0.6s all;
            position: absolute;
            bottom: 20px;
            left: 10px;
            z-index: 3;
        }

        img {
            width: 1.2rem;
        }

        .icon:hover + .info, .icon:focus + .info {
            opacity: 1;
        }
    `

    shadow.appendChild(style);
  }
}
```
总之，在`ShadowDom`里面能做的事情，与在`document`中是没啥区别的，它们就是两个完全隔离的`dom`渲染区域。

## 使用template和slot
不同于上面直接在js中写内部的`html`结构和样式，自定义组件还能利用`template`和`slot`这个元素来实现更加强大的`html`结构构建功能。可参考：[使用template和slot](https://developer.mozilla.org/zh-CN/docs/Web/Web_Components/Using_templates_and_slots)

## 使用生命周期函数
在自定义组件中还能使用生命周期函数，来开发更强的组件，可参考： [使用生命周期函数](https://developer.mozilla.org/zh-CN/docs/Web/Web_Components/Using_custom_elements#%E4%BD%BF%E7%94%A8%E7%94%9F%E5%91%BD%E5%91%A8%E6%9C%9F%E5%9B%9E%E8%B0%83%E5%87%BD%E6%95%B0)

## 实例
`mdn`上有提供诸多实例，包含了`web component`相关的各个要点，在真正想去实践`web component`时，可以拿来研究参考：[mdn实例](https://github.com/mdn/web-components-examples)

