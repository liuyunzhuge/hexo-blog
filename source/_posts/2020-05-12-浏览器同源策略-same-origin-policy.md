---
title: 浏览器同源策略 same-origin policy
tags:
  - ssp
  - 同源策略
categories:
  - web安全
date: 2020-05-12 22:22:46
---


`Same-site Policy`称为浏览器同源策略，是一项非常重要的安全策略。限制不同源的文档或它加载的脚本，对其它文档的访问，帮助阻拦恶意的网站侵犯用户权益。

## 同源的定义
页面的`协议` `主机` `端口` 三者构成一个页面的源，三者中有一项不同，则是不同源。

IE的同源策略有两个主要的差异点：
* 授信范围（Trust Zones）：两个相互之间高度互信的域名，如公司域名（corporate domains），则不受同源策略限制。
* 端口：IE未将端口号纳入到同源策略的检查中，因此`https://company.com:81/index.html`和`https://company.com/index.html`属于同源并且不受任何限制。

## 源的继承
通过`javascript:`伪协议以及`about:blank结合window.open`打开的新文档，将继承源文档的源，因为这些新文档不具备服务端的信息。

通过`javascript:;`伪协议打开新文档：
```html demo01.html
<!doctype html>
<html>
<head>
    <meta charset="UTF-8">
    <title>javascript:伪协议测试</title>
</head>
<body>
    <a href="javascript: '<script>window.opener.makeContent(window)</script>';" target="_blank">测试</a>
    <script src="demo01.js"></script>
</body>
</html>
```
```js demo01.js
var someContent = 'some content';

function makeContent({document}){
    let parentContent = someContent
    document.write(`<div>${parentContent}</div>`)
}
```

通过`window.open`打开`about:blank`的新文档：
```html demo02.html
<!doctype html>
<html>
<head>
    <meta charset="UTF-8">
    <title>about:blank测试</title>
</head>
<body>
    <a href="javascript: openNewWin();">测试</a>
    <script src="../dist/js/demo01.js"></script>
</body>
</html>
```
```js demo02.js
function openNewWin() {
    let win = window.open('about:blank')
    let {document} = win
    document.open()
    document.write(
        `<!doctype html>
<html>
<head>
    <meta charset="UTF-8">
    <title>about:blank测试</title>
</head>
<body>
maked by document.write
</body>
</html>`
    )
    document.close()
}
```

## 作用范围
同源策略的作用范围包含三个方面：
1. 限制对于网络资源的访问，包括表单提交、XHR、fetch、图片、音视频、脚本和css等
2. 限制对于不同源页面之间的DOM交互
3. 限制对于浏览器端存储资源的访问，包括cookies、Web Storage和IndexedDB

### 网络资源的限制
当出现跨源网络资源访问时，同源策略有不同的处理方式:
1. 如果是一个跨源的网络资源写操作，通常都是允许的，比如链接跳转、页面重定向、表单提交。但是xhr和fetch这种操作需要通过`CORS`方式才能访问成功。
2. 嵌入页面的网络资源访问，通常都是允许的，比如：
    * `<script src="..."></script>` 标签嵌入跨域脚本。但是跨域脚本中出现的运行错误明细，无法被`window.onerror`捕捉到，只有同源的脚本抛出的错误，才能捕捉到错误明细。
    * `<link rel="stylesheet" href="...">` 标签嵌入CSS。由于CSS的松散的语法规则，CSS的跨域需要一个设置正确的HTTP头部`Content-Type`。不同浏览器有不同的限制。
    * 通过 `<img>` 展示的图片。支持的图片格式包括PNG,JPEG,GIF,BMP,SVG,...
    * 通过 `<video>` 和 `<audio>` 播放的多媒体资源。
    * 通过 `<object>`、 `<embed>` 和 `<applet>` 嵌入的插件。
    * 通过 `@font-face` 引入的字体。一些浏览器允许跨域字体（ `cross-origin fonts`），一些需要同源字体（`same-origin fonts`）。
    * 通过 `<iframe>` 载入的任何资源。站点可以使用`X-Frame-Options`消息头来阻止这种形式的跨域交互。
3. 读取跨源的网络资源内容，通常是不允许的。比如在`canvas`中虽然可以读取跨源的图片数据并写入画布，但是这会污染画布，导致`canvas`后续的api如`getImageData()、toBlob()、toDataURL()`会抛出安全错误。（参考：https://developer.mozilla.org/zh-CN/docs/Web/HTML/CORS_enabled_image）

