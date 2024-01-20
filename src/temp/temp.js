import { parsePath } from '../utils/index.js'

export default class Watcher {
  constructor(vm, expOrFn, cb) {
    this.vm = vm
    this.deps = []
    this.depIds = new Set()
    // ...
  }
  addDep(dep) {
    const id = dep.id
    if (!this.depIds.has(id)) {
      this.depIds.add(id)
      this.deps.push(dep)
      dep.addSub(this)
    }
  }
}
