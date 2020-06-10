---
title: 模仿koajs的middware设计思想实现异步任务链式处理
date: 2020-06-10 16:37:18
tags:
  - koajs
---


最近在接触koajs，发现它的middware设计非常精巧。 今天模仿它实现一下异步任务链式处理。

<!-- more -->

## koajs使用举例
```js
const Koa = require('koa');
const app = new Koa();

// x-response-time
app.use(async (ctx, next) => {
  //前置逻辑！！！
  const start = Date.now();
  
  //等待后续middware全部处理完毕！！！
  await next();

  //后置逻辑！！！
  const ms = Date.now() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
});

// logger
app.use(async (ctx, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}`);
});

// response
app.use(async ctx => {
  ctx.body = 'Hello World';
});

app.listen(3000);
```
以上代码三个`app.use`的使用，添加了3个middware，这三个middware都是`async`函数，因为`async`函数的特性，这些middware最终在执行时会表现出与同步行为相似的效果。 每个middware内部，在执行`await next()`之前，都是它的前置逻辑，执行`await next()`会让当前middware像同步函数一样被`阻塞`住，只有后续的`middwares`全部处理完毕，它的后置逻辑才得以执行。

## 同步实现
在学习vue-router源码时，它里面有一个类似的任务链设计来处理那些hooks：
```js
function runSequence(tasks, fn, cb) {
    function run(index) {
        const task = tasks[index]
        if (task) {
            fn(task, function runNext() {
                run(index + 1)
            })
        } else if (index >= tasks.length) {
            cb && cb()
        } else {
            run(index + 1)
        }
    }

    run(0)
}
```
这个方式的使用举例如下：
```js
let hooks = [
    function (ctx, next) {
        console.log(1)
        ctx.from = 1
        next()
        console.log(2)
    },
    function (ctx, next) {
        console.log(3)
        ctx.from = ctx.from + ' 2'
        next()
        console.log(4)
    },
    function (ctx, next) {
        console.log(5)
        ctx.from = ctx.from + ' 3'
        next()
        console.log(6)
    }
]

let ctx = {}
runSequence(hooks, function runSequenceFn(hook, next) {
    hook(ctx, function hookNext(res) {
        if (res === false) {
            return
        }

        next()
    })
})

// 1
// 3
// 5
// 6
// 4
// 2

console.log(ctx) // {from: '1 2 3'}
```
这个实现思想里面，有两层next的处理。第一层在`runSequence`的内部，有一个`runNext`，它会在作为`runSequenceFn`的第二个参数传入，第二层是`hookNext`，在调用hook时，作为它的第二个参数传入。 以上使用举例中，在hooks数组内添加了三个task，从打印可以看到这三个task的前置、后置逻辑在真正执行时的先后顺序：`1 3 5 6 4 2`。 

这个实现方式有一个缺陷，就是各个task中必须调用`next`，否则下一个task就得不到执行，可以稍微改善一下：
```js
let hooks = [
    function (ctx, next) {
        console.log(1)
        ctx.from = 1
        next()
        console.log(2)
    },
    // 这个hook内部没有了next调用
    function (ctx, next) {
        console.log(3)
        ctx.from = ctx.from + ' 2'
        console.log(4)
    },
    function (ctx, next) {
        console.log(5)
        ctx.from = ctx.from + ' 3'
        next()
        console.log(6)
    }
]

let ctx = {}
runSequence(hooks, function runSequenceFn(hook, next) {
    let nextCalled = false
    hook(ctx, function hookNext(res) {
        if (res === false) {
            return
        }

        nextCalled = true
        next()
    })

    if(!nextCalled) {
        next()
    }
})

// 1
// 3
// 4
// 5
// 6
// 2

console.log(ctx) // {from: '1 2 3'}
```
不过因为第二个task没有`next`调用的原因，所以`console.log(3)`和`console.log(4)`现在都是前置逻辑，而原来`console.log(4)`属于后置逻辑。

## 实现async任务链
将同步改为异步，只需要将原来的同步函数，全部都改为`async`函数即可：
```js
async function runSequence(tasks, fn) {
    async function run(index) {
        const task = tasks[index]
        if (task) {
            await fn(task, async function runNext() {
                await run(index + 1)
            })
        } else if (index >= tasks.length) {
            return
        } else {
            await run(index + 1)
        }
    }

    await run(0)
}

const long = () => new Promise(resolve => setTimeout(resolve, 1000))
const now = Date.now()

let hooks = [
    async function (ctx, next) {
        console.log('===>1', Date.now() - now)
        await long()
        ctx.from = 1
        await next()
        await long()
        console.log('1<===', Date.now() - now)
    },
    async function (ctx, next) {
        console.log('===>2', Date.now() - now)
        await long()
        ctx.from = ctx.from + ' 2'
        await next()
        await long()
        console.log('2<===', Date.now() - now)
    },
    async function (ctx, next) {
        console.log('===>3', Date.now() - now)
        await long()
        ctx.from = ctx.from + ' 3'
        await next()
        await long()
        console.log('3<===', Date.now() - now)
    }
]

let ctx = {}
runSequence(hooks, async function runSequenceFn(hook, next) {
    let nextCalled = false
    await hook(ctx, async function hookNext(res) {
        nextCalled = true
        await next()
    })

    if (!nextCalled) {
        await next()
    }
}).then(() => {
    // ===>1 1
    // ===>2 1002
    // ===>3 2004
    // 3<=== 4014
    // 2<=== 5020
    // 1<=== 6025
    console.log(ctx) // {from: '1 2 3'}
})
```
`async`函数是异步处理用同步方式进行表达的设计，所以以上代码，按照同步逻辑来理解即可。

## koa源码
koajs中这个处理时利用`koa-compose`来处理的，这是一个非常简单的源码：
```js
function compose(middleware) {
    if (!Array.isArray(middleware)) throw new TypeError('Middleware stack must be an array!')

    return function (context, next) {
        // last called middleware #
        let index = -1
        return dispatch(0)
        function dispatch(i) {
            if (i <= index) return Promise.reject(new Error('next() called multiple times'))
            index = i
            let fn = middleware[i]
            if (i === middleware.length) fn = next
            if (!fn) return Promise.resolve()
            try {
                return Promise.resolve(fn(context, dispatch.bind(null, i + 1)))
            } catch (err) {
                return Promise.reject(err)
            }
        }
    }
}
```
基于这个`compose`函数，也能实现async的异步任务链：
```js
const long = () => new Promise(resolve => setTimeout(resolve, 1000))
const now = Date.now()

let hooks = [
    async function (ctx, next) {
        console.log('===>1', Date.now() - now)
        await long()
        ctx.from = 1
        await next()
        await long()
        console.log('1<===', Date.now() - now)
    },
    async function (ctx, next) {
        console.log('===>2', Date.now() - now)
        await long()
        ctx.from = ctx.from + ' 2'
        await next()
        await long()
        console.log('2<===', Date.now() - now)
    },
    async function (ctx, next) {
        console.log('===>3', Date.now() - now)
        await long()
        ctx.from = ctx.from + ' 3'
        await next()
        await long()
        console.log('3<===', Date.now() - now)
    }
]

let ctx = {}
let runSequence = compose(hooks)
runSequence(ctx).then(() => {
    // ===>1 1
    // ===>2 1002
    // ===>3 2004
    // 3<=== 4014
    // 2<=== 5020
    // 1<=== 6025
    console.log(ctx) // {from: '1 2 3'}
})
```