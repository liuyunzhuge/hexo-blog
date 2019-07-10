---
title: 从then.js的源码掌握Promise实现的思路
date: 2019-06-03 22:05:00
tags:
- Promise相关
- 源码学习
categories:
- Javascript
---

本篇继续学习Promise的实现思路，这一次从github上找了一个比较简单的库来学习：[then/promise](https://github.com/then/promise)。 它代码比较少，如果对Promise特性掌握地比较熟悉的话，学起来会比较容易。

<!-- more -->
Promise的特性及简单实现思路可参考之前的两篇文章：
> {% post_link "ES6-Promise" "ES6 Promise" %}；
> {% post_link "从别人博客学到的基本的Promise实现思路" "从别人博客学到的基本的Promise实现思路" %}

这个库的核心代码是这个文件[core.js](https://github.com/then/promise/blob/master/src/core.js)，本篇也是主要学习这个文件的实现要点。

## 核心实现思想
我觉得每个Promise实现库最重要的一个思路是要解决then的调用对象、then的回调函数以及then的返回对象三者之间的作用关系，在上一篇文章：{% post_link "从别人博客学到的基本的Promise实现思路" "从别人博客学到的基本的Promise实现思路" %}，介绍的方法是通过一个中间形式的回调函数，在这个中间层的回调函数内，利用js闭包的特性，来联结它们三个角色。 then/promise这个库，它思路跟中间形式的回调函数差不多，它采用的是面向对象的形式，封装了一个临时的Handler对象：
```js
function Handler(onFulfilled, onRejected, promise){
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}
```
这个Handler对象接收三个参数，前面两个是then方法调用时的两个回调函数，而第三个参数则是then方法返回的那个promise实例对象。现在Handler对象已经联结了then方法的回调和then方法返回的Promise实例，还需要再联结到then方法的调用对象才行。

这个库是这么做的，它在Promise类里面，封装了一个_deferreds属性：
```js
function Promise(fn) {
  if (typeof this !== 'object') {
    throw new TypeError('Promises must be constructed via new');
  }
  if (typeof fn !== 'function') {
    throw new TypeError('Promise constructor\'s argument is not a function');
  }
  this._deferredState = 0;
  this._state = 0;
  this._value = null;
  this._deferreds = null;
  if (fn === noop) return;
  doResolve(fn, this);
}
```
经过then方法的调用之后，then内部创建的Handler对象，会存储到then调用对象的_deferreds属性上面去。等到then的调用对象被resolve或reject的时候，会同时拿到_deferreds属性上存储的所有Handler对象，并挨个地把Handler对象上的回调函数都执行一遍，并改变Handler对象上的Promise实例的状态。

这样一来，它就实现了then的调用对象、then的回调函数以及then的返回对象三者之间的联动关系。

下面开始解读它的源码。 这个core.js总共不到200行，你不看我下面的内容也没什么关系，每个人理解的思路，描述的方法都不一定能帮助另外一个人快速理解，如果感兴趣的话，自己去反复阅读它的源码，效果会更好。

## 源码零散的部分
```js
var asap = require('asap/raw');

function noop() {}

// States:
//
// 0 - pending
// 1 - fulfilled with _value
// 2 - rejected with _value
// 3 - adopted the state of another promise, _value
//
// once the state is no longer pending (0) it is immutable

// 注意： 3这个状态，在这个库的实现里面是一个比较特殊的状态，它的定义对于整个库的完整实现是比较关键的


// 下面三个函数，作用很简单，我觉得现在只需要认识它们，等到后面的代码中看到它们的调用，就能明白它们的意义了
// 这个作者能想到这个办法，还是挺聪明的，我以前从来没这么考虑过
var LAST_ERROR = null;//这个变量用来存储下面三个函数调用过程中的抛出的错误
var IS_ERROR = {};// 这个变量主要用来做判断用的，如果下面三个函数的返回值等于它，说明调用报错了
function getThen(obj) {
  try {
    return obj.then;
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}

function tryCallOne(fn, a) {
  try {
    return fn(a);
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}
function tryCallTwo(fn, a, b) {
  try {
    fn(a, b);
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}
```
第一个asap的依赖，是为了解决Promise跟event-loop之间的问题，从其它一些资料学习到，Promise是一种mico-task，它的回调是异步执行的，会在本轮事件循环的末尾执行，而setTimeout这种都是下一轮事件循环的开始执行。asap这个模块可以让Promise回调在本轮事件循环的末尾执行，这是一个npm 模块，可以去它的主页学习。

## Promise的构造函数
```js
function Promise(fn) {
  if (typeof this !== 'object') {
    throw new TypeError('Promises must be constructed via new');
  }
  if (typeof fn !== 'function') {
    throw new TypeError('Promise constructor\'s argument is not a function');
  }
  //_deferredState这个属性作用也比较关键，对于这个库来说它是必须的，但如果一般人理解这个库的核心思路
  //我觉得不一定会用这个属性来做，或者不一定是类似这个库这样用它
  this._deferredState = 0;
  
  this._state = 0;

  //保留异步的结果 resolve或reject都用它 毕竟Promise只能有一个状态，所以不需要两个变量存储
  this._value = null;

  //前面解释过，用来存放then方法调用后创建的handler对象的
  this._deferreds = null;
  if (fn === noop) return;

  //核心方法
  doResolve(fn, this);
}

//下面三个静态方法，做一些全局性的逻辑
Promise._onHandle = null;
Promise._onReject = null;
Promise._noop = noop;
```
## doResolve核心方法
Promise都是直接new Promise(function(resolve, reject){})这么用的，它的构造函数接收一个参数函数，这个参数函数我们用来写异步任务，它接收两个参数，分别是resolve和reject，利用这两个参数，可以改变Promise实例的状态。doResolve方法是一个单独的方法，它不与任何的Promise实例关联，你可以认为它是静态的，它的第一个参数fn表示一个包含异步任务的函数，通常是Promise构造函数参数，它的第二个参数promise表示一个跟fn相关的promise实例，fn内部的逻辑最终改变的就是这个promise实例的状态。
```js
function doResolve(fn, promise) {
  var done = false;
  // 这里已经可以看到tryCallTwo这几个方法的作用了
  var res = tryCallTwo(fn, 
  function (value) {
    if (done) return;
    done = true;

    //核心方法
    resolve(promise, value);
  }, 
  function (reason) {
    if (done) return;
    done = true;
    //核心方法
    reject(promise, reason);
  });

  //如果前面通过tryCallTwo调用fn发生错误，下面的代码就会执行，把promise给reject掉
  //这就是Promise标准里面的特性：当new Promise发生错误，那么构造出的Promise实例就是rejected
  if (!done && res === IS_ERROR) {
    done = true;
    reject(promise, LAST_ERROR);
  }
}
```
注意tryCallTwo的第二个参数和第三个参数的含义，假如有：
```js
new Promise(function(resolve, reject){})
```
这个里面的resolve和reject就是tryCallTwo的第二个参数和第三个参数！done变量的作用是为了防止fn，也就是Promise构造函数的参数内部，多次调用resolve或reject的情况，比如这种：
```js
new Promise(function(resolve, reject){
    resolve();
    resolve();
    resolve();
    resolve();
});
```
doResolve内部的resolve方法和reject方法，又是这个库的另外两个核心方法，它们跟doResolve方法一样，没有与任何Promise实例绑定，可以认为是静态方法。

## resolve核心方法
这个方法接收2个参数，第一个参数self表示一个promise实例，第二个参数表示一个状态，这个方法的作用就是尝试用第二个参数把第一个参数给resolve掉。

```js
function resolve(self, newValue) {
  //这个不知道为啥需要处理，感觉不处理也没事
  if (newValue === self) {
    return reject(
      self,
      new TypeError('A promise cannot be resolved with itself.')
    );
  }

  //newValue是异步任务的结果，根据异步任务的结果可能是一个普通js值，也可能是一另外一个Promise
  //所以下面的逻辑都是处理它的情况

  if (
    newValue &&
    (typeof newValue === 'object' || typeof newValue === 'function')
  ) {

      //看看能否拿到newValue的then属性
    var then = getThen(newValue);
    if (then === IS_ERROR) {
        //拿的过程出错了，都会跳到将self给reject掉的逻辑
      return reject(self, LAST_ERROR);
    }

    //这个if判断用来判断newValue是否是这个库写的Promise类的实例
    if (
      then === self.then &&
      newValue instanceof Promise
    ) {

        //此处把self这个实例的状态设置为3了，只有当newValue是另外一个Promise实例的时候
        // state才会变为3，并且self的_value也会保存newValue对应的那个Promise实例
        // 这么做的目的是为啥呢？
        // 它是为了把self身上保存的所有handler实例，通通都转移到newValue去处理
        // 由newValue的状态，来决定handler的回调及promise的调用
        // 这也是Promise标准特性的实现
      self._state = 3;
      self._value = newValue;
      //finale核心方法
      finale(self);
      return;
    } else if (typeof then === 'function') {
      //下面又是一个特殊情况，不过似乎在Promise标准特性里面没见过
      // 它考虑的是newValue是一个thenable对象的时候
      doResolve(then.bind(newValue), self);
      return;
    }
  }
  //将self这个promise给resolve
  self._state = 1;
  self._value = newValue;
  //finale核心方法
  finale(self);
}
```

## reject核心方法
这个方法跟resolve类似，就是为了把第一个参数表示的promise实例，用第二个参数给reject掉。
```js
function reject(self, newValue) {
  self._state = 2;
  self._value = newValue;
  if (Promise._onReject) {
    Promise._onReject(self, newValue);
  }
  finale(self);
}
```
它比较简单，没有复杂逻辑，直接就是reject。

## final核心方法
```js
function finale(self) {
  if (self._deferredState === 1) {
      //核心方法
    handle(self, self._deferreds);
    self._deferreds = null;
  }
  if (self._deferredState === 2) {
    for (var i = 0; i < self._deferreds.length; i++) {
      handle(self, self._deferreds[i]);
    }
    self._deferreds = null;
  }
}
```
只有三种情况会调用finale方法：
1. self状态为resolved
2. self状态为rejected
3. self状态为3

这个方法内部通过handle方法来处理这三个场景的逻辑。

## then方法
```js
Promise.prototype.then = function(onFulfilled, onRejected) {
  if (this.constructor !== Promise) {
    return safeThen(this, onFulfilled, onRejected);
  }
  var res = new Promise(noop);
  handle(this, new Handler(onFulfilled, onRejected, res));
  return res;
};

function safeThen(self, onFulfilled, onRejected) {
  return new self.constructor(function (resolve, reject) {
    var res = new Promise(noop);
    res.then(resolve, reject);
    handle(self, new Handler(onFulfilled, onRejected, res));
  });
}
```
在这个core.js内，并没有提到过catch实例方法，因为只要then方法实现好了，catch方法自然能实现。它的then方法，有一个safeThen的逻辑，这个是为了应付一些特殊的场景的，比如说别的一个Promise类的实例可能借用了这个库的then实例方法：
```js
Promise.prototype.then.call(objOfAnotherPromiseLibrary, onFulfilled, onRejected)
```
经验有限，我也不太清楚它这个逻辑真正的价值，所以在学习这个库的时候我没有花太多时间在这个点上。

通过源码，可以看到then方法很简单，比我上篇笔记中写的then方法简单多了，它把最主要的逻辑都放在了handle里面来处理了。另外也能看到，then方法内部，实例化了一个Handler对象，联结了then内部返回的Promise实例以及then方法的两个回调函数，这个Handler实例，就是其它代码中经常看到用来表示deferred含义的对象。 “延迟对象”

## handle核心方法
```js
// 纳闷了，为啥参数这里叫deferred，外面的类叫Handler
function handle(self, deferred) {
  while (self._state === 3) {
    self = self._value;
  }
  if (Promise._onHandle) {
    Promise._onHandle(self);
  }

  if (self._state === 0) {
    //这一块代码是为了缓存deferred对象到_deferreds属性，不知道是为啥不直接用一个数组来搞
    //而要分两个情况来考虑
    //我猜是性能的角度，它是想能不用数组就尽量不用数组，毕竟大部分情况下Promise的实例都可能只调用一次then
    if (self._deferredState === 0) {
      self._deferredState = 1;
      self._deferreds = deferred;
      return;
    }
    if (self._deferredState === 1) {
      self._deferredState = 2;
      self._deferreds = [self._deferreds, deferred];
      return;
    }
    self._deferreds.push(deferred);
    return;
  }
  //核心方法
  handleResolved(self, deferred);
}
```
这个hande方法要解决四个场景的作用：
1. self这个promise状态为pending的时候
在这个场景下，handle方法的作用是把deferred这个对象缓存到self实例的_deferreds属性上。
2. self这个promise状态为1的时候
在这个场景下，它直接跳到最后的handleResolved方法，通过这个方法，来完成deferred上面的回调函数调用和promise实例的状态处理。
3. self这个promise状态为2的时候
同第2点。
4. self这个promise状态为3的时候
有2个情况会出现这个场景，一是new Promise的构造参数内，通过resolve方法，传递了另外一个Promise实例；二是then方法的回调函数返回了一个新的Promise实例。这两种场景会让promise实例们通过self\.\_value和self\.\_state=3构造成为一个链表，这个方法内部先通过while结构，找到这个链表最原始的那个promise实例，并把它赋值给原来的self变量。然后再重新根据self的状态来判断进行前面第1、2、3点处理。

## handleResolve核心方法
```js
function handleResolved(self, deferred) {
  asap(function() {
    var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      if (self._state === 1) {
        resolve(deferred.promise, self._value);
      } else {
        reject(deferred.promise, self._value);
      }
      return;
    }
    var ret = tryCallOne(cb, self._value);
    if (ret === IS_ERROR) {
      reject(deferred.promise, LAST_ERROR);
    } else {
      resolve(deferred.promise, ret);
    }
  });
}
```
这个方法是一定只有在self的状态变为1或2的时候才会调用的，deferred也一定是self对象上保存的Handler类的实例，deferred上面缓存着曾经调用then方法注册的与异步任务关联的回调函数，以及then方法返回的promise对象。 理解这个代码的时候，不能把resolve和reject方法的细节带进来，而是从resolve和reject的作用去理解。他们的作用分别是为了resolve掉或reject掉deferred上面保存的那个promise对象。

## 小结
到这里为止，then/promise这个库该记录与分享的东西就差不多了，在源码部分的描述可能会让有的人觉得理解不了，这个确实是挺难的，每个人描述和理解的思路都不同，而且源码的解读本身就是一个比较纠结的事情。 所以学习它更好的办法是自己去研究、琢磨，等到自己领悟到了它的核心思路，那我这里怎么写怎么说都不重要了。

写这篇笔记只是为了记录、分享这样一个比较简单的Promise实现思想。
