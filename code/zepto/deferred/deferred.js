;(function($){
  var slice = Array.prototype.slice

  function Deferred(func) {
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