import ApplicationContextDAO from '@/dao/ApplicationContextDAO'
import { getDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAnalyticsStore = defineStore('analytics', () => {
  const _seasonId = ref<string>()
  const _competitionId = ref<string>()

  function setSeason(id?: string) {
    if (!id) return
    if (_seasonId.value === id) return

    _seasonId.value = id
    _competitionId.value = undefined
  }

  function setCompetition(id?: string) {
    _competitionId.value = id || undefined
  }

  const seasonId = computed(() => _seasonId.value)
  const competitionId = computed(() => _competitionId.value)

  getDoc(ApplicationContextDAO.get()).then((appContext) => {
    const ac = appContext?.data()
    if (ac && !_seasonId.value) {
      setSeason(ac.currentSeason.id)
    }
  })

  return { seasonId, competitionId, setSeason, setCompetition }
})
