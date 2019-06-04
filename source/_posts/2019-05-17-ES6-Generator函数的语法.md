---
title: ES6 Generator函数的语法
date: 2019-05-17 18:10:47
tags:
- ES6学习笔记
categories:
- Javascript
- ES6
- 学习笔记
---

注：这是一篇学习笔记，记录自己在ES6学习过程中按照自己的思路觉得应该记录的一些要点，方便以后查看和复习。参考：
> 阮一峰ES6的书籍中[ES6 Generator函数的语法](http://es6.ruanyifeng.com/#docs/generator)
> {% post_link "ES6入门学习的规划" 我的ES6入门学习规划 %}

## 简介
Generator函数是一种函数，不过是特殊的。以下是这两种函数的形式：
<!-- more -->
```js
function * genFunc(){
	yield 1;
}

function commonFunc() {
	return 1;
}

console.log(genFunc());//genFunc {<suspended>}
console.log(commonFunc());//1
```
Generator函数与普通函数的区别是：
* 表现上，Generator函数在function关键字后面会有一个额外的 \* 号，普通函数没有；
* 另外一种表现，Generator函数可以使用yield关键字，普通函数不能用；
* Generator函数的执行，不是一次性完成的，而是可以分为多个阶段来执行，普通函数的执行是一次性完成的；
* Generator函数执行以后，不会立即开始执行函数体的代码，而是通过[native code]先返回一个Iterator对象，普通函数执行将立即执行函数体的代码，并且把return后面的表达式作为返回值返回；

yield是一个关键词，它后面可以接表达式，它的作用是将Generator函数体从起始位置到结束位置（比如：return）分为多个阶段，如果把函数体看作是一条线段，每一个yield表达式就是这条线段中的一个分隔点，函数体的起始位置和结束位置也是这条线段上的点，这些点的含义代表了函数体执行时的位置；通过调用Generator函数返回的Iterator对象的next方法，可以让Generator函数体真正开始执行，并且是分阶段执行。详细的规则如下：
1. 每一次调用Iterator对象next方法，都会让函数体从当前的执行位置执行到下一个yield关键词出现的位置，并把yiled后面表达式的值，部署到next方法返回值的value属性上从而传递到外面，Generator函数的执行就会停在这里；Generato函数体默认的执行位置是起始位置；
2. 如果调用next方法时，函数体当前执行位置后面没有了yield 表达式，就会把剩下的代码都执行完，并把函数返回值部署到next方法的返回值里面，至此一个Generator函数才算是完整的运行结束；
3. 当函数体已经运行结束，继续调用next方法不会再继续运行函数体内的代码。 

next方法的返回值，包含了value和done属性，value属性用来存放yield后面表达式的值或者是函数的返回值（函数结束的时候）；done属性代表了函数体是否执行完毕。 掌握Iterator接口以后，这个next方法的返回值属性会特别好理解。

Generator函数简单举例如下：
```js
function* genFunc() {
	//start
	console.log('range 0');
	yield (Math.random() * 10) > 5 ? 'first lucky' : 'first unlucky';

	console.log('range 1');
	yield (Math.random() * 10) > 5 ? 'second lucky' : 'second unlucky';
	
	console.log('range 2');
	yield (Math.random() * 10) > 5 ? 'third lucky' : 'third unlucky';

	console.log('range 3');
	// end
	return true;
}

let gen = genFunc();
console.log(gen.next());
console.log(gen.next());
console.log(gen.next());
console.log(gen.next());

// range 0
// {value: "first lucky", done: false}
// range 1
// {value: "second lucky", done: false}
// range 2
// {value: "third lucky", done: false}
// range 3
// {value: true, done: true}
```
这个简单的例子可以看到Generator函数的执行过程。它一共包含3个yield关键词，包含起点和终点在内，把函数体分为了5个部分，4个阶段；每一次调用next方法，都能看到之前打印的一条range信息，意味着有一个阶段完成了执行；next每次执行的返回值打印出来后，也能清楚地看到yield表达式的返回值。

Generator函数的行为让它用起来更符合面向对象层次的含义，它提供了封装分阶段向外部传递（或者说回调）内部状态的能力。在编码的时候，如果某个行为，在执行的时候，可能有多次向外部暴露数据的需求，可以考虑使用Generator函数来处理。 

实际上，除了Generator函数可以向外部分阶段传递数据，外部环境也可以在每个阶段执行的时候，通过next方法往Generator函数体内注入数据，这个数据会作为上一个yield表达式的返回值，从而影响下一阶段的函数执行。
```js
function* foo(x) {
  console.log("x", x);
  var y = 2 * (yield (x + 1));
  console.log("y", y);
  var z = yield (y / 3);
  console.log("z", z);
  return (x + y + z);
}

var b = foo(5);
console.log(b.next())
console.log(b.next(12))
console.log(b.next(13));

//x 5
//{value: 6, done: false}
//y 24
//{value: 8, done: false}
//z 13
//{value: 42, done: true}
```
next方法的参数会被传入到Generator函数体内，作为当前执行位置的yield表达式的返回值，但是第一次调用next方法传递的参数是无效的，因为此时函数体的执行位置是起始位置，没有yield表达式。通过上面例子中的log可以清晰地看到**yield后面表达式的返回值**以及通过next方法注入数据后，**yield表达式的返回值**。

有了这个注入数据的特性后，Generator函数面向对象的封装作用就更加明显了，它就像一个小机器人一样，开发人员根据需要为它编写逻辑，当它执行的时候，会把每个步骤的执行结果告诉外部控制它的人，同时它的外部控制环境，也能通过next方法参数注入新的命令，这样它的内部就能根据外部最新的命令，执行下一阶段的任务，直到自己的职责履行完毕。

一些小要点:
* yield表达式可以不出现在Generator函数，这样Generator函数就变成了一个延迟执行的函数
```js
function delayFunc(gen){
	return function(){
		return gen.next().value;
	};
}

function *genFunc(x,y,z){
	return x+y+z;
}

let delayGen = delayFunc(genFunc(1,2,3));

delayGen();// 6
```
* yield关键词只能出现在Generator函数体内，下面这种是错的
```js
var arr = [1, [[2, 3], 4], [5, 6]];

var flat = function* (a) {
  a.forEach(function (item) {
    if (typeof item !== 'number') {
      yield* flat(item);
    } else {
      yield item;
    }
  });
};

for (var f of flat(arr)){
  console.log(f);
}
```
* yield表达式如果用在另一个表达式之中，必须放在圆括号里面。
```js
function* demo() {
  console.log('Hello' + yield); // SyntaxError
  console.log('Hello' + yield 123); // SyntaxError

  console.log('Hello' + (yield)); // OK
  console.log('Hello' + (yield 123)); // OK
}
```
* yield表达式用作函数参数或放在赋值表达式的右边，可以不加括号。
```js
function* demo() {
  foo(yield 'a', yield 'b'); // OK
  let input = yield; // OK
}
```
* Generator函数执行后，返回的是是一个Iterator对象，所以Generator函数具备Iterator对象的所有特性，也可以用Generator函数来实现对象的遍历逻辑

* Generator函数用于for-of循环时，它return的值不会被for-of循环遍历到，这其实也是Iterator对象的特性，这里只是单独强调：
```js
function* foo() {
  yield 1;
  yield 2;
  yield 3;
  yield 4;
  yield 5;
  return 6;
}

for (let v of foo()) {
  console.log(v);
}
// 1 2 3 4 5
```

Generator函数的流程，可以简单的用图来描述：
{% asset_img 01.jpg [title] %}

## throw方法
在学习Iterator对象的时候，了解到Iterator对象其实有一个throw方法，不过主要是在Generator函数里面才有应用。这个方法部署在Generator函数返回的对象上面，调用它之后，Generator函数体可以在内部部署一套try-catch来处理相应的逻辑。也就是说Generator函数现在又具备了一个新的能力，就是它的外部环境能够告知它外部执行时出现了什么意外，然后Generator函数可以针对外部的发生的意外进行响应处理。

```js
function* foo() {
}

let gen = foo();
console.log(typeof gen.throw);// function
```

throw方法接收一个参数，会传递到Generator函数体内部署的try-catch代码，这个参数通常是Error类的实例。
```js
var g = function* () {
  try {
    yield 1;
  } catch (e) {
    console.log('内部捕获', e);
  }
  return 2;
};

var i = g();
i.next();

i.throw('a');
```
这个简单的例子看到外部通过i.throw抛出的错误，被g函数体内捕获到了。

throw方法的本质是什么？（我觉得）**应该是在调用throw方法的时候，在Generator函数体当前的执行位置在函数体内抛出了throw方法传递过来的数据，如果此时Generator函数体当前的执行位置正好位于内部的一个try-catch范围内，那么就能捕获到这个异常**。可以下面的一些例子来验证：

```js
var g = function* () {
  console.log('ready');
  yield 'start';
  try {
  	console.log('try block');
  } catch (e) {
    console.log('catch block', e);
  }
  return 'end';
};

var i = g();

try {
  i.throw('sth happened')
} catch (e) {
  console.log('外部捕获', e);
}
// 外部捕获 sth happened
```
**↑** 这个例子未调用i.next()，所以i.throw的时候，g函数体的执行位置还是起始位置，而起始位置不在函数体的try-catch范围内。

```js
var g = function* () {
  console.log('ready');
  yield 'start';
  try {
  	console.log('try block');
  } catch (e) {
    console.log('catch block', e);
  }
  return 'end';
};

var i = g();
i.next();

try {
  i.throw('sth happened')
} catch (e) {
  console.log('外部捕获', e);
}
// ready
// 外部捕获 sth happened
```
**↑** 这个例子调用了i.next()，所以i.throw的时候，g函数体的执行位置是函数体内第一个yield表达式的位置，但是这个位置也不在内部的try-catch范围内。

```js
var g = function* () {
  console.log('ready');
  try {
  	console.log('try block');
  	yield 'start';
  } catch (e) {
    console.log('catch block', e);
  }
  return 'end';
};

var i = g();
i.next();

try {
  i.throw('sth happened')
} catch (e) {
  console.log('外部捕获', e);
}
// ready
// try block
// catch block sth happened
```
**↑** 这个例子有效地在内部捕获到了外部注入的错误，原因也是因为i.throw的时候，g函数体的执行位置已经位于try-catch范围内了。

```js
var g = function* () {
  console.log('ready');
  try {
  	console.log('try block');
  } catch (e) {
    console.log('catch block', e);
  }
  yield 'a little late';
  return 'end';
};

var i = g();
i.next();

try {
  i.throw('sth happened')
} catch (e) {
  console.log('外部捕获', e);
}
// ready
// try block
// 外部捕获 sth happened
```
**↑** 这个例子跟前2个一样，虽然执行了next方法，但是调用throw方法时，g函数体的执行位置已经位于内部的try-catch范围之后了。

综合以上4个例子，可以看到throw方法的作用机制确实跟Generator函数体的执行位置有关系，认清这一点，throw方法就基本上已经掌握了。 如果throw方法调用的时候，Generator函数体的执行位置并没有位于try-catch范围内，这个错误就会全局地抛出到Generator函数的外部执行环境了。

throw方法还有一个特性，**就是在内部的try-catch块有效地捕捉到外部注入的错误后，还会把Generator函数继续往后执行一次（等同于内部自己再调用一次next方法）**。前面介绍throw方法的价值时，说过

> Generator函数现在又具备了一个新的能力，就是它的外部环境能够告知它外部执行时出现了什么意外，然后Generator函数可以针对外部的发生的意外进行响应处理

throw方法会内部再做一次next方法的处理，也是有道理的。因为当外部环境告诉Generator函数，外部执行出现了意外时；Generator函数对此意外的处理是不定的，完全由实际需求决定，也许这种意外发生的时候，某些Generator函数应该彻底终止，但是某些Generator函数可以自己处理掉意外，然后告诉外部“我”还能继续运行；所以throw方法通过再做一次next方法的处理，并把“意外”的处理结果通过throw方法的返回值传递到外部环境，这样外部完全可以根据内部传递出的“信息”决定下一步是否继续要运行Generator函数。

```js
let machineFactory = function*(no){
	let count = 0;
	while(true) {
		try {
			count++;
			yield `No.${no} has worked ${count} times`;
		} catch(e) {
			if(e instanceof NothingImportant) {
				continue;
			} else if(e instanceof BigAccident) {
				break;
			}
		}
	}

	return `No.${no} has stopped.`
};

class NothingImportant extends Error {

}

class BigAccident extends Error {

}

let machine = machineFactory(1);
console.log(machine.next().value);
console.log(machine.next().value);
console.log(machine.throw(new NothingImportant("")).value);
console.log(machine.next().value);
console.log(machine.throw(new BigAccident("")).value);

// No.1 has worked 1 times
// No.1 has worked 2 times
// No.1 has worked 3 times
// No.1 has worked 4 times
// No.1 has stopped.
```

## return方法
Generator函数返回的Iterator对象还有一个return实例方法，它调用后会终止掉整个Generator函数的执行。这个方法接收一个参数，会部署到这个方法的返回值的value属性中传递回来。

```js
var genFunc = function* () {
	yield 'state1';
	yield 'state2';
	return 'state3';
};

var gen = genFunc();
console.log(gen.next());// {value: "state1", done: false}
console.log(gen.return('no state'));// {value: "no state", done: true}
```

return方法其实也跟Generator函数体的执行位置有关系。调用return方法实际上就是紧跟在Generator函数当前的执行位置后面，插入一个return语句，然后内部运行一次next方法的调用，这样Generator函数相当于就是提前结束了。 这个方法的实际意义在于提供给了Generator函数外部执行环境的一种强制终止Generator函数的能力，虽然霸道，但在某些场合下肯定有需要的。

特殊的点，如果调用return方法时，Generator函数当前的执行位置正好位于try-[catch]-finally的try或catch范围内，return方法等效的return语句就不会插入到当前的执行位置，而是插入到finally代码块的最后，因为要保证finally里面的代码一定能被执行，尤其是在这个代码里面做了一些资源释放、清理等重要性操作的时候。

```js
var genFunc = function* () {
	try {
		yield 'state1';
	} finally {
		yield 'state2';
		console.log('return after me');
	}
	return 'state3';
};

var gen = genFunc();
console.log(gen.next());
console.log(gen.return('no state'));
console.log(gen.next());
// {value: "state1", done: false}
// {value: "state2", done: false}
// return after me
// {value: "no state", done: true}
```
这个例子先运行了一次next方法，让函数执行到第一个yield表达式的位置，然后运行return方法，此时函数执行位置还位于try代码块内，函数体还有finally代码，运行return方法，会让函数进入finally代码内执行，finally里面还有yield表达式，所以return方法最终的执行结果就好比把执行位置切入到了finally里面，然后运行了一次next。 下次再运行next方法，就会运行到finally方法最后的一个执行位置，而这最后的一个位置，因为前面有return的调用，实际上已经被插入了一条“return 'no state'”的调用了，所以最后一次运行next方法会把return方法调用时的参数给返回出来。
这个代码等效于：
```js
var genFunc = function* () {
	try {
		yield 'state1';
	} finally {
		yield 'state2';
		console.log('return after me');
		return 'no state';
	}
	return 'state3';
};

var gen = genFunc();
console.log(gen.next());
console.log(gen.next());
console.log(gen.next());
// {value: "state1", done: false}
// {value: "state2", done: false}
// return after me
// {value: "no state", done: true}
```
再看几个例子：

```js
var genFunc = function* () {
	try {
		yield 'state1';
	} catch(e) {
		yield 'state2';
	} finally {
		yield 'state3';
		console.log('return after me');
	}
	return 'state4';
};

var gen = genFunc();
console.log(gen.next());
console.log(gen.throw('test'));
console.log(gen.return('no state'));
console.log(gen.next());
// {value: "state1", done: false}
// {value: "state2", done: false}
// {value: "state3", done: false}
// return after me
// {value: "no state", done: true}
```
这个例子跟上面的差不多，只不过用了throw方法，让函数执行位置停留在了catch的代码块内。执行结果的原理也跟上面的一致。

```js
var genFunc = function* () {
	try {
		yield 'state1';
	} finally {
		yield 'state2';
		console.log('return after me');
		yield 'state3';
	}
	return 'state4';
};

var gen = genFunc();
console.log(gen.next());
console.log(gen.next());
console.log(gen.return('no state'));
// {value: "state1", done: false}
// {value: "state2", done: false}
// {value: "no state", done: true}
```
这个例子中，当运行return方法的时候，函数体的执行位置本身已经进入finally代码了，但是“return after me”这句话没有打印，return方法返回的value也不是state3，说明这个时候return方法调用并没有把return调用插入到finally代码块的最后，而是插入到了当前的执行位置。 也就是说只有当函数执行位置是try或catch代码块内的时候，调用return才会放到finally最后执行。

```js
var genFunc = function* () {
	yield 'state1';
};

var gen = genFunc();
console.log(gen.return(1));
// {value: 1, done: true}
console.log(gen.return(2));
// {value: 2, done: true}
console.log(gen.return(3));
// {value: 3, done: true}
```
这个例子说明对于一个已经结束的Generator函数，继续运行return方法，不会改变done的事实，但是会把return的参数重新部署到return方法的返回值中返回出来。

## yield* 表达式
在一个Generator函数里面，调用了另外一个Generator函数，就需要用到yield \* 表达式。 yield\*表达式后面接的是一个Iterator对象，除了Generator函数返回的Iterator对象，其它的Iterator对象，比如数组，字符串都可以放到yield\*表达式后面。

它的作用实际上就是把它后面的Iterator对象遍历逻辑并入到当前的Generator函数中，并把它后面的Iterator对象遍历完成时的value值作为yield\*表达式的返回值。 再以线段来类比Generator函数执行的话，yield \*表达式等同于给Generator函数增加了额外的分隔点。

```js
function *inner(){
	yield 2;
	console.log('before inner return');
	return 3;
}

function *outer(){
	yield 1;
	let ret = yield* inner();
	console.log('after inner return');
	yield ret;
	return 4;
}

let gen = outer();
console.log(gen.next());
console.log(gen.next());
console.log(gen.next());
console.log(gen.next());
// {value: 1, done: false}
// {value: 2, done: false}
// before inner return
// after inner return
// {value: 3, done: false}
// {value: 4, done: false}
```
这个例子中，当执行第二次next调用时，outer的函数执行已经进入到了inner的函数里面，但是会停在inner的内部；当执行第三次next调用时，outer的函数执行会从inner的内部开始，但是不会停留在inner结束的位置，而是运行到outer里面yield\*表达式的下一个yield表达式的位置(yield ret)。 也就是说yield\*后面的Iterator的返回值，不会增加Generator函数的执行分隔点。

## Generator函数与this
当Generator函数作为一个对象的属性部署的时候，Generator函数执行时this指向它所在的对象。
```js
let machineFactory = function*(){
	while(this.times--) {
		this.count++;
		yield `No.${this.no} has worked ${this.count} times`;
	}
};

let machine = {
	count: 0,
	no: 1,
	times: 5,
	[Symbol.iterator]: machineFactory
};
for(let v of machine) {
	console.log(v);
}

//No.1 has worked 1 times
//No.1 has worked 2 times
//No.1 has worked 3 times
//No.1 has worked 4 times
//No.1 has worked 5 time
```

Generator 函数总是返回一个遍历器，ES6 规定这个遍历器是 Generator 函数的实例，也继承了 Generator 函数的prototype对象上的方法。
```js
function* g() {}

g.prototype.hello = function () {
  return 'hi!';
};

let obj = g();

obj instanceof g // true
obj.hello() // 'hi!'
```
这看起来跟普通函数是一致的。 但是Generator函数不能用作构造函数，不能跟new一起使用，会报错。Generator函数如果不部署到对象上，将无法在它内部使用this。如果为了在Generator函数上使用this，需要换一种方式使用Generator函数。

```js
let machineFactory = function*(){
	while(this.times--) {
		this.count++;
		yield `No.${this.no} has worked ${this.count} times`;
	}
};

let machine = machineFactory.call({
	count: 0,
	no: 1,
	times: 5
});

for(let v of machine) {
	console.log(v);
}

//No.1 has worked 1 times
//No.1 has worked 2 times
//No.1 has worked 3 times
//No.1 has worked 4 times
//No.1 has worked 5 time
```

用call或者apply，改变Generator函数的调用方式，就能把this注入到Generator函数内。

## Generator 与状态机
Generator 是实现状态机的最佳结构。 

## 总结
Generator函数是一个特殊的函数，可以分阶段执行，虽然它返回的对象，经常被称为遍历器对象，实际上它返回的对象应该说只是实现了Iterator和Iterable的接口，所以能把Generator函数当做遍历器对象那样应用。除了用来实现遍历结构，我觉得Generator函数，还能发挥更大的价值，比如说面向对象的封装，或者是帮助我们实现分步骤、分阶段才能完成的多个任务。学习起来不太难，但是真正的掌握，还需要经常编码，不断地思考是否能将其应用起来，才能感受到更多的东西。