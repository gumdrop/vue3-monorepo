import type SiteUser from '@/entity/SiteUser'
import SiteUserDAO from '@/dao/SiteUserDAO'
import type Team from '@/entity/Team'
import { useUserStore } from '@/stores/app'
import axios from 'axios'
import { getCurrentUser } from 'vuefire'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth'
import { REST_ROOT } from './constants'

export const EMAIL_NOT_REGISTERED_MESSAGE =
  'This email does not belong to a registered user.  Please contact your team captain.'

export interface LoggedInUser {
  siteUser: SiteUser
  email: string
  team?: Team
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
        provider.setCustomParameters({ login_hint: email })
        const auth = getAuth()

        const result = await signInWithPopup(auth, provider)
        if (result.user.email?.toLowerCase() !== email.toLowerCase()) {
          await signOut(auth)
          throw new Error('Google account email does not match the requested login email')
        }

        const savedSiteUser = await bindSiteUserToFirebaseUser(siteUser, result.user)
        await useUserStore().setUser(result.user)
        return savedSiteUser
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

  async function bindSiteUserToFirebaseUser(siteUser: SiteUser, user: User) {
    const updatedSiteUser = {
      ...siteUser,
      uid: user.uid,
      avatar: user.photoURL ?? siteUser.avatar,
      handle: siteUser.handle || user.displayName || user.email || '',
    }

    await SiteUserDAO.save(updatedSiteUser)
    return updatedSiteUser
  }

  async function siteUserForEmail(email: string | null) {
    const response = await axios.get<SiteUser | string>(`${REST_ROOT}/site-user-for-email/${email}`)
    return typeof response.data === 'string' ? (JSON.parse(response.data) as SiteUser) : response.data
  }

  async function verifyEmail(email: string) {
    try {
      const siteUser = await siteUserForEmail(email)
      if (siteUser) {
        const auth = getAuth()
        await sendSignInLinkToEmail(auth, email, {
          url: window.location.origin + '/login',
          handleCodeInApp: true,
        })
        window.localStorage.setItem('emailForSignIn', email)
      }
      return true && siteUser

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if (e?.response?.status === 404) {
        throw new Error(EMAIL_NOT_REGISTERED_MESSAGE)
      }
      console.error(`Error getting site user : ${e.message}`)
      return false
    }
  }

  const checkEmailSignInLink = async () => {
    const auth = getAuth()
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn')
      if (!email) {
        email = window.prompt('Please provide your email for confirmation')
      }
      if (email) {
        const result = await signInWithEmailLink(auth, email, window.location.href)
        window.localStorage.removeItem('emailForSignIn')
        const siteUser = await siteUserForEmail(email)
        if (siteUser) {
          await bindSiteUserToFirebaseUser(siteUser, result.user)
        }
        await useUserStore().setUser(result.user)
        return true
      }
    }
    return false
  }

  async function authGuard() {
    await getCurrentUser()
    const { user } = useUserStore()
    return user !== undefined
  }

  async function unauthGuard() {
    await getCurrentUser()
    const { user } = useUserStore()
    return user === undefined
  }

  return { logout, logonWithGoogle, verifyEmail, authGuard, unauthGuard, checkEmailSignInLink }
}
