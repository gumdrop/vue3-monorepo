import type SiteUser from '@/entity/SiteUser'
import type Team from '@/entity/Team'
import { useUserStore } from '@/stores/app'
import axios from 'axios'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { REST_ROOT } from './constants'

export interface LoggedInUser {
  siteUser: SiteUser
  email: string
  team: Team
}

export default function useAuth() {
  const logout = () => {
    const auth = getAuth()
    if (auth) {
      signOut(auth)
    }
  }

  const logon = () => {}

  const logonWithGoogle = async (email: string | undefined) => {
    if (email) {
      const siteUser = await verifyEmail(email)

      if (siteUser) {
        const provider = new GoogleAuthProvider()
        const auth = getAuth()

        signInWithPopup(auth, provider).then(async (result) => {
          // This gives you a Google Access Token. You can use it to access the Google API.
          // const credential = GoogleAuthProvider.credentialFromResult(result)
          // //const token = credential.accessToken
          // // The signed-in user info.
          // setUser(result.user)
          // IdP data available using getAdditionalUserInfo(result)
          // ...
        })
      }

      //     .catch((error) => {
      //       // Handle Errors here.
      //       const errorCode = error.code
      //       const errorMessage = error.message
      //       // The email of the user's account used.
      //       const email = error.customData.email
      //       // The AuthCredential type that was used.
      //       const credential = GoogleAuthProvider.credentialFromError(error)
      //       // ...
      //     })
    }
  }

  function siteUserForEmail(email: string | null) {
    return axios.get<SiteUser>(`${REST_ROOT}/site-user-for-email/${email}`)
  }

  async function verifyEmail(email: string) {
    try {
      const siteUser = await siteUserForEmail(email)
      return true && siteUser

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error(`Error getting site user : ${e.message}`)
      return false
    }
  }

  function authGuard() {
    const { user } = useUserStore()
    return user.value !== undefined
  }

  function unauthGuard() {
    const { user } = useUserStore()
    return user.value === undefined
  }

  return { logout, logonWithGoogle, verifyEmail, authGuard, unauthGuard }
}
