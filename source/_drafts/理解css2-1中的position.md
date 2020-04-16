---
title: 理解css2.1中的position
tags:
  - w3c规范
categories:
  - css
  - w3c规范
---

理解`相对定位` `绝对定位` `固定定位`。

<!-- more -->

## css2.1中的定位方案
在css2.1中一共有3种定位方案：
1. `normal-flow` 文档流，分水平和垂直两个布局上下文
2. `float` 浮动，让元素脱离`normal-flow`里面的`IFC`
3. `absolute position` 绝对定位，`position: aboslute`和`position: fixed`都属于它

另外`relative postion`是同时可应用于`normal-flow`和`float`的定位形式，所以没有单独作为一个分类。

## `position` property
`position`这个属性，可用于设置元素的定位方式，它的定义如下：
> Value:  	static | relative | absolute | fixed | inherit
初始值:  	static
可应用于:  	所有元素
是否能被继承:  	no
Percentages:  	不支持百分比

各个含义如下：
* `static` 这是`position`的默认值，元素按默认的`normal-layout`进行布局。与`position`相关的四个偏移属性：`top left right bottom`在`position:static`时无效。
* `relative` 这个可以开启相对定位。`box`在`normal layout`中的布局出来的位置，称为`normal position`。`relative`可以让`box`，相对`normal position`进行偏移，利用`top left rigth bottom`这四个偏移属性。当一个`box`开启`relative`并且进行偏移之后，对其它在`normal-layout`中的元素布局没有任何影响，其它元素就好像这个`box`没有偏移过一样；所以`relative`可能会导致`box`与其它`box`发生重叠。`relative`对`display`为`table-row-group, table-header-group, table-footer-group, table-row, table-column-group, table-column, table-cell, and table-caption`的元素无效。
* `absolute` 这个可以开启绝对定位。它会让`box`脱离`normal layout`，注意这里它是完全脱离`normal layout`，不像`float`(不会完全脱离`BFC`)。然后可以使用四个偏移属性`top left rigth bottom`对`box`偏移，偏移是相对于`containing block`进行的。`absolute`的`box`不会与任何`margin`发生合并。所以`margin`可以用在`absolute`的元素上实现一些特殊效果，为啥？因为margin能改变元素的位置，对元素实现拉扯定位。
* `fixed` 这个也是绝对定位，是一种特殊的绝对定位，它在偏移时是相对视口`viewport`进行的，对网页来说，这个`视口`一般指的的就是网页的可视区域。`fixed`的`box`的定位位置不会受网页滚动的影响。

## `box offset`
`relative absolute fixed`都可以对`box`进行偏移（offset），偏移用到四个css属性：`top left rigth bottom`。各个属性定义如下：
* `top`
> Value:  	<length> | <percentage> | auto | inherit
初始值:  	auto
应用于:  	所有元素
是否可被继承:  	不
百分比:  	支持百分比，相对于`containing block`的`height`计算
负值：允许

当元素是`absolute | fixed`定位时，这个属性定义了`box`的`top margin edge`与`containing block`的上边的距离；当元素是`relative`时，这个属性定义了`box`的`top margin edge`与它在`normal flow`中或`float`时的`top margin edge`的距离。

* `bottom`
> Value:  	<length> | <percentage> | auto | inherit
初始值:  	auto
应用于:  	所有元素
是否可被继承:  	不
百分比:  	支持百分比，相对于`containing block`的`height`计算
负值：允许

当元素是`absolute | fixed`定位时，这个属性定义了`box`的`bottom margin edge`与`containing block`的`bottom padding edge`的距离；当元素是`relative`时，这个属性定义了`box`的`bottom margin edge`与它在`normal flow`中或`float`时的`bottom margin edge`的距离。

* `left`
> Value:  	<length> | <percentage> | auto | inherit
初始值:  	auto
应用于:  	所有元素
是否可被继承:  	不
百分比:  	支持百分比，相对于`containing block`的`width`计算
负值：允许

当元素是`absolute | fixed`定位时，这个属性定义了`box`的`left margin edge`与`containing block`的左边的距离；当元素是`relative`时，这个属性定义了`box`的`left margin edge`与它在`normal flow`中或`float`时的`left margin edge`的距离。

