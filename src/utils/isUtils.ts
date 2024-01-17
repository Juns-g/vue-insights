export function isFunction(value: any): value is (...args: any[]) => any {
  return typeof value === 'function'
}

export const isArray = Array.isArray
