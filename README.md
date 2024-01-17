# vue-insights

学习 vue 的底层、设计与实现

参考资料：

- [深入浅出 Vue.js
  ](https://book.douban.com/subject/32581281/)
- [Vue2 源码](https://github.com/vuejs/vue)

## 响应式系统

Vue 的特性之一是其看上去并不显眼的响应式系统。数据模型仅仅是简单的 JS 对象，但是当我们修改它们时，视图会进行更新。这让状态管变得简单直接。但是理解他的原理也很重要，这样可以让我们避免一些常见的问题。

从状态生成 DOM，在输出到用户界面，这样的流程叫渲染，应用在运行时会不断的重新渲染。响应式系统赋予框架重新渲染的能力，其中的一个重要组成部分就是变化侦测。他也是响应式系统的核心。

变化侦测的作用就是侦测数据的变化，当数据变化时，会通知视图进行相应的更新.

### object 的变化侦测

#### 如何追踪变化

在 JS 中如何侦测一个对象的变化？我们可以轻易的想到`Object.defineProperty()`和`Proxy`, `Vue2`使用的是`Object.defineProperty()`，`Vue3`使用的是`Proxy`。这里我们就只看`Object.defineProperty()`。

那我们就可以写出这样的侦听代码：

```js
function defineReactive(data, key, val) {
  Object.defineProperty(data, key, {
    enumerable: true,
    configurable: true,
    get() {
      return val
    },
    set(newVal) {
      if (val === newVal) {
        return
      }
      val = newVal
    },
  })
}
```

这里定义了一个`defineReactive`函数，作用时定义一个响应式数据，当响应式数据的读取或变化时会触发响应的 get 和 set 方法

#### 如何收集依赖

上面仅仅是封装了`Object.defineProperty()`，但是这并没有什么实际用处，有用的是收集依赖

之所以要观察数据，是为了当数据的属性变化时，通知使用了数据的地方进行更新。

所以可以先收集依赖，然后当属性变化时，通知依赖进行更新。

即：在 get 方法中收集依赖，在 set 方法中通知依赖更新

#### 依赖收集到哪里

既然需要收集依赖，那么依赖收集到哪里呢？

我们可以想到，依赖收集到一个数组中，当数据变化时，遍历数组，通知依赖进行更新。

那么就可以想到每个 key 都有一个依赖数组，假设依赖是一个函数，存在`window.target`中，那么就可以写出这样的代码：

```js
function defineReactive(data, key, val) {
  const dep = []
  Object.defineProperty(data, key, {
    enumerable: true,
    configurable: true,
    get() {
      dep.push(window.target)
      return val
    },
    set(newVal) {
      if (val === newVal) {
        return
      }
      for (let i = 0; i < dep.length; i++) {
        dep[i](newVal, val)
      }
      val = newVal
    },
  })
}
```

在代码中新增了依赖数组，当 set 触发时，遍历依赖数组，通知依赖进行更新。

可以优化一下代码，把依赖收集代码封装成一个 Dep 类

```js
class Dep {
  constructor() {
    this.subs = []
  }
  addSub(sub) {
    this.subs.push(sub)
  }
  removeSub(sub) {
    remove(this.subs, sub)
  }
  depend() {
    if (window.target) {
      this.addSub(window.target)
    }
  }
  notify() {
    const subs = this.subs.slice()
    for (let i = 0; i < subs.length; i++) {
      subs[i].update()
    }
  }
}

function remove(arr, item) {
  if (arr.length) {
    const index = arr.indexOf(item)
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}
```

改造一下`defineReactive`函数

```js
function defineReactive(data, key, val) {
  const dep = new Dep()
  Object.defineProperty(data, key, {
    enumerable: true,
    configurable: true,
    get() {
      dep.depend()
      return val
    },
    set(newVal) {
      if (val === newVal) {
        return
      }
      dep.notify()
      val = newVal
    },
  })
}
```

这样就清晰多了

#### 依赖是谁

收集谁，其实可以理解为，当属性变化后，通知谁

我们要通知用到数据的地方，而这个地方有很多，并且类型也是不一样的。我们在依赖收集阶段只手机这个封装好的类的实例进来，通知也只通知它一个。然后再让它去通知其他地方。所以可以把这个抽象的东西取个名字，叫 Watcher。

#### 什么是 Watcher

Watcher 是一个抽象的概念，它的作用是连接依赖和更新视图的桥梁。

举一个 vue 中的例子：

```js
vm.$watch('a.b.c', (newVal, oldVal) => {
  // do something
})
```

含义就是，当 a.b.c 变化时，执行回调函数

下面思考一下，这个 Watcher 是怎么实现的

```js
import { parsePath } from '../utils/index.js'

export default class Watcher {
  constructor(vm, expOrFn, cb) {
    this.vm = vm
    this.getter = parsePath(expOrFn)
    this.cb = cb
    this.value = this.get()
  }

  get() {
    window.target = this
    const vm = this.vm
    let value = this.getter.call(vm, vm)
    window.target = undefined
    return value
  }

  update() {
    const oldValue = this.value
    this.value = this.get()
    this.cb.call(this.vm, this.value, oldValue)
  }
}
```

#### 递归侦测所有的 key

这里已经实现变化侦测的功能了，但是前面的代码只能侦测数据中的一个属性，我们当然希望是能够侦测到数据的所有属性，包括子属性，所以需要封装一个 Observer 类。他的作用就是将一个数据内的所有属性，都转换成响应式数据。

```js
import Dep from './Dep.js'
import { isArray } from '../utils/isUtils.js'

export class Observer {
  constructor(value) {
    this.value = value
    if (!isArray(value)) {
      this.walk(value)
    }
  }
  walk(obj) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i], obj[keys[i]])
    }
  }
}

function defineReactive(data, key, val) {
  if (typeof val === 'object') {
    new Observer(val)
  }
  const dep = new Dep()
  Object.defineProperty(data, key, {
    enumerable: true,
    configurable: true,
    get() {
      dep.depend()
      return val
    },
    set(newVal) {
      if (val === newVal) {
        return
      }
      val = newVal
      dep.notify()
    },
  })
}
```

把一个 object 传入 object 类，会遍历这个 object 的所有属性，然后把这些属性都转换成响应式数据。

#### 缺陷

Vue2 是通过`Object.defineProperty()`来实现响应式的，但是这个方法有一些缺陷，只能跟踪一个数据是否被修改，但是无法最总新增属性和删除属性。

Vue2 提供了俩个方法来解决这个问题，分别是`Vue.set()`和`Vue.delete()`。

#### 总结

变化侦测就是为了，当数据变化时，能够侦测到并发出通知。

Object 可以通过`Object.defineProperty()`来把属性转换成 getter/setter 的形式来追踪变化。

我们需要在 getter 中手机有哪些依赖使用了数据。当 setter 被触发时，需要去通知 getter 中的依赖数据发生了变化。

收集依赖就需要有一个地方存储依赖，为此创建了 Dep，用来收集依赖、删除依赖、向依赖发送消息。

所谓的依赖其实就是 Watcher。只有 Watcher 触发的 getter 才会手机依赖，哪个 Watcher 触发了 getter，就把哪个 Watcher 收集到 Dep 中。当数据变化时，循环依赖列表通知所有的 Watcher。

Watcher 的原理是先把自己设置到全剧唯一的指定位置，例如上文的`window.target`，然后读取数据。读取数据就触发了 getter。然后 getter 从全局唯一的位置读取当前的 Watcher，把这个 Watcher 收集到 Dep 中。通过这样的方式，Watcher 就可以主动去订阅任意一个数据的变化。

还创建了 Observer 类，作用是把一个 object 中的所有数据转换成响应式的，也就是说它会侦测 object 中的所有数据的变化

### Array 的变化侦测

上一节是对 Object 的侦测方式，这一节是对 Array 的侦测方式

为什么要单独处理 Array 呢？因为 Array 的变化侦测方式和 Object 不一样。

比如`list.push(1)`这个操作，并不会触发 getter/setter

#### 如何追踪变化

Object 是通过 setter 来追踪的，数据发生变化一定会触发 setter

所以说只要我们可以在用户通过 push 操作数组的时候能够得到通知，就能实现相同的目的

不过 ES6 之前的 JS 没有提供相应的拦截能力，Vue 通过的是自定义方法去覆盖原生的原型方法

#### 拦截器

拦截器其实就是一个和`Array.prototype`一样的 Object，里面包含的属性和方法都一样，但是这些方法都是被重写过的，重写的方法会在执行原生方法之前，先通知依赖进行更新。