* `right`
> Value:  	<length> | <percentage> | auto | inherit
初始值:  	auto
应用于:  	所有元素
是否可被继承:  	不
百分比:  	支持百分比，相对于`containing block`的`width`计算
负值：允许

当元素是`absolute | fixed`定位时，这个属性定义了`box`的`right margin edge`与`containing block`的右边的距离；当元素是`relative`时，这个属性定义了`box`的`right margin edge`与它在`normal flow`中或`float`时的`right margin edge`的距离。

其它要点：
1. 这四个属性都允许负值，好多网页布局都要利用它们的负值
2. 百分比都是相对`containing block`的宽高计算，包括`relative`。不要认为`relative`的偏移百分比值是相对于自身计算。
3. `auto`这个特殊值的逻辑，需要其它内容。

## relative positioning
`相对定位`要点。

`relative`可以对`normal layout`中的`box`和`float box`生效。`box`可以利用四个偏移属性，对`box`被`relative`之前的位置进行偏移，被`relative`的`box`在发生偏移后，对其它`box`的布局不会有任何影响，其它`box`就好像这个`box`没有移动过一样。所以`relative`可能会造成`box`的重叠。但是有一种情况，可能会因为`relative`影响布局：当`box`被`relative`后可能会导致有设置`overflow: scroll`或`overflow:auto`的`box`发生溢出，浏览器需要保证溢出后，还能与这些溢出的`relative box`交互，就会通过创建滚动条的方式来满足这点要求，滚动条会影响布局，因为滚动条要占据空间。

`relative box`偏移后，`box`的尺寸大小不会受影响。

`left`与`right`属性，只是将`box`水平移动，但是不会改变`box`大小。正的`left`让`box`往右偏移，负的`left`让`box`往左偏移；反之，正的`right`让`box`往左偏移，负的`right`让`box`往右偏移；由于`box`不会因为`left` `right`而分割或拉伸，所以它们始终要满足这个关系：`left=-right`。
* 当`left`和`right`都是`auto`的时候，`auto`是默认值，这两个属性最终被使用的值都是：`0`。
* 如果一个是`auto`，另一个不是，则另一个根据`left=-right`自动计算出一个值；
* 如果两个都不是`auto`，则会发生冲突，其中一个会被忽略，然后用`left=-right`计算一个新值。谁被舍弃，取决于`box`的`direction`这个属性。当`direction:ltr`时，表示从从到右的布局方向，`right`会被舍弃；当`direction:rtl`，时，表示从右到左的布局方向，`left`会被舍弃。

`top`与`bottom`属性，只是将`box`垂直移动，但是不会改变`box`大小。基本跟`left right`大同小异，且满足：`top=-bottom`。有一点不同的是：
* 当`top`和`bottom`都不是`auto`的时候，始终是`bottom`被忽略，然后`bottom = -top`来得到一个新的`bottom`值。


## absolute positioning
在绝对定位中，`box`是相对于它的`containing block`进行偏移的。它可以同时使用`top right left bottom`四个属性来指定偏移量，`top bottom`和`left right`之间同时设定的话，会对`box`进行拉伸，所以不存在类似`relative`那样的牵制关系。

元素绝对定位后，会完全从`normal flow`中脱离出来，并新建一个`BFC`来布局子内容。绝对定位的`box`会与其它`box`发生重叠，他们的堆叠顺序，可以通过`stack level`也就是`z-index`属性来控制。

## fixed positioning 
固定定位就是一种特殊的绝对定位，只不过`box`偏移的`containing block`是`viewport`本身。

## 什么是`containing block`
在css2.1里面，很多的`box`位置和大小都是根据一个矩形区域的边缘来计算的，这个矩形区域称为`containing block`。一般情况下，都是`box`充当后代`boxes`的`containing block`，我们说它是一个`box`为它的后代创建了`containing block`。 一个`box`的`containing block`，是指它布局所在的那个块，不是指它生成的那个块。

每一个`box`都会有一个相对于它所在的`containing block`的`position`值（x,y坐标），但是`containing block`不会限制`box`的显示，所以`box`可能会溢出。

`containing block`具体的定义是什么呢，分以下几种情况：
* 根元素`html`所在的`containg block`称为`initial containing block`，对网页来说这个`containing block`与`view port`大小一致，而且固定在`canvas`的原点
* 对于`position: relative`或`position: absolute`的`box`，