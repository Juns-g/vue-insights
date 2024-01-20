export function isFunction(value) {
  return typeof value === 'function'
}

export const isArray = Array.isArray

export function isObject(obj) {
  return obj !== null && typeof obj === 'object'
}
