---
title: HTTP Strict Transport Security
tags:
  - HSTS
  - https
categories:
  - web安全
date: 2020-05-11 11:59:13
---


`Strict-Transport-Security`是一个`http`的`response header`，可以告诉浏览器要用https来访问网站，而不是http。`hsts`就是`http strict transport security`。

<!-- more -->

## 语法
```
Strict-Transport-Security: max-age=<expire-time>
Strict-Transport-Security: max-age=<expire-time>; includeSubDomains
Strict-Transport-Security: max-age=<expire-time>; preload
```

### 指令
* `max-age=<expire-time>`
设置在浏览器收到这个请求后的`<expire-time>`秒的时间内，凡是访问这个域名下的请求都使用`https`请求。
* `includeSubDomains` | 可选
如果这个可选的参数被指定，那么说明此规则也适用于该网站的所有子域名。
* `preload` | 可选
这个指令不是标准规定的，而是谷歌和火狐浏览器维护的一个`hsts`列表，像一个白名单，只要在这个列表内的网站，永远启用`hsts`。

### 介绍
一般现在部署`https`的网站，都会同时兼容`http`和`https`的访问，后端服务器配置`http`强制重定向到`https`访问。在这种场景中，对用户而言，最终都会转化为`https`访问，但是如果用户每次都是通过`http`连接发起的访问，那么每次始终都会有一次`http`请求，之后才是`https`请求。 这样的访问过程中，首次的`http`访问，有被攻击的风险。 中间人可以劫持这次访问，收集用户的信息、给用户返回钓鱼网站。当用户的手机接入公共wifi的时候，假如这个公共wifi是一个黑客的笔记本热点，那这种攻击很有可能就会发生。

`Strict-Transport-Security`可以防范此类攻击，只要浏览器记录过一个网站的`Strict-Transport-Security`值，并且这个值没有过期，当用户下次使用`http`访问这个网站的时候，就会自动替换为`https`访问。

`Strict-Transport-Security`还有一个作用，就是如果用户发起`https`请求过程中，检测到证书无效，则浏览器会弹出警告，并且用户不能忽视，从而完全阻止用户访问该网站。


### 浏览器如何处理
**只有在用户第一次使用https请求，访问网站，并且网站设置了`Strict-Transport-Security`，浏览器才会记录这个`header`的值，之后用户尝试访问这个网站的`http`请求都会被替换为`https`。**

这个规则非常关键，当使用`http`访问网站时，即使响应这种包含有`Strict-Transport-Security`也会被浏览器忽略，因为这是`http`返回的`Strict-Transport-Security`的头部，这是不可信的，很有可能被中间人篡改过。只有`https`返回的`Strict-Transport-Security`，浏览器才会信任。

这间接地说明`Strict-Transport-Security`对安全的防范也不是百分之百的，用户最起码需要进行一次`https`访问之后，`Strict-Transport-Security`才能生效，那么在`https`访问之前，如果存在`http`访问，那依然是有被攻击的风险的。

每次浏览器接收到`Strict-Transport-Security`头，它都会更新这个网站的过期时间，所以网站可以刷新这些信息，防止过期发生。当`Strict-Transport-Security`头设置的过期时间到了，后面通过`http`的访问恢复到正常模式，不会再自动跳转到`https`。

Chrome、Firefox等浏览器里，当尝试访问该域名下的内容时，会产生一个307 Internal Redirect（内部跳转），自动跳转到`https`请求。

### 需注意的问题

网上说提到的`chrome hsts 失效`的问题，其实正是`hsts`生效的原因，而网上有些人提到的解决方案，竟然都是如何去清理`hsts`相关的域名，这既不符合用户体验，也不符合`hsts`这项标准的内涵。 什么情况下会出现下面这种因为`hsts`导致的访问拦截呢？
<img src="{% asset_path "01.png" %}" width="600" style="border: none">
上面图片已经说得非常明显了：
> 可能是因为有攻击者试图冒充xxxx.com，或wifi登录屏幕中断了此次连接。

上面这个图片是怎么出来的呢？是我在对xxxx.com进行已设置`hsts`的进行了`https`访问后，修改了xxxx.com的证书，然后对它发起`http`访问后出现的。 我这个测试情况，就是上述图片中所说的有人在冒充`xxxx.com`；因为我修改了`xxxx.com`的证书后，浏览器根据修改后的证书，无法判断`xxxx.com`的身份了。所以针对这种情况，进行阻止，是符合安全规范的。

第二种情况：*wifi登录屏幕中断了此次连接*。这是什么情况呢？比如xxxx.com开启了`hsts`，并且你事先访问过xxxx.com，可以保证浏览器内的`strict transport security`已生效，然后你去连接星巴克、麦当劳等使用`http`了进行认证的wifi网络，当你发起一个对`xxxx.com`的`http`访问后，浏览器会默认替换为`https`进行访问，但是因为还没有连入wifi，所以星巴克、麦当劳的`http`wifi认证生效，拦截了你被替换后的`https`请求，返回了一个基于`http`的wifi登录页面，浏览器本来需要一个`https`的响应，结果返回了一个`http`响应，自然就触发了安全警告机制。

`strict transport security`过期并不会导致出现上面类似的安全警告，只是不会再自动将http替换为https访问。如果要关闭掉`hsts`，不能把`strict transport security`这个头去掉，而是要明确的将`max-age`设置为0，不然之前`hsts`已生效的浏览器在过期之前会一直使用`hsts`。
```
strict-transport-security:max-age=0
```