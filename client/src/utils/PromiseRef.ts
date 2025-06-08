import { ref, toValue, watchEffect, type MaybeRefOrGetter } from 'vue'

export function usePromise<T>(wrapper: MaybeRefOrGetter<Promise<T | undefined>>) {
  const holder = ref<T>()

  watchEffect(async () => {
    const promise = toValue(wrapper)
    const value = await promise
    if (value) {
      holder.value = value
    }
  })

  return holder
}
