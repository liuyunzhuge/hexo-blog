---
title: Vue指南的要点笔记（一）
tags:
- Vue指南要点笔记
- Vue笔记
categories:
- Javascript
- Vue
- 指南要点
---

本篇开始，仔细地阅读Vue官方指南，并记录学习过程中思考、实践、总结的要点。 本篇包含的主要是内容是：
1. 生命周期图示中关键节点

<!-- more -->

## 生命周期图示中关键节点
这是官方的生命周期图示:
<img src="https://cn.vuejs.org/images/lifecycle.png" width="450">
根据这张图示，可以总结出的要点有：
1. 如果没有`el`option，`new Vue`构造出的实例不会立即渲染到dom上，除非再次调用实例的`$mount`方法，将vue实例与dom元素进行挂载：
```js
let vue = new Vue({
	el: '#app'
	//,...
});

//等价于
let vue = new Vue({
	//...
});

vue.$mount('#app');
```
	而且没有`el`option的实例，它的生命周期只会进行到`created`这个钩子，当它被`$mount`到一个dom元素之后，`created`后面的生命周期才能继续。
2. `vm.$data`这个属性、`vm`的计算属性、`vm`通过watch添加的回调，最早要在`created`这个钩子里面才能生效。只有生命周期进行到`created`这个钩子的时候，vue实例才完成了injections的初始化；
3. `vm.$el`这个属性，最早要在`beforeMounte`这个钩子里面才能访问到；
4. vm实例methods内定义的行文方法，最早要在`created`这个钩子里面才能访问到；
5. `vm.$refs`这个属性内的节点引用，至少要在`mounted`这个钩子里面才能访问到；
6. 当设置了`el`option，且未设置`template`option的时候，会把`el`的`outerHTML`作为渲染模板进行编译，由于是`outerHTML`，所以el元素本身也能使用vue的模板语法，比如动态地设置class属性；
```html
<div id="vue" :class="{enabled: enabled}">
	<p ref="content">{{msg}}</p>
</div>

<script type="text/javascript">
	let obj = {
			msg: new Date(),
			enabled: true
		};
	let vue = new Vue({
		data: obj,
		beforeCreate() {
			console.log('beforeCreate', this.$el, this.$data, this.$data === obj );
			//beforeCreate undefined undefined false

			console.log(this.updateMsg);
			//undefined

			console.log(this.$refs.content);
			//undefined
		},
		created() {
			console.log('created', this.$el, this.$data, this.$data === obj);
			//created undefined {__ob__: Observer} true
			
			console.log(this.updateMsg);
			//function updateMsg

			console.log(this.$refs.content);
			//undefined
		},
		beforeMount(){
			console.log('beforeMount', this.$el);
			//beforeMount div#vue

			console.log(this.$refs.content);
			//undefined
		},
		mounted(){
			console.log('mounted', this.$el);
			//mounted div#vue

			console.log(this.$refs.content);
			//<p></p>
		},
		methods: {
			updateMsg(){
				this.msg = new Date();
			}
		}
	});

	vue.$mount('#vue');

</script>
```
7. 不管有没有设置`el`option，只要设置了`template`option，就会把`template`直接用于底层的render函数，并根据`template`创建出新的dom元素，替换掉`el`option所指向的dom元素，并赋值给`vm.$el`；所以更加安全地访问`vm.$el`的时机点，最早是在`mounted`这个钩子函数里面。
8. `template`option的应该只能包含一个顶层元素，这个顶层元素最后会被创建到dom里面，成为最终的`vm.$el`；由此可知，所谓的单文件的vue组件，实际上就是把template部分定义的内容，设置为了组件的`template`option而已。
