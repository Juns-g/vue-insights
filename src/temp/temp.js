const dep = new Set()

const data = { text: 'hello' }
const effect = () => {
  console.log('effect')
}

const proxyData = new Proxy(data, {
  get(target, key) {
    dep.add(effect)
    return Reflect.get(...arguments)
  },
  set(target, key, value) {
    Reflect.set(...arguments)
    dep.forEach(effect => effect())
  },
})
