---
title: ES6 Generator函数的异步应用（二）
date:  2019-05-17 18:11:00
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

这篇笔记继续学习Generator函数的异步应用。
<!-- more -->

## Thunk函数
thunk函数是替代Promise实现Generator函数自动执行的另外一种方案。在Generator函数的应用里，thunk函数的作用是：把多参数函数（最后一个参数是一个回调函数）变换为只接收回调函数作为参数的单参函数。 简而言之它是一个函数转换器，把一个函数转换为另一个函数。
```js
function asyncTask(name, age, callback) {
	setTimeout(function () {
		// sth async logic
		callback({name, age});
	}, 0);
}

// 直接使用asyncTask这个函数，是这么用
asyncTask('lyzg', 28, function (data) {
	console.log("origin version",data);
});

// 定义一个thunk函数用于转换asyncTask这类函数
function thunk(fn) {
	return function (...args) {
		return function (callback) {
			return fn.call(this, ...args, callback);
		}
	}
}

let asyncTaskThunk = thunk(asyncTask);

// 使用thunk版本的asyncTask函数
asyncTaskThunk('lyzg', 28)(function (data) {
	console.log("thunk version",data);
});
```
上面的这个例子中，thunk函数是一个通用的，可以把类似于asyncTask这类多个参数但是最后一个参数是一个回调的函数转成一个另外的函数。 使用的时候是使用转换后的这个函数，原先的一次调用，最后会变为两次调用，才能把原先所有的参数“用尽”。
```js
asyncTaskThunk('lyzg', 28)(callback);
```
那么Thunk函数如何应用于Generator函数的异步执行呢？回顾Promise如何解决Generator函数的异步问题，基本点在于把yield后面的异步任务写成Promise来处理。Thunk函数这里也是，我们需要把yield后面的内容用thunk来处理。先不考虑如何让Generator函数自动执行，看看如何用Thunk函数实现Generator函数中的异步任务链式地运行起来：
```js
function thunk(fn) {
	return function (...args) {
		return function (callback) {
			return fn.call(this, ...args, callback);
		}
	}
}

function * executeAsyncTasks() {
	// 核心就是把异步任务改成thunk转换后的函数调用

	let task1 = thunk(function(taskName, callback){
		setTimeout(function(){
			console.log(taskName + ' executed');
			callback({name: taskName, state: 'executed', next: Math.random() * 10 > 5 ? 'task2' : 'task3'});
		},1000);
	});

	let task2 = thunk(function(taskName, callback){
		setTimeout(function(){
			console.log(taskName + ' executed');
			callback({name: taskName, state: 'executed'});
		},1000);
	});

	let task3 = thunk(function(taskName, callback){
		setTimeout(function(){
			console.log(taskName + ' executed');
			callback({name: taskName, state: 'executed'});
		},1000);
	});

	let resultForTask1 = yield task1('task1');

	let resultForNext;
	if(resultForTask1.next === 'task2') {
		resultForNext = yield task2('task2');
	} else {
		resultForNext = yield task2('task3');
	}

	return [resultForTask1, resultForNext];
}
let asyncTaskExecutor = executeAsyncTasks();

// 重点：理解asyncTaskExecutor.next().value是个什么值
asyncTaskExecutor.next().value(function(data){

	asyncTaskExecutor.next(data).value(function(data){

		console.log(asyncTaskExecutor.next(data).value);
		// [{…}, {…}]
	});
});
```
回顾这个例子里面的关键点，首先把异步任务定义为最后一个参数是回调的普通函数，那个回调参数是为了接收异步任务的处理结果；然后把这个普通函数用thunk函数转换一下，得到一个可用于在yield表达式后执行的异步任务函数，注意通过thunk转换以后，异步任务并没有开始执行；接着在yield关键词后面调用上一步的异步任务函数，并传入除回调参数之外的其它所有参数，这个异步任务会返回一个新函数，作为外部调用next方法返回值的value属性，此时异步任务开始执行；最后外部通过next().value即可注入一个回调函数，这个回调函数在异步任务结束后就会被调用。 至此，外部就掌握到了Generator函数内部异步任务结束的时机，并成功拿到了异步任务的结果。

如果想要上面的例子自动跑起来，那么就可以像Promise那个做法一样处理，因为上面的例子中最后运转Generator函数的逻辑，也是一个类似递归调用自身next方法的处理。
```js
function thunk(fn) {
	return function (...args) {
		return function (callback) {
			return fn.call(this, ...args, callback);
		}
	}
}

function * executeAsyncTasks() {
	// 核心就是把异步任务改成thunk转换后的函数调用

	let task1 = thunk(function(taskName, callback){
		setTimeout(function(){
			console.log(taskName + ' executed');
			callback({name: taskName, state: 'executed', next: Math.random() * 10 > 5 ? 'task2' : 'task3'});
		},1000);
	});

	let task2 = thunk(function(taskName, callback){
		setTimeout(function(){
			console.log(taskName + ' executed');
			callback({name: taskName, state: 'executed'});
		},1000);
	});

	let task3 = thunk(function(taskName, callback){
		setTimeout(function(){
			console.log(taskName + ' executed');
			callback({name: taskName, state: 'executed'});
		},1000);
	});

	let resultForTask1 = yield task1('task1');

	let resultForNext;
	if(resultForTask1.next === 'task2') {
		resultForNext = yield task2('task2');
	} else {
		resultForNext = yield task2('task3');
	}

	return [resultForTask1, resultForNext];
}

function autoRunGenerator(gen, callback) {
	function run(lastResult) {
		let ret = gen.next(lastResult);
		if(ret.done) {
			typeof callback === 'function' && callback(ret.value);
		} else {
			ret.value(function (result) {
				run(result);
			});
		}
	}

	run();
}
let asyncTaskExecutor = autoRunGenerator(executeAsyncTasks(), function (data) {
	console.log(data);
});
```
对比上一篇笔记记录的Promise自动运行的方式，其实发现Promise跟thunk函数的核心点都是相似的，就是解决以下两个问题：
1. 如何让外部知道里面的异步任务什么时候执行完毕，这样外部好在那个时机点，通过next方法让下一个异步任务开始运行；
2. 如何让外部拿到每次异步任务的执行结果，这样外部通过next方法的参数，就能在下一个异步任务执行之前，把上一个异步任务的结果注入回Generator函数体。

明白这两点，这两个自动运行Generator函数的方式就都好理解了。

## thunkify
thunk函数有一个npm模块，github上可看到源码，[thunk](https://github.com/tj/node-thunkify/blob/master/index.js)。 这个实现也很简单，跟前面的那个简单形式差不多的，唯一的区别就是npm版本这个加入了回调函数最后只能调用一次的处理。
```js
function thunkify(fn){
  assert('function' == typeof fn, 'function required');

  return function(){
    var args = new Array(arguments.length);
    var ctx = this;

    for(var i = 0; i < args.length; ++i) {
      args[i] = arguments[i];
    }

    return function(done){
      var called;

      args.push(function(){
        if (called) return;
        called = true;
        done.apply(null, arguments);
      });

      try {
        fn.apply(ctx, args);
      } catch (err) {
        done(err);
      }
    }
  }
};
```

## co模块
[co 模块](https://github.com/tj/co)是著名程序员 TJ Holowaychuk 于 2013 年 6 月发布的一个小工具，用于 Generator 函数的自动执行。这个模块写的比较厉害，能同时兼容thunk或Promise编写的Generator函数异步任务的处理，相当于这个模块内部同时处理近两篇笔记学习的东西，而且提供了更多的使用形式，比如yield后面接普通数据而不是异步任务，后面接数组这种。源码不算特别多，我觉得值得认真去学习一下。

简单举例：
```js
// 数组的写法
co(function* () {
  var res = yield [
    Promise.resolve(1),
    Promise.resolve(2)
  ];
  console.log(res);
}).catch(onerror);

// 对象的写法
co(function* () {
  var res = yield {
    1: Promise.resolve(1),
    2: Promise.resolve(2),
  };
  console.log(res);
}).catch(onerror);
```

## 小结
Generator函数的异步其实并没有从这里止步，后面还要学习的async函数也是另外一种Generator函数的异步运用，但是近2篇笔记恰恰是后面async掌握的关键。Generator函数能做的事情也不单单只有异步任务这个，了解它的特性，了解它怎么处理异步机制，有助于今后更好地将它的价值发挥到工作中去。