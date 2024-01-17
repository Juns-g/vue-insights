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
