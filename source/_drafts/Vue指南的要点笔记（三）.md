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
2. 事件修饰符的要点
3. 按键修饰符

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
```html
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
```
这种方式注册事件，能够很方便地将响应式数据传入方法，尤其是在`v-for`列表渲染中，能够轻易地拿到列表中单个项目的数据，如果还想在方法里面获取事件对象，则需要在绑定的时候，在方法调用表达式传入特殊的变量$event。

## 事件修饰符的要点
* stop 阻止事件冒泡
* prevent 阻止事件的默认行为（如表单提交，链接跳转）
* capture 启用事件的捕获阶段
* self 只响应元素自身的事件（非冒泡或捕获的事件）
* once 只回调一次
* passive 启动addEventListener的passive选项，不可与prevent一起使用，有passive，prevent会被浏览器忽略

once可应用于原生事件和组件自定义事件，其它修饰符只能用于原生事件。

特殊地用法：只有修饰符，没有事件回调
```html
<div id="vue">
	<form action="" method="get" @submit.prevent>
		<input type="text" name="title">
		<button type="submit">submit</button>
	</form>

	<a href="/" @click.prevent>回到首页</a>
</div>

<script type="text/javascript">
	let vue = new Vue({
		el: '#vue',
		data: {
		}
	});
</script>
```

修饰符的顺序：
> `v-on:click.prevent.self` 会阻止所有的点击，而 `v-on:click.self.prevent` 只会阻止对元素自身的点击。
```html
<div id="vue">
	<a href="/" @click.self.prevent style="display: block; border: 1px solid #ccc; width: 200px; height: 200px;padding-top: 100px;">
		<span>click me won't prevent</span>
	</a>
	<a href="/" @click.prevent.self style="display: block; border: 1px solid #ccc; width: 200px; height: 200px;padding-top: 100px;">
		<span>click me would prevent</span>
	</a>
</div>

<script type="text/javascript">
	let vue = new Vue({
		el: '#vue',
		data: {
		}
	});
</script>
```
示例中第1个`a`里面的`span`点击后，会跳转到`/`，第2个`a`里的不会。

passive跟prevent是矛盾的，只要passive启用了， 浏览器就会认为你不想要preventDefault，如果要prevent，passive就不能启用，如果要passive，就不能用prevent：
```html
<div id="vue" @touchmove.passive="move" style="width: 200px;height: 200px;border: 1px solid #ccc;">
</div>

<script type="text/javascript">
	let vue = new Vue({
		el: '#vue',
		data: {
		},
		methods: {
			move(event){
				event.preventDefault();
				console.log(event);
			}
		}
	});
</script>
```
以上代码，测试时候会发现报错：`Unable to preventDefault inside passive event listener invocation.`；解决办法就是要么把preventDefault的调用去掉，要么把passive去掉，这得根据实际情况决定。

## 按键修饰符
> 你可以直接将 KeyboardEvent.key 暴露的任意有效按键名转换为 kebab-case 来作为修饰符。
[KeyboardEvent.key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key/Key_Values)是对按键的一套标准规则。

vue内置了一套别名，用于常用的按键，举例：
```html
<div id="vue">
	<div>
		1. <input type="text" @keyup.enter="keyup(1, $event)">
	</div>
	<div>
		2. <input type="text" @keyup.tab="keyup(2, $event)">
	</div>
	<div>
		3. <input type="text" @keyup.delete="keyup(3, $event)">
	</div>
	<div>
		4. <input type="text" @keyup.esc="keyup(4, $event)">
	</div>
	<div>
		5. <input type="text" @keyup.space="keyup(5, $event)">
	</div>
	<div>
		6. <input type="text" @keyup.up="keyup(6, $event)">
	</div>
	<div>
		7. <input type="text" @keyup.down="keyup(7, $event)">
	</div>
	<div>
		8. <input type="text" @keyup.left="keyup(8, $event)">
	</div>
	<div>
		9. <input type="text" @keyup.right="keyup(9, $event)">
	</div>
	<p>{{log}}</p>
</div>

<script type="text/javascript">
	let vue = new Vue({
		el: '#vue',
		data: {
			log: ''
		},
		methods: {
			keyup(index, event){
				this.log = 'clicked No.' + index + ' input, event key is ' + event.key;
			}
		}
	});
</script>
```

按键码`<input v-on:keyup.13="submit">`的方式已经废弃，不推荐使用；除vue内置的别名外，其它按键应首选KeyboardEvent.key来使用。

### 系统修饰键
* .ctrl
* .alt
* .shift
* .meta

