---
title: ES6 let&const声明变量
date: 2019-05-09 17:35:30
tags:
- ES6学习笔记
categories:
- Javascript
- ES6
- 学习笔记
---

注：这是一篇学习笔记，记录自己在ES6学习过程中按照自己的思路觉得应该记录的一些要点，方便以后查看和复习。参考：
> 阮一峰ES6的书籍中[let 和 const 命令](http://es6.ruanyifeng.com/#docs/let)
> {% post_link "ES6入门学习的规划" 我的ES6入门学习规划 %}

<!-- more -->
## 基本点
let与const基本上没区别；只是const声明的是常量，它后面的变量一旦赋值以后，不允许重新赋值。共同特性如下：
1. 声明的变量仅在代码块内有效；
2. 不存在变量提升（不会提升到作用域顶部进行提前声明）
3. 暂时性死区（从代码块开始位置到变量完成声明之前，变量不可用）
4. 不能重复声明同一个变量

## for循环要点
```javascript
var a = [];
for (let i = 0, tom = {}; i < 10; i++) {
  a[i] = {
  	sayHi: function(){
  		console.log('I \'m ' + (i+1));
  	},
  	tom: tom
  };
}
a[6].sayHi(); // I 'm 7
console.log(a[5].tom === a[6].tom); // true
```
以上的i变量如果用var声明，会导致最后a数组每个元素sayHi的时候，输出的是同一个i值。 用let声明没有此问题，这是因为let与const给js的作用域带来了块级作用域，for后面的花括号表示这个块级作用域，for循环次数代表了for循环过程中产生的块级作用域个数。 上例中因此创建的作用域有10个，而如果用var声明，只会产生一个作用域。也就是说let的方式，在for循环内部声明的函数都不是在同一个作用域内定义的，所以它们可以单独访问各自作用域里面的i；而var的方式，定义出来的内部函数都是在同一个作用域中的，只有借助立即执行的函数表达式才能让每次循环定义的函数分布到单独的作用域当中。所以let的方式，等同于下面的var方式：
```javascript
var a = [];
for (var i = 0, tom = {}; i < 10; i++) {
  a[i] = {
  	sayHi: (function(i){
  		return function(){
	  		console.log('I \'m ' + (i+1));
	  	}
  	})(i),
  	tom: tom
  };
}
a[6].sayHi(); // I 'm 7
console.log(a[5].tom === a[6].tom); // true
```
实际上for循环这个情况，我觉得还跟i是一个基础类型值有关系，上例中tom就不会在每个作用域里面都复制一份；而且如果从作用域角度考虑，i既然是一个外层作用域声明的变量，那么应该在循环里所有的作用域内都有效才对；猜测是ES6对于for循环有做特殊处理。

另外for循环用了let之后，for部分会形成一个外层作用域，循环体是一个子作用域：
```javascript
for (let i = 0; i < 3; i++) {
  let i = 'abc';
  console.log(i);
}
// abc
// abc
// abc
```

## 块级作用域
ES6有了块级作用域。注意点：不要将函数声明在块级作用域内，而是在顶层作用域或者是外部函数作用域中去声明函数。

## Javascript声明变量的6种方式：
```javascript
var function let const class import
```

## 顶层对象的属性
var function声明的变量会变为顶层对象的属性，let const class声明的不会。

## 顶层对象与globalThis提案

浏览器、webworker、node等js运行环境中，顶层对象的含义不一致：
* 浏览器中可以用window表示顶层对象，webworker与node不可以
* 浏览器与webworker可以用self表示顶层对象，node不可以
* node可以用global表示顶层对象，浏览器和webworker不可以

this可以拿到顶层对象，但是也不完全可靠：
* 全局环境中，浏览器的this会返回顶层对象，但是node和es6的module都会返回当前模块
* 函数作为非对象方法运行时，return this能返回顶层对象，但是严格模式下会返回undefined
* new Function('return this') 始终能返回顶层对象，但是浏览器启用了内容安全策略，会无效

现在有一个提案，在语言标准的层面，引入globalThis作为顶层对象。也就是说，任何环境下，globalThis都是存在的，都可以从它拿到顶层对象，指向全局环境下的this。