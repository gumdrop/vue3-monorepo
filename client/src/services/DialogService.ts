import { useDisplay } from 'vuetify'

export const useDialog = () => {
  const { smAndDown } = useDisplay()

  function dialogSize() {
    return { fullscreen: smAndDown }
  }

  return { dialogSize }
}
