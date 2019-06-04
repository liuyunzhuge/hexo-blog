---
title: ES6 Iterator和for...of循环
date: 2019-05-17 18:10:30
tags:
- ES6学习笔记
categories:
- Javascript
- ES6
- 学习笔记
---

注：这是一篇学习笔记，记录自己在ES6学习过程中按照自己的思路觉得应该记录的一些要点，方便以后查看和复习。参考：
> 阮一峰ES6的书籍中[Iterator和for-of循环](http://es6.ruanyifeng.com/#docs/iterator)
> {% post_link "ES6入门学习的规划" 我的ES6入门学习规划 %}

<!-- more -->
## Iterator定义
Iterator称为遍历器，是一种设计模式，很多语言都有它的实现，JS出得比较晚。主要作用是用来遍历数据结构，但是任何类或对象都可以按它的规范实现它，以便给外部提供遍历自己内部数据或状态的能力。它的规范如下：
```js
interface Iterable {
  [Symbol.iterator]() : Iterator,
}

interface Iterator {
  next(value?: any) : IterationResult,
}

interface IterationResult {
  value: any,
  done: boolean,
}
```
要点：
* 需要把Symbol.iterator这个Symbol值定义为一个方法属性，部署到在对象或类上，并返回一个Iterator对象；外部通过调用类实例或对象的[Symbol.iterator]方法即可得到它的遍历器对象；
* 遍历器对象（Iterator对象）需部署一个next实例方法，在外部拿到遍历器对象后，通过不断地调用它的next方法就能遍历出对象的内部数据或状态；
* next方法返回值的value属性用于传递本次遍历的值，next返回值的done属性可用作判断遍历是否结束，为true时表示结束；
* 实际实现中next方法的返回值，不一定需要同时包含value跟done属性；
* 由于Iterator的作用是遍历，所以在考虑如何生成这个对象的时候，用一个变量去记住当前的遍历位置，是个比较常见的做法。

举例：
```js
let obj = {
	0: 'tom',
	1: 'jerry',
	2: 'jim',
	length: 3,
	[Symbol.iterator]() {
		let curIndex = 0;
		return {
			next: ()=> {
				if(curIndex === this.length) {
					return {done: true};
				}

				return {value: this[curIndex++]};
			}
		}
	}
};

let iterator = obj[Symbol.iterator]();

let result;
while((result = iterator.next()) && !result.done) {
	log(result);
}

function log(result) {
	console.log('当前值：' + result.value);
}
```

js中，实现了Iterator接口的内置对象：
* Array
* Map
* Set
* String: 默认的Iterator接口会把字符串对象当成字符数组进行遍历
* TypedArray
* 函数的 arguments 对象
* NodeList 对象

这些内置对象的[Symbol.iterator]方法有时候可以借用，比如数组的Iterator接口可以借給类数组对象（含数值键和length属性）使用：
```js
let obj = {
	0: 'tom',
	1: 'jerry',
	2: 'jim',
	length: 3,
	[Symbol.iterator]: Array.prototype[Symbol.iterator]
};

let iterator = obj[Symbol.iterator]();

let result;
while((result = iterator.next()) && !result.done) {
	log(result);
}

function log(result) {
	console.log('当前值：' + result.value);
}
```

ES新增for-of循环，专门用来遍历Iterator接口：
```js
let obj = {
	0: 'tom',
	1: 'jerry',
	2: 'jim',
	length: 3,
	[Symbol.iterator]() {
		let curIndex = 0;
		return {
			next: ()=> {
				if(curIndex === this.length) {
					return {done: true};
				}

				return {value: this[curIndex++]};
			}
		}
	}
};

for(let value of obj) {
	log(value);
}

function log(value) {
	console.log('当前值：' + value);
}
```
可想而知, for-of循环内部一定会通过[Symbol.iterator]方法，拿到遍历器对象，然后反复调用next方法实现遍历。即使没有for-of循环，我们也能使用while来实现遍历，for-of只是语言级别上提供的一个遍历而已。

## 主要用途
* {% post_link "ES6-数组解构-变量解构" 解构赋值 %}
* {% post_link "ES6-数组的扩展" 扩展运算符 %}
* yield \*表达式，{% post_link "ES6-Generator函数的语法" 参见Generator部分 %}
* for-of循环

## Generator函数
由于后面要学习的Generator函数，返回的就是一个Iterator对象，所以如果要实现一个类或对象的遍历器，也可以直接在[System.iterator]上部署一个Generator函数。
```js
let obj = {
	0: 'tom',
	1: 'jerry',
	2: 'jim',
	length: 3,
	*[Symbol.iterator]() {
		let curIndex = 0;
		while(curIndex < this.length) {
			yield this[curIndex++];
		}
	}
};

for(let value of obj) {
	log(value);
}

function log(value) {
	console.log('当前值：' + value);
}
```

## Iterator对象的return方法
除了next方法，还可以在Iterator对象上再部署一个return方法。 
* return方法必须返回一个对象，这是规范约定的，否则会报错；
* return方法会在for-of循环出现break，或for-of循环体内抛出异常时调用
```js
let obj = {
	0: 'tom',
	1: 'jerry',
	2: 'jim',
	length: 3,
	[Symbol.iterator]() {
		let curIndex = 0;
		return {
			next: ()=> {
				if(curIndex === this.length) {
					return {done: true};
				}

				return {value: this[curIndex++]};
			},
			return: ()=> {
				console.log('return');
				return {done: true};
			}
		}
	}
};


function log(value) {
	console.log('当前值：' + value);
}

for(let value of obj) {
	if(value === 'jerry') break;
	log(value);
}


for(let value of obj) {
	if(value === 'jerry') throw new Error('sth wrong');
	log(value);
}
// 执行以上语句会发现打印了2次return
```
return只是要求返回一个对象，但是并没有说清楚应该返回一个什么结构的对象，上面的例子中返回了{done: true}，也仅仅是补充表达了遍历已结束的含义。

return方法的使用价值：对于一般的遍历实现来说，return方法可能不是一定需要部署的，但是如果在遍历过程中有用到一些特殊的资源或任务，比如打开文件、打开数据库连接这种，那么部署一个return方法，然后在return方法里面做资源的关闭或任务地中止（关闭文件、关闭数据库连接），是一个比较不错的处理方式。

## Iterator对象的throw方法
除了return方法，还可以在Iterator对象上再部署一个throw方法。 这个方法大部分遍历场景不用到，它是专门给Generator函数配套提供的。 这一点，我觉得实现地不够优雅。如果把Generator函数返回的Iterator对象类型，作为普通的Iterator类型的一个子类，然后给这个子类单独定义throw方法，会不会更好一点。

## for-of循环
这是ES推出的专门用来遍历Iterator对象的语法。
```js
const arr = ['red', 'green', 'blue'];

for(let v of arr) {
  console.log(v); // red green blue
}
```
v这个变量就是对象(arr)的Iterator对象next方法返回值的value属性。任何部署了[System.iterator]接口的对象，都能使用for-of循环。

注意：Iterator对象最后一次next方法，返回的value如果有值，会被for-of循环给忽略：
```js
let obj = {
	0: 'tom',
	1: 'jerry',
	2: 'jim',
	length: 3,
	[Symbol.iterator]() {
		let curIndex = 0;
		return {
			next: ()=> {
				if(curIndex === this.length) {
					return {done: true, value: 'end'};
				}

				return {value: this[curIndex++]};
			}
		}
	}
};


function log(value) {
	console.log('当前值：' + value);
}

for(let value of obj) {
	log(value);
}
```
这是合理的，最后一次next方法调用，返回值的done属性，必定为true，它表达的含义就是遍历结束，所以它的value值会被忽略。

Object Array Set Map这几个类新推出的entries()、keys()、values()实例方法，返回的都是Iterator对象，所以都能用for-of循环。

跟数组实例的forEach方法相比，for-of循环不是回调，可正常使用break continue return这些语法控制遍历，所以for-of循环优于forEach方法来遍历数组。