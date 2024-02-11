class Vue {
  constructor(options) {
    console.log('🚀 ~ options:', options)
    this.$options = options
    this.$data = options.data
    observe(this.$data)
    new Compile(options.el, this)
  }
}

function observe(data) {
  if (typeof data !== 'object' || data === null) {
    return data
  }
  Object.keys(data).forEach(key => {
    defineReactive(data, key, data[key])
  })
}

function defineReactive(obj, key, val) {
  observe(val)
  const dep = new Dep()
  Object.defineProperty(obj, key, {
    get() {
      console.log('get', obj, key, val)
      dep.depend()
      console.log('🚀 ~ dep.subs.length:', dep.subs.length)
      return val
    },
    set(newVal) {
      if (val !== newVal) {
        observe(newVal)
        console.log('set', obj, key, newVal)
        val = newVal
        dep.notify()
      }
    },
  })
}

class Compile {
  constructor(el, vm) {
    this.$vm = vm
    const dom = document.querySelector(el)
    this.compile(dom)
  }
  compile(node) {
    const childNodes = node.childNodes
    childNodes.forEach(node => {
      console.dir(node)
      // 插值表达式
      if (this.isInter(node)) {
        // const key = this.getInter(node)
        // this.compileText(node, key)
        this.getInter(node)
      } else {
        const attrs = node.attributes
        if (attrs) {
          Array.from(attrs).forEach(attr => {
            const { name, value } = attr
            if (name.startsWith('v-')) {
              const type = name.substring(2)
              this[type](node, value)
              node.value = this.$vm.$data[value]
            }
          })
        }
        // 递归
        if (node.childNodes.length > 0) {
          this.compile(node)
        }
      }
    })
  }
  compileText(node, key) {
    node.textContent = this.$vm.$data[key]
  }
  isInter(node) {
    const reg = /\{\{(.*)\}\}/
    return reg.test(node.textContent)
  }

  getInter(node) {
    if (!this.isInter(node)) throw new Error('node内部不是一个插值表达式')
    const reg = /\{\{(.*)\}\}/
    const exp = node.textContent.replace(reg, '$1').trim()
    const watcher = new Watcher(this.$vm, exp, val => {
      console.log('🚀 ~ val:', val)
      node.textContent = val
    })
    return exp
  }
  // 双向绑定 v-model
  model(node, exp) {
    console.log('🚀 ~ v-model exp:', exp)
    // 这里就只考虑 input 了
    const watcher = new Watcher(this.$vm, exp, val => {
      node.value = val
    })

    node.addEventListener('input', () => {
      this.$vm.$data[exp] = node.value
    })
  }
}

class Watcher {
  constructor(vm, exp, callback) {
    this.cb = callback
    this.$vm = vm
    this.$exp = exp
    this.value = this.get()
  }
  get() {
    window.nowWatcher = this
    let val = this.$vm.$data[this.$exp]
    window.nowWatcher = null
    return val
  }
  update() {
    console.log('🚀 ~ update:')
    const oldVal = this.value
    const newVal = this.get()
    if (oldVal !== newVal) {
      this.cb.call(this.$vm, newVal, oldVal)
    }
  }
}

class Dep {
  constructor() {
    this.subs = []
  }
  notify() {
    console.log('🚀 ~ notify:')
    this.subs.forEach(sub => {
      console.log('🚀 ~ sub:')
      sub.update()
    })
  }
  addSub(sub) {
    console.log('🚀 ~ addSub:', sub)
    this.subs.push(sub)
  }
  depend() {
    console.log('🚀 ~ depend, window.nowWatcher:', window.nowWatcher)
    if (window.nowWatcher) {
      this.addSub(window.nowWatcher)
    }
  }
}
