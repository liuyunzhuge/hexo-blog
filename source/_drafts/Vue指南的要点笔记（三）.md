---
title: Vue指南的要点笔记（三）
tags:
  - Vue指南要点笔记
  - Vue
categories:
  - Javascript
  - Vue
  - 指南要点
---

本篇要记录的要点有：
1. 简单的事件注册

<!-- more -->

## 简单的事件注册
1. 直接在事件绑定中写逻辑，适用于简单场景
```html
<div id="vue">
	<div class="dropdown" :class="{open: open}">
		<a class="drop_toggle" href="javascript:;" @click="open=!open">更多操作</a>
	</div>
</div>

<script type="text/javascript">
	let vue = new Vue({
		el: '#vue',
		data: {
			open: false
		}
	});
</script>
```

2. 事件绑定的时候，注册一个方法名称
```html
<div id="vue">
	<ul class="tabs"> 
		<li :style="{fontWeight: active === 1 ? 'bold' : ''}">
			<a href="javascript:;" @click="switchTab">标签1</a>
		</li>
		<li :style="{fontWeight: active === 2 ? 'bold' : ''}">
			<a href="javascript:;" @click="switchTab">标签2</a>
		</li>
		<li :style="{fontWeight: active === 3 ? 'bold' : ''}">
			<a href="javascript:;" @click="switchTab">标签3</a>
		</li>
	</ul>
</div>

<script type="text/javascript">
	let vue = new Vue({
		el: '#vue',
		data: {
			active: 1
		},
		methods: {
			switchTab(event){
				//event is a dom event
				let ul = event.target.parentNode.parentNode;
				let li = event.target.parentNode;
				for(let [index, child] of [].slice.call(ul.children).entries()) {
					if(li === child) {
						this.active = index + 1;
					}
				}
			}
		}
	});
</script>
```
直接绑定方法名称的方式注册事件，当方法执行时，方法接收到的参数，是事件对象。

3. 事件绑定的时候，注册一个方法调用表达式
<div id="vue">
	<ul class="tabs"> 
		<li :style="{fontWeight: active === 1 ? 'bold' : ''}">
			<a href="javascript:;" @click="switchTab(1, $event)">标签1</a>
		</li>
		<li :style="{fontWeight: active === 2 ? 'bold' : ''}">
			<a href="javascript:;" @click="switchTab(2, $event)">标签2</a>
		</li>
		<li :style="{fontWeight: active === 3 ? 'bold' : ''}">
			<a href="javascript:;" @click="switchTab(3, $event)">标签3</a>
		</li>
	</ul>
</div>

<script type="text/javascript">
	let vue = new Vue({
		el: '#vue',
		data: {
			active: 1
		},
		methods: {
			switchTab(index, event){
				//event is a dom event
				this.active = index;
				if(event) {
					//special logic can write here
					console.log(event);
				}
			}
		}
	});
</script>
这种方式注册事件，能够很方便地将响应式数据传入方法，尤其是在`v-for`列表渲染中，能够轻易地拿到列表中单个项目的数据，如果还想在方法里面获取事件对象，则需要在绑定的时候，在方法调用表达式传入特殊的变量$event。