降低同源策略对网络资源的访问限制的唯一方式，是使用`CORS`机制。比如上面提到的跨源`script`执行后，无法捕捉到它抛出的错误明细，但是通过设置`script`的`CORS setting attribute` - `crossOrigin`属性，就能解决这个问题；上述提到跨源图片写入`canvas`会污染画布也是类似的，通过设置`img`的`crossOrigin`属性，也能解决跨源给`canvas`带来的安全性问题，参考下面demo03中的代码。
```js demo03
function startDownload() {
  let imageURL = "https://cdn.glitch.com/4c9ebeb9-8b9a-4adc-ad0a-238d9ae00bb5%2Fmdn_logo-only_color.svg?1535749917189";
 
  downloadedImg = new Image;
  downloadedImg.crossOrigin = "Anonymous";
  downloadedImg.addEventListener("load", imageReceived, false);
  downloadedImg.src = imageURL;
}

function imageReceived() {
  let canvas = document.createElement("canvas");
  let context = canvas.getContext("2d");

  canvas.width = downloadedImg.width;
  canvas.height = downloadedImg.height;
 
  context.drawImage(downloadedImg, 0, 0);
  imageBox.appendChild(canvas);
 
  try {
    localStorage.setItem("saved-image-example", canvas.toDataURL("image/png"));
  }
  catch(err) {
    console.log("Error: " + err);
  }  
}
```

### 不同源之间DOM交互的限制
这种情况主要出现在页面与`frames、iframes`中的页面、页面与它用`window.open`打开的页面之间出现跨域时。 如果不是跨源的，那么：
* 页面与它包含的`frames或iframes`中的页面，可以通过`window`对象、`frames和iframe`的`name`、以及`parent`属性来获取对方的引用，并且能够访问对方的`document`对象，从而完成DOM交互
* 页面与它用`window.open`打开的页面，可以通过`window.open`的返回值、以及`window.opener`来获取对方的引用，并且能够访问对方的`document`对象，从而完成DOM交互

一旦它们是跨源的页面，则在它们拿到对方的`window`对象以后，只能使用非常有限的api来访问`window`对象，`dom`操作最重要的`document`对象是绝对禁止访问的。`window`对象上允许使用的api有：
* 方法
    - `window.blur`
    - `window.close`
    - `window.focus`
    - `window.postMessage`
* 属性	
    — `window.closed`	Read only.
    — `window.frames`	Read only.
    — `window.length`	Read only.
    — `window.location`	Read/Write.
    — `window.opener`	Read only.
    — `window.parent`	Read only.
    — `window.self`	Read only.
    — `window.top`	Read only.
    — `window.window`	Read only.

有的浏览器可能开放的方法/属性比上面多。  从上面的api也能看到，`window.location`也是允许跨源访问的，这个对象即使拿到之后，对它的访问也是有限制的：
* 方法
    - `location.replace`
* 属性    	
    - `href` Write-only.

示例：
<img src="{% asset_path "01.png" %}" width="600" style="border: none">

这样的安全是非常合理的，不然恶意网站就很容易攻击成功了。但是这个方式也给合理的跨源访问增加了限制，比如两个跨源的域名是两个互信的域名，它们如果有跨源的访问需求，显然应该是要被支持的。想要两个跨源的页面之间直接进行DOM交互是不可能的，但是如果能让两个跨源的页面之间能够传递消息，那么间接地就能完成DOM交互等同源场景才能做的事情了。目前有3种方式能够实现跨源的两个页面之间进行通信。

第一种是利用`hash`修改`location.href`，然后各自用`hashchange`事件监听消息。
```js 父窗口
var src = originURL + '#' + data;
document.getElementById('myIFrame').src = src;
```
```js 子窗口
window.onhashchange = checkMessage;

function checkMessage() {
  var message = window.location.hash;
  // ...
}

// 子窗口也可以修改父窗口的hash
parent.location.href= target + "#" + hash;
```
这个方式是可行的，但是缺点也比较多：
1. hash不是用来干这个，这个方式可能与那些hash原本的特性相冲突，比如跟`spa router`框架
2. 这个方式利用了`location.href`，所以可交互的数据量是有限的
3. 如果把大量的信息追加在hash中，会让地址栏变得比较丑

第二种是利用`window.name`这个属性来进行交互。下面的示例中，页面A将可以通过借助`window.name`的方式，获取到跨域页面B中的数据
```html 页面A http://localhost:9001/html/demo1.html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>test1</title>
</head>

<body>
    <h2>test1页面</h2>
    <script type="text/javascript">
        function getCrossOriginData(target, callback) {
            var boo = false;
            var iframe = document.createElement('iframe');
            var loadData = function () {
                if (boo) {
                    var data = iframe.contentWindow.name;
                    callback(data);
                    iframe.contentWindow.document.write('');
                    iframe.contentWindow.close();
                    document.body.removeChild(iframe);
                } else {
                    boo = true;
                    iframe.contentWindow.location = "about:blank";
                }
            };
            iframe.src = target;
            iframe.onload = loadData;
            document.body.appendChild(iframe);
        }

        getCrossOriginData('http://127.0.0.1:5500/client2/html/index.html', console.log.bind(console))
    </script>
</body>

</html>
```
```html 页面B
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>test2</title>
</head>

<body>
    <h2>test2页面</h2>
    <script>
        var person = {
            name: 'wayne zhu',
            age: 22,
            school: 'xjtu'
        }
        window.name = JSON.stringify(person)
    </script>
</body>

</html>
```
这个方式之所以成功，是因为iframe中`window.name`属性在设置之后，即使修改了iframe的地址，让它显示其它文档，依然不会改变原先`window.name`的值，这说明`window.name`这个属性是跟浏览器窗口有关的一个属性，即使这个窗口内的网页发生更新和替换，不会影响到这个属性值，除非脚本主动去设置它。 上面的代码中为什么在iframe第一次load成功后，要再把它的src更改为`about:blank`呢，这是因为`window.name`是一个不允许跨源访问的属性，只有同源才可以访问，而`about:blank`会与源文档继承相同的源。

