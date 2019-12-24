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

这个库提供的核心服务：
* 动态激活vConsole
* 收集客户端脚本运行错误
* 收集`script|img|link`标签加载资源时的加载错误
* 收集使用`vue`时的运行错误
* 收集使用`vue-router`时的运行错误
* 收集使用`axios`时的请求和响应错误
* 上报自定义错误

其它场景的错误收集服务，在后续版本会陆续发布。
* react相关
* 未捕获的Promise
* fetch或xhr过程中的错误

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
 * setConfig(options)
 *  onReport {Function} 收集到错误之后的回调函数，在此进行错误上报
 */
// 错误上报
ErrorReporter.setConfig({
    onReport (message, reportType) {
        // message是可以进行上报的包含错误信息的字符串
        // reportType是一个描述上报场景的字符串
    }
})


// 调用enableVConsole动态加载vConsole并实例化，如果show为true则在实例化完成后立即展示vConsole
let show = false
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

## 详细使用说明

### `setConfig(options)`
这是进行初始化的一个方法，各个option的用法如下：
* vConsoleSrc

    `@{String|default: '//cdn.bootcss.com/vConsole/3.3.4/vconsole.min.js'}`

    这个option指定vConsole的文件地址，当启用vConsole时，会基于这个地址动态加载vConsole源文件。

* maximumStackLines

    `@{Number|default: 20}`
    这个option用在收集运行时错误的场景中。通常js运行错误，都有比较长的堆栈信息，这个option限制上报时最多收集多少行堆栈信息。

* resource

    `@{Boolean|default: true}`

    是否开启收集资源加载失败的错误。默认为`true`，开启后，`script|img|link`资源加载失败，会被收集到。

*  vue

    `@{Class|default: null}`
    这个option默认为null，传入`Vue`之后，就会通过`Vue`的异常处理机制收集`Vue`的运行错误。

* vueRouter

    `@{VueRouter|default: null}`

    这个option默认为null，可传入`vue-router`的实例。传入后，就会通过`vue-router`的异常处理机制，收集`vue-router`的运行错误。

* axios

    `@{axios|default: null}`

    这个option默认为null，可传入`axios`引用。传入后，通过配置`axios`对`request responce`的拦截器，收集相关错误。

* axiosReportConfig

    `@{Array|default: ['url', 'method', 'params', 'data', 'headers']}`

    配置此数组，可以在捕获到`axios`的错误时，从它的`config`对象内提取指定信息。 默认提取的信息数组为：`'url', 'method', 'params', 'data', 'headers'`，这些数据被提取出来后，会作为`onReport`的第三个参数传入，方便一同上报至后台。

* axiosIgnore

    `@{Array,Function| default: null}`

    这个option可以是一个数组，也可以是一个函数。当它是一个数组时，可通过数组指定正则表达式，只要这个数组内存在某个正则，与`config.url`匹配，则在此`config`请求失败时，不会进行上报。

    或者是配置为一个函数，会被传入捕获到的`axios`的`error`对象，当这个函数返回trusy值时，则不会进行此错误的上报。

* notReportErrors

    `@{Array|default: []}`

    这个option可以指定为一个数组，它的元素应该是`Error`类的子类，当`error-reporter`捕获的任何错误，只要是这个数组中某一个元素的实例（基于`instanceof`运算），则不进行该错误的上报。

* processStack

    `@{Function|default:[inner function]`

    这个option用来对`Error`实例的`stack`进行解析，在此库的内部有使用以下这个函数进行解析，如果不想要或者想更换，则可利用此`option`处理。

    默认的处理函数如下：
    ```js
    function processStackMsg (error) {
        // 1. clean line separator
        // 2. replace 'at' with '@' in error source like 'at window.makeError (http://localhost:8080/test.js?a=1&b=2:3:5)'
        // 3. limit maximum stack lines
        // 4. clean query string in error source like 'http://localhost:8080/test.js?a=1&b=2'

        let stack = error.stack
            .replace(/\n/gi, '') // 1
            .split(/\bat\b/) // 2
            .slice(0, config.maximumStackLines) // 3
            .join('@')
            .replace(/\?[^:]+/gi, '') // 4
        let msg = error.toString()
        if (stack.indexOf(msg) < 0) {
            stack = msg + '@' + stack
        }
        return stack
    }    
    ```

* onReport

    `@{Function|default: noop}`

    这是收集到错误以后的回调函数，不管是哪个场景的错误，都会进入这个回调。

    它有三个参数：
    * message 错误信息串
    * reportType 错误场景描述的字符串
    * extraData 某些上报场景可能会包含额外的数据，如`axios`

* onResourceLoadError

    `@{Function|default: noop}`

    这是单独给资源加载失败时提供的额外的回调函数。考虑到资源加载失败是比较严重的错误，而且通常刷新一下页面可能就能恢复正常使用，所以需要一个类似这样的回调函数，来进行相关的提示和刷新操作。

特殊地：
在此库内部，会用到一个自定义的`Error`实例的属性：`notToReport`，只要这个属性是一个trusy值，则在捕获到这个错误时，不会进行上报。

所以除了`notReportErrors`option，另外一个屏蔽某些错误不进行上报的方式，可以参考下面的做法：
```js
setTimeout(()=>{
    let e = new Error('sth happened')
    e.notToReport = true
    throw e // 这个错误不会进行上报
})
```

#### reportType
内部有定义常量来描述上报场景：
```js
const REPORT_TYPE = {
    RUNTIME: 'runtime',
    RESOURCE: 'resource',
    VUE: 'vue',
    VUE_ROUTER: 'vue-router',
    MANUAL: 'manual',
    AXIOS_REQUEST: 'axios-request',
    AXIOS_RESPONSE: 'axios-response',
    UNHANDLED_REJECTION: 'unhandledrejection'
}
```
将来支持的场景越多，这个地方还会增加。 另外在后面介绍的api方法中，有一个`makeReport`方法，它可以传入自定义的`reportType`：
```js
function makeReport (err, reportType, extraData = {}) {
    let error = err
    if (isObjectType(err, 'String')) {
        error = new Error(err)
    }
    if (notToReport(error)) return
    return config.onReport.call(ErrorReporter, config.processStack(error), reportType || REPORT_TYPE.MANUAL, extraData)
}
```
后端收集到错误，可根据`reportType`做相关统计和分类查询。

### `enableVConsole`
这个方法用来激活`vConsole`，它有一个参数：
* show @{Boolean|Default: undefined} 指定为true时，将在激活后立即显示vConsole面板
    
### `getSystemInfo`
这个方法可用来收集客户端信息，目前可收集的信息如下：
```js
{
    system,
    systemVersion,
    netType,
    ua,
    wechat,
    wechatVersion,
    wechatMini
}
```

### `getCookie`
这是一个工具方法，用来从`document.cookie`中查询指定的cookie值。
有一个参数：
* name @{String} 要查询的cookie的名字

### `makeReport`
这个方法，可用来自定义错误上报，接收两个参数
* err @{String|Error} 可以是字符串或`Error`实例
* reportType @{String}

### `wrapNotReport`
这个方法，用来包裹一个`Error`对象，添加`notToReport`属性，阻止它被上报。

### 更加完整的示例
```js
import Vue from 'vue'
import ErrorReporter from 'breif-error-reporter'
import axios from 'axios'
import router from './router'

// 错误上报
ErrorReporter.setConfig({
    vue: Vue,
    vueRouter: router,
    axios: axios,
    axiosIgnore: [
        /web-error-report/
    ],
    onResourceLoadError (event) {
        if (event.target && event.target instanceof HTMLScriptElement) {
            if (event.target.src.indexOf('static/js') > -1) {
                location.reload()
            }
        }
    },
    onReport (message, reportType, extraData) {
        let accessToken = localStorage.accessToken || ''
        let clientId = localStorage.client_id || ''

        let systemInfo = this.getSystemInfo()
        let href = location.href
        let path = location.pathname
        let search = location.search ? location.search.substring(1) : ''
        let cookieClientId = this.getCookie('client_id')
        let cookieAccessToken = this.getCookie('accessToken')
        let cookie = []
        cookieClientId && cookie.push(cookieClientId)
        cookieAccessToken && cookie.push(cookieAccessToken)
        cookie = cookie.join('; ')

        let reportData = {
            ...systemInfo,
            accessToken,
            clientId,
            href,
            path,
            search,
            cookie,
            message,
            reportType,
            extraData: JSON.stringify(extraData)
        }

        // post reportData ...
    }
})
```

### 运行时错误的跨域问题
`ErrorReporter`利用`window.onerror`收集运行时错误，有一个跨域问题需要注意：
如果错误是由跨域的脚本产生的，比如某网站`a.com`下有个页面有如下js引用：
```html
<script src="http://b.com/some.js"></script>
```
`some.js`运行时发生错误，通过`ErrorReporter`收集到出错信息时，默认只能收到`Script error.`这样一个字符串，并且`window.onerror`回调的最后一个很重要的参数`error`也是`null`，这是浏览器因为安全策略故意做的，防止信息泄露。这样的错误信息是没有意义的。

如果想收集不同域的脚本报出的完整错误信息，必须做到两点：
* script标签添加`crossorigin`属性，如`<script crossorigin>`
* 脚本域名必须做CORS的处理，将`Access-Control-Allow-Origin`这个http header配置好

## 实现思路
请阅读[这篇文章](https://mp.weixin.qq.com/s/E51lKQOojsvhHvACIyXwhw)
