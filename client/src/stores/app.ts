// Utilities
import ApplicationContextDAO from '@/dao/ApplicationContextDAO'
import SiteUserDAO from '@/dao/SiteUserDAO'
import type ApplicationContext from '@/entity/ApplicationContext'
import type { LoggedInUser } from '@/services/AuthService'

import { useTeams } from '@/services/TeamService'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { getDoc } from 'firebase/firestore'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useFirebaseAuth } from 'vuefire'

export const useUserStore = defineStore('user', () => {
  const _user = ref<LoggedInUser>()

  const _auth = useFirebaseAuth()
  const { teamForUser } = useTeams()

  const setUser = async (fbUser: User | null) => {
    if (fbUser != null) {
      const email = fbUser.email
      const siteUser = await SiteUserDAO.siteUserForUid(fbUser.uid)
      const team = await teamForUser(siteUser?.user?.id)
      if (siteUser && team && email) {
        _user.value = { siteUser, team, email: fbUser.email }
      }
    } else {
      _user.value = undefined
    }
  }

  const user = computed(() => _user)

  if (_auth) {
    onAuthStateChanged(_auth, async (fbUser: User | null) => {
      setUser(fbUser)
    })
  }

  return { user, setUser }
})

export const useSideMenuStore = defineStore('sidemenu', () => {
  const sidemenu = ref(true)
  function setSidemenu(value: boolean) {
    sidemenu.value = value
  }

  return { sidemenu, setSidemenu }
})

export const useAppContextStore = defineStore('appcontext', () => {
  const _appContext = ref<ApplicationContext>()
  const _seasonId = ref<string>()
  const seasonId = computed(() => _seasonId)
  const appContext = computed(() => _appContext)

  getDoc(ApplicationContextDAO.get()).then((context) => {
    if (context) {
      const ac = context.data()
      _appContext.value = ac
      _seasonId.value = ac?.currentSeason.id
    }
  })

  return { appContext, seasonId }
})
