---
title: Vue指南的要点笔记（八）
tags:
  - Vue指南要点笔记
  - Vue
categories:
  - Javascript
  - Vue
  - 指南要点
---

本篇记录动态组件和异步组件的要点。 包括：
1. component标签的使用
2. keep-alive标签的使用
3. 异步组件的定义和使用
4. 异步组件的加载过程控制


<!-- more -->

## component标签的使用
component是一个虚拟标签，用来支持动态组件，在一些场景中，同一个数据可能有不同的展现形式，这个时候就很适合用动态组件来处理。它可以利用`is`这个prop，绑定需要真实渲染的组件id：
```html
<div id="vue">
    <component v-bind:is="component"></component>
</div>

<script type="text/javascript">
    Vue.component('card-a', {
        data(){
            return {}
        },
        template: `<div>1</div>`
    });
    Vue.component('card-b', {
        data(){
            return {}
        },
        template: `<div>2</div>`
    });

    let vue = new Vue({
        data: {
            component: 'card-a'
        },
        el: '#vue'
    });
</script>
```
`is`prop绑定的值，可以是像上面例子中展示的某个全局或局部注册的组件名称，也可以是一个可以表示组件定义的`javascript options`对象，比如这样：
```html
<div id="vue">
    <component v-bind:is="component"></component>
</div>

<script type="text/javascript">
    let vue = new Vue({
        data: {
            component: {
                data(){
                    return {}
                },
                template: `<div>1</div>`
            }
        },
        el: '#vue'
    });
</script>
```
还可以是某个组件的构造函数：
```html
<div id="vue">
    <component v-bind:is="component"></component>
</div>

<script type="text/javascript">
    let CardA = Vue.component('card-a', {
        data(){
            return {}
        },
        template: `<div>1</div>`
    });

    console.log(CardA === Vue.component('card-a'));//true

    let vue = new Vue({
        data: {
            component: CardA
        },
        el: '#vue'
    });
</script>
```
或者是：
```html
<div id="vue">
    <component v-bind:is="component"></component>
</div>

<script type="text/javascript">
    let CardA = Vue.extend({
        data(){
            return {}
        },
        template: `<div>1</div>`
    });

    let vue = new Vue({
        data: {
            component: CardA
        },
        el: '#vue'
    });
</script>
```
这是`is`prop在vue的api文档中的说明：
```
is - string | ComponentDefinition | ComponentConstructor
```

## keep-alive标签的使用
keep-alive标签也是一个虚拟标签，用于需要将`vm`实例缓存的场景。Vue默认情况下，会根据逻辑，销毁和重建组件实例，尤其是在`v-if`结构下。

这个方式不利于缓存页面UI状态，比如用户之前在A页面填写了筛选条件，然后路由到了B页面，在B页面做了些操作，返回A页面，由于A页面和B页面是两个不同的组件，所以在路由切换后，两个页面的组件实例默认会重新创建，从而导致一开始的A页面写过的筛选条件无法再展示出来。这样不利于用户的使用。

如果不想每次UI更新时某些组件都会被销毁然后重建，简单地做法是使用`v-show`指令而不是`v-if`指令，但是组件多的话，这个方式不好管理；另外一种做法就是利用`keep-alive`标签。在`keep-alive`标签之间的组件实例在满足`keep-alive`的缓存规则时，当它们被销毁的时候，不会真正意义上的进行销毁，而是被缓存起来，当之后需要再次渲染的时候，会用之前的实例进行渲染，从而实现组件实例状态的保存。看下面这个示例：
```html
<div id="vue">
    <keep-alive>
        <login-form v-if="isLogin"></login-form>
        <register-form v-else></register-form>
    </keep-alive>
    <div><label><input type="checkbox" v-model="isLogin">{{isLogin ? '切换到注册' : '切换到登录'}}</label></div>
</div>

<script type="text/javascript">
    let LoginForm = Vue.extend({
        data(){
            return {
                email: '',
                password: ''
            }
        },
        template: `<div>
        <div><label>用户名：</label><input type="email" v-model="email" placeholder="输入登录邮箱" /></div>
        <div><label>密码：</label><input type="password" v-model="password" placeholder="输入登录密码" /></div>
        </div>`
    });

    let RegisterForm = Vue.extend({
        data(){
            return {
                email: '',
                password: '',
                passwordConfirm: ''
            }
        },
        template: `<div>
        <div><label>注册邮箱：</label><input type="email" v-model="email" placeholder="输入有效的邮箱" /></div>
        <div><label>注册密码：</label><input type="password" v-model="password" placeholder="输入密码" /></div>
        <div><label>确认密码：</label><input type="password" v-model="passwordConfirm" placeholder="再次输入密码" /></div>
        </div>`
    });

    let vue = new Vue({
        data: {
            isLogin: true
        },
        components: {
            LoginForm,
            RegisterForm
        },
        el: '#vue'
    });
</script>
```
点击[这个链接](/code/vue/component/05.html)查看这个例子的使用效果：首先在登录模式随便输入一些内容，然后切换到注册，输入一些内容，最后通过切换登录或注册，来检查登录和注册的组件实例状态是否有恢复。`keep-alive`标签内一定只能有一个组件是激活的，比如像上面例子中，`v-if`结构的做法，保证了只有一个组件是要被激活渲染的。

`keep-alive`非常适合与动态组件标签一起搭配使用，目前已知的动态组件标签有两个，一个是本篇前面学习的`component`标签，另一个是vue-router里面的`router-view`标签，这些标签都不会绑定到某个固定的组件实例，而是动态地展示不同的组件，`keep-alive`与它们结合起来使用，可以帮助它们缓存从激活状态切换到非激活状态的组件，当这些组件再次从非激活状态切换到激活状态时，就不需要重新创建实例就可以立即渲染出来了。

比如上面的例子，可以用`component`标签改写为：
```html
<div id="vue">
    <keep-alive>
        <component :is="authForm"></component>
    </keep-alive>
    <div><label><input type="checkbox" v-model="authForm" true-value="login-form" false-value="register-form">{{authForm === 'login-form' ? '切换到注册' : '切换到登录'}}</label></div>
</div>

<script type="text/javascript">
    let LoginForm = Vue.extend({
        data(){
            return {
                email: '',
                password: ''
            }
        },
        template: `<div>
        <div><label>用户名：</label><input type="email" v-model="email" placeholder="输入登录邮箱" /></div>
        <div><label>密码：</label><input type="password" v-model="password" placeholder="输入登录密码" /></div>
        </div>`
    });

    let RegisterForm = Vue.extend({
        data(){
            return {
                email: '',
                password: '',
                passwordConfirm: ''
            }
        },
        template: `<div>
        <div><label>注册邮箱：</label><input type="email" v-model="email" placeholder="输入有效的邮箱" /></div>
        <div><label>注册密码：</label><input type="password" v-model="password" placeholder="输入密码" /></div>
        <div><label>确认密码：</label><input type="password" v-model="passwordConfirm" placeholder="再次输入密码" /></div>
        </div>`
    });

    let vue = new Vue({
        data: {
            authForm: 'login-form'
        },
        components: {
            LoginForm,
            RegisterForm
        },
        el: '#vue'
    });
</script>
```
点击[这个链接](/code/vue/component/06.html)查看上面代码的使用效果。

`keep-alive`标签支持以下三个prop:
* include - 字符串或正则表达式。只有名称匹配的组件会被缓存。
* exclude - 字符串或正则表达式。任何名称匹配的组件都不会被缓存。
* max - 数字。最多可以缓存多少组件实例。
前两个用于控制允许和不允许哪些组件实例被缓存，最后一个控制最多可缓存的组件实例个数，以免内存占用过高。

> 当组件在 &lt;keep-alive&gt; 内被切换，它的 activated 和 deactivated 这两个生命周期钩子函数将会被对应执行。在 2.2.0 及其更高版本中，activated 和 deactivated 将会在 &lt;keep-alive&gt; 树内的所有嵌套组件中触发。

## 异步组件的定义和使用
vue开发的基本都是单页应用，单页应用最大的性能问题，就是首屏加载的问题，而首屏加载优化的关键，就是尽可能地减小首屏加载的资源文件大小。将组件变为异步加载再使用，是减少首屏加载资源大小的一个有效方式。

异步组件的定义可以用在全局注册和局部注册当中。Vue.component这个api用来定义全局组件，这是它的声明：
```
Vue.component( id, [definition] )
参数：

{string} id
{Function | Object} [definition]
```
它的第二个参数支持Function类型，这个类型就是用来定义异步的全局组件用的。当第二个参数是一个函数的时候，它与Promise类的构造函数参数有相同的签名，都支持两个参数，分别是是resolve和reject，从官方的例子来看，第2个参数在Vue内部应该会调用Promise.resolve来处理。 以下是在定义全局的异步组件的例子：
```html
<div id="vue">
    <register-form></register-form>
</div>

<script type="text/javascript">
    Vue.component('register-form',function(resolve){
        //模拟异步加载
        setTimeout(function(){
            resolve({
                data(){
                    return {
                        email: '',
                        password: '',
                        passwordConfirm: ''
                    }
                },
                template: `<div>
                <div><label>注册邮箱：</label><input type="email" v-model="email" placeholder="输入有效的邮箱" /></div>
                <div><label>注册密码：</label><input type="password" v-model="password" placeholder="输入密码" /></div>
                <div><label>确认密码：</label><input type="password" v-model="passwordConfirm" placeholder="再次输入密码" /></div>
                </div>`
            })
        },1000);
    });

    let vue = new Vue({
        data: {
        },
        el: '#vue'
    });
</script>
```
[查看演示](/code/vue/component/07.html)。上面的是模拟的一个异步组件，真实项目，肯定不会这么干，这么搞的话，组件的代码并没有变为异步加载的。想要在真实环境中异步加载组件，有两个做法，第一个是利用webpack这个构建工具提供的`require`api来加载异步组件的文件：
```js
Vue.component('register-form', function (resolve) {
    require(['./register-form.js'], resolve);
});

let vue = new Vue({
    data: {
    },
    el: '#vue'
});
```
上面的示例没法在博客中提供演示，因为还需要用到webpack工具，我已经在项目中验证过这个方法的有效性。在这个做法中，`register-form`需要单独放到一个文件里面定义，定义的方式既可以是es6的模块，也可以是cmd规范的模块：
```js
module.exports = {
    data() {
        return {
            email: '',
            password: '',
            passwordConfirm: ''
        };
    },
    template: `<div>
    <div><label>注册邮箱：</label><input type="email" v-model="email" placeholder="输入有效的邮箱" /></div>
    <div><label>注册密码：</label><input type="password" v-model="password" placeholder="输入密码" /></div>
    <div><label>确认密码：</label><input type="password" v-model="passwordConfirm" placeholder="再次输入密码" /></div>
    </div>`
};
```

第二个做法，是利用目前还处于提案阶段的ES6的异步module加载的api：`import()`：
```html
<div id="vue">
    <register-form></register-form>
</div>

<script type="text/javascript">
    Vue.component('register-form',function(resolve){
        return import('./register-form.js');
    });

    let vue = new Vue({
        data: {
        },
        el: '#vue'
    });
</script>
```
`register-form`这个组件被移动到一个单独的文件里面定义了：
```js
export default {
    data(){
        return {
            email: '',
            password: '',
            passwordConfirm: ''
        }
    },
    template: `<div>
    <div><label>注册邮箱：</label><input type="email" v-model="email" placeholder="输入有效的邮箱" /></div>
    <div><label>注册密码：</label><input type="password" v-model="password" placeholder="输入密码" /></div>
    <div><label>确认密码：</label><input type="password" v-model="passwordConfirm" placeholder="再次输入密码" /></div>
    </div>`
};
```
[查看演示](/code/vue/component/08.html)。

在局部注册中，异步组件的使用方式，跟全局注册里面几乎是一致的：
```html
<div id="vue">
    <register-form></register-form>
</div>

<script type="text/javascript">
    let vue = new Vue({
        data: {
        },
        el: '#vue',
        components: {
            'register-form': function(resolve){
                //模拟异步加载
                setTimeout(function(){
                    resolve({
                        data(){
                            return {
                                email: '',
                                password: '',
                                passwordConfirm: ''
                            }
                        },
                        template: `<div>
                        <div><label>注册邮箱：</label><input type="email" v-model="email" placeholder="输入有效的邮箱" /></div>
                        <div><label>注册密码：</label><input type="password" v-model="password" placeholder="输入密码" /></div>
                        <div><label>确认密码：</label><input type="password" v-model="passwordConfirm" placeholder="再次输入密码" /></div>
                        </div>`
                    })
                },1000);
            }
        }
    });
</script>
```
[查看演示](/code/vue/component/10.html)。

一样可以使用webpack提供的`require`api:
```js


let vue = new Vue({
    data: {
    },
    el: '#vue',
    components: {
        'register-form': function (resolve) {
            require(['./register-form.js'], resolve);
        }
    }
});
```
以及es6的`import()`api：
```html
<div id="vue">
    <register-form></register-form>
</div>

<script type="text/javascript">
    let vue = new Vue({
        data: {
        },
        el: '#vue',
        components: {
            'register-form': ()=>import('./register-form.js')
        }
    });
</script>
```
[查看演示](/code/vue/component/11.html)。

## 异步组件的加载过程控制
为了提升用户体验，同时也考虑到可能有加载错误和超时的问题，vue提供了更精细地对异步组件加载的控制方式：
```js
const AsyncComponent = () => ({
  // 需要加载的组件 (应该是一个 `Promise` 对象)
  component: promise,//eg: import('./MyComponent.vue')
  // 异步组件加载时使用的组件
  loading: LoadingComponent,
  // 加载失败时使用的组件
  error: ErrorComponent,
  // 展示加载时组件的延时时间。默认值是 200 (毫秒)
  delay: 200,
  // 如果提供了超时时间且组件加载也超时了，
  // 则使用加载失败时使用的组件。默认值是：`Infinity`
  timeout: 3000
})
```
简而言之，就是把上一个部分介绍的异步组件的加载函数，改成上面的一个函数形式。使用例子：
```html
<div id="vue">
    <register-form></register-form>
</div>

<script type="text/javascript">
    let vue = new Vue({
        data: {
        },
        el: '#vue',
        components: {
            'register-form': ()=>({
                component: new Promise(resolve=>{
                    setTimeout(()=>{
                        resolve(import('./register-form.js'));
                    },2000);
                }),
                loading: {
                    template: `<div>加载中...</div>`
                },
                error: {
                    template: `<div>加载出错</div>`
                },
                delay: 200,
                timeout: 3000
            })
        }
    });
</script>
```
[查看演示](/code/vue/component/12.html)。这个例子中为了演示`loading`的效果，故意把component做成了下面的形式：
```js
new Promise(resolve=>{
    setTimeout(()=>{
        resolve(import('./register-form.js'));
    },2000);
})
```
如果想看timeout的演示，可以点击[这个例子](/code/vue/component/13.html)。 如果因为超时导致组件加载失败，控制台会提示：
```
[Vue warn]: Failed to resolve async component: ()=>({
                component: new Promise(resolve=>{
                    setTimeout(()=>{
                        resolve(import('./register-form.js'));
                    },3001);
                }),
                loading: {
                    template: `<div>加载中...</div>`
                },
                error: {
                    template: `<div>加载出错</div>`
                },
                delay: 200,
                timeout: 3000
            })
Reason: timeout (3000ms)
```

以上就是本篇的全部内容。