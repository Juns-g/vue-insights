class Vue {
  constructor(options) {
    this.$options = options
    this.$data = options.data
    // 将data转换成响应式数据
    // 编译渲染试图
  }
}
