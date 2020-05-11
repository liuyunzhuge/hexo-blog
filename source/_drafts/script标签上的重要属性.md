---
title: script标签上的重要属性
tags:
  - script
categories:
  - javascript
---

`<script>`元素作用越来越丰富了，所以有必要总结下它的一些重要属性。

<!-- more -->

* async 该属性将尝试开启对脚本的异步加载，当页面渲染时遇到`<script src="..." async>`的脚本，将不会被阻塞，脚本将被异步加载，等到脚本加载完时才执行，那个时候会阻塞页面渲染。正是因为这种机制，如果页面内有多个开启`async`的脚本，则无法保证它们会按顺序进行执行，因为它们的加载完成时间是没有顺序的。该属性对内联的（没有`src`）脚本无效。

* crossorigin 该属性属于`CORS`相关的属性。如果一个脚本是跨域的，但是没有设置`crossorigin`，当通过`window.onerror`处理器收集到这个跨域脚本内抛出的错误时，只能收到非常简短的错误信息，而不是完整的错误源，导致对于错误的上报这种服务无法得到很好的处理。 通过设置`crossorigin`属性，可以让`window.onerror`捕获到的跨域脚本错误更加完整。
    ```html
    <script src="..." crossorigin="anonymous"></script>
    ```

* defer 该属性也可以开启对脚本的异步加载执行，与`async`属性不同的是，此属性标记的脚本，将在页面完成解析后、触发`DOMContentLoaded `事件前执行，而不是异步加载完就执行，如果页面内有多个`defer`标记的脚本，则会按照在文档中出现的顺序依次执行。该属性对内联的（没有`src`）脚本无效。

* integrity 这个属性用于设置`SRI`验证的哈希值。
 
* nomodule 这个属性用于标识脚本，在支持ES modules的浏览器中不执行，换言之，这个脚本只在不支持ES modules的浏览器中才会执行。 `vue-cli4`的`modern`构建模式，就是依赖这个属性。

* nonce 这个属性配合`CSP`来完成`script`相关的安全策略。

* referrerpolicy 这个属性用来指定加载脚本、或者脚本执行过程中加载其它资源时，发送`refer`头的策略。

* src 这个属性指定脚本地址，如果不设置，就说明`script`是内联的。

* type 该属性指定脚本的语言。属性的值为MIME类型; 支持的MIME类型包括text/javascript, text/ecmascript, application/javascript, 和application/ecmascript。如果MIME类型不是JavaScript类型（上述支持的类型），则该元素所包含的内容会被当作数据块而不会被浏览器执行。以前在html中写模板，就可能使用`script`来充当模板：
    ```html
    <script id="addTpl" type="text/html">
        <div>...</div>
    </script>
    ```
    如果type属性为module，代码会被当作ES模块。

> https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element/script