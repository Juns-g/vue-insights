// 自己尝试写一个reactive
// 1. 传入一个对象，返回一个响应式对象
// 2. 对响应式对象的属性进行修改，会触发log
import { isArray, isObject, hasOwn } from '../utils/index.js'

class Observer {
  constructor(val) {
    this.val = val
    def(val, '__ob__', this)
    if (isArray(val)) {
      this.observerArray(val)
    } else {
      this.walk(val)
    }
  }
  walk(obj) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i], obj[keys[i]])
    }
  }
  observerArray(items) {
    for (let i = 0; i < items.length; i++) {
      observe(items[i])
    }
  }
}

function defineReactive(data, key, val) {
  observe(val)
  Object.defineProperty(data, key, {
    enumerable: true,
    configurable: true,
    get() {
      console.log(`get ${key}:${val}`)
      return val
    },
    set(newVal) {
      console.log(`set ${key}:${newVal}`)
      val = newVal
    },
  })
}

function observe(val) {
  if (!isObject(val)) {
    return
  }
  let ob
  if (hasOwn(val, '__ob__') && val.__ob__ instanceof Observer) {
    ob = val.__ob__
  } else {
    ob = new Observer(val)
  }
  return ob
}

// 无递归，无数组
/* const simpleObj = {
  name: 'juns',
  age: 18,
}
const reactiveSimpleObj = new Observer(simpleObj)
reactiveSimpleObj.val.name // get
reactiveSimpleObj.val.name = 'jk' // set
reactiveSimpleObj.val.sex = 'man' // 无反应 */

// 递归obj
/* const obj = {
  name: 'juns',
  age: 18,
  child: {
    name: 'jk',
    age: 1,
  },
}
const reactiveObj = new Observer(obj)
reactiveObj.val.child // get child object
reactiveObj.val.child.name // get name:jk
reactiveObj.val.child.name = 'test' // set name:test */

function def(obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true,
  })
}

const arrayProto = Array.prototype
const arrayMethods = Object.create(arrayProto)

const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse',
]

methodsToPatch.forEach(method => {
  const original = arrayProto[method]
  Object.defineProperty(arrayMethods, method, {
    enumerable: true,
    configurable: true,
    value(...args) {
      const result = original.apply(this, args)
      const ob = this.__ob__
      let inserted
      switch (method) {
        case 'push':
        case 'unshift':
          inserted = args
          break
        case 'splice':
          inserted = args.slice(2)
          break
      }
      inserted && ob.observerArray(inserted)
      return result
    },
  })
})

// 数组
const arr = [1, 2, 3]
const reactiveArr = new Observer(arr)
reactiveArr.val[0] // get 0:1
reactiveArr.val[0] = 1 // set 0:1
reactiveArr.val.push(4) // 无反应
reactiveArr.val.pop() // 无反应
