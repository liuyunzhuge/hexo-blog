---
title: wxjssdk-copy及spa-wxjssdk-util
tags:
  - wxjssdk
categories:
  - Javascript
  - wxjssdk
date: 2020-02-08 10:58:02
---


从官方wxjssdk的源码中复制了一份：[wxjssdk-copy](https://github.com/liuyunzhuge/wxjssdk-copy)，并做了一小点改动，以保证`wx.config`能有一个始终是异步的回调方式：`wx.complete`(这是非官方的)。

基于[wxjssdk-copy](https://github.com/liuyunzhuge/wxjssdk-copy)，开发出了[spa-wxjssdk-util](https://github.com/liuyunzhuge/spa-wxjssdk-util)，这是一个用于单页应用中，改善`wxjssdk`使用的工具。
