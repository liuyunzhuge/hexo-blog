---
title: ES6 Generator函数的异步应用（一）
date: 2019-05-17 18:10:59
tags:
- ES6学习笔记
categories:
- Javascript
- ES6
- 学习笔记
---

注：这是一篇学习笔记，记录自己在ES6学习过程中按照自己的思路觉得应该记录的一些要点，方便以后查看和复习。参考：
> 阮一峰ES6的书籍中[ES6 Generator函数的异步应用](http://es6.ruanyifeng.com/#docs/generator-async)
> {% post_link "ES6入门学习的规划" 我的ES6入门学习规划 %}

Generator函数天然具备实现异步任务管理的能力，因为它分阶段执行的特性，跟异步任务分步完成的需求，是完全契合的。也就是说可以把异步任务写到Generator函数里面，然后通过Generator实例的next方法，让异步任务能够分步骤地跑起来。
<!-- more -->
```js
function * executeAsyncTasks() {
	yield setTimeout(function(){
		console.log('first async task executed');
	},1000);
	yield setTimeout(function(){
		console.log('second async task executed');
	},1000);
	yield setTimeout(function(){
		console.log('third async task executed');
	},1000);
}
let asyncTaskExecutor = executeAsyncTasks();

let result;
while((result = asyncTaskExecutor.next()) && !result.done) {
	console.log(result.value);
}
```
通过这个简单的例子可以看到Generator函数已经做到让多个异步任务“链式”地运行起来了。与Promise相比，Generator函数的这种写法就是所谓的“异步逻辑的同步表达”，它跟Promise不同的是，它完全是由同步方式的语句写法来实现异步链式逻辑的，Promise虽然在同步表达方面的含义也不差：
```js
new Promise(function(resolve){
	setTimeout(function(){
		console.log('first async task executed');
		resolve();
	},1000);
}).then(function(data){
	return new Promise(function(resolve){
		setTimeout(function(){
			console.log('second async task executed');
			resolve();
		},1000);
	});
}).then(function(data){
	return new Promise(function(resolve){
		setTimeout(function(){
			console.log('third async task executed');
			resolve();
		},1000);
	});
})
```
但是比起来，还是Generator函数更加简洁一些。

再回到最开始的那个例子：
```js
function * executeAsyncTasks() {
	yield setTimeout(function(){
		console.log('first async task executed');
	},1000);
	yield setTimeout(function(){
		console.log('second async task executed');
	},1000);
	yield setTimeout(function(){
		console.log('third async task executed');
	},1000);
}
let asyncTaskExecutor = executeAsyncTasks();

let result;
while((result = asyncTaskExecutor.next()) && !result.done) {
	console.log(result.value);
}
```
仔细地思考一下，如果按这个方式去编写真实的异步任务，会发现它的功能也是比较有限的，比如说：
* 真实的异步任务封装，我们更希望拿到一个函数执行后，整个异步链就自己跑起来了，而不是上面那种还需要去不断地调用next才能运转；
* 真实的异步任务往往是前一个异步任务的运行结果，会返回到链条执行环境里面去，因为它很有可能要用于后面的异步任务的逻辑；而上面的例子是肯定做不到这点的，首先yield后面的表达式返回出去的是一个timer id，外部执行环境拿到也干不了啥，然后即使next方法能传参进去，但是传什么值进去是里面的异步任务的执行结果决定的，外部执行环境根本拿不到异步任务的结果；

为了解决以上这些限制，需要考虑以下几点：
1. 如何让Generator函数自动跑起来
2. 如何让外部环境能够拿到异步任务的执行结果

先看第2个问题，一旦我们拿到了异步任务的执行结果，要再传进去，只需要使用next方法就行了。在目前已知的对象中，能够保留异步任务执行结果的对象只有一个，就是Promise，所以我们可以用Promise来尝试一下:
```js
function * executeAsyncTasks() {
	// 核心就是把异步任务从timer换成Promise

	let resultForTask1 = yield new Promise(function(resolve){
		setTimeout(function(){
			console.log('first async task executed');
			resolve({name: 'task1', state: 'executed', next: Math.random() * 10 > 5 ? 'second' : 'third'});
		},1000);
	});

	let resultForNext;
	if(resultForTask1.next === 'second') {
		resultForNext = yield new Promise(function(resolve){
			setTimeout(function(){
				console.log('second async task executed');
				resolve({name: 'task2', state: 'executed'});
			},1000);
		});
	} else {
		resultForNext = yield new Promise(function(resolve){
			setTimeout(function(){
				console.log('third async task executed');
				resolve({name: 'task3', state: 'executed'});
			},1000);
		});
	}

	return [resultForTask1, resultForNext];
}
let asyncTaskExecutor = executeAsyncTasks();

// 此处asyncTaskExecutor.next().value是一个Promise实例
asyncTaskExecutor.next().value.then(function(data){
	// data拿到的第一个yield表达式后面的Promise实例fulfilled时存储的异步任务状态

	// 此处asyncTaskExecutor.next(data).value又是一个Promise实例
	asyncTaskExecutor.next(data).value.then(function(data){
		// data拿到的下一个yield表达式后面的Promise实例fulfilled时存储的异步任务状态

		// 此处的asyncTaskExecutor.next(data).value是Generator函数最终的返回值，保存了内部两个异步任务的执行结果
		console.log(asyncTaskExecutor.next(data).value);
		//[{…}, {…}]
	});
});
```
借助Promise，已经可以成功地从外部环境拿到内部的异步结果，并且还能通过next方法再把结果传进函数。唯一美中不足的是，最后这个异步任务链地运转还是很繁琐，如果能自动跑起来就更好了。观察上面运转异步任务链的代码，可以发现一个规律，这个运转是有规则的，就是调用next方法，然后给value注册回调，在回调内重头做一遍“调用next方法，然后给value注册回调”的事情。 wait...这不就是递归吗？所以可以试试把这个部分用递归的形式给封装起来：
```js
function * executeAsyncTasks() {
	// 核心就是把异步任务从timer换成Promise

	let resultForTask1 = yield new Promise(function(resolve){
		setTimeout(function(){
			console.log('first async task executed');
			resolve({name: 'task1', state: 'executed', next: Math.random() * 10 > 5 ? 'second' : 'third'});
		},1000);
	});

	let resultForNext;
	if(resultForTask1.next === 'second') {
		resultForNext = yield new Promise(function(resolve){
			setTimeout(function(){
				console.log('second async task executed');
				resolve({name: 'task2', state: 'executed'});
			},1000);
		});
	} else {
		resultForNext = yield new Promise(function(resolve){
			setTimeout(function(){
				console.log('third async task executed');
				resolve({name: 'task3', state: 'executed'});
			},1000);
		});
	}

	return [resultForTask1, resultForNext];
}

function autoRunGenerator(gen, callback) {
	function run(lastResult){
		let ret = gen.next(lastResult);

		if(!ret.done) {
			ret.value.then(function(result) {
				run(result);
			});
		} else {
			typeof callback === 'function' && callback(ret.value);
		}
	}

	run();
}

autoRunGenerator(executeAsyncTasks(), function(ret) {
	console.log(ret);
});
```
这个例子封装出了autoRunGenerator这个函数，它接收2个参数，第一个参数代表的是某个异步Generator函数执行后返回的Iterator对象，第二参数是Generator函数完全执行完毕后的回调，这个回调能够拿到Generator函数完全执行后最终的返回值。 借助autoRunGenerator，任意的Generator函数都可以跑起来，唯一的要求就是yield后面必须用Promise来写异步任务。这就很容易做到了，毕竟Promise都已经是官方标准了。

为了贯彻Promise，autoRunGenerator的第二个参数也可以改造成Promise来使用：
```js
function * executeAsyncTasks() {
	// 核心就是把异步任务从timer换成Promise

	let resultForTask1 = yield new Promise(function(resolve){
		setTimeout(function(){
			console.log('first async task executed');
			resolve({name: 'task1', state: 'executed', next: Math.random() * 10 > 5 ? 'second' : 'third'});
		},1000);
	});

	let resultForNext;
	if(resultForTask1.next === 'second') {
		resultForNext = yield new Promise(function(resolve){
			setTimeout(function(){
				console.log('second async task executed');
				resolve({name: 'task2', state: 'executed'});
			},1000);
		});
	} else {
		resultForNext = yield new Promise(function(resolve){
			setTimeout(function(){
				console.log('third async task executed');
				resolve({name: 'task3', state: 'executed'});
			},1000);
		});
	}

	return [resultForTask1, resultForNext];
}

function autoRunGenerator(gen, callback) {
	return new Promise(function(resolve, reject){
		function run(lastResult){
			let ret = gen.next(lastResult);

			if(!ret.done) {
				ret.value.then(function(result) {
					run(result);
				}).catch(function(error) {
					reject(error);
				})
			} else {
				resolve(ret.value);
			}
		}

		run();
	});
}

autoRunGenerator(executeAsyncTasks()).then(function(ret) {
	console.log(ret);
});
```
上面的代码改动了两个地方，第一是把autoRunGenerator内部整体用Promise包起来了，并且返回了这个用于包裹的Promise实例，当整个Generator函数完全执行后，这个实例会被fulfilled；第二是一旦异步任务有一个出现错误，整个异步控制就会中断掉。

总之，借助于Promise和autoRunGenerator函数，已经实现了让Generator函数来做异步任务的基本功能。 在没有学习到后面正式内容前，上面的内容应该是够用的。

这篇笔记是学习阮一峰的书籍之后，自己总结出来的，帮助自己掌握Generator函数应用于异步任务的思路。下一篇笔记才是针对书籍内容的记录，相比的话，还是书里面提到的一些方法更加完善全面一些。