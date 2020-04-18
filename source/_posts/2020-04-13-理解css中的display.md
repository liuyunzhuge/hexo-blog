---
title: 理解css中的display
tags:
  - w3c规范
categories:
  - CSS
  - w3c规范
date: 2020-04-13 17:46:42
---


提炼`css-display`这个`module`中的一些要点。

<!-- more -->

## css box tree

`css`把一个包含`elements`和`text nodes`的`document tree`渲染到`canvas`上。
`css`生成了一个中间结构：`box tree`，表示`document tree`的格式化渲染结构。
`box tree`上的每个`box`与相应的`element or pseudo element`对应，`box tree`上的每个`text run`与`text nodes`的`content`对应。

对每个`element`而言，`css`会根据它的`display`属性值为它自身创建0到多个`box`。 一个`element`至少会有一个`box`，称为`principal box`，表示`element`自己以及它在`box tree`中包含的内容。 有一些`display`值会生成多个`box`。比如`list-item`这个值，会生成一个`principal block box`和一个`marker box`。有一些值比如`none or contents`不会生成任何`box`。`box`可以用`display`的类型来指代，比如一个`display:block`的`element`可以被称为一个`block box`或者`block`。

除非另有说明，`box`会被设定与它对应的`element`相同的样式。`inherited properties`（可继承的属性）被设定到`element`的`principal box`上，然后通过`box tree`的层级关系继承给该`element`生成的后代`box`。`non-inherited properties`（不可继承属性）默认情况下也是应用到`principal box`上，但是如果一个`element`自身要生成多个box，就可能把`non-inherited properties`应用到其它`box`，而不是`principal box`。比如`table`元素的`border`属性，是一个`non-inherited property`，它是应用到`table grid box`上的，不是`table wrapper box`。补充：`table`的`princial box`又称为`table wrapper box`。

`document tree`中连续的`text nodes`，`css`会为它们生成一个`text run`的东西，来包含这些文本内容，每个`text run`会被设定成与它们对应的`text nodes`相同的样式。

在创建`box tree`的过程中，某一个`element`生成的`boxes`（应该指所有）都是这个元素所有祖先`elements`的`principal box`的后代。通常来说，一个元素的`principal box`的`direct parent box`就是这个元素祖先元素中，离它最近并且有生成`box`的那个祖先元素的`principal box`；但是有例外，比如下面的`anonymous box`的情况。补充理解：`direct parent box`的含义，也可以理解为一个元素的`principal box`的`direct parent box`，大部分情况应该就是它父级元素的`principal box`。

`anonymous box`就是与任何`element`都没有关系的`box`。`anonymous box`都是在特定情况下才会生成用来修复`box tree`结构；这个特殊情况是指`box tree`需要一个特别的`box`嵌套结构，但是这个嵌套结构没有被`element tree`提供。 比如，一个`table cell box`要求它的`parent box`必须是一个`tabel row box`，所以如果一个`display:table-cell`的`element`父级，并不是一个`display: table-row`的`element`时，那此时`element tree`就没有满足`table row box -> table cell box`这种嵌套结构，`css`会自动在`table cell box`的外层生成一个`table row box`来作为它的`parent box`。

在布局过程中，`box`和`text run`可能会被分割为多个`fragments`。比如，当一个`inline box`或者是`text run`因为换行，就会被分割为多个`fragments`；一个`block box`也会因为`page`（分页）和`columns`（分栏），被分割为多个`fragments`；这个分割过程叫做`fragmentation`。因此一个`box`可能会存在0到多个`box fragments`，一个`text run`可能存在0到多个`text fragments`。

## display property
`display`定义了`element`的`display type`，包含两个方面：
* `inner display type` 决定它自己生成一个什么类型的`formatting context`，控制由它生成的`descendant boxes`如何布局；
* `outer display type` 决定`element`自己的`principal box`如何参与`flow layout`。

注意此要点的描述：`outer display type`决定的是自己如何参与`flow layout`，而`css`中并不只有一种`layout`，除了`flow layout`，还有`flex layout`、`table layout`等，那么当一个元素位于一个`flow layout`当中，`outer display type`才有意义，否则没有意义。比如当元素位于`flex layout`或`table layout`当中，`outer display type`就没有意义。

### value
`display`的`value`定义：
```
	[ <display-outside> || <display-inside> ] | <display-listitem> | <display-internal> | <display-box> | <display-legacy>
```
各个`value component`的定义：
```
<display-outside>  = block | inline | run-in
<display-inside>   = flow | flow-root | table | flex | grid | ruby
<display-listitem> = <display-outside>? && [ flow | flow-root ]? && list-item
<display-internal> = table-row-group | table-header-group |
                     table-footer-group | table-row | table-cell |
                     table-column-group | table-column | table-caption |
                     ruby-base | ruby-text | ruby-base-container |
                     ruby-text-container
<display-box>      = contents | none
<display-legacy>   = inline-block | inline-table | inline-flex | inline-grid
```
根据以上语法说明，以下的`value`形式都是允许的：
```
display: <display-outside>;
display: <display-inside>;
display: <display-outside> <display-inside>;
display: <display-inside> <display-outside>;
display: <display-listitem>;
display: <display-internal>;
display: <display-box>;
display: <display-legacy>;
```
特殊的`display-listitem`还会出现下面这种奇怪的`display`值写法：
```css
display: block flow list-item;
display: list-item;
display: block list-item;
```
以上`value type`涉及到的`<> || | []`以及下面的`&& ?`等符号的语法，是`css`在规范文档中用来描述`Value Definition`的一种语法，可前往[css-values](https://www.w3.org/TR/css-values-4/#value-defs)这个文档学习。

综合以上内容可以看到，`display`的值是支持单值、双值和三值写法的：
```css
display: block flow;
display: block flow list-item;
display: inline-block;
```
不过目前这个写法还没有得到支持，但是可以从这个角度去理解`display`，因为多值的写法能够清晰地看到`inner display type`和`outer display type`，大部分单值写法只是多值写法的简写形式。

### display-outside
`<display-outside>`这个`value type`，决定了`display`的`outer display type`，它包含3个值：
```
<display-outside>  = block | inline | run-in
```
其中`run-in`并没有完全支持，所以暂不讨论。另外两个含义如下：
* `block` 表示当元素处于`flow-layout`当中时，生成的`box`是`block-level`的
* `inline` 表示当元素处于`flow-layout`当中时，生成的`box`是`inline-level`的

要分析一个`display`值的`outer display type`只要找到`display`值里面跟`<display-outside>`对应的部分即可。当讨论一个`box`是`block-level`还是`inline-level`，说的是`box`的`outer display type`。

### display-inside
`<display-inside>`这个`value type`，决定了`display`的`inner display type`，包含以下几个值
```
<display-inside>   = flow | flow-root | table | flex | grid | ruby
```
其中`ruby`并没有完全支持，所以暂不讨论。其它值的含义如下：
* `flow` 表示该元素的包含的内容，会使用`flow layout`进行布局，`flow layout`就是`block-and-inline layout`，它包含两种`formatting context`: `block formatting context`和`inline formatting context`。在`display-insde: flow`的前提下，当`outer display type`是`inline`时，生成的`box`是一个`inline box`；当`outer display type`是`block`，生成的`box`是一个`block-level`的`box`，称为`block container`。 `block-container`与`block box`不完全相同，`block box`是突出一个`box`是`block-level`的，而`block-container`是突出一个`box`的能力，见下面对`block container`的解释。当一个`box`是`inline box`的时候，它始终带着自己和自己包含的内容参与到一个`inline formatting context`当中一起布局；当一个`box`是一个`block container`的时候，它要么会新建一个`BFC`来布局子内容，要么把子内容放到自己所在的那个`block formatting context`中一起布局。
* `flow-root` 这个跟`flow`唯一的区别就是，它一定会让`box`新建一个`BFC`。那种新建了`BFC`的`block container`都可以当成`inner display type`为`flow root`来看待。
* `table` 表示元素会生成一个`principal box`，也叫做`table wrapper box`，并且新建一个`block formatting context`，在此`context`内再生成一个`table grid box`，并且使用一个新的布局`context`:`table formatting context`来布局内容，这就是所谓的`table layout`。`table wrapper box`应该是一个`block container`，因为它会创建`BFC`。
* `flex` 表示元素会生成一个`flex container box`，并创建一个新的布局`context`:`flex formatting context`，使用`flex layout`来布局内容。这个`flex container`跟`block container`是完全不同的，`flex container`指的是这个`box`是1个`flex formatting context`的根。
* `grid` 表示元素会生成一个`grid container box`，并创建一个新的布局`context`:`grid formatting context`，使用`grid layout`来布局内容。这个`grid container`跟`block container`是完全不同的，`grid container`指的是这个`box`是1个`grid formatting context`的根。

#### block container
`block container box`要么只包含`inline box`，要么只包含`block box`。怎么做到这一点呢？需要一个`box`只包含`inline-box`比较容易，但是要它只包含`block-box`如何做到？实际上还是借助`anonymous box`，比如下面这个结构：
```html
<div>
asd
<p>abc</p>
</div>
```
div内混合了文本和`p`节点，`css`会在`asd`外面包裹一个`anonymous block box`来保证`div`这个`block container`仅包含`block box`。

当一个`block container`只包含`inline box`的时候，它会创建一个`inline formatting context`，并且会在所有的`inline box`外面包裹一层`anonymous box`来作为这些`inline content`的`root inline box`。

`block container`在它的`parent formatting context`不是一个`block formatting context`的时候，会创建一个新的`block formatting context`来布局它的内容。这个点值得关注，下面这个例子能证明这个点是对的：
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style type="text/css">
    .parent {
        width: 400px;
        background-color: #ddd;
        margin: 0 auto;
    }

    .child {
        width: 100px;
        height: 100px;
        background-color: red;
        float: left;
    }

    .main {
        display: flex;
    }
    </style>
</head>
<body>
    <div class="main">
        <div class="parent">
            <div class="child"></div>
        </div>
    </div>
</body>
</html>
```
例子中，`div.main`是一个`flex formatting context`，而`div.parent`是一个`block container`，所以`div.parent`会创建一个`BFC`，这样`div.child`浮动带来的高度塌陷问题就没有了。

如果`block container`的`parent formatting context`是一个`BFC`，那么`block container`就是按两种方式来布局它包含的内容：第一种，还是新建一个`BFC`，比如`overflow float position`这些属性可能会导致新的`BFC`被创建；第二种，就是将它的内容放到`parent formatting context`中去布局。第二种方式，有一个场景值得说明：
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style type="text/css">
    .parent {
        width: 400px;
        background-color: #ddd;
        margin: 0 auto;
    }

    .child {
        width: 100px;
        height: 100px;
        background-color: red;
        float: left;
    }
    </style>
</head>
<body>
    <div class="parent">
        <div>yes</div>
        <div>yes</div>
        <div>yes</div>
        <div>yes</div>
        <div>yes</div>
        <div class="child"></div>
    </div>
    <p>surrounds</p>
</body>
</html>
```
上例中，为什么与`div.parent`同级的`p`元素会环绕在`div.child`这个浮动元素的右边呢？这是因为上面的例子中`div.parent`并没有创建新的`BFC`，所以它的内容都是在`body`的`formatting context`中布局出来的，而`div.child`虽然设置了浮动，但是浮动只能让它从文档流脱离出来，它仍然属于`body`的`block formatting context`，而`div.parent`后面的`p`也是在`body`的`context`中布局的，这样`p`里面的文本所形成的`inline formatting context`与浮动元素的作用关系，导致了这个结果。浮动本质上不会脱离元素所在的`block formatting context`。如果想让`p`与`div.child`不产生浮动环绕的作用，解决办法就是把`div.parent`变为`BFC`，这样`div.child`与`p`不在同一个`block formatting context`，它们是不会产生浮动环绕作用的。

`block container`可以同时有两种`formatting context`，比如它仅包含`inline box`，这样它会创建`inline formatting context`，然后再通过别的方式触发新建`BFC`，这样就两种`formatting context`共存了。

`block container`vs`block box`：
* `block box`是指`block-level box`，它参与`flow layout`时一定是`block-level`的，它不一定是`block container`，比如`display: block`的`replace elements`所生成的`box`以及`display: flex`的元素生成的`flex container`都是`block box`，但不是`block container`
* `block container`也不一定都是`block box`，比如`display: inline-block`和`display: table-cell`的元素生成`box`会创建BFC，属于`block container`，但不是`block-level box`

### 缺省说明
如果`display`值，指定了`<display-outside>`但是没有指定`<display-inside>`，`<display-inside>`的默认值就是：`flow`。
如果`display`值，指定了`<display-inside>`但是没有指定`<display-outside>`，`<display-outside>`的默认值就是：`block`。

### display-listitem
这个`value type`的定义是：
```
<display-listitem> = <display-outside>? && [ flow | flow-root ]? && list-item
```
其中`<display-outside>`和`[flow | flow-root]`是可选的，`list-item`这个关键词是必须有的。`<display-listitem>`把`inner display type`限制为`flow | flow-root`，暂时没有其它的`inner display type`。如果未指定`outer display type`，则`outer display type`默认值是：`block`，所以`li`元素默认都是`block-level`的；如果未指定`inner display type`，则`inner display type`默认值是：`flow`。 所以`<display-listitem`>可定义的`display`值的形式有：
```css
/* a. */
display: list-item;

/*以下3个与a.均等价*/
display: block flow list-item;
display: flow list-item;
display: block list-item;

/*以下两个等价*/
display: inline list-item;
display: inline flow list-item;

/*以下两个等价*/
display: flow-root list-item;
display: block flow-root list-item;
```
从上面的举例也能看到，`display: list-item`这种单值写法是多值写法的简写形式。

`display-listitem`相比`<display-outside> || <display-inside>`，最大的区别其实是它会让`element`多生成一个`marker box`来表现`项目列表`的符号，这就是为啥`li`元素默认情况下，前面会有项目符号的原因。

### display-legacy
这个`value type`定义为：
```
<display-legacy> = inline-block | inline-table | inline-flex | inline-grid
```
这几个关键词就是几个简写形式：
* `inline-block` 等价于`inline flow-root`，所以`display:inline-block`的元素其实是个`BFC`
* `inline-table` 等价于`inline table`
* `inline-flex` 等价于`inline flex`
* `inlin-grid` 等价于`inline grid`

### display-internal
这个`value type`的定义：
```
<display-internal> = table-row-group | table-header-group |
                     table-footer-group | table-row | table-cell |
                     table-column-group | table-column | table-caption |
                     ruby-base | ruby-text | ruby-base-container |
                     ruby-text-container
```
一些布局（例如`table` `ruby`）具有复杂的内部结构，其子代和后代可以担当几种不同的角色，`display-internal`实际上就是在指定元素在`table` `ruby`这种特定布局里面充当的角色，所以`display-internal`跟其它的`display`的`value type`不一样，它只有在特定的布局里面才有意义。而且非常特殊的是，`display-internal`的值，除非另有说明，否则使用这些值的元素生成的box的`inner display type`和`outer display type`都将设置为给定关键字。比如`display: table-row-group`，这个元素的`inner display type`和`outer display type`就都是`table-row-group`。 所以前面好多的关于`outer display type`和`inner display type`的知识，在`display-internal`不一致的，这是`css`针对`table` `ruby`布局的内部处理。

不考虑`ruby`，`display-internal`这个值的详细含义如下：
* `table-row-group, table-header-group, table-footer-group, table-row, table-cell, table-column-group, table-column` 表示这个元素是一个`table`布局的子元素，它会相应的创建`internal table box`来参与`table layout`。特殊的是，`table-cell`指定了`inner display type`为：`flow-root`，所以`display:table-cell`的元素会创建`BFC`。

* `table-caption` 表示这个元素会生成一个`table caption box`，它是一个`block box`，并且和`table and table wrapper boxes`有特殊的行为，同时它还有指定`inner display type`为：`flow-root`，所以`display:table-caption`的元素也会创建`BFC`。

### 归纳总结
综合以上内容，发现：学习`display`的值，主要抓这几个要素：
1. 分析它生成的`box`，1个还是多个，每个`box`的名称是啥
2. 分析它的`inner display type`，遵循什么`layout`，会不会新建`formatting context`
3. 分析它的`outer display type`，看看是`block-level`还是`inline-level`

下面是一个对常见`display`值的归纳整理：
* `display:block`
>完整写法：`display: block flow`
outer display type: `block`
inner display type: `flow`
box level: `block-level`
生成的box：一定是`block box` 不一定是`block container`，见前面对此二者的区分说明
formatting context: 要么新建一个`BFC`布局子内容，要么把子内容布局到自己所在的`BFC`。
* `display:flow-root`
>完整写法：`display: block flow-root`
outer display type: `block`
inner display type: `flow-root`
box level: `block-level`
生成的box：`block container`
formatting context: 新建一个`BFC`布局子内容
* `display:inline`
>完整写法：`display: inline flow`
outer display type: `inline`
inner display type: `flow`
box level: `inline-level`
生成的box：`inline box`
formatting context: 将子内容布局到自己所在的`inline formatting context`
* `display:inline-block`
>完整写法：`display: inline flow-root`
outer display type: `inline`
inner display type: `flow-root`
box level: `inline-level`
生成的box：`block container`
formatting context: 新建一个`BFC`布局子内容
* `display:list-item`
>各个要素与前面四个几乎一致，就是会多生成一个`marker box`
* `display:flex`
>完整写法：`display: block flex`
outer display type: `block`
inner display type: `flex`
box level: `block-level`
生成的box：`flex container`
formatting context: 新建一个`flex formatting context`布局子内容
* `display:inline-flex`
>完整写法：`display: inline flex`
outer display type: `inline`
inner display type: `flex`
box level: `inline-level`
生成的box：`flext container`
formatting context: 新建一个`flex formatting context`布局子内容
* `display:grid`
>完整写法：`display: block grid`
outer display type: `block`
inner display type: `grid`
box level: `block-level`
生成的box：`grid container`
formatting context: 新建一个`grid formatting context`布局子内容
* `display:inline-grid`
>完整写法：`display: inline grid`
outer display type: `inline`
inner display type: `grid`
box level: `inline-level`
生成的box：`flext container`
formatting context: 新建一个`grid formatting context`布局子内容
* `display:table`
>完整写法：`display: block table`
outer display type: `block`
inner display type: `table`
box level: `block-level`
生成的box：`table wrapper box`包含`table grid box`，其中`table wrapper box`是一个会新建`BFC`的`block-container`，且是`block-level`的
formatting context: `table wrapper box`新建`BFC`，而`table grid box`新建`table formatting context`
* `display:inline-table`
>完整写法：`display: inline table`
outer display type: `inlne`
inner display type: `table`
box level: `inline-level`
生成的box：`table wrapper box`包含`table grid box`，其中`table wrapper box`是一个会新建`BFC`的`block-container`，且是`inline-level`的
formatting context: `table wrapper box`新建`BFC`，而`table grid box`新建`table formatting context`

### display type的自动转换
`blockification`: 块级化，将`box`的`outer display type`强制设定为`block`
`inlinification`: 内联化，将`box`的`outer display type`强制设定为`inline`

一些布局可能会对元素的`box`进行`blockification`或者是`inlinification`的处理，比如`浮动 或绝对定位 或flex布局`都会对元素进行`blockification`。

## 引用
> [https://www.w3.org/TR/2019/CR-css-display-3-20190711/](https://www.w3.org/TR/2019/CR-css-display-3-20190711/)