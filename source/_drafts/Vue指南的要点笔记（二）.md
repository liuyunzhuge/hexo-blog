---
title: Vue指南的要点笔记（二）
tags:
  - Vue指南要点笔记
  - Vue
categories:
  - Javascript
  - Vue
  - 指南要点
---

本篇要记录的要点有：
1. 计算属性的缓存特性
2. `vm`实例方法用在模板中取值时执行的时机
3. template元素在条件渲染和列表渲染中的作用
4. 列表渲染中的注意点

<!-- more -->

## 计算属性的缓存特性
> 计算属性是基于它们的响应式依赖进行缓存的。只在相关响应式依赖发生改变时它们才会重新求值。

```html
<div id="vue">
	<p>{{reverseMsg}}</p>
	<p>{{flag}}</p>
	<p>{{timestamp}}</p>
</div>

<script type="text/javascript">
	let vue = new Vue({
		el: '#vue',
		data: {
			msg: new Date() + '',
			flag: true
		},
		computed: {
			reverseMsg() {
				console.log('reverseMsg recomputed');
				return this.msg.split('').reverse().join('');
			},
			timestamp() {
				console.log('timestamp recomputed');
				return Date.now();
			}
		},
		created() {
			//timer1
			setTimeout(() => {
				this.msg = new Date() + '';
			}, 1000);

			console.log(this.reverseMsg);
			console.log(this.reverseMsg);
			console.log(this.reverseMsg);

			//timer2
			setTimeout(() => {
				this.flag = !this.flag;
			}, 2000);
		}
	});

</script>
```
在这个示例中，控制台会打印出：
```
reverseMsg recomputed
timestamp recomputed
reverseMsg recomputed
```
第1、2行的打印是`vm`实例初始化渲染，2个computed属性首次计算的时候打印出来的，当timer1执行的时候，`vm`实例会再次渲染，但是第2个computed属性`timestamp`由于内部没有响应式依赖，这个computed属性在首次计算以后，就会被缓存起来，永远不会再被调用；timer1内部重新给响应式的`msg`属性赋值，触发`vm`实例再次渲染，第1个computed属性，依赖了`msg`这个响应式属性，所以在渲染之前，`reverseMsg`这个计算属性再次执行，打印出第3条log；当timer2执行的时候，`vm`这个实例会再次渲染，但由于`reverseMsg`这个计算属性依赖的`msg`属性没有变化，所以这个计算属性不会被重新计算，而是直接用上次计算缓存的值继续渲染。

计算属性（如reverseMsg）通过computed这个option定义，最终会被定义到`vm`实例上面（`vm.reverseMsg`），它在`vm`实例上面会部署为一个`getter`属性，在这个`getter`属性内部内，它会先去判断计算属性的响应式依赖的属性是否有变化，有变化，则重新去执行计算属性对应的函数，否则直接取计算属性缓存的值。可以在timer1中加入以下的代码，利用浏览器的调试来验证这一点：
```js
	//timer1
	setTimeout(() => {
		this.msg = new Date() + '';
		debugger;
		console.log(this.reverseMsg);
		debugger;
		console.log(this.reverseMsg);
	}, 1000);
```
可以在两次debugger的时候，跟进调试，会发现只有第1个debugger后面的`this.reverseMsg`会进入到`computed.reverseMsg()`里面去执行，第二个debugger后面的不会。

计算属性跟它内部响应式依赖之间的另外一层依赖关系，必须在计算属性有过一次执行之后才会建立，而且只会与每次执行过程中用到的响应式属性建立依赖。
```html
<div id="vue">
	<p>{{reverseMsg}}</p>
	<p>{{reverseMsg2}}</p>
</div>

<script type="text/javascript">
	let vue = new Vue({
		el: '#vue',
		data: {
			msg: new Date() + '',
			msg2: new Date() + ''
		},
		computed: {
			reverseMsg() {
				console.log('reverseMsg recomputed');
				let r = '';
				if(true) {
				 	r = this.msg.split('').reverse().join('');
				}

				return r;
			},
			reverseMsg2() {
				console.log('reverseMsg2 recomputed');
				let r = '';
				if(false) {
				 	r = this.msg2.split('').reverse().join('');
				}

				return r;
			}
		},
		created() {
			setTimeout(() => {
				this.msg = new Date() + '';
			}, 1000);
			setTimeout(() => {
				this.msg2 = new Date() + '';
			}, 2000);
		}
	});

</script>
```
打印结果：
```
reverseMsg recomputed
reverseMsg2 recomputed
reverseMsg recomputed
```
上面这个例子可以看到，`reverseMsg`与`reverseMsg2`这两个计算属性，仅仅只是内部if结构有没有执行的区别，但是最后只有reverseMsg是响应式的。因为reverseMsg2第一次执行的时候，并没有用到msg2这个响应式属性，所以reverseMsg2根本没有依赖任何响应式属性。也就是说计算属性的响应式特性，是在计算属性的函数执行完毕才确认的，这是一个动态的过程。


计算属性可以响应式依赖另外一个计算属性：
```html
<div id="vue">
	<p>{{reverseMsg}}</p>
	<p>{{reverseMsg2}}</p>
</div>

<script type="text/javascript">
	let vue = new Vue({
		el: '#vue',
		data: {
			msg: new Date() + '',
			msg2: new Date() + ''
		},
		computed: {
			reverseMsg() {
				console.log('reverseMsg recomputed');
				return this.msg.split('').reverse().join('');
			},
			reverseMsg2() {
				console.log('reverseMsg2 recomputed');
				return this.reverseMsg.split('').reverse().join('');
			}
		},
		created() {
			setTimeout(() => {
				this.msg = new Date() + '';
			}, 1000);
		}
	});

</script>
```
打印结果：
```
reverseMsg recomputed
reverseMsg2 recomputed
reverseMsg recomputed
reverseMsg2 recomputed
```

## `vm`实例方法用在模板中取值时执行的时机
`vm`实例方法，如果用在模板中使用，在每次重新渲染的时候，方法都会执行，它不具备像计算属性一样的缓存特性。
```html
<div id="vue">
	<p>{{reverseMsg()}}</p>
</div>

<script type="text/javascript">
	let vue = new Vue({
		el: '#vue',
		data: {
			msg: new Date() + ''
		},
		created() {
			//timer1
			setTimeout(() => {
				this.msg = new Date() + '';
			}, 1000);
		},
		methods: {
			reverseMsg() {
				console.log('vm.reverseMsg called')
				return this.msg.split('').reverse().join('');
			}
		},
		beforeUpdate() {
			console.log('beforeUpdate');
		},
		updated() {
			console.log('updated');
		}
	});

</script>
```
打印结果：
```
vm.reverseMsg called
beforeUpdate
vm.reverseMsg called
updated
```
第1条log是`vm`实例初始化渲染时调用`reverseMsg`方法打印的，后面的3条打印可以看出，实例方法在模板中取值时调用的时机是位于beforeUpdate这个hook之后，以及updated这个hook之前的。

## template元素在条件渲染和列表渲染中的作用

## 列表渲染中的注意点
