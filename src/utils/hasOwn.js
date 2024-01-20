const hasOwnProperty = Object.prototype.hasOwnProperty
/* export function hasOwn(obj: Object | Array<any>, key: string): boolean {
  return hasOwnProperty.call(obj, key)
} */
export function hasOwn(obj) {
  return hasOwnProperty.call(obj, key)
}
