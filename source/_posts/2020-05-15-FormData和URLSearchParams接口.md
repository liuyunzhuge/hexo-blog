---
title: FormData和URLSearchParams接口
tags:
  - FormData
  - URLSearchParams
categories:
  - Javascript
  - WebApi
date: 2020-05-15 22:56:50
---


学习`FormData和URLSearchParams接口`。

<!-- more -->
## FormData
在使用`form`提交表单的场景中，浏览器自动把文本域、文件域的数据收集起来，并按照`enctype`指定的方式，把数据写入到`http`请求体里面传递至后台。`FormData`这个接口，让开发者可以在不借助`form`元素的前提下，做类似的表单提交的请求，比如在`ajax`里面。 这个接口极大地简化了`ajax`请求数据构造的过程。

举例：
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title></title>
</head>

<body>
    <input type="file" id="file">
    <script>
        var fileElem = document.querySelector('#file')
        fileElem.onchange = function () {
            var formData = new FormData();

            // 添加普通数据
            formData.append("username", "Groucho");
            formData.append("accountnum", 123456);

            // 添加文件到formData
            formData.append("userfile", fileElem.files[0], "file");

            // 添加其它二进制数据
            var content = '<a id="a"><b id="b">hey!</b></a>'; // the body of the new file...
            var blob = new Blob([content], { type: "text/xml" });

            formData.append("webmasterfile", blob, "ttest");

            var request = new XMLHttpRequest();
            request.open("POST", "http://liuyunzhuge.com:3000/post");
            request.send(formData);
        }
    </script>
</body>
</html>
```
<img src="{% asset_path "01.jpg" %}" width="600" style="border: none">

如图所示，使用`FormData`发出的请求，数据格式与使用了`enctype="multipart/form-data"`的`form`提交是一模一样的。`FormData`比`form`提交不仅要简洁，同时还能随便添加二进制数据，以类似文件上传的方式，加入请求，但是不需要借助`input`文件域。 这实际上等于说给了`ajax`一种更大传输二进制数据的空间。

除了直接构造`FormData`，还可以将`FormData`与`form`元素结合使用。`FormData`的构造函数支持传入一个`form`元素，它会使用`form`元素，自动收集其中的表单域，完成构造，然后用于`ajax`。
```html
<html>
<head>
    <title>New Post</title>
</head>
<body>
    <form enctype="multipart/form-data" method="post" name="fileinfo">
        <label>Your email address:</label>
        <input type="email" autocomplete="on" autofocus name="userid" placeholder="email" required size="32"
            maxlength="64" /><br />
        <label>Custom file label:</label>
        <input type="text" name="filelabel" size="12" maxlength="32" /><br />
        <label>File to stash:</label>
        <input type="file" name="file" required />
        <input type="submit" value="Stash the file!" />
    </form>
    <script>
        var form = document.forms.namedItem("fileinfo");
        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var formData = new FormData(form);

            formData.append("CustomField", "This is some extra data");

            var req = new XMLHttpRequest();
            req.open("POST", "http://liuyunzhuge.com:3000/post", true);
            req.send(formData);
        }, false);
    </script>
</body>
</html>
```
<img src="{% asset_path "02.png" %}" width="600" style="border: none">

## URLSearchParams
`URLSearchParams`这个接口其实属于`URL`接口的一部分，但是它也可以单独使用，就像`FormData`一样，可以用来构造`ajax`所需要的数据。

```html
<html>
<head>
    <title>New Post</title>
</head>
<body>
    <input type="file" id="file">
    <script>
    var data = new URLSearchParams();

    data.append("username", "Groucho");
    data.append("accountnum", 123456);

    var request = new XMLHttpRequest();
    request.open("post", "http://liuyunzhuge.com:3000/post");
    request.send(data);
    </script>
</body>
</html>
```
<img src="{% asset_path "03.png" %}" width="600" style="border: none">

这个跟`form`元素使用`post`方法并且`enctype="application/x-www-form-urlencoded"`的提交效果一致的。不过`URLSearchParams`不能与`get`方法使用。

完整用法：
> https://developer.mozilla.org/zh-CN/docs/Web/API/FormData
> https://developer.mozilla.org/zh-CN/docs/Web/API/URLSearchParams