export function log<T>(obj: T, message?: string) {
  console.log(`${message}\n${JSON.stringify(obj)}`)
  return obj
}
