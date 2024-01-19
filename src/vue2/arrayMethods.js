import { def } from './def'

const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto) // 继承原型上的方法

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
  // 缓存原始方法
  const original = arrayProto[method]
  def(arrayMethods, method, function mutator(...args) {
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
    if (inserted) {
      // 对新增的元素进行观测
      ob.observerArray(inserted)
    }
    ob.dep.notify() // 向依赖发送消息
    return result
  })
})
