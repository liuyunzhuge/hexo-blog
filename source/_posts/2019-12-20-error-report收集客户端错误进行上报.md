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