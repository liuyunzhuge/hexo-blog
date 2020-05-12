---
title: Referrer Policy
tags:
  - Referrer Policy
categories:
  - web安全
date: 2020-05-12 09:54:55
---


当从A页面导航到B页面时，B页面的http请求会带上一个`referer`请求头，来标识B页面是从什么页面过来的。这个`referer`头的信息，通常来说也构不成安全威胁。但是用户不小心在点击了一个恶意网站，当他访问这个恶意网站的时候，可能会把用户当前正在访问的页面地址以`referer`头的方式发送到了恶意网站服务器，从而泄露了用户自己的访问信息。 `Referrer Policy`就是用来设置`referer`头如何发送的安全策略。

<!-- more -->
`referer`这个单词是错误的，`referrer`这个单词才是正确的。但是`http`的请求头里面很早就用了`referer`，所以改不过来了。但是`Referrer Policy`是使用一个新的http响应头来设置的：`Referrer-Policy`，它更正了请求头中`referer`的写法。 `Referrer-Policy`是一个http响应头，它的语法如下：
```
Referrer-Policy: no-referrer
Referrer-Policy: no-referrer-when-downgrade
Referrer-Policy: origin
Referrer-Policy: origin-when-cross-origin
Referrer-Policy: same-origin
Referrer-Policy: strict-origin
Referrer-Policy: strict-origin-when-cross-origin
Referrer-Policy: unsafe-url
```
它一共有8个指令，各个指令的含义如下：
* no-referrer 这个指令规定页面跳转到别的页面时不带`referer`请求头。
* no-referrer-when-downgrade 这个是目前浏览器`Referrer Policy`的默认值。它在安全级别降级的情况下（https跳转http）不带`referer`头，在安全级别不降级的情况下，会发送源页面完整地址作为`referer`头。
* origin 在任何情况下，只把源页面的源作为`referer`头发送，而不是源页面的完整地址，源页面的源是指：源页面的协议 + 源页面的主机 + 源页面的端口。
* origin-when-cross-origin 当两个页面同源的时候，发送源页面的完整地址，当页面不同源的时候，只发送源页面的源作为`referer`头。
* same-origin 同源的时候发送页面的完整地址作为`referer`头，不同源的时候不发送。
* strict-origin 它在安全级别降级的情况下（https跳转http）不带`referer`头，在安全级别不降级的情况下，会发送源页面的源作为`referer`头。
* strict-origin-when-cross-origin 同源的情况下，发送页面完整地址作为`referer`头；否则，它在安全级别降级的情况下（https跳转http）不带`referer`头，在安全级别不降级的情况下，会发送源页面的源作为`referer`头。
* unsafe-url 不安全，不要用。

示例参考：
> https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Headers/Referrer-Policy#%E7%A4%BA%E4%BE%8B

**跟html集成**
`Referrer Policy`也可以在html中通过meta标签设置：
```html
<meta name="referrer" content="origin">
```

部分html元素，可以通过`referrerpolicy`属性，单独设置`Referrer Policy`，如`<a>、<area>、<img>、<iframe>、<script> 或者 <link>`:
```html
<a href="http://example.com" referrerpolicy="origin">
```
另外也可以在`<a>、<area> 或者 <link>`元素上将 rel 属性设置为`noreferrer`。
```html
<a href="http://example.com" rel="noreferrer">
```

**跟css集成**
* 外部样式表，使用默认策略（`no-referrer-when-downgrade`），但是也可以通过给外表样式表定制单独的响应头来覆盖默认策略。
* `style`标签或`style`属性，遵循文档的`Referrer Policy`。
