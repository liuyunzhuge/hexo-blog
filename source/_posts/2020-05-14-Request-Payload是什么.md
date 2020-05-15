---
title: Request Payload是什么
tags:
  - enctype
  - request payload
categories:
  - web
  - http
date: 2020-05-14 20:10:26
---


在监控请求提交的数据的时候，应该注意到有的时候数据提交部分的名称是：`Request Payload`，而不是我们熟悉的`QueryString`和`FormData`。什么是`Request Payload`，以及它与`Query String`和`Form Data`是什么关系和区别呢？

<!-- more -->
`Request Payload`
<img src="{% asset_path "01.png" %}" width="500" style="border: none">
`Query String`
<img src="{% asset_path "02.png" %}" width="500" style="border: none">
`Form Data`
<img src="{% asset_path "03.png" %}" width="500" style="border: none">

`Query String`其实非常简单，就是把`url`中的参数解析在这个位置。不管是`url`里面本身包含的`searchParams`，还是`http`请求通过`get`方法额外设置的数据，最终都会以`url` `query`的形式进行传输。 开发者工具是非常明确这部分数据的类型和来源的，所以把这种数据划分在一个名叫`Query String`的部分来展示，方便开发人员查看。

剩下两个要从`form`元素的`enctype`说起。`enctype`有三个属性值：
* `application/x-www-form-urlencoded` 默认值。将请求提交的数据按照url编码之后再传递。
* `multipart/form-data` 这个请求数据进行编码，表单内有文件上传时使用。
* `text/plain` 空格转换为加号，其它数据原封不动地进行传递。

当表单的`method`属性设置为`get`时，`enctype`没有啥作用，这是因为`get`等价于意味着`http`的`get`方法，它的数据是放在`url`中传递的，所以`enctype`没有效果。

为了看到`enctype`的作用，可以选择`post`方法来测试。

```html 测试1 post + application/x-www-form-urlencoded
    <form action="http://liuyunzhuge:3000/post" method="post" enctype="application/x-www-form-urlencoded">
        <input type="text" name="name">
        <input type="file" name="image">
        <input type="submit" value="提交">
    </form>
```
<img src="{% asset_path "04.png" %}" width="800" style="border: none">
从图可以看到，这个时候开发者工具显示的是`Form Data`，并且通过查看`Form Data`原始数据，可以看到数据是经过了`url`编码处理的。

```html 测试2 post + multipart/form-data
    <form action="http://liuyunzhuge:3000/post" method="post" enctype="multipart/form-data">
        <input type="text" name="name">
        <input type="file" name="image">
        <input type="submit" value="提交">
    </form>
```
<img src="{% asset_path "06.png" %}" width="800" style="border: none">
从图可以看到，这个时候开发者工具显示的是`Form Data`，并且通过查看`Form Data`原始数据，可以看到数据是未经过`url`编码处理的。


```html 测试3 post + text/plain
    <form action="http://liuyunzhuge:3000/post" method="post" enctype="text/plain">
        <input type="text" name="name">
        <input type="submit" value="提交">
    </form>
```
<img src="{% asset_path "07.png" %}" width="800" style="border: none">
从图可以看到，这个时候开发者工具显示的是`Request Payload`，并且其中展示的数据不再有可交互的特性，只是直白的字符展示。

综合以上所述，可以发现：
1. 当`form`使用`post`方法，并且`enctype`设置为`application/x-www-form-urlencoded`或`multipart/form-data`时，开发者工具会按`Form Data`来显示数据，并且数据有两种查看方式：按原始的方式和按解析好的方式。
2. 当`form`使用`post`方法，并且`enctype`设置为`text/plain`时，开发者工具会按`Request Payload`来显示数据，数据只有1种查看方式。

再进一步思考，`form`的提交，本质上是发起新的`http`请求，而`enctype`最终影响的其实也就是`http`请求。  综合以上的例子，还可以发现`enctype`与`http`请求中的`Content-Type`请求头有一定的关联：
* 当`enctype`为`application/x-www-form-urlencoded`的时候，对应的`http`的`content-type`请求头是：`application/x-www-form-urlencoded`
* 当`enctype`为`multipart/form-data`的时候，对应的`http`的`content-type`请求头是：`multipart/form-data; boundary=----...`
* 当`enctype`为`text/plain`的时候，对应的`http`的`content-type`请求头是：`text/plain`

所以开发者工具里数据部分是显示为`Request Payload`还是`Form Data`，实质上跟`content-type`请求头有关系：
* 当`content-type`请求头是`application/x-www-form-urlencoded`或者`multipart/form-data; boundary=----...`，开发者工具显示的就是`Form Data`
* 当`content-type`是其它值，比如`text/plain`、`application/json`等，开发者工具就显示为`Request Payload`。

在使用`axios`发请求的时候，就经常能看到`application/json`下显示出的`Request Payload`：
<img src="{% asset_path "08.png" %}" width="800" style="border: none">

为什么要分为这三种呢？跟它们各自含义有关系：
1. `Query String` 代表的是`url`中的查询参数，所以这个部分可能与`Request Payload`和`Form Data`共存
2. `Form Data` 代表的是内容类型固定的请求数据
3. `Request Payload` 代表的是内容类型未知的请求数据

所以在开发者工具中，`Query String`和`Form Data`都有两种查看数据的方式，`view source`和`view parsed`，因为浏览器知道这个时候的请求数据是什么格式的；而对于`Request Payload`，浏览器则不知道请求体里是什么数据。
