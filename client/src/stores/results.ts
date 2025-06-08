import ApplicationContextDAO from '@/dao/ApplicationContextDAO'
import { getDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useResultsStore = defineStore('results', () => {
  const _seasonId = ref<string>()
  function setSeason(id: string) {
    _seasonId.value = id
  }

  const seasonId = computed(() => _seasonId)

  getDoc(ApplicationContextDAO.get()).then((appContext) => {
    if (appContext) {
      const ac = appContext.data()
      if (ac) {
        setSeason(ac.currentSeason.id)
      }
    }
  })

  return { seasonId, setSeason }
})
