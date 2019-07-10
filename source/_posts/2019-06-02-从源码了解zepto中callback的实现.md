---
title: 从源码了解zepto中callback的实现
date: 2019-06-04 22:06:34
tags:
- Promise相关
- 源码学习
categories:
- Javascript
---

本篇继续学习Promise实现相关的一些东西。 Promise很早就在jquery框架中出现，jquery是用deferred和callbacks两个模块来实现它的，跟jquery类似的框架zepto也有类似的实现。相比之下，zepto的代码可能更加简单好理解一些，所以这次打算从zepto源码的角度研究下它是如何实现类似Promise的模式的。 zepto也是用callbacks和deferred两个模块来实现的，这两个模块的源码在它的github上都有：[zepto](https://github.com/madrobby/zepto/tree/master/src)。 本篇从callbacks开始。

<!-- more -->

## 了解callbacks的作用
callbacks用来管理一组回调函数。 平常我们如果想要做一个回调函数队列，最简单的办法是用数组，但是数组的能力比较有限，只能做到顺序执行，适用的场景很小。zepto封装的callbacks管理回调很方便，只需要借助add和remove方法，就能快速添加和删除回调函数；它要回调所有的回调函数也很方便，只需要调用fire方法即可，语义非常清晰；另外它借助几个可选得到option，有更多的功能可用。这几个option分别是：
* memory
* unique
* once
* stopOnFalse

为了快速了解callbacks和这几个option的作用，我准备了几个代码，将以下代码放到html中，并准备好zepto的脚本，就能在浏览器中运行起来。 

1. 不加option的情况
```html
<script type="text/javascript">
    let foo = (msg)=>{
        console.log('foo says: ' + msg);
    };
    let bar = (msg)=>{
        console.log('bar says: ' + msg);
    };
    let callbacks = $.Callbacks({
    });

    callbacks.add(foo);
    callbacks.fire('bingo'); 
    // foo says: binggo

    callbacks.add(bar);
    callbacks.add(foo);
    callbacks.fire('bingo');
    // foo says: binggo
    // bar says: bingo
    // foo says: binggo

    callbacks.remove(foo);//移除所有的foo回调
    callbacks.fire('bingo');
    // bar says: bingo

</script>
```
从这个例子可以看到，不加option时，callbacks每次fire都会把所有的回调都执行一遍。

2. 设置once
```html
<script type="text/javascript">
    let foo = (msg)=>{
        console.log('foo says: ' + msg);
    };
    let bar = (msg)=>{
        console.log('bar says: ' + msg);
    };
    let callbacks = $.Callbacks({
        once: true
    });

    callbacks.add(foo);
    callbacks.fire('bingo'); 
    // foo says: binggo

    callbacks.add(bar);
    callbacks.fire('bingo');
    // 没有打印


</script>
```
once这个option让callbacks只能被fire一次。

3. 设置memory
```html
<script type="text/javascript">
    let foo = (msg)=>{
        console.log('foo says: ' + msg);
    };
    let bar = (msg)=>{
        console.log('bar says: ' + msg);
    };
    let callbacks = $.Callbacks({
        memory: true
    });

    callbacks.add(foo);
    callbacks.fire('bingo'); 
    // foo says: binggo

    callbacks.add(bar);
    // bar says: binggo

</script>
```
memory这个option让callbacks记住了上一次fire的参数，如果在上一次fire之后，下一次fire之前add了新的回调，新的回调会立即执行，传入上一次fire的参数。

4. 设置unique
```html
<script type="text/javascript">
    let foo = (msg)=>{
        console.log('foo says: ' + msg);
    };
    let bar = (msg)=>{
        console.log('bar says: ' + msg);
    };
    let callbacks = $.Callbacks({
        unique: true
    });

    callbacks.add(foo);
    callbacks.fire('bingo'); 
    // foo says: binggo

    callbacks.add(bar);
    callbacks.add(foo);
    callbacks.fire('bingo');
    // foo says: binggo
    // bar says: bingo

</script>
```
unique这个option控制callbacks不能加入重复的回调函数。

5. 设置stopOnFalse
```html
<script type="text/javascript">
    let foo = (msg)=>{
        console.log('foo says: ' + msg);
        return false;
    };
    let bar = (msg)=>{
        console.log('bar says: ' + msg);
    };
    let callbacks = $.Callbacks({
        stopOnFalse: true
    });

    callbacks.add(foo);
    callbacks.add(foo);
    callbacks.fire('bingo'); 
    // foo says: binggo
</script>
```
stopOnFalse这个option在fire的时候，如果某一个回调返回false，则后面所有回调都不会执行。

以上几个option都是可选的，可以根据需要启用0到多个。callback的核心用法，就是上面这些，掌握好它的特性之后，接下来学习源码实现就会容易好多。

## 源码结构
$.Callbacks()返回的实例，具有的方法及作用如下：
```js
{
    add: ..., // 添加回调，支持任意个参数，支持嵌套数组
    remove: ...,// 移除回调，支持任意个参数，支持数组
    has: ..., // 判断某个回调函数在当前实例中是否有加过
    empty: ..., // 清空回调函数的数组
    disable: ...,// 销毁Callbacks实例
    disabled: ...,// 返回实例的销毁状态
    lock: ...,// 用于锁住Callbacks实例的状态，不能再用新的状态进行fire，它会记住最后一次fire的状态，通常是配合memory这个option来使用
    locked: ...,// 返回实例的lock状态
    fireWith: ...,// 触发Callbacks实例的所有回调函数调用，支持两个参数，第一个参数是指定回调函数被调用时的context，第二个参数是数组，指定回调函数需要的参数
    fire: ...,// fireWith的重载方法
    fired: ...// 返回Callbacks实例有没有被fire过
}
```
跟Callbacks实例使用场景最密切的方法是add、remove、fire以及fireWith，其它方法都是作者根据他自己的需要加入的，好在源码比较少，通过对源码进行分析，我们也能琢磨出disable以及lock这两个特殊方法的作用和含义。

### 源码里的主要变量
这个库的主要变量及作用如下：
```js
  var memory, // 有两个作用，1是用于判断options.memory是否启用，2是用于保存上一次fire时传递的参数
      fired,  // 这是一个简单的布尔变量，每次被fire的时候它都会设置为true，它唯一的作用就是用在
      // fired这个实例方法里面，用于判断实例是否有被fire过
      firing, // 这个布尔变量，用于内部判断当前实例是否正在fire回调函数
      firingStart, // 这是个int变量，用于记录当前实例fire时的起始位置
      firingLength, // 这是个int变量，用于记录当前实例fire时的回调函数个数
      firingIndex, // 这是个int变量，用于记录当前实例fire的实时位置
      list = [], // 这个数组用于存放add进来的回调函数
      stack = !options.once && [], // 这个变量只有在options.once没有启用的时候才会初始化为一个空数组
      // 它的作用是用于排队，如果当前实例正在fire，但此时别的位置又调用了它的fire，后续的fire参数都会暂存到
      // stack里面进行排队，等到前一次fire完成，就会从stack里面shift一个出来，继续fire
```

### add方法
add用于添加回调函数，支持传递数组。
```js
add: function() {
  //只有list为trusy的时候，才会继续，disable方法会把list赋值为undefined值
  if (list) {
    var start = list.length,
        add = function(args) {
          $.each(args, function(_, arg){
            if (typeof arg === "function") {
              //此处是options.unique的控制点，如果options.unqiue为true，那么同一个回调函数不会被add进来
              if (!options.unique || !Callbacks.has(arg)) list.push(arg)
            }
            // 此处判断add的参数有数组类型的情况，比如add(foo, [foo, bar])这种调用
            // 如果有则递归调用一下内部的add函数
            else if (arg && arg.length && typeof arg !== 'string') add(arg)
          })
        }
    add(arguments); 
    //注意下面的实现

    //如果当前实例正在被fire，那么firingLength会被重置为list的最新长度
    //因为实例被fire的时候，是通过for循环来写的
    //firingLength是for循环的终止条件
    //有人可能要问了：在callbacks实例被fire的过程中，怎么还能再add新的回调函数呢
    //这是因为被fire的回调函数，很可能还能访问到callbacks实例，然后继续调用add方法
    if (firing) firingLength = list.length

    //这个就是options.memory这个特性的关键点
    //如果options.memory有启用，同时上次fire有传递参数
    //那么上次的参数就会赋值给memory变量
    //此时判断memory变量，有值，就把新add的回调函数用上一次的参数fire一遍
    else if (memory) {
      firingStart = start
      fire(memory)
    }
  }
  return this
},
```
回顾前面的这个例子，应该能帮助你明白else if (memory)这个点：
```html
<script type="text/javascript">
    let foo = (msg)=>{
        console.log('foo says: ' + msg);
    };
    let bar = (msg)=>{
        console.log('bar says: ' + msg);
    };
    let callbacks = $.Callbacks({
        memory: true
    });

    callbacks.add(foo);
    callbacks.fire('bingo'); 
    // foo says: binggo

    callbacks.add(bar);//这次add不需要外部手动调用fire就会用上次的参数，在内部进行“fire”
    // bar says: binggo

</script>
```

### fireWith及fire、fired方法
fireWith是fire内部调用的方法，所以fireWith方法才是核心。fired方法仅仅是返回fired变量的值，判断当前实例有没有被fire过。
```js
fireWith: function(context, args) {
  //注意这个判断条件
  //stack变量有2种情况会是falsy: 第1种是options.once启用了，第2种是lock或disable方法被调用了
  //只有list有效，并且（实例没有被fire过或者stack变量为trusy），fireWith方法才能有效
  //lock和disable方法会直接影响到fireWith的功能
  if (list && (!fired || stack)) {
    args = args || []
    //只有args是数组才有slice方法
    args = [context, args.slice ? args.slice() : args]

    //注意此处：如果当前实例正在fire，但是别的位置又调用了实例的fire方法，那么新的fire调用参数会被存入stack数组，进行排队
    if (firing) stack.push(args)

    // 当前实例没有在fire，就会执行此处，通过内部的fire函数来完成回调函数的调用
    else fire(args)
  }
  return this
},
fire: function() {
  return Callbacks.fireWith(this, arguments)
},
fired: function() {
  return !!fired
}
```

### 内部的fire函数
这是个内部函数，在它执行过程中，Callbacks的其它实例方法，均有可能调用从而影响这个函数的行为，比如：empty、add、remove、lock、disable、fireWith。 
```js
fire = function(data) {
    //注意此处：memory只有在options.memory启用时，才会赋值为data，data就是实例被fire时传递的参数
    //但是data不能是falsy值，否则等同于没有启用option.memory
    memory = options.memory && data
    fired = true// 你看每次fire时，fired变量都会被赋值为true

    //注意firingIndex这个变量的赋值，一般情况下它是0，表示从第一个回调函数开始回调
    //但是在options.memory启用的场景中，它可能是会被赋值为firingStart的值
    //参考add实例方法的源码
    firingIndex = firingStart || 0
    firingStart = 0
    firingLength = list.length

    //开始fire
    firing = true

    //注意for语句的第二个部分，也必须是list为trusy才会继续
    //因为很有可能fire过程中，会被调用lock或disable方法
    for ( ; list && firingIndex < firingLength ; ++firingIndex ) {
      //此处是options.stopOnFalse特性的关键点
      //只有这个option启用了，且某个回调函数返回了false，那么整个实例都不会再继续调用
      if (list[firingIndex].apply(data[0], data[1]) === false && options.stopOnFalse) {
        memory = false
        break
      }
    }

    //结束fire
    firing = false

    //如果list为trusy
    if (list) {

      // 大部分情况下走这个分支，但是当stack为falsy的时候就不会走了
      // stack为falsy只有2种情况，见fireWith方法的源码分析
      // 如果stack数组不为空，就会从stack数组的顶部取出最早在等待地参数，继续fire
      // stack是一个先进先出的队列作用
      if (stack) stack.length && fire(stack.shift())

      // 如果stack为falsy，要么是options.once启用了， 要么是实例被lock了
      // 如果实例被lock了，且options.memory有启用的话，就可能会进入这个分支
      // 清掉当前的回调函数，但是callbacks实例还能继续调用add，新的回调函数依然会用最后一次的fire参数进行fire
      // 这是lock的使用场景实现
      else if (memory) list.length = 0

      // 否则就销毁掉了callbacks实例，这是options.once这个场景需要的
      else Callbacks.disable()
    }
},
```

### remove方法
这个方法用来移除回调，可以传递多个参数，只要在list中有，就通过数组的splice方法进行移除。
```js
remove: function() {
  if (list) {
    $.each(arguments, function(_, arg){
      var index
      while ((index = $.inArray(arg, list, index)) > -1) {
        list.splice(index, 1)
        // Handle firing indexes

        //注意此处：有可能remove调用的时候，实例正在进行fire，那么就要根据被移除的元素位置来
        //调整firingLength和firingIndex的值
        //因为remove回调函数，用的是数组的splice方法，这是直接修改list数组的
        //而fire过程是对list进行的for循环，所以必须得同步remove之后for循环的状态
        if (firing) {
          if (index <= firingLength) --firingLength
          if (index <= firingIndex) --firingIndex
        }
      }
    })
  }
  return this
},
```

### disable方法
它的作用很简单，就是用来销毁callbacks实例，让它没法再继续用了。
```js
disable: function() {
  list = stack = memory = undefined
  return this
},
disabled: function() {
  return !list
},
```
我个人觉得叫destroy方法更合适。

### lock方法
```js
lock: function() {
  stack = undefined
  if (!memory) Callbacks.disable()
  return this
},
locked: function() {
  return !stack
},
```
这个方法是配合options.memory这个场景来使用的，因为当memory为falsy时，它的作用跟disable方法一模一样，没有存在的价值。

我觉得合适的场景是：
```html
<script type="text/javascript">
    let foo = (msg)=>{
        console.log('foo says: ' + msg);
    };
    let bar = (msg)=>{
        console.log('bar says: ' + msg);
    };
    let callbacks = $.Callbacks({
        memory: true
    });

    callbacks.add(foo);
    callbacks.add(bar);
    callbacks.fire('bingo'); 

    callbacks.lock();

    callbacks.add(foo);// foo says: bingo
    callbacks.add(bar);// bar says: bingo
    callbacks.add(foo);// foo says: bingo
    callbacks.add(bar);// bar says: bingo

    callbacks.fire('aaa');// 无效了
</script>
```
在这个例子中，如果没有lock方法，callbacks.fire('aaa')这个调用，会把callbacks内部所有的回调函数全部用aaa回调一遍，但是加了lock之后，callbacks.fire无效了，callbacks变为一个只能按上一次fire的参数继续使用的一个特殊对象。当然如果这个实例后面再也不调用fire方法了，那么lock方法也没有使用的必要性，只要memory被启用了，它再继续add都能用上一次的参数进行回调。但是有了lock会把这个控制地更加完美。

## 小结
以上就是本篇要分享的关于zepto中callback实现的内容。 学习它的目的是为了下篇继续研究zepto中deferred模块的实现，毕竟这算是早期的Promise实现方式，在它们源码并不复杂的情况下， 花点时间来琢磨也还是值得的。

最后看了下jquery的[callback源码](https://github.com/jquery/jquery/blob/master/src/callbacks.js)，发现跟zepto是几乎一样的，估计zepto实现参考了它吧。
