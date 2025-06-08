import { computed } from 'vue'
import { useDisplay } from 'vuetify'

export const useLayout = () => {
  const { xs } = useDisplay()

  const gridSize = computed(() => (xs.value ? 'px-0 py-1' : ''))

  return { gridSize }
}