总体来看，这个方式利用的window.name能存储很多数据，而且隐藏了数据细节，但也不是一个好的方式：
1. `window.name`明明是不允许跨源访问的api，却被用来做跨源的事情
2. 上述方式仅仅能完成跨源的数据访问，但是不能实现两个页面之间进行双向通信，iframe是无法获取到`parent.name`的

第三种方式，是利用web标准的api`postMessage`来完成两个页面之间的通信，这是最正确的方式，所以也是最推荐使用的。它的使用其实很简单，参考MDN文档即可：https://developer.mozilla.org/zh-CN/docs/Web/API/Window/postMessage

### 浏览器端存储资源的限制
浏览器端的存储资源主要包括：`cookies` 、 `Web Storage`和`Indexed DB`。`Web Storage`和`Indexed DB`按照严格的同源方式分开存储，所以跨源页面无法获取对方的`Web Storage`和`Indexed DB`。

`cookies`使用不同的源定义方式，它的源仅跟`cookie`的`domain`即`域`有关。一个页面可以为当前域或者父域设置`cookie`，只要父域不是公共后缀即可。公共后缀是指`.com` 、`.cn`、`.org`等。 不管使用哪个协议（`HTTP/HTTPS`）或端口号，浏览器都允许给定的域以及其任何子域名(`sub-domains`) 访问`cookie`。比如一个`cookie`如果它的域设置为了`.a.com`，那么`a.com`以及所有`*.a.com`下的页面，就都可以访问到这个`cookie`。

## 源的更改
在满足某些限制条件的情况下，页面可以通过`document.domain`修改它的源，但是只能把源修改为当前域或者它的父域，否则就会报错：
<img src="{% asset_path "02.png" %}" width="600" style="border: none">

父域与子域页面通过设置相同的`document.domain`之后，这样的两个跨源页面可以突破上面介绍的DOM交互限制。

示例一：
```html  http://liuyunzhuge.com:5500/client/html/demo1.html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title></title>
</head>

<body>
    <iframe id="childFrame" name="child" frameborder="0"></iframe>
    <script type="text/javascript">
        document.domain = 'liuyunzhuge.com'
        let childFrame = document.querySelector('#childFrame')
        
        childFrame.onload = function() {
            let c = document.createElement('div')
            c.innerText = child.callback()
            document.body.appendChild(c)
        }

        childFrame.src = 'http://a.liuyunzhuge.com:5500/client2/html/index.html'

        function getContent() {
            return 'content from parent'
        }
    </script>
</body>

</html>
```
```html http://a.liuyunzhuge.com:5500/client2/html/index.html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <title></title>
</head>

<body>
  <script type="text/javascript">
    document.domain = 'liuyunzhuge.com'
    document.write(parent.getContent())

    function callback() {
      return 'content from child'
    }
  </script>
</body>

</html>
```
这个示例原本是受跨域限制的，但是`document.domain`让它们突破了跨源的限制，现在可以互相直接访问了。

示例二：
```html http://liuyunzhuge.com:5500/client/html/demo2.html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title></title>
</head>

<body>
    <button type="button" onclick="openNewWin()">打开新页面</button>
    <script type="text/javascript">
        document.domain = 'liuyunzhuge.com'

        function getContent() {
            return 'content from opener'
        }

        function setContentFromNewWin(content) {
            let c = document.createElement('div')
                c.innerText = content
                document.body.appendChild(c)
        }

        function openNewWin() {
            window.open('http://a.liuyunzhuge.com:5500/client2/html/02.html', '_blank')
        }
    </script>
</body>

</html>
```
```html http://a.liuyunzhuge.com:5500/client2/html/02.html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <title></title>
</head>

<body>
  <script type="text/javascript">
    document.domain = 'liuyunzhuge.com'
    document.write(window.opener.getContent())

    window.opener.setContentFromNewWin('content from new window')
  </script>
</body>

</html>
```
上面这个示例也是，通过`document.domain`让新打开的`window`与它的`opener`之间可以类似同源交互了。

`cookie`只依据自己的`domain`进行共享，跟`document.cookie`的设置关系不大，网上好多东西都是说`document.domain`设置后，就可以共享`cookie`，这是不对的。

`web storage`与`indexed db`虽然无法在设置了相同`document.domain`的父子域页面中共享，但是既然这样的两个页面已经互相访问dom了，那自然就可以借助相关的`window`对象来访问各自的`web storage`与`indexed db`。