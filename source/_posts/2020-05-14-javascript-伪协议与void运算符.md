---
title: 'javascript:伪协议与void运算符'
tags:
  - 语言基础
categories:
  - Javascript
date: 2020-05-14 11:44:47
---


巩固两个基础小知识：javascript:伪协议与void运算符。

<!-- more -->

## void运算符
> `void`运算符 对给定的表达式进行求值，然后返回`undefined`。

`void 0`与`void (0)`都是对`0`这个表达式求值，然后`void`表达式自身返回值是`undefined`。

利用`void`运算符可以把函数声明识别为函数表达式并执行：
```js
void function mod() {

}();
```
这就是`IIFE`立即调用的函数表达式的另外一种写法。

`void 0`也可以用来获取`undefined`这个值的原始值。假如你担心`undefined`被开发者莫名其妙的改写了的话，那么`void 0`依然能够返回`undefined`的原始值。
```js
var undefined = '1';
var b;
b === undefined;// false
b === void 0;// true
```

箭头函数标准中，允许在函数体不使用括号来直接返回值。 如果右侧调用了一个原本没有返回值的函数，其返回值改变后，则会导致非预期的副作用。安全起见，当函数返回值是一个不会被使用到的时候，应该使用`void`运算符，来确保返回`undefined`（如下方示例），这样当API改变时，并不会影响箭头函数的行为。
```js
button.onclick = () => void doSomething();
```

## `javascript:`伪协议
在html中，可以给超链接的href属性设置`javascript:`伪协议的内容，如：
```html
<a href="javascript:alert(1);">
```
`javascript:`伪协议的作用是执行`javascript:`后面的js语句，并在最后一条语句的返回值不是`undefined`的时候，把该值作为文档内容，在当前页面中替换或者新窗口中打开。 如果伪协议返回的是`undefined`，则链接不会发生跳转。

利用这个特性，可以在通过伪协议来打开新的空白文档：
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
上述代码，可以通过伪协议在新窗口中显示指定内容。

```html demo2.html
<!doctype html>
<html>
<head>
    <meta charset="UTF-8">
    <title>javascript:伪协议测试</title>
    <script>
        var foo = 'foo'
        function replace() {
            return `<a href="javascript:alert(window.foo);">get foo</a>`
        }
    </script>
</head>
<body>
    <a href="javascript: replace();">测试</a>
</body>
</html>
```
上述代码，可以通过伪协议来替换当前文档的内容，并且在替换之后，通过点击`get foo`链接，还能看到新文档的`window`对象已经发生变化，无法再访问到原来文档中的`foo`变量。

`javascript:;`vs`javascript: void(0)`
二者区别不大。`javascript:;`更简洁，`javascript: void(0)`更有代码含义。