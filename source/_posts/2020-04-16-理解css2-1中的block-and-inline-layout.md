---
title: 理解css2.1中的block-and-inline layout
tags:
  - w3c规范
categories:
  - css
  - w3c规范
date: 2020-04-16 10:22:24
---


这几个概念等价：`block-and-inline layout` `normal flow` `flow layout`。

<!-- more -->
`flow layout`就是所谓的`流体布局`，它分为垂直和水平两个方向的布局上下文，垂直方向上的布局上下文称为：`block formatting context`，简称`BFC`；水平方向上的布局上下文称为`inline formatting context`，简称`IFC`。`boxes`在`flow layout`里面，要么处于`BFC`当中，要么处于`IFC`当中，不可能同时位于两个上下文。具体来说：`block-level`的`box`位于`BFC`，`inline-level`的`box`位于`IFC`。

## block formatting context
网页默认就有一个`BFC`，一开始的内容都是布局在这个`BFC`里面的。 有很多方法可以让一个`box`新建`BFC`，比如`绝对或固定定位` `floats` `display: inline-block | table-cell | table-caption` `非visible值的overflow`。

在`BFC`里面，只有`block-level`的`box`，不会出现`inline box`，如果同时有`block box`和`inline box`，则会在`inline box`外部包裹一层`anonymous block-level box`。这些`box`从它的`container`顶部边缘开始，从上到下依次排列布局。两个相邻的`box`之间的间隙是由它们的外边距决定的，外边距满足条件时会触发外边距合并。

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
当一个`block-level`的`box`里面只有`inline box`的时候，它会创建一个`inline formatting context`来布局这些`inline`内容。`inline box`一定是在一个`IFC`中布局的，它的`children`也会跟它一起布局在相同的`IFC`当中。

在`IFC`当中，`inline box`也是从`container box`的`top content edge`开始布局的。水平方向上的`margin` `border` `padding`都会起作用。这些`inline box`在水平方向上有多种对齐方式，可能是按照`box`的顶部边缘对齐、可能是底部边缘对齐、也可能是按照文本基线对齐。在`IFC`当中，每一行都是一个不可见矩形区域，来包裹这些`inline box`，这个矩形区域称为`line box`。

`line box`默认的宽度是跟`container box`的`conten box`宽度一样的，但是当`line box`遇到`float`元素后，`line box`会自动收缩自己的宽度，以便`line box`不跟`float`发生重叠，形成了`line box`环绕`float box`的效果。`line box`的高度根据`line-height`属性的计算规则有关，需要学习其它规范内容。

`line box`的高度始终大于它里面任意一个`inline box`的高度，甚至会出现`line box`的高度比它里面最高的`box`的高度还要高。当某个`box`的高度低于`line box`的高度时，这个`box`在这一行内垂直方向上的对齐方式是由`vertical-align`属性决定的。当`inline boxs`用一个`line box`排不下的时候，它们会被分割到垂直堆叠的多个`line box`中来布局，因为`line box`的宽度最大就是`container content box`的宽度。一个`inline formatting context`实际上由垂直堆叠的多个`line box`布局出来的，这些堆叠的`line box`不会发生重叠，同时它们之间在默认情况下不会出现间隙。当`清除浮动`的时候，可能会让相邻的`line box`之间出现间隙，因为`清除浮动`是增加`line box`的`top margin`，来达到`line box`左右不出现`float box`这个目的的。

同一个`IFC`当中的`line box`，高度不一定相同，比如某个`line box`内有张图片，另一个没有。默认情况下`line box`的左边与`container content box`的左边对齐，`line box`的右边与`container content box`的右边对齐；但是当`float`出现后，部分`line box`的宽度会变窄，以便不与`float box`发生重叠。`line box`与`float box`的这种环绕行为，以及`line box`作用于`清除浮动`的行为，都只会在同一个`BFC`当中发生。 `float`会让一个`inline box`脱离`IFC`，但是不会脱离`BFC`，所以`float`与相应的`line box`还是处于同一个`BFC`，它们才能发生一些特定行为。 假如不想让某个`box`里面的`line box`与这个`box`所在的`BFC`中的`float box`发生特定行为，只需要把这个`box`变为`BFC`即可。

当一个`line box`内所有的`inline box`的总宽度小于`line box`的宽度时，这些`inline box`在水平方向上的对齐方式，就由`text-align`属性来决定。如果某个`inline box`在一个`line box`内排不下，它就会被分割为多个`box`，然后布局到下一个`line box`当中。但是当一个`inline box`不允许被分割时，比如设置了`white-space: nowrap | pre`，那这个`inline box`就会溢出当前它所在的`line box`。

当一个`inline box`被分割时，`margin` `padding` `border`都不会有分割的视觉效果，就是`margin padding border`看起来仍然会是连续的。如：
```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>

    <style type="text/css">
        .container {
            width: 150px;
            margin: 0 auto;
            background: #ccc;
        }

        .target {
            border: 10px solid red;
            margin: 0 20px;
            padding: 0 20px;
            background: blue;
            color: #fff;
            border-top: 0;
            border-bottom: 0;
        }
    </style>
</head>

<body>
    <div class="container">
        Several <em class="target">emphasized words</em> appear
        <strong>in this</strong> sentence, dear.</div>
</body>

</html>
```
<img src="{% asset_path "01.png" %}" style="border: none">
其实就是说虽然`inline box`被分割为多个`box`了，但是它们从整体上是满足一个`box`的`box model`的，所以把它当成一个`box`看待即可。

`line box`是`IFC`为了包含`inline-level`的内容创建的。
> Line boxes that contain no text, no preserved white space, no inline elements with non-zero margins, padding, or borders, and no other in-flow content (such as images, inline blocks or inline tables), and do not end with a preserved newline must be treated as zero-height line boxes for the purposes of determining the positions of any elements inside of them
不含文本，没有`preserved white space`，没有带`marign`、或带`border`或带`padding`的内联元素，没有其它未脱离文档流的布局内容（比如图片、内联block，内联table），并且没有换行符的此类`line box`，必须被当做是`zero-height line box`（0高的line box）来处理，这是为了这些`line box`中包含的元素定位的目的。比如某个`div`内包含一个`inline-block`的`div`，此时这个子div所属于的`line box`肯定不是`zero-height line box`，但是如果把`inline-block`的`div`，设置了绝对定位之后呢？它就会脱离它原来所在的`line box`，原来的`line box`就变为`zero-height line box`了，这个`line box`虽然高度为0，但是是对于子`div`的定位是有作用的。但是另一方面，`zero-height line box`在其它的场合中，必须被当成不存在的`line box`处理。

