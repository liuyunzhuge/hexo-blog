---
title: 理解css2.1中的block-and-inline layout
tags:
  - w3c规范
categories:
  - css
  - w3c规范
---

这几个概念等价：`block-and-inline layout` `normal flow` `flow layout`。

<!-- more -->
`flow layout`就是所谓的`流体布局`，它分为垂直和水平两个方向的布局上下文，垂直方向上的布局上下文称为：`block formatting context`，简称`BFC`；水平方向上的布局上下文称为`inline formatting context`，简称`IFC`。`boxes`在`flow layout`里面，要么处于`BFC`当中，要么处于`IFC`当中，不可能同时位于两个上下文。具体来说：`block-level`的`box`位于`BFC`，`inline-level`的`box`位于`IFC`。

## block formatting context
网页默认就有一个`BFC`，一开始的内容都是布局在这个`BFC`里面的。 有很多方法可以让一个`box`新建`BFC`，比如`绝对或固定定位` `floats` `display: inline-block | table-cell | table-caption` `非visible值的overflow`。

在`BFC`里面，只有`block-level`的`box`，不会出现`inline box`，如果有`inline box`，也会在它外部包裹一层`anonymous block-level box`。这些`box`从它的`container`顶部边缘开始，从上到下依次排列布局。两个相邻的`box`之间的间隙是由它们的外边距决定的，外边距满足条件时会触发外边距合并。

如果一个`block-level`的`box`未创建一个新的`BFC`，则它的`children`就会跟自己一起，布局在相同的`BFC`里面；如果它创建了`BFC`，则它的`children`会部署在自己新建的`BFC`里面，与自己所在的`BFC`是分离的。 只有位于相同`BFC`当中的`box`，才会发生特定的`flow layout`行为，否则不会。比如外边距合并这种行为就只能发生在相同的`BFC`当中。

看下面这个例子：
```html
<body>
    <div class="box1" style="margin-top: 30px">
        <div class="ovh">
            <div class="child1" style="margin-top: 10px">123</div>
            <div class="child2">abc</div>
        </div>
        456
    </div>
    <div class="box2" >
</body>
```
上面的例子，没有创建任何新的`BFC`，所以所有的`box`全部在相同的`BFC`中布局，具体如下：
* `div.box1`与`div.box2`这两个box，按照先后顺序，从`body`的顶部边缘开始依次布局下来
* `456`这个文本外面，会生成一个`anonymous block box`
* `div.ovh`和`456 anonymous block box`这两个box，按照先后顺序，从`div.box1`的顶部边缘依次布局下来
* `div.child1`与`div.child2`这两个box，按照先后顺序，从`div.ovh`的顶部边缘开始依次布局下来
* `div.child1`与`div.box1`的`top margin`会发生合并

如果代码改动一下：
```html
<body>
    <div class="box1" style="margin-top: 30px">
        <div class="ovh" style="overflow:hidden">
            <div class="child1" style="margin-top: 10px">123</div>
            <div class="child2">abc</div>
        </div>
        456
    </div>
    <div class="box2" >
</body>
```
* 因为`overflow:hidden`的作用，`div.ovh`现在会新建`BFC`；
* `div.child1`与`div.child2`这两个box，按照先后顺序，从`div.ovh`的顶部边缘开始依次布局下来；但此时它俩所属的布局上下文是`div.ovh`新建的那个，而不是`div.ovh`自身所处的那个；
* `body` `div.box1` `div.ovh` `div.box2` `456 anonymouse box`仍然处于相同的`BFC`当中
* 因为`div.ovh`所新建的`BFC`的作用，`div.child1`和`div.box1`的`top margin`不会再发生合并

在`BFC`中还有一个特性，就是`box`的左边的边缘，会与`container box`的左边边缘对齐。这样的话，加上`box`的`width`初始值始终是`auto`，就会让`box`形成一个水平方向上充满`container`的布局效果，这就是`box`所谓的流体特性。 注意`width: auto`与`width: 100%`不是一样的，这就是为啥有的时候子元素设置`width: 100%`，反而不能自动充满父元素，可能会超出的原因，比如这个代码：
```html
    <div style="width: 300px; padding: 0 30px;">
        <div style="width: 100%"></div>
    </div>
```
父级div最终的宽度会变为360，而不是300，因为子div的宽度设置为100%，所以它的宽度也是300，一下子就把父div撑开了，`width: 100%`导致子div失去了自动在水平方向充满父div内容区的流体效果。

`BFC`有两个布局要点：
1. `box`的顶部边缘对齐`container box`的顶部边缘，那这2个顶部边缘是指哪里呢？`box`的顶部边缘是指`border box`的上边`top border edge`，`container`的顶部边缘是指`container`的`content box`的上边，也即是`top content edge`
2. `box`的左边对齐`container box`的左边，那这2个左边是指哪里呢？`box`的左边是指`border box`的左边`left border edge`，`container`的左边是指`container`的`content box`的左边，也即是`left content edge`

当一个原本位于`BFC`中的`block-level box`变为一个`BFC`以后，它会失去它在水平方向上的流体布局特性，宽度不再自动充满`container`的内容区域，而是收缩到自己的内容实际填充宽度，这就是所谓的包裹性。

## inline formatting context
