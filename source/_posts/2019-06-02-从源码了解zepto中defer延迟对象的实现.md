---
title: 从源码了解zepto中defer延迟对象的实现
date: 2019-06-05 22:06:54
tags:
- Promise相关
- 源码学习
categories:
- Javascript
---

本篇在上一篇《{% post_link "从源码了解zepto中callback的实现" 从源码了解zepto中callback的实现 %}》的基础上，继续来学习zepto中Promise模式的实现，这次要学习的是它的deferred模块，源码位置：[zepto](https://github.com/madrobby/zepto/tree/master/src)。 

<!-- more -->

## deferred基本用法
在学习代码之前，依然是先学习它的用法。

deferred被称为延迟对象，用来封装异步任务。$.Deferred是它的构造函数。
```js
let deferred = $.Deferred();
```
deferred有3个实例方法，resolve()、reject()、notify()分别可以在异步任务完全结束、异步任务出错以及异步任务分步进行的时候调用，以便能够把异步任务的状态回调出去。 
```js
let deferred = $.Deferred();

let counter = 1;
let timer = setInterval(function () {
	if(counter > 5) {
		deferred.resolve("success", {data: [1,2,3]});
		return clearInterval(timer);
	}

	if(counter == 4 && (Math.random() * 10 > 7)) {
		deferred.reject("fail", new Error('random number gt 7'));
		return clearInterval(timer);
	}

	deferred.notify('progressUpdate', (counter++ / 5.0));

}, 1000);
```
上面这个例子模拟了一个异步任务，包含了有异步任务成功完成、异常结束以及分步调用的逻辑。 其它位置拿到deferred实例后，可通过另外三个实例方法，done()、fail()、progress()来分别添加异步任务完成、出错以及分步进行的回调函数，resolve()、reject()、notify()这三个方法调用时传入的参数，都会相应的传入done()、fail()、progress()注册的回调函数。 
```js
function createAsyncTask(n) {
	let deferred = $.Deferred();

	let counter = 1;
	let timer = setInterval(function () {
		if(counter > n) {
			deferred.resolve("success", {data: [1,2,3]});
			return clearInterval(timer);
		}

		if(counter == (n - 1) && (Math.random() * 10 > 7)) {
			deferred.reject("fail", new Error('random number gt 7'));
			return clearInterval(timer);
		}

		deferred.notify('progressUpdate', ((1.0 * counter++) / n));

	}, 1000);

	return deferred;
}

let deferred = createAsyncTask(5);

deferred.done(function(state, data){
	console.log(state, data);
});

deferred.fail(function(state, error){
	console.error(state, error);
});

deferred.progress(function(state, progress){
	console.log(state, progress);
});

//progressUpdate 0.2
//progressUpdate 0.4
//progressUpdate 0.6
//progressUpdate 0.8
//progressUpdate 1
//success {data: Array(3)}
```
上面把写法改地更加符合实际的工作场景，把异步任务用一个函数封装起来，这样外部看不到异步任务的内在逻辑，只需要和异步任务返回的deferred实例打交道即可。 由于deferred实例，具备resolve、reject这些直接能够改变异步任务状态的方法，所以在createAsyncTask函数内，更好的做法，不是返回deferred实例，而是return deferred.promise()，它通过调用自身的promise方法返回一个不具备resolve、reject等这些可改变状态方法的promise对象，外部拿到这个promise对象之后，仅能使用done、fail等添加回调函数的api。这一点跟标准的Promise特性是一致的。
```js
function createAsyncTask(n) {
	let deferred = $.Deferred();

	let counter = 1;
	let timer = setInterval(function () {
		if(counter > n) {
			deferred.resolve("success", {data: [1,2,3]});
			return clearInterval(timer);
		}

		if(counter == (n - 1) && (Math.random() * 10 > 7)) {
			deferred.reject("fail", new Error('random number gt 7'));
			return clearInterval(timer);
		}

		deferred.notify('progressUpdate', ((1.0 * counter++) / n));

	}, 1000);

	//将原先的 return deferred 改为下面的这个
	return deferred.promise();
}

let deferred = createAsyncTask(5);

deferred.done(function(state, data){
	console.log(state, data);
});

deferred.fail(function(state, error){
	console.error(state, error);
});

deferred.progress(function(state, progress){
	console.log(state, progress);
});

//progressUpdate 0.2
//progressUpdate 0.4
//progressUpdate 0.6
//progressUpdate 0.8
//progressUpdate 1
//success {data: Array(3)}
```
不管是deferred对象，还是deferred.promise()返回的promise对象，都还有一个让它跟Promise规范非常类似的一个实例方法，就是then。这个then可以同时接收三个回调函数，作为参数，分别会在deferred实例resolve、reject、notify的时候调用，一个then方法等同于同时调用了done、fail、progress方法。不过它的作用还不止这么简单，这个then可以让deferred实例实现类似Promise规范的异步任务链。
```js
function createAsyncTask(taskId, n) {
	let deferred = $.Deferred();

	let counter = 1;
	let timer = setInterval(function () {
		if(counter > n) {
			deferred.resolve("success task: " + taskId, {data: [1,2,3]});
			return clearInterval(timer);
		}

		if(counter == (n - 1) && (Math.random() * 10 > 7)) {
			deferred.reject("fail task: " + taskId, new Error('random number gt 7'));
			return clearInterval(timer);
		}

		deferred.notify('progressUpdate task: ' + taskId, ((1.0 * counter++) / n));

	}, 1000);

	return deferred;
}

let deferred = createAsyncTask('1', 3);

deferred
	//这里添加的回调会在deferred状态变化时才会调用
	.then(function fnDone(state, data){
		console.log(state, data);
		//此处返回一个新的异步任务
		return createAsyncTask('2', 4);
	}, function fnFail(state, error){
		console.error(state, error);
	})
	//这里添加的回调会在上一个then的fnDone内返回的异步任务状态变化时才会调用
	.then(function fnDone(state, data){
		console.log(state, data);
		//此处返回一个新的异步任务
		return createAsyncTask('3', 4);
	}, function fnFail(state, error){
		console.error(state, error);
	})
	//这里添加的回调会在上一个then的fnDone内返回的异步任务状态变化时才会调用
	.then(function fnDone(state, data){
		console.log(state, data);
	}, function fnFail(state, error){
		console.error(state, error);
	});

//success task: 1 {data: Array(3)}
//success task: 2 {data: Array(3)}
//success task: 3 {data: Array(3)}
```
上面这个例子模拟了一个异步任务链，每个异步任务的回调都是通过then方法来注册的，然后在前两个异步任务的done回调内都返回一个新的异步任务，新的异步任务会等待前一个异步任务完全结束才会开始。 这就跟ES6 Promise的使用比较相似，虽然功能不如那边那么多，但是能应付很多的场景。 不过，虽然说then方法还能传入第三个参数，在异步任务进行notify的时候回调，但是这个notify以及配合使用的progress回调并不是很好用，尤其是在有异步任务链的情况下，所以最好是别用。 在Promise规范里，也从来没有过类似progress的回调。

deferred封装异步任务，还有另外一种形式。$.Deferred作为一个构造函数，可以接收一个函数参数，异步任务也可以像Promise规范一样，写在这个构造函数的参数函数里面：
```js
function createAsyncTask(n) {
  return $.Deferred(function(deferred){
    let counter = 1;
    let timer = setInterval(function () {
      if(counter > n) {
        deferred.resolve("success", {data: [1,2,3]});
        return clearInterval(timer);
      }

      if(counter == (n - 1) && (Math.random() * 10 > 7)) {
        deferred.reject("fail", new Error('random number gt 7'));
        return clearInterval(timer);
      }

      deferred.notify('progressUpdate', ((1.0 * counter++) / n));

    }, 1000);
  }).promise();
}
```
这个写法跟把异步任务写在$.Deferred()外面比起来，更加合适一点，代码更具内聚性。

以上就是对deferred对象使用的基本介绍，剩下的目标就是从源码角度学习一下看看它是如何实现异步的状态回调以及那个then异步任务链的。 

## 源码分析
这个模块的代码不算特别多，我直接把要点都注释进去了。需要说明的是，最原始的源码，它还包含有一个$.when的api，这个是类似Promise.all的一个函数，我不打算深入研究它，所以在下面的代码中去掉了：
```js
;(function($){
  var slice = Array.prototype.slice

  function Deferred(func) {

  	//这个tuples是一个配置表

    var tuples = [
          // action, add listener, listener list, final state
          [ "resolve", "done", $.Callbacks({once:1, memory:1}), "resolved" ],
          [ "reject", "fail", $.Callbacks({once:1, memory:1}), "rejected" ],
          [ "notify", "progress", $.Callbacks({memory:1}) ]
        ],
        state = "pending",
        promise = {
          state: function() {
            return state
          },
          always: function() {
            deferred.done(arguments).fail(arguments)
            return this
          },
          then: function(/* fnDone [, fnFailed [, fnProgress]] */) {
            var fns = arguments

            //then方法的作用是返回一个新的Deferred实例，开始有Promise模式的影子了
            return Deferred(function(defer){
              //这个function(defer)用来解决then的调用者，then的回调函数以及then的返回值之间的关系

              //tuples的遍历顺序，必须与then的参数列表fnDone [, fnFailed [, fnProgress]]保持一致
              $.each(tuples, function(i, tuple){
                //遍历tuples[0]时，取到fnDone
                //遍历tuples[1]时，取到fnFailed
                //遍历tuples[2]时，取到fnProgress
                var fn = $.isFunction(fns[i]) && fns[i]

                //注意这里的deferred实际上可以看作是then的调用对象

                //这里给then的调用对象再加一个回调
                //遍历tuples[0]时,调用deferred.done
                //遍历tuples[1]时,调用deferred.fail
                //遍历tuples[2]时,调用deferred.progress
                deferred[tuple[1]](function(){

                  var returned = fn && fn.apply(this, arguments)
                  if (returned && $.isFunction(returned.promise)) {
                    //这里判断fn调用后返回一个新的Deferred对象的情况
                    //这个场景的话，then返回的Deferred对象状态转由then对应的回调函数返回的Deferred对象来决定
                    returned.promise()
                      .done(defer.resolve)
                      .fail(defer.reject)
                      .progress(defer.notify)
                  } else {
                    var context = this === promise ? defer.promise() : this,
                        values = fn ? [returned] : arguments
                    defer[tuple[0] + "With"](context, values)
                  }
                })
              })
              fns = null
            }).promise()
          },

          promise: function(obj) {
            return obj != null ? $.extend( obj, promise ) : promise
          }
        },
        deferred = {}

    $.each(tuples, function(i, tuple){
      var list = tuple[2],
          stateString = tuple[3]

      //给promise注入done fail progress方法，赋值为callback list实例的add方法
      //    promise.done = list.add
      //    promise.fail = list.add
      //    promise.fail = list.add
      promise[tuple[1]] = list.add

      if (stateString) {
        //tuples[0]、tuples[1]才会执行这段逻辑
        //下面这段代码表面上的作用是给tuples[0],tuples[1]的callbacks list自动添加三个回调函数
        //只要list这个callbacks实例被fire，那么就会做三件事情
        //1. 改变state
        //2. 当state变为resolved，就把rejected的list给disable掉
        //   当state变为rejected，就把resolved的list给disable掉
        //3. 把 tuples[2] 的list给lock掉
        //Promise的核心思想是：state的一致性，任何时候state只能处于一个状态，状态只能改变一次
        //这个模块实现这个点的关键是就是下面代码中的disable与lock，以及callbacks list实例启用的options.once和
        //options.memory
        list.add(function(){
          state = stateString
        }, tuples[i^1][2].disable, tuples[2][2].lock);

      }

      //给deferred对象注入resolve reject notify方法
      deferred[tuple[0]] = function(){

        //此处直接调用对应的resolveWith rejectWith notifyWith方法
        //注意this === deferred时，传入With方法的第一个参数是promise对象，而不是this本身
        //这是为了防止外部回调函数通过this直接访问到deferred对象
        //通常deferred对象都是定义异步任务的时候用的
        //外部环境只需要使用到promise对象即可
        deferred[tuple[0] + "With"](this === deferred ? promise : this, arguments)
        return this
      }

      //给deferred对象注入resolveWith rejectWith notifyWith方法，赋值为callbacks list实例的fireWith方法
      // deferred.resolveWith = list.fireWith
      // deferred.rejectWith = list.fireWith
      // deferred.notifyWith = list.fireWith
      deferred[tuple[0] + "With"] = list.fireWith
    })

    //把promise的方法复制到deferred对象上
    // deferred.state = promise.state
    // deferred.then = promise.then
    // deferred.always = promise.always
    // deferred.promise = promise.promise
    promise.promise(deferred)

    //调用$.Deferred的构造函数函数，如果有的话
    //异步任务可以写在func里面
    if (func) func.call(deferred, deferred)
    return deferred
  }

  $.Deferred = Deferred
})(Zepto)
```
源码中的tuples再详细说明一下：
```js
    var tuples = [
          // action, add listener, listener list, final state
          [ "resolve", "done", $.Callbacks({once:1, memory:1}), "resolved" ],
          [ "reject", "fail", $.Callbacks({once:1, memory:1}), "rejected" ],
          [ "notify", "progress", $.Callbacks({memory:1}) ]
        ],
```
这个tuples是个二维数组，每个子数组都与deferred实例的特定行为进行关联，第1个子数组关联的是deferred实例的异步任务完成行为，第2个子数组关联的是deferred实例的异步任务出错行为，第3个子数组关联的是deferred实例的异步分步进行的行为。 每个子数组内都构造了一个callbacks实例，用来存储异步任务的回调函数，并且第1个和第2个同时都启用了once和memory这两个特性，第3个只启用memory。这是因为resolve和reject行为在deferred实例上只能触发一次，而且是互斥的，而notify行为可以触发多次。

通过后面的源码还能看到resolve、reject、notify的行为，实际上绑定的是callbacks实例的fireWith方法：
```js
      //给deferred对象注入resolve reject notify方法
      deferred[tuple[0]] = function(){

        //此处直接调用对应的resolveWith rejectWith notifyWith方法
        //注意this === deferred时，传入With方法的第一个参数是promise对象，而不是this本身
        //这是为了防止外部回调函数通过this直接访问到deferred对象
        //通常deferred对象都是定义异步任务的时候用的
        //外部环境只需要使用到promise对象即可
        deferred[tuple[0] + "With"](this === deferred ? promise : this, arguments)
        return this
      }

      //给deferred对象注入resolveWith rejectWith notifyWith方法，赋值为callbacks list实例的fireWith方法
      // deferred.resolveWith = list.fireWith
      // deferred.rejectWith = list.fireWith
      // deferred.notifyWith = list.fireWith
      deferred[tuple[0] + "With"] = list.fireWith
```

如果deferred实例调用了resolve，state会被设置为resolved, tulpes[1]的callbacks实例会被disable掉，tuple[0]的callbacks实例会被lock住。  被disable掉的callbacks实例既不能再add新的回调函数，也不能再被fire。 被lock住的callbacks实例虽然不能再被fire，但是可以再add新的回调。
如果deferred实例调用了reject，state会被设置为rejected, tulpes[0]的callbacks实例会被disable掉，tuple[0]的callbacks实例会被lock住。 
如此一来，这个模块就实现了resolve和reject的互斥性，同时也保证了当deferred实例不管是变为resolved还是rejected，deferred实例都不可能再使用resolve、reject以及notify这三个行为方法了。 关键点就是下面的代码：
```js
      if (stateString) {
        //tuples[0]、tuples[1]才会执行这段逻辑
        //下面这段代码表面上的作用是给tuples[0],tuples[1]的callbacks list自动添加三个回调函数
        //只要list这个callbacks实例被fire，那么就会做三件事情
        //1. 改变state
        //2. 当state变为resolved，就把rejected的list给disable掉
        //   当state变为rejected，就把resolved的list给disable掉
        //3. 把 tuples[2] 的list给lock掉
        //Promise的核心思想是：state的一致性，任何时候state只能处于一个状态，状态只能改变一次
        //这个模块实现这个点的关键是就是下面代码中的disable与lock，以及callbacks list实例启用的options.once和
        //options.memory
        list.add(function(){
          state = stateString
        }, tuples[i^1][2].disable, tuples[2][2].lock);

      }
```
从这个代码可以看到，tuples[0]和tuples[1]的callbacks实例，会自动加入三个回调函数，来做前面说的那些事情。

学习这个模块的代码，我觉得可以先忽略掉promise这个字面量对象的逻辑，主要关注后面$.each对tuples那部分的遍历逻辑：
```js
function Deferred(func) {
    var tuples = [
          // action, add listener, listener list, final state
          [ "resolve", "done", $.Callbacks({once:1, memory:1}), "resolved" ],
          [ "reject", "fail", $.Callbacks({once:1, memory:1}), "rejected" ],
          [ "notify", "progress", $.Callbacks({memory:1}) ]
        ],
        state = "pending",
        promise = {
          //先忽略这个部分的内容

          promise: function(obj) {
            return obj != null ? $.extend( obj, promise ) : promise
          }
        },
        deferred = {}

    //重点了解这个$.each里面的内容，通过代码调试，看看它做了什么事情
    $.each(tuples, function(i, tuple){
      var list = tuple[2],
          stateString = tuple[3]

      promise[tuple[1]] = list.add

      if (stateString) {
        list.add(function(){
          state = stateString
        }, tuples[i^1][2].disable, tuples[2][2].lock);

      }

      deferred[tuple[0]] = function(){

        deferred[tuple[0] + "With"](this === deferred ? promise : this, arguments)
        return this
      }

      deferred[tuple[0] + "With"] = list.fireWith
    })

    promise.promise(deferred)

    if (func) func.call(deferred, deferred)
    return deferred
  }
```
只要了解本篇介绍的deferred模块的基本用法，写几个例子，然后逐步调试进去，就能逐步弄清楚$.each里面做的事情。

## Promise实现方式
zepto的deferred对象，实现Promise模式的点就是then这个实例方法：
```js
then: function(/* fnDone [, fnFailed [, fnProgress]] */) {
  var fns = arguments

  //then方法的作用是返回一个新的Deferred实例，开始有Promise模式的影子了
  return Deferred(function(defer){
    //这个function(defer)用来解决then的调用者，then的回调函数以及then的返回值之间的关系

    //tuples的遍历顺序，必须与then的参数列表fnDone [, fnFailed [, fnProgress]]保持一致
    $.each(tuples, function(i, tuple){
      //遍历tuples[0]时，取到fnDone
      //遍历tuples[1]时，取到fnFailed
      //遍历tuples[2]时，取到fnProgress
      var fn = $.isFunction(fns[i]) && fns[i]

      //注意这里的deferred实际上可以看作是then的调用对象

      //这里给then的调用对象再加一个回调
      //遍历tuples[0]时,调用deferred.done
      //遍历tuples[1]时,调用deferred.fail
      //遍历tuples[2]时,调用deferred.progress
      deferred[tuple[1]](function(){

        var returned = fn && fn.apply(this, arguments)
        if (returned && $.isFunction(returned.promise)) {
          //这里判断fn调用后返回一个新的Deferred对象的情况
          //这个场景的话，then返回的Deferred对象状态转由then对应的回调函数返回的Deferred对象来决定
          returned.promise()
            .done(defer.resolve)
            .fail(defer.reject)
            .progress(defer.notify)
        } else {
          var context = this === promise ? defer.promise() : this,
              values = fn ? [returned] : arguments
          defer[tuple[0] + "With"](context, values)
        }
      });
    })
    fns = null
  }).promise()
},
```
Promise模式的关键就在于如何解决then的调用者、then的返回者以及then注册的回调函数之间的关联关系。 这个then方法是利用callback来处理的。 它通过deferred\[tuple\[1\]\](function(){...})这段代码，给then的调用者的callbacks实例添加了新的回调函数，然后在这个新的回调函数内，会进行then的回调函数调用以及then的返回对象状态改变的逻辑。

## 感受与小结
以上的内容就是这次要分享的deferred模块的全部了，回顾上篇笔记介绍的callbacks模块，我的整体感受是，这两个模块的代码写得比较巧，但是语义不算特别好，如果能够写得更加面向对象一点，那么阅读起来就会更舒服了。 当然它的作者既然能写出巧的、牛逼的代码，为什么要写出语义非常清晰的形式给旁人看呢，只要最后对外提供的api足够清晰简单不就行了！也确实如此，deferred实例以及deferred.promise()返回的实例给旁人封装的api还是很简洁明了的。 所以不需要抱怨，能看到别人的编程方式，这篇的学习时间就值了。