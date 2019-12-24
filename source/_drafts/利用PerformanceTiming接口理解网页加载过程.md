---
title: 利用PerformanceTiming接口理解网页加载过程
tags:
---

`PerformanceTiming`接口包含了当前页面加载渲染的时间信息。 通过它可以看到页面被载入的各个关键环节的耗时情况。要拿到这样一个接口的数据，非常简单:
```js
let performance = window.performance.timing; // PerformanceTiming接口的实例
```

`PerformanceTiming`包含了以下数据属性：
```
PerformanceTiming
    navigationStart: 1577102909439
    unloadEventStart: 1577102909463
    unloadEventEnd: 1577102909463
    redirectStart: 0
    redirectEnd: 0
    fetchStart: 1577102909443
    domainLookupStart: 1577102909443
    domainLookupEnd: 1577102909443
    connectStart: 1577102909443
    connectEnd: 1577102909443
    secureConnectionStart: 0
    requestStart: 1577102909443
    responseStart: 1577102909443
    responseEnd: 1577102909447
    domLoading: 1577102909485
    domInteractive: 1577102909611
    domContentLoadedEventStart: 1577102909615
    domContentLoadedEventEnd: 1577102909622
    domComplete: 1577102909650
    loadEventStart: 1577102909650
    loadEventEnd: 1577102909650
```

各个数据属性的含义分别为：
* navigationStart

* unloadEventStart

* unloadEventEnd

* redirectStart

* redirectEnd

* fetchStart

* domainLookupStart

* domainLookupEnd

* connectStart

* connectEnd

* secureConnectionStart

* requestStart

* responseStart

* responseEnd

* domLoading

* domInteractive

* domContentLoadedEventStart

* domContentLoadedEventEnd

* domComplete

* loadEventStart

* loadEventEnd
