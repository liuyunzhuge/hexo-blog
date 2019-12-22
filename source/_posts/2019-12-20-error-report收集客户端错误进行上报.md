---
title: error-report收集客户端错误进行上报
tags:
  - javscript
  - 日常开发
  - error-reporter
categories:
  - Javascript
date: 2019-12-20 22:04:19
---


开发了一个小工具：[ErrorReporter](https://github.com/liuyunzhuge/error-reporter)。利用window.onerror完成脚本错误收集，方便进行上报，以便排查未知的客户端问题。 参考自AlloyLever，在它的基础上有简化和调整使用方式。错误上报服务也可以使用商业方案：Sentry和Bugsnag。

<!-- more -->

这个库是基于[AlloyLever](https://github.com/AlloyTeam/AlloyLever)改的，实现思路和核心代码，都是它那边复制过来的。为什么不直接用它，而是再写一个？因为碰到了不一样的使用方式，而且它的一些逻辑，并不是每个项目都需要的，所以这个项目只保留了AlloyLever最核心的功能。

这个库提供两项服务能力：
* 动态激活vConsole
* 收集客户端脚本运行错误

## 使用方式
先介绍下error-reporter的使用方式。

安装：
```
npm install breif-error-reporter --save
```

使用：
```js
import ErrorReporter from 'breif-error-reporter'

/**
 * setConfig
 *  onReport {Function} 收集到错误之后的回调函数，在此进行错误上报
 *  maximumStackLines {Number|default:20} 最多收集多少行错误堆栈信息
 *  vConsoleSrc {String} 动态激活vConsole时，要提供的vConsole的脚本文件地址，默认值使用的是Bootcss提供的cdn地址
 */
// 错误上报
ErrorReporter.setConfig({
    onReport (message) {
        // message是可以进行上报的包含错误信息的字符串
    }
})


// 激活vConsole
let show = false
// 调用enableVConsole动态加载vConsole并实例化，如果show为true则在实例化完成后立即展示vConsole
ErrorReporter.enableVConsole(show)
```

如果你想在某个url参数下自动唤起vConsole，可以采用以下类似的做法：
```js
if(window.location.href.indexOf('vconsole') > -1) {
    ErrorReporter.enableVConsole()
}
```
当生产环境有用户反馈问题，不好排查原因时，可将带有`vconsole`参数的链接发给用户，让用户协助截图或录屏的方式，帮忙反馈vConsole收集的日志。

这个库并没有把url参数唤起的方式，自动加入到库的实现里面去，只提供了动态唤起vConsole的方法，每个项目怎么用，由项目自己决定。


## VS. AlloyLever
* 本库不提供url参数唤起vConsole，以及`entry`机关唤起vConsole，只提供动态唤起vConsole的方法，每个项目可自行决定如何唤起。
* 本库不默认提供上报的逻辑，由每个项目自己通过回调函数决定如何上报。 AlloyLever内部是通过`new Image().src`的方式来进行上报的，我个人更喜欢用ajax来处理，比`new Image().src`灵活。

## 要点
实现核心是`window.onerror`的事件回调函数，详细地说明可参考[MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/GlobalEventHandlers/onerror)。

有两个地方需要注意。 第一是在AlloyLever的源码里面有这样一段代码：
```js
window.onerror = function(msg, url, line, col, error) {
    ...

    if (isOBJByType(newMsg, "Event")) {
        newMsg += newMsg.type ?
            ("--" + newMsg.type + "--" + (newMsg.target ?
                (newMsg.target.tagName + "::" + newMsg.target.src) : "")) : ""
    }

    ...
}
```
为什么`newMsg`可能是`Event`的一个实例呢？按照mdn文档的描述：
> * 当JavaScript运行时错误（包括语法错误）发生时，window会触发一个ErrorEvent接口的error事件，并执行window.onerror()。
> * 当一项资源（如\<img\>或\<script\>）加载失败，加载资源的元素会触发一个Event接口的error事件，并执行该元素上的onerror()处理函数。这些error事件不会向上冒泡到window，不过（至少在Firefox中）能被单一的window.addEventListener捕获。

也就是说`newMsg`如果是`Event`的实例，应该代表它是一个img或script加载失败的事件，但是mdn的说明里面，`window.onerror`的回调里面应该接收不到这样的事件才对。 所以不太明白AlloyLever里加入这段代码的作用，本库也保留了这个处理，希望上报功能上线后，看看是否会有类似的错误上报上来。

第二个注意点，如果错误是由跨域的脚本产生的，比如某网站`a.com`下有个页面有如下js引用：
```html
<script src="http://b.com/some.js"></script>
```
`some.j`如果运行时发生错误，通过`ErrorReporter`收集到出错信息时，默认只能收到`Script error.`这样一条错误信息，并且onerror回调的最后一个很重要的参数`error`也是`null`，这是浏览器因为安全策略故意做的，防止信息泄露。

如果想收集不同域的脚本报出的完整错误信息，必须做到两点：
* script标签添加`crossorigin`属性，如`<script crossorigin>`
* 脚本域名必须做CORS的处理，将`Access-Control-Allow-Origin`这个http header配置好

## v0.1.3新增
* `getSystemInfo`和`getCookie`两个方法，方便在上报时利用它们收集客户端相关信息
```js
let systemInfo = ErrorReporter.getSystemInfo()
/**
 * {
    system: "iPhone"
    systemVersion: "iOS11.0"
    netType: "Unknown"
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 11_0 like Mac OS X) AppleWebKit/604.1.38 ..."
    wechat: false
    wechatVersion: ""
    wechatMini: false
 * }
 */

ErrorReporter.getCookie('someCookieName')
```

## v0.1.4新增
这个版本使用方式没有变化。在内部，新增了对于`script img link`元素加载失败时的错误处理，在捕获到这些元素抛出`error`错误时，也会通过`onReport`回调出来，这样后台收集到上报数据后，能明确知道什么资源在加载时出现问题。

由于`script img link`的`error`事件并不会冒泡，所以`window.onerror`这个监听方式无法检测到这类错误。 这也说明，前面AlloyLever这段代码中的处理是多余的：
```js
window.onerror = function(msg, url, line, col, error) {
    ...

    if (isOBJByType(newMsg, "Event")) {
        newMsg += newMsg.type ?
            ("--" + newMsg.type + "--" + (newMsg.target ?
                (newMsg.target.tagName + "::" + newMsg.target.src) : "")) : ""
    }

    ...
}
```
所以我把这段代码在新版本内去掉了。因为`window.error`里面，不会有这个逻辑进来阿。

虽然`window.error`无法监听到资源加载的错误，但是可以利用事件的机制，在捕获阶段，对错误进行上报，做法如下：
```js
// 2. use capture phase of window `error` event to collect resource loading errors
// `error` event does not bubble, so `window.onerror` cannot known resource loading errors
// but you can catch such errors using the capture phase of `error` event
window.addEventListener('error', function (event) {
    if (isOBJByType(event, 'Event') &&
        (
            event.target instanceof HTMLScriptElement ||
            event.target instanceof HTMLLinkElement ||
            event.target instanceof HTMLImageElement
        )
    ) {
        let message = event.type
            ? ('--' + event.type + '--' + (event.target
                ? (event.target.tagName.toLowerCase() + '::' + event.target.src) : '')) : ''
        config.onReport.call(ErrorReporter, message)
    }
}, true)
```

今天看到一篇文章，介绍前端如何全面地做错误收集，写得非常全面，也说明`error-reporter`这个库还有诸多不完善的地方。按照文章的总结，前端对于错误收集应该分为以下几个维度：
* 运行时错误(done)
* 资源加载错误(done)
* Promise未处理的错误(todo)
* 异步请求错误(xhr或fetch api) (todo)
* 框架集成(vue、react) (todo)

接下来的目标会针对以上几个`todo`一一解决。

文章地址：[一篇文章教你如何捕获前端错误](https://mp.weixin.qq.com/s/E51lKQOojsvhHvACIyXwhw)