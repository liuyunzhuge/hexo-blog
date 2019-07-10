---
title: 理解css中perspective的特性
tags:
  - CSS tranform
categories:
  - CSS
  - 知识学习
date: 2019-06-26 22:55:01
---


perspective是利用css做3d效果必不可少的一个属性，本篇记录理解这个属性的一些关键点、掌握怎么样找到这个属性的合适值。

<!-- more -->

## css transforms里面的坐标系
这是css transforms的坐标系：
<img src="{% asset_path "01.png" %}" width="300">
* x轴的正方向是向右的
* y轴的正方向是向下的
* z轴的正方向是从屏幕面向自己的眼睛的

普通的元素是渲染在x轴和y轴所组成的这个平面的之内的，也就是上图中网格所表示的那个面，当应用了css transforms之后，元素可以在上述坐标系的整个3d空间内渲染。正确地理解这个坐标系，对于理解perspective有非常大的作用。

## 初始perspective的作用
这是三个没有做任何transforms的三个box:
<img src="{% asset_path "05.png" %}" width="900">
它的代码如下：
```html
<div class="box">
        <div>1</div>
    </div>
    <div class="box">
        <div>2</div>
    </div>
    <div class="box">
        <div>3</div>
    </div>
</div>
```
```css
.container    {
    display: flex;
    width: 1200px;
    height: 200px;
    justify-content: space-between;
    margin: 50px auto;
}

.box {
    width: 200px;
    height: 200px;
    background-color: #f77333;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 80px;
}
```
为了通过它演示perspective的作用，我把container设置了`perspective: 800px`，然后分别对第二个盒子和第三个盒子，分别设置了`translateZ(400px)`和`translateZ(-400px)`，效果如下：
<img src="{% asset_path "06.png" %}" width="900">
```css
.container    {
    display: flex;
    width: 1200px;
    height: 200px;
    justify-content: space-between;
    margin: 50px auto;
    perspective: 800px;
}

.box {
    width: 200px;
    height: 200px;
    background-color: #f77333;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 80px;
}

.box:nth-child(1) {
    
}
.box:nth-child(2) {
    transform: translateZ(400px);
}
.box:nth-child(3) {
    transform: translateZ(-400px);
}
```
通过开发者工具，可以查看到三个box最后的尺寸分别是：`200px * 200px`，`400px * 400px`，`133.33px * 133.33px`。第一个元素没有设置`translateZ`，所以尺寸没变化，第二个元素的尺寸变为了原本的2倍，第三个元素的尺寸变为了原本的2/3倍。这其中起到关键作用的就是`perspective`，虽然translateZ可以把元素从默认的2d平面渲染，沿着z轴的方向进行平移（正的translateZ的值，让渲染平面沿z轴的正方向平移，负值让渲染平面沿着z轴负方向平移），但是只有当设置了`perspective`，这个平移的作用才会显现出来，也就是最后看到第二个box会变大，第三个box会变小。

## perspective的原理及计算
perspective的含义是用于设置一个3d展示的舞台，在这个舞台内的所有子元素，都将在同一个视角、同一个视线之下来展示3d效果。所以perspective通常设置到一个包含所有3d效果子元素的父元素上面。

它默认以设置了perspective元素正中心为起始点，从起始点沿着z轴正方向移动`perspective属性值大小`的距离，以终点作为整个3d舞台的视点。这是w3c对这个视点以及它作用特性的示意图：
<img src="{% asset_path "02.png" %}" width="400">
此图中：
`drawing surface`表示浏览器默认渲染元素的平面。这个平面里面，蓝色部分的椭圆表示某个元素经过3d渲染之后的最终大小；黑色边线部分的椭圆表示元素的原始大小。z表示的是`drawing surface`上面某个元素的`translateZ`值的绝对值大小。d表示的是舞台父元素`perspective`属性设置的值。

假设元素的原始宽高分为w,h，设元素3d渲染之后的宽高分为w1,h1，那么根据三角形中位线定理:
在上图的上半部分（translateZ大于0时），有如下等式成立：
```
(d - z) / d = w / w1
(d - z) / d = h / h1
#d z w h均为已知数，只有w1和h1是未知的s
```
根据这个规律，就能明白本篇第二个部分的实例中，第2个box最后的大小为啥是`400 * 400`了，（d=800, z=400, w=200, h=200; => w1 = 400, h1 = 400）。
在上图的下半部分（translateZ小于0时），有如下等式成立：
```
d / (d + z) = w1 / w
d / (d + z) = h1 / h
```
根据这个规律，就能明白本篇第二个部分的实例中，第3个box最后的大小为啥是`133.33 * 133.33`了，（d=800, z=400, w=200, h=200; => w1 = 133.33, h1 = 133.33）。

## 注意点
* 当`translateZ`的值大于等于`perspective`设置的值时，元素会被渲染在视点也就是眼睛的背面，导致元素从3d舞台中消失不见；
* 除了`translateZ`，其它css transforms属性只要会导致元素从默认的平面脱离渲染的话，都会受到perspective的影响，比如说rotateX、rotateY

## 应用
如何确定perspective属性的大小？在了解了上面perspective相关的计算原理之后，怎么找到一个合适的perspective值呢？比如swiper这个库，它在做3d轮播的时候，设置的perspective值是1200px，为什么它会选择这个值呢，其实很简单，根据最终3d效果的真实性来判断即可。比如设置1000px，1200px都可以的时候，就看1000px还是1200px，哪个的3d效果更好。

## 配合perspective一起使用的perspective-origin
这是一个目前支持还不太普遍的属性，需要使用浏览器前缀才能使用，它与perspective属性一起使用，用来设置perspective视点的投影在xy轴平面的位置，默认这个perspective-origin是设置在perspective舞台元素的正中心，perspective-origin用来改变这个位置。它的含义就是用来调整视角的位置，比如可以做到俯视、仰视、侧看等特殊的3d效果，w3c对它的示意如下：
<img src="{% asset_path "04.png" %}" width="400">

本篇第2个部分的例子，设置了这个属性的话`-webkit-perspective-origin: 50% 0%;`，效果就会变为下面的样子(顶端对齐)：
<img src="{% asset_path "07.png" %}" width="900">

如果是3d立体的效果，这个属性的作用应该能看得更明显一些。本篇暂不引入了。该属性详细的说明可参考：https://drafts.csswg.org/css-transforms-2/#propdef-perspective-origin

## w3c参考
> https://drafts.csswg.org/css-transforms-2/
