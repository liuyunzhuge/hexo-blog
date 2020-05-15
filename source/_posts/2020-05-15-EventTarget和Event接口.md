---
title: EventTarget和Event接口
tags:
  - Event
categories:
  - Javascript
  - WebApi
date: 2020-05-15 21:25:02
---


学习`EventTarget和Event`接口。 

<!-- more -->

## EventTarget
浏览器内有很多内置事件，比如`click` `foucs`等等，能够派发这些事件的源对象，都实现了一个共同的接口：`EventTarget`。 实现了这个接口的对象，具备事件监听和派发的能力。 这个接口的定义如下：
```js
interface EventTarget {
    // 注册事件监听
    public void addEventListener(...);
    // 移除事件监听
    public void removeEventListener(...);
    // 派发事件
    public boolean dispatchEvent(...);
}
```
比如`Element` `Document` `Window` `XMLHttpRequest`等对象都实现了这个接口，所以我们在这些对象上就能使用下面这种常见的方式来监听事件：
```js
const elem = document.querySelector('#demo')
elem.addEventListener('click', function click() {
    // ... some logic

    elem.removeEventListener('click', click)
}, false)
```

`EventTarget`就是浏览器给我们提供好的一个观察者模式的实现。

### addEventListener
语法：
```
target.addEventListener(type, listener, options);
target.addEventListener(type, listener, useCapture);
```
* `type` | `string` 事件名称，如`target.addEventListener('click', ...)`
* `listener` | `function` 事件监听回调，如`target.addEventListener('click', function() {...})`
* `第三个参数` 分为2种
    - `useCapture` | `boolean` 为`true`时，表示这个事件监听在捕获阶段才触发，冒泡阶段不触发；为`false`时表示这个事件监听在冒泡阶段才触发，捕获阶段不触发。默认为`false`。
    - `options` | `object` 包含以下选项设置：
        * `capture` | `boolean` 跟`useCapture`一致，默认为`false`。
        * `once` | `boolean` 为`true`时表示监听只会触发一次，默认为`false`。
        * `passive` | `boolean` 为`true`时表示`listener`内部永不会执行`preventDefault`，即使执行了也会被忽略。默认值不定，浏览器区别对待一些元素。

`options`的参数形式是后制定的标准，所以在使用这种方式监听时，需要注意、考虑它的兼容性。考虑到将来的扩展性，第三个参数推荐写成`options`形式。

举例：
```js
const elem = document.querySelector('#demo')
elem.addEventListener('click', function click() {}, {
    capture: false,
    once: true,
    passive: true
})
```

> https://developer.mozilla.org/zh-CN/docs/Web/API/EventTarget/addEventListener

### removeEventListener
语法：
```
target.removeEventListener(type, listener[, options]);
target.removeEventListener(type, listener[, useCapture]);
```
* `type` | `string` 事件名称，如`target.removeEventListener('click', ...)`
* `listener` | `function` 事件监听回调，如`target.removeEventListener('click', listener)`
* `第三个参数` 分为2种
    - `useCapture` | `boolean` 为`true`时，那么只有当`listener`注册的时候，也启用了`capture`或`useCapture`，才能移除成功；为`false`时，那么只有当`listener`注册的时候，也未启用`capture`或`useCapture`，才能移除成功。默认为`false`。
    - `options` | `object` 包含以下选项设置：
        * `capture` | `boolean` 跟`useCapture`一致，默认为`false`。

这个方法的第三个参数为`options`的形式目前只有一个`capture`的选项，但是不排除将来还会新增别的。考虑到将来的扩展性，第三个参数推荐写成`options`形式。

举例：
```js
const listener1 = ()=>{}
const listener2 = ()=>{}
elem.addEventListener('click', listener1, true);
elem.addEventListener('click', listener2, false);

elem.removeEventListener('click', listener1, false); //fail
elem.removeEventListener('click', listener1, true); //success

elem.removeEventListener('click', listener2, false); //success
elem.removeEventListener('click', listener2, true); //fail
```

### dispatchEvent
语法：
```
cancelled = !target.dispatchEvent(event)
```
* `event` | `Event` 是要被派发的事件对象，实现了`Event`接口的对象。
* `target` | `EventTarget` 实现了`EventTarget`接口的源。

返回值
* `boolean` 这个方法调用后返回一个`boolean`值，为`true`时，则代表`event`在相关的`listener`内部被调用了`preventDefault`方法，为`false`时，则代表`preventDefault`方法没有被调用。  所以返回值的含义等同于`isDefaultPrevented`。

这个方法接收的参数`event`是一个实现了`Event`接口的对象。`Event`接口是下面要学习的内容。


## Event
`Event`接口是浏览器事件模型中的关键接口。 不论是众多的内置标准事件，还是开发者想要借助`EventTarget`派发的自定义事件，都要继承`Event`接口。 

### 它的常用属性
* `bubbles` | `boolean` 表示事件是否会冒泡
* `cancelable` | `boolean` 表示事件是否可以取消，只有这个属性为`true`，调用`preventDefault`方法才有意义
* `currentTarget` | `EventTarget` 事件当前传递至的对象。
* `defaultPrevented` | `boolean` 事件是否调用过`preventDefault`
* `target` | `EventTarget` 派发事件的源对象。

### 它的方法 
* `initEvent`
    ```js
    event.initEvent(type, bubbles, cancelable);
    ```
    这个方法在旧的派发自定义事件时，需要用到。 后面再介绍。

* `preventDefault` 调用这个方法，阻止事件的默认行为
* `stopPropagation` 调用这个方法，阻止事件冒泡
* `stopImmediatePropagation` 如果有多个相同类型事件的事件监听函数绑定到同一个元素，当该类型的事件触发时，它们会按照被添加的顺序执行。如果其中某个监听函数执行了 event.stopImmediatePropagation() 方法，则当前元素剩下的监听函数将不会被执行。

`Event`接口仅仅是事件对象的顶层接口，在以往的开发中接触过的事件，比如`click`和`scroll`等等，这些事件监听里面拿到的事件监听对象，往往比上面的`Event`接口，有更多的属性和方法，这是因为那些事件，实际上都是继承了`Event`接口的子事件对象类型。 浏览器内置了非常多的事件类，它们都继承了`Event`接口，以表达特定的事件含义，同时也扩展出了跟自身相关特有的属性和方法，所以实际开发遇到哪个还需要单独学习:
<img src="{% asset_path "01.png" %}" width="600" style="border: none">

这些`Event`子类之间，也存在继承关系。比如`MouseEvent`继承了`UIEvent`，而`WheelEvent`继承了`MouseEvent`。

## 派发事件
派发浏览器事件模型中的事件，一般分为三个场景：
1. 浏览器UI交互派发，比如鼠标点击、键盘输入和页面滚动等
2. 脚本通过特定的方法触发，比如`btn.click()` `input.focus()`
3. 通过构造`Event`实例，借助`dispatchEvent`方法来触发

下面看看如何派发主动构造的`Event`，分2部分：
1. 旧版的方式主动派发事件
3. 新版的方式主动派发事件

### 旧版的方式主动派发事件
分三步：
1. 使用`document.createEvent`这个方法来构造`Event`对象：
```js
let event = document.createEvent(type);
```
    - `event` 就是被创建的 Event 对象.
    - `type` 是一个字符串，表示要创建的事件类型。事件类型可能包括`UIEvents`, `MouseEvents`, `MutationEvents`, 或者 `HTMLEvents`等等。

2. 构造完了`event`对象以后，要调用`event`对应的初始化方法，才能用于`dispatchEvent`。 这个初始化方法，每个内置事件类型，可能都有差异，比如顶层的`Event`类，它的初始化方法是`initEvent`，`MouseEvent`子类的初始化方法是`initMouseEvent`，`UIEvent`子类的初始化方法是`initUIEvent()`，`FocusEvent`子类的初始化方法是`initEvent`等等。

3. 调用`dispatchEvent`，把`event`派发出去。


示例：
```html demo1
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title></title>
</head>
<body>
    <div id="test">
    </div>
    <script>
        var elem = document.querySelector("#test");
        // 1.
        var event = document.createEvent('Event');

        // 2.
        event.initEvent('build', true, true);

        elem.addEventListener('build', function (e) {
            console.log('yeah!') // yeah!
        }, false);

        // 3.
        elem.dispatchEvent(event);
    </script>
</body>
</html>
```
这个`demo`自定义了一个`build`事件，直接利用的是`Event`这个顶层类。 `Event`这个顶层类，在使用`document.createEvent`构建的时候，应该传入的`type`是`Event`，然后它的初始化方法为`initEvent`。 这个所有的`event`对象都可以使用的`initEvent`方法是这样的：
```js
event.initEvent(type, bubbles, cancelable);
```
* `type` 一个`DOMString`类型的字段，定义了事件的名称.
* `bubbles` 一个`Boolean`值，决定是否事件是否应该向上冒泡. 
* `cancelable` 一个`Boolean`值，决定该事件的默认动作是否可以被取消. 

`Event`基类用于自定义事件当然是没问题的，但是它不具备传递数据的能力，而在事件监听模型中，派发事件时传递数据是非常常见的需求。 为了满足这种需求，可以使用`CustomEvent`这个子类：
```html demo2
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title></title>
</head>
<body>
    <div id="test">
    </div>
    <script>
        var elem = document.querySelector("#test");
        // 1.
        var event = document.createEvent('CustomEvent');

        // 2. 
        event.initCustomEvent('build', true, true, {
            name: 'lyzg'
        });

        elem.addEventListener('build', function (e) {
            console.log(e.detail) // {name: "lyzg"}
        }, false);

        // 3.
        elem.dispatchEvent(event);
    </script>
</body>
</html>
```
`CustomEvent`用在`document.createEvent`的`type`是：`CustomEvent`，它的初始化方法为`initCustomEvent`，这个方法比基类的`initEvent`方法多一个参数：
```js
event.initCustomEvent(type, canBubble, cancelable, detail);
```
* `detail` 事件初始化时传入的数据.

使用`CustomEvent`这个类就比使用`Event`基类，更符合自定义事件的场景。

如果想主动派发标准事件，比如`MouseEvent`，需要这么做：
```html demo3
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title></title>
</head>
<body>
    <div id="test">
    </div>
    <button id="btn" type="button">click</button>
    <script>
        var elem = document.querySelector("#test");
        var btn = document.querySelector("#btn");

        elem.addEventListener('click', function (e) {
            console.log(e.type) //click
        }, false);

        btn.onclick = function () {
            // 1.
            var event = document.createEvent('MouseEvents');

            // 2. 
            event.initMouseEvent("click", true, true, window,
                0, 0, 0, 0, 0, false, false, false, false, 0, null);

            // 3.
            elem.dispatchEvent(event);
        }
    </script>
</body>
</html>
```

`MouseEvent`用在`document.createEvent`的`type`是：`MouseEvents`，它的初始化方法为`initMouseEvent`，这个方法比基类的`initEvent`要复杂的多：


```js
event.initMouseEvent(type, canBubble, cancelable, view,
                     detail, screenX, screenY, clientX, clientY,
                     ctrlKey, altKey, shiftKey, metaKey,
                     button, relatedTarget);
```

综合以上内容可以看到这种主动派发事件的方式，有两个比较关键的问题：
1. 假如你想派发某个事件，首先你必须找到它在`document.createEvent`中使用时对应的`type`是什么；
2. 当你`dispatchEvent`它之前，必须调用初始化方法，而它的初始化方法到底是`initEvent`还是别的，以及相对应的参数有哪些，也都需要去专门的学习。 

正因如此，上面这种方式已经慢慢被废弃了，浏览器开始使用新的标准来派发自定义事件。

### 新版的方式主动派发事件
新的方式主动派发事件，简单的多，只需要利用`Event`及其子类的构造函数，`new`出事件对象，就能用于`dispatchEvent`。

示例：
```html demo4
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title></title>
</head>
<body>
    <div id="test">
    </div>
    <script>
        var elem = document.querySelector("#test");
        // 1.
        var event = new Event('build');

        elem.addEventListener('build', function (e) {
            console.log('yeah!') // yeah!
        }, false);

        // 2.
        elem.dispatchEvent(event);
    </script>
</body>
</html>
```

自定义可传递数据的事件：
```html demo5
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title></title>
</head>
<body>
    <div id="test">
    </div>
    <script>
        var elem = document.querySelector("#test");
        // 1.
        var event = new CustomEvent('build', {
            detail: {
                name: 'lyzg'
            }
        });

        elem.addEventListener('build', function (e) {
            console.log(e.detail) // {name: "lyzg"}
        }, false);

        // 2.
        elem.dispatchEvent(event);
    </script>
</body>
</html>
```

自定义内置事件：
```html demo6
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title></title>
</head>
<body>
    <div id="test">
    </div>
    <button id="btn" type="button">click</button>
    <script>
        var elem = document.querySelector("#test");
        var btn = document.querySelector("#btn");

        elem.addEventListener('click', function (e) {
            console.log(e.type) //click
        }, false);

        btn.onclick = function () {
            // 1.
            var event = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });

            // 2.
            elem.dispatchEvent(event);
        }
    </script>
</body>
</html>
```

综上可见，新的派发方式简洁多了，当你想要派发某个事件的时候，只需要去学习这个事件的构造函数如何使用即可。

### polyfill
虽然新的派发方式，是浏览器遵循后来的DOM标准改进的，但是这个方式与旧版的方式是兼容的，甚至可以说，新版方式就是基于旧版做的改进，它不就是把旧版中的`document.createEvent`与`init`合二为一，直接放进构造函数中内部统一完成了吗，所以对开发者来说更加简洁了而已。

因此即使新版方式在部分浏览器有兼容性问题，我们依然能够使用到有效的`polyfill`来使用新版方式。

比如`MouseEvent`，可以用`polyfill`：
```js
(function (window) {
  try {
    new MouseEvent('test');
    return false; // No need to polyfill
  } catch (e) {
		// Need to polyfill - fall through
  }

    // Polyfills DOM4 MouseEvent
	var MouseEventPolyfill = function (eventType, params) {
		params = params || { bubbles: false, cancelable: false };
		var mouseEvent = document.createEvent('MouseEvent');
		mouseEvent.initMouseEvent(eventType, 
			params.bubbles,
			params.cancelable,
			window,
			0,
			params.screenX || 0,
			params.screenY || 0,
			params.clientX || 0,
			params.clientY || 0,
			params.ctrlKey || false,
			params.altKey || false,
			params.shiftKey || false,
			params.metaKey || false,
			params.button || 0,
			params.relatedTarget || null
		);

		return mouseEvent;
	}

	MouseEventPolyfill.prototype = Event.prototype;

	window.MouseEvent = MouseEventPolyfill;
})(window);
```

`CustomEvent`的`polyfill`：
```js
(function () {

  if ( typeof window.CustomEvent === "function" ) return false;

  function CustomEvent ( event, params ) {
    params = params || { bubbles: false, cancelable: false, detail: null };
    var evt = document.createEvent( 'CustomEvent' );
    evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
    return evt;
   }

  window.CustomEvent = CustomEvent;
})();
```

其它的`Event`子类也可以在用到的时候，根据上面类似的方式写出`polyfill`。