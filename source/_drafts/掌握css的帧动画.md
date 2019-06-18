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

## 帧动画原理
帧动画是设置animation-timing-function生效的，跟普通的keyframes动画不一样的，帧动画的animation-timing-function，设置的不是贝塞尔曲线函数，而是step函数，比如上面的设置的step(6, end)。掌握帧动画的关键就是要掌握step函数的特性。

step函数的作用：把@keyframes里面定义的相邻的两个帧，划分为step函数第1个参数所指定的阶段数，比如step(6, end)，会把相邻的两个帧，划分为6个阶段，每个阶段所对应的动画时长内，应用动画的元素都会保持同一个状态，而不是进行过渡变化；过渡变化是普通的keyframes动画做的事情。

注意：step函数作用的是相邻的两个keyframe，而不是整个动画过程，虽然上面的例子看起来是影响了整个动画过程，那是因为整个动画确实只定义了两个帧，所以step的作用范围就跟动画完整的范围重合了。这对于掌握帧动画期间每个阶段的持续时长比较关键，假设有如下动画代码定义(随便写的，没实际含义和演示)：
```css
.box.move {
	animation-name: move;
	animation-duration: 1s;
	animation-timing-function: steps(6, end);
}

@keyframes move {
	0% {
		background-position: 0 0;
	}

	15% {
		background-position: -260px 0;
	}

	100% {
		background-position: -590px 0;
	}
}
```
以上代码定义了一个动画，时长为1s，包含了三个keyframe，有2对相邻的keyframe，分别是0~15%,15~100%。 这两段动画过程，占用的动画时长分别是动画完整时长的15%和85%。由于step函数的作用，这两段动画过程又分别被划分为了6个子阶段，每个子阶段的动画持续时长，是当前阶段动画时长的1/6。所以第1对相邻的keyframe，它里面的每个子阶段的最终动画时长就是1/6 \* 0.15s；第2对相邻的keyframe，它里面的每个子阶段的最终动画时长就是1/6 \* 0.85s。

前面说过“每个阶段所对应的动画时长内，应用动画的元素都会保持同一个状态，而不是进行过渡变化”，steps函数的第二个参数决定了每个阶段应该保持为哪个动画状态。 所谓的动画状态，其实就是一个表示动画完成进度的百分比值，0%代表动画刚开始，100%代表动画结束，帧动画的本质就是同一个阶段的动画时长内，动画完成进度的百分比值都是相同的，但是每个阶段的百分比值不同。 steps函数的第二个参数，决定了每个阶段动画完成进度的百分比应该是多少。

steps函数的第二个参数，有如下几个值可用：
* start或jump-start
* end或jump-end
* jump-none
* jump-both



* start表示帧动画在每个阶段的起始点进行动画状态的变化



https://www.w3.org/TR/css-easing-1/#step-easing-functions