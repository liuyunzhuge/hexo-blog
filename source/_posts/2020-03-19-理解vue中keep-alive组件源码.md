---
title: 理解vue中keep-alive组件源码
tags:
  - Vue
  - keep-alive
categories:
  - Vue
date: 2020-03-19 23:09:31
---


keep-alive内置组件的源码解析。keep-alive是vue中用于组件实例重用的一个内置组件，弄懂它对于运用好vue比较有用，而且它还比较简单。

<!-- more -->
为了阅读方便，我把keep-alive相关的代码都整合到了一起，以便不牵扯到其它代码，采用的是v2.6.11：
```js
// 从数组中删除指定的item
function remove(arr, item) {
    if (arr.length) {
        const index = arr.indexOf(item)
        if (index > -1) {
            return arr.splice(index, 1)
        }
    }
}

// 接下来3个函数都是在getFirstComponentChild中被调用的
function isAsyncPlaceholder(node) {
    return node.isComment && node.asyncFactory
}

function isDef(v) {
    return v !== undefined && v !== null
}

function isRegExp(v) {
    return _toString.call(v) === '[object RegExp]'
}

// 得到第一个子component的vnode
function getFirstComponentChild(children) {
    if (Array.isArray(children)) {
        for (let i = 0; i < children.length; i++) {
            const c = children[i]
            if (isDef(c) && (isDef(c.componentOptions) || isAsyncPlaceholder(c))) {
                return c
            }
        }
    }
}

// 得到组件名称
function getComponentName(opts) {
    return opts && (opts.Ctor.options.name || opts.tag)
}


// 判断pattern与name两参数之间的匹配关系
function matches(pattern, name) {
    if (Array.isArray(pattern)) {
        return pattern.indexOf(name) > -1
    } else if (typeof pattern === 'string') {
        return pattern.split(',').indexOf(name) > -1
    } else if (isRegExp(pattern)) {
        return pattern.test(name)
    }
    return false
}

// 清理keep-alive实例:keepAliveInstance上无需继续缓存的子组件实例
function pruneCache(keepAliveInstance, filter) {
    const { cache, keys, _vnode } = keepAliveInstance
    for (const key in cache) {
        const cachedNode = cache[key]
        if (cachedNode) {
            const name = getComponentName(cachedNode.componentOptions)
            if (name && !filter(name)) {
                pruneCacheEntry(cache, key, keys, _vnode)
            }
        }
    }
}

// 清理已经缓存的某个实例
function pruneCacheEntry(
    cache,
    key,
    keys,
    current
) {
    const cached = cache[key]

    // cached.tag !== current.tag 是为了让keep-alive最少留一个实例不被清除
    // 但是keep-alive自身销毁时，所有的实例都会被销毁
    // 为什么留一个实例不被清除？
    // keep-alive的初衷是为了让组件复用，但是在组件没有被复用前，正常情况
    // 也都至少有一个组件实例才符合常理
    if (cached && (!current || cached.tag !== current.tag)) {
        cached.componentInstance.$destroy()
    }
    cache[key] = null
    remove(keys, key)
}

const patternTypes = [String, RegExp, Array]

export default {
    name: 'keep-alive',
    abstract: true,

    props: {
        include: patternTypes,
        exclude: patternTypes,
        max: [String, Number]
    },

    created() {
        // 创建一个对象，作为缓存容器
        this.cache = Object.create(null)
        this.keys = []
    },

    destroyed() {
        // 当keep-alive实例自己被销毁的时候，遍历所有缓存的实例
        // 调用pruneCacheEntry销毁每一个缓存的实例
        for (const key in this.cache) {
            pruneCacheEntry(this.cache, key, this.keys)
        }
    },

    mounted() {
        this.$watch('include', val => {
            // 当keep-alive实例的include属性变化时，通过pruneCache函数来清理缓存
            // name => matches(val, name) 这个调用不成立的会被清掉，成立的则会保留
            pruneCache(this, name => matches(val, name))
        })
        this.$watch('exclude', val => {
            // 当keep-alive实例的exclude属性变化时，通过pruneCache函数来清理缓存
            // name => !matches(val, name) 这个调用不成立的会被清掉，成立的则会保留
            pruneCache(this, name => !matches(val, name))
        })
    },

    render() {
        const slot = this.$slots.default
        // 其实简单点的话，就直接slot[0]来处理了
        const vnode = getFirstComponentChild(slot)
        const componentOptions = vnode && vnode.componentOptions
        // 找到的vnode必须有componentOption，才会执行keep-alive的核心逻辑
        if (componentOptions) {
            // check pattern
            const name = getComponentName(componentOptions)
            const { include, exclude } = this
            if (
                // not included
                (include && (!name || !matches(include, name))) ||
                // excluded
                (exclude && name && matches(exclude, name))
            ) {
                // 如果不在include指定的模式内，或者在exclude排除的模式外，就会直接返回vnode，而不会保持alive
                // 上面的匹配都是根据component的name来匹配的
                return vnode
            }

            const { cache, keys } = this
            const key = vnode.key == null
                // Ctor是构造函数的意思
                // componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '')
                // 上面这行处理，跟一个bug有关，可以看这个issue: https://github.com/vuejs/vue/issues/3269
                // 是由于组件构造函数可能会被多注册为多个本地组件，导致
                // 改造函数上的cid值并不能作为一个唯一标识符，来充当vnode.key的作用
                ? componentOptions.Ctor.cid + (componentOptions.tag ? `::${componentOptions.tag}` : '')
                : vnode.key

            // keep-alive组件的缓存是基于vnode.key管理的
            if (cache[key]) {
                // cache[key]缓存的是一个vnode
                // 当一个vnode首次被创建的时候是没有跟componentInstance关联的
                // 但是当它首次完成渲染之后，肯定就会有某个具体的componentInstance了
                // 在keep-alive的render方法中，每次返回的vnode都是不同的
                // 但是基于缓存的机制，代码走到这里时，会把之前缓存的vnode渲染出的节点实例
                // 绑定到即将要渲染的vnode节点上，也就是下面这个vnode变量
                // 这样的话，keep-alive的render函数返回的就是一个已经配置有了componentInstance的vnode实例
                // 那在vue的其它代码里面应该就会直接重用这个实例，而不是根据vnode的componentOptions重新实例化一个
                vnode.componentInstance = cache[key].componentInstance

                // 为什么要做下面的处理？因为要考虑到那个max属性的作用
                // 代码执行到这，说明某个实例被激活到最前面了
                // 那它就应该离max的作用机制更远一点
                // make current key freshest
                remove(keys, key)
                keys.push(key)
            } else {
                // 首次渲染这个component，把这次创建的vnode缓存起来
                cache[key] = vnode
                keys.push(key)

                // 存活最久的实例，会通过max的机制，自动被清理掉
                // this._vnode应该是keep-alive实例当前的vnode节点
                // prune oldest entry
                if (this.max && keys.length > parseInt(this.max)) {
                    pruneCacheEntry(cache, keys[0], keys, this._vnode)
                }
            }

            //把keepAlive设置到vnode节点的数据对象上
            //这样别的地方需要判断一个节点是不是keep-alive节点，就能很好判断了
            //另外vue的dev-tools也依赖这个keepAlive状态
            vnode.data.keepAlive = true
        }
        return vnode || (slot && slot[0])
    }
}
```