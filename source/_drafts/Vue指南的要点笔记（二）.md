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
5. 对象和数组作为响应式属性的注意点

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
template元素可以在不增加真实的dom元素的前提下，对多个元素进行条件渲染：
```html
<div id="vue">
	<div>
		<label>
			<input type="checkbox" v-model="useMobile">
		</label>
	</div>
	<template v-if="useMobile">
		<div>
			<label>mobile:</label>
			<input type="text" v-model="mobile">
		</div>
		<div>
			<label>password:</label>
			<input type="text" v-model="password">
		</div>
	</template>
	<template v-else>
		<div>
			<label>email:</label>
			<input type="text" v-model="email">
		</div>
		<div>
			<label>password:</label>
			<input type="text" v-model="password">
		</div>
	</template>
	<div>
		{{JSON.stringify({username: username, password: password})}}
	</div>
</div>

<script type="text/javascript">
	let vue = new Vue({
		el: '#vue',
		data: {
			useMobile: true,
			logon: true,
			mobile: '',
			email: '',
			password: ''
		},
		computed:{
			username() {
				return this.useMobile ? this.mobile : this.email;
			}
		}
	});

</script>
```
也可以同时应用于列表渲染中：
```html
<style type="text/css">
	.content {
		font-size: 14px;color: #2f2f2f;line-height: 1.5;padding: 10px;
	}

	.gap {
		height: 2px; background-color: #eee;
	}
</style>
<div id="vue">
	<div>
		<input type="text" v-model.trim="newText">
		<button type="button" @click="addNew">add</button>
	</div>
	<template v-for="(item, index) in items">
		<div class="gap" v-if="index > 0"></div>
		<div class="content">{{item.text}}</div>
	</template>
</div>

<script type="text/javascript">
	let id = 1;

	let vue = new Vue({
		el: '#vue',
		data: {
			newText: '',
			items: []
		},
		methods: {
			addNew() {
				this.items.push({
					id: id++,
					text: this.newText
				});
			}
		}
	});

</script>
```
template用于v-for指令时，template元素上不能设置key属性。

## 列表渲染中的注意点
遍历字符串:
```html
<div id="vue">
	<div v-for="(item, index) in items">{{item}}</div>
</div>

<script type="text/javascript">
	let vue = new Vue({
		el: '#vue',
		data: {
			items: 'hello vue'
		}
	});
</script>
```
`v-for`遍历字符串，把字符串当字符数组来遍历，`item`指向单个字符元素，`index`指向字符位置，不支持第三个参数。


遍历数字：
```html
<div id="vue">
	<div v-for="(item, index) in items">{{item}}\{{index}}</div>
</div>

<script type="text/javascript">
	let vue = new Vue({
		el: '#vue',
		data: {
			items: 5
		}
	});
</script>
```
`v-for`遍历数字，数字必须大于0，它会生成一个从1增长到指定数字的number数组，来进行渲染。`item`指向数组内的元素，`index`指向数组元素位置。 不支持第三个参数。


遍历iterator对象：
```html
<div id="vue">
	<div v-for="(item, index) in items">{{item}}\{{index}}</div>
</div>

<script type="text/javascript">
	let vue = new Vue({
		el: '#vue',
		data: {
			items: {
				* [Symbol.iterator]() {
					yield {lang: 'css'};
					yield {lang: 'html'};
					yield {lang: 'js'};
					yield {lang: 'php'};
				}
			}
		}
	});
</script>
```
iterator对象，在v-for中渲染，item指向iterator.next()返回的`value`数组，index指向迭代的索引位置。 不支持第三个参数。


数组也是iterator对象，所以与iterator对象迭代特性相同：
```html
<div id="vue">
	<div v-for="(item, index) in items">{{item}}\{{index}}</div>
</div>

<script type="text/javascript">
	let vue = new Vue({
		el: '#vue',
		data: {
			items: [
				{lang: 'css'},
				{lang: 'html'},
				{lang: 'js'},
				{lang: 'php'}
			]
		}
	});
</script>
```

遍历普通对象：
```html
<div id="vue">
	<div v-for="(value, key, index) in items">{{key}}:{{value}}/{{index}}</div>
</div>

<script type="text/javascript">
	let vue = new Vue({
		el: '#vue',
		data: {
			items: {
				lang: 'php',
				type: 'backend',
				level: 'middle',
				like: 'yes'
			}
		}
	});
</script>
```
`v-for`渲染object,最多支持三个参数，第一个参数是object属性的value，第二个参数是object属性名称，第三个参数是属性的索引位置。 v-for内部通过Object.keys返回对象的属性数组，所以遍历顺序也跟Object.keys返回的属性顺序一致。


将以上示例中的`in`全部替换为`of`，结果完全一致，在实际使用中，更推荐使用`of`。

## 对象和数组作为响应式属性的注意点
Vue不能检测对象属性的添加或删除, 对于已经创建的实例，Vue不允许动态添加根级别的响应式属性。
```html
<div id="vue">
	a: {{a.name}},
	b: {{b && b.name}}
</div>

<script type="text/javascript">
	let vue = new Vue({
		el: '#vue',
		data: {
			a: {
				name: 'a'
			}
		}
	});

	vue.b = {
		name: 'b'
	};//此处控制台会有警告

	delete vue.a;
</script>
```
a在`vm`实例化期间经过生命周期的injections处理，成为了响应式属性，b是`vm`实例化之后添加的，不会成为响应式属性。a属性删除并不会引发响应式的渲染。

虽然不能增删跟级别的响应式属性，但是对已存在的响应式数据进行修改、增删属性，是可以的。



