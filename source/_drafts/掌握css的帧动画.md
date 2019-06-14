---
title: 掌握css的帧动画
tags:
- CSS动画
categories:
- CSS
- 知识学习
---

css的key frames知识具备强大的动画能力。 帧动画是这个知识点的一部分，它可以用来实现跳帧动画，就像放动画片一样。 

<!-- more -->
这是一张准备用来演示帧动画的图片：
![](/images/assets/rise_animation_demo.jpg)

下面的代码可以让这个图片里面的牛动起来：
```css
.box {
	width: 98px;
	height: 103px;
}

.box.move {
	background-image: url(./rise_animation_demo.jpg);
	background-position: 0 0;
	background-repeat: no-repeat;
	animation-name: move;
	animation-timing-function: steps(6, end);
	animation-iteration-count: infinite;
}

@keyframes move {
	from {
		background-position: 0 0;
	}

	to {
		background-position: -590px 0;
	}
}
```
实际效果及源码可以点击[这里](/code/css/animation/rise_frame_animation.html)查看。

https://www.w3.org/TR/css-easing-1/#step-easing-functions