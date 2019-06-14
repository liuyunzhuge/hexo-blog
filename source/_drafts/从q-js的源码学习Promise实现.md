---
title: 从q.js的源码学习Promise实现（一）
tags:
- Promise相关
- 源码学习
categories:
- Javascript
---

前端时间再次彻底地学习了ES6 Promise的规范，然后也从实现方面对Promise的模式有了很清晰地认识，既有简单的实现思路：《{% post_link "从别人博客学到的基本的Promise实现思路" 从别人博客学到的基本的Promise实现思路 %}》，也有较复杂一点的github库实现：《{% post_link "从then-js的源码掌握Promise的思想" "从then.js的源码掌握Promise实现的思路" %}》，还有从经典的js库zepto中学习到的类似Promise的deferred对象的实现方式：《{% post_link "从源码了解zepto中defer延迟对象的实现" 从源码了解zepto中defer延迟对象的实现 %}，至此，Promise这块内容算是积累地不错了。 唯一觉得不太够的是，前面学习的内容都相对比较简单，而github上对于promise的实现有很多的开源库，所以我想再重新找个关注数多一点的，代码多一点的库，再来学习看看有啥不一样的地方。这次选的是q.js，源码：[q](https://github.com/kriskowal/q)。 它加上注释，有将近2000行的代码，估计学习起来会比之前东西稍微麻烦一些。


本篇主要先从它的用法开始学习。
<!-- more -->