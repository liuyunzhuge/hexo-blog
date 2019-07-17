---
title: Vue指南的要点笔记（十）
tags:
  - Vue指南要点笔记
  - Vue
categories:
  - Javascript
  - Vue
  - 指南要点
---


本篇开始学习Vue的过渡系统。大部分内容都比较简单，所以只记录在学习和使用过程中遇到过问题的内容。要点包括：
1. 过渡中的钩子方法
2. 初始渲染的过渡

<!-- more -->

## 过渡中的钩子方法
vue进入和离开过渡一共有6个钩子方法，分别是：
* before-enter
* enter
* after-enter
* enter-canceled: 当进入过渡完成前，触发离开过渡，此回调会被触发
* before-leave
* leave
* after-leave
* leave-canceled: 此回调仅在`v-show`的情形中才有

这6个钩子方法在仅使用css transtion或css animation进入过渡的时候会自动触发回调，也可用于实现纯js动画方式的过渡。在仅使用css transtion或css animation的时候，`enter`与`leave`这两个钩子方法，不要定义第二个`done`参数，否则过渡会异常，这个`done`参数一定是在纯js的过渡中才能使用的。 
```js
    let vue = new Vue({
        data: {
            'demo1': false
        },
        el: '#vue',
        methods: {
            beforeEnter(el) {
                console.log('beforeEnter');
            },
            // 不能在使用css方式的过渡中定义enter钩子的第二个参数done
            // enter(el, done) {
            //     console.log('enter');
            // },
            enter(el) {
                console.log('enter');
            },
            afterEnter(el) {
                console.log('afterEnter');
            },
            enterCancelled(el) {
                console.log('enterCancelled');
            },
            beforeLeave(el){
                console.log('beforeLeave');
            },
            // 不能在使用css方式的过渡中定义leave钩子的第二个参数done
            // leave(el, done) {
            //     console.log('leave');
            // },
            leave(el){
                console.log('leave');
            },
            afterLeave(el){
                console.log('afterLeave');
            },
            leaveCancelled(el){
                console.log('leaveCancelled');
            }
        }
    });
```

`enter`与`leave`两个钩子函数，可以实现纯js的进入和离开过渡（[查看演示](/code/vue/transition/03.html)）：
```html
<div id="vue">
    <div>
        <button @click="demo1=!demo1">v-if</button>
        <div class="content-wrapper">
            <transition 
                    v-on:enter="enter"
                    v-on:after-enter="afterEnter"
                    v-on:leave="leave"
                    v-on:after-leave="afterLeave">
                <p v-show="demo1" >Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
                tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
                quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
                cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
                proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            </transition>
        </div>
    </div>
</div>
<script type="text/javascript">
    let vue = new Vue({
        data: {
            'demo1': false
        },
        el: '#vue',
        methods: {
            enter(el, done) {
                let startTime = Date.now();
                let duration = 1000;
                let _enter = ()=>{
                    let currentTime = Date.now();
                    let p = Math.min((currentTime - startTime) / duration, 1);
                    el.style.opacity = p;
                    if(p === 1) {
                        done();
                    }
                    p<1 && requestAnimationFrame(_enter);
                };

                requestAnimationFrame(_enter);
            },
            afterEnter(){
                console.log('afterEnter');
            },
            leave(el, done){
                let startTime = Date.now();
                let duration = 1000;
                let _leave = ()=>{
                    let currentTime = Date.now();
                    let p = Math.min((currentTime - startTime) / duration, 1);
                    el.style.opacity = 1 - p;
                    if(p === 1) {
                        done();
                    }
                    p<1 && requestAnimationFrame(_leave);
                };

                requestAnimationFrame(_leave);
            },
            afterLeave(){
                console.log('afterLeave');
            }
        }
    });
</script>
```
> 推荐对于仅使用 JavaScript 过渡的元素添加 v-bind:css="false"，Vue 会跳过 CSS 的检测。这也可以避免过渡过程中 CSS 的影响。

## 初始渲染的过渡
初始化渲染的过渡只需要启用`transition`组件的`appear`属性:
```html
<transition appear></transition>
```
`appear`会自动启用组件进入时的过渡状态。也可通过`appear-class``appear-active-class``appear-to-class`来自定义初始化时的过渡效果：
```html
<transition
  appear
  appear-class="custom-appear-class"
  appear-to-class="custom-appear-to-class" (2.1.8+)
  appear-active-class="custom-appear-active-class"
>
  <!-- ... -->
</transition>
```
也能自定义类似`enter`相关的钩子函数：
```html
<transition
  appear
  v-on:before-appear="customBeforeAppearHook"
  v-on:appear="customAppearHook"
  v-on:after-appear="customAfterAppearHook"
  v-on:appear-cancelled="customAppearCancelledHook"
>
  <!-- ... -->
</transition>
```
这四个钩子函数，使用方式与作用跟`before-enter enter after-enter enter-canceled`类似。 `enter`如果定义了第二个参数done，可用来实现纯js的初始化渲染，在纯css的过渡情形中，第二个参数done依然不可以定义。
```html
<div id="vue">
    <div>
        <button @click="demo1=!demo1">v-if</button>
        <div class="content-wrapper">
            <transition 
                    v-on:appear="appear"
                    v-on:after-appear="afterAppear">
                <p v-if="demo1">Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
                tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
                quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
                cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
                proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
            </transition>
        </div>
    </div>
</div>
<script type="text/javascript">
    let vue = new Vue({
        data: {
            'demo1': true
        },
        el: '#vue',
        methods: {
            appear(el, done) {
                let startTime = Date.now();
                let duration = 1000;
                let _appear = ()=>{
                    let currentTime = Date.now();
                    let p = Math.min((currentTime - startTime) / duration, 1);
                    el.style.opacity = p;
                    if(p === 1) {
                        done();
                    }
                    p<1 && requestAnimationFrame(_appear);
                };

                requestAnimationFrame(_appear);
            },
            afterAppear(){
                console.log('afterAppear');
            }
        }
    });
</script>
```
[查看上例](/code/vue/transition/04.html)。注意上例中，因为使用纯js的初始化过渡，用到了`appear`这个钩子函数，这个函数跟`appear`特性一样，只要有一个设置了，就表示要启用组件的初始化渲染过渡，所以上例中没有定义`appear`属性，也能有初始化的过渡效果。

## 多个元素的过渡
`transition`标签支持多个元素的过渡，但是要保证`transition`标签内的元素在显示上的互斥：要么只有一个元素是显示的(v-show)，要么只有一个元素是渲染的（v-if）。而且，如果有互斥的相同标签的元素，需要各自指定一个key，防止vue对元素或组件的重用。

`key`属性，在一些场景中也能触发vue的过渡系统：
```html
<style type="text/css">
    .fade-enter-active,.fade-leave-active {
        transition: all 1s;
    }
    .fade-enter,.fade-leave-to {
        opacity: 0;
    }
</style>
<div id="vue">
    <div>
        <label><input type="radio" v-model="docState" value="saved"> saved</label>
        <label><input type="radio" v-model="docState" value="edited"> edited</label>
        <label><input type="radio" v-model="docState" value="editing"> editing</label>
    </div>
    <transition name="fade" mode="out-in">
        <button v-bind:key="docState">
            {{ buttonMessage }}
        </button>
    </transition>
</div>
<script type="text/javascript">
    let vue = new Vue({
        data: {
            'docState': 'saved'
        },
        computed: {
            buttonMessage: function () {
                switch (this.docState) {
                    case 'saved': return 'Edit'
                    case 'edited': return 'Save'
                    case 'editing': return 'Cancel'
                }
            }
        },
        el: '#vue'
    });
</script>
```
[查看演示](/code/vue/transition/05.html)

## 过渡模式
vue的过渡系统默认情况下，进入和离开过渡同时发生，但是也可以更改，在`transition`标签上通过`mode`属性来指定：
* in-out 进入的过渡先发生完，然后再开始离开的过渡
* out-in 离开的过渡先发生完，然后再开始进入的过渡

[这个例子](/code/vue/transition/05.html)中就使用到了`out-in`这个mode。

