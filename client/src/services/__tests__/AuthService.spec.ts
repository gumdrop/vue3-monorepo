import { beforeEach, describe, expect, it, vi } from 'vitest'

import useAuth, { EMAIL_NOT_REGISTERED_MESSAGE } from '../AuthService'
import { REST_ROOT } from '../constants'

const mocks = vi.hoisted(() => ({
  axiosGet: vi.fn(),
  getAuth: vi.fn(),
  googleAuthProvider: vi.fn(function GoogleAuthProvider(this: { setCustomParameters: unknown }) {
    this.setCustomParameters = mocks.setCustomParameters
  }),
  saveSiteUser: vi.fn(),
  sendSignInLinkToEmail: vi.fn(),
  isSignInWithEmailLink: vi.fn(),
  signInWithEmailLink: vi.fn(),
  setCustomParameters: vi.fn(),
  setUser: vi.fn(),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  getCurrentUser: vi.fn(),
  userStore: {
    user: undefined as unknown,
    setUser: vi.fn(),
  },
}))

vi.mock('vuefire', () => ({
  getCurrentUser: mocks.getCurrentUser,
}))

vi.mock('@/dao/SiteUserDAO', () => ({
  default: {
    save: mocks.saveSiteUser,
  },
}))

vi.mock('axios', () => ({
  default: {
    get: mocks.axiosGet,
  },
}))

vi.mock('firebase/auth', () => ({
  getAuth: mocks.getAuth,
  GoogleAuthProvider: mocks.googleAuthProvider,
  signInWithPopup: mocks.signInWithPopup,
  signOut: mocks.signOut,
  sendSignInLinkToEmail: mocks.sendSignInLinkToEmail,
  isSignInWithEmailLink: mocks.isSignInWithEmailLink,
  signInWithEmailLink: mocks.signInWithEmailLink,
}))

vi.mock('@/stores/app', () => ({
  useUserStore: () => mocks.userStore,
}))

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getAuth.mockReturnValue({ id: 'auth' })
    mocks.signInWithPopup.mockResolvedValue({
      user: {
        uid: 'firebase-uid',
        email: 'captain@example.com',
        photoURL: '/avatar.png',
        displayName: 'Captain Example',
      },
    })
    mocks.saveSiteUser.mockResolvedValue(undefined)
    mocks.sendSignInLinkToEmail.mockResolvedValue(undefined)
    mocks.isSignInWithEmailLink.mockReturnValue(false)
    mocks.signInWithEmailLink.mockResolvedValue({ user: { uid: 'firebase-uid' } })
    mocks.getCurrentUser.mockResolvedValue({ uid: 'firebase-uid' })
    mocks.userStore.setUser = mocks.setUser
    mocks.userStore.user = undefined
  })

  it('verifies an email through the site user REST endpoint', async () => {
    const siteUserResponse = { data: { id: 'site-user-1', path: 'siteuser/site-user-1' } }
    mocks.axiosGet.mockResolvedValue(siteUserResponse)

    await expect(useAuth().verifyEmail('captain@example.com')).resolves.toBe(
      siteUserResponse.data,
    )

    expect(mocks.axiosGet).toHaveBeenCalledWith(
      `${REST_ROOT}/site-user-for-email/captain@example.com`,
    )
  })

  it('accepts legacy stringified site user REST responses', async () => {
    const siteUser = { id: 'site-user-1', path: 'siteuser/site-user-1' }
    mocks.axiosGet.mockResolvedValue({ data: JSON.stringify(siteUser) })

    await expect(useAuth().verifyEmail('captain@example.com')).resolves.toEqual(siteUser)
  })

  it('returns false when email verification fails', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    mocks.axiosGet.mockRejectedValue(new Error('not registered'))

    try {
      await expect(useAuth().verifyEmail('missing@example.com')).resolves.toBe(false)
    } finally {
      error.mockRestore()
    }
  })

  it('throws the registered user message when email verification returns 404', async () => {
    mocks.axiosGet.mockRejectedValue({
      message: 'Request failed with status code 404',
      response: { status: 404 },
    })

    await expect(useAuth().verifyEmail('missing@example.com')).rejects.toThrow(
      EMAIL_NOT_REGISTERED_MESSAGE,
    )
  })

  it('binds a verified site user to the Google Firebase uid after sign-in', async () => {
    const siteUser = {
      id: 'site-user-1',
      path: 'siteuser/site-user-1',
      handle: '',
      avatar: '',
      user: { id: 'user-1', path: 'user/user-1' },
    }
    mocks.axiosGet.mockResolvedValue({ data: siteUser })

    await useAuth().logonWithGoogle('captain@example.com')

    expect(mocks.googleAuthProvider).toHaveBeenCalledTimes(1)
    expect(mocks.setCustomParameters).toHaveBeenCalledWith({
      login_hint: 'captain@example.com',
    })
    expect(mocks.signInWithPopup).toHaveBeenCalledWith(
      { id: 'auth' },
      expect.any(mocks.googleAuthProvider),
    )
    expect(mocks.saveSiteUser).toHaveBeenCalledWith({
      ...siteUser,
      uid: 'firebase-uid',
      avatar: '/avatar.png',
      handle: 'Captain Example',
    })
    expect(mocks.setUser).toHaveBeenCalledWith({
      uid: 'firebase-uid',
      email: 'captain@example.com',
      photoURL: '/avatar.png',
      displayName: 'Captain Example',
    })
  })

  it('signs out and fails when the Google account does not match the verified email', async () => {
    mocks.axiosGet.mockResolvedValue({ data: { id: 'site-user-1', path: 'siteuser/site-user-1' } })
    mocks.signInWithPopup.mockResolvedValue({
      user: { uid: 'firebase-uid', email: 'other@example.com' },
    })

    await expect(useAuth().logonWithGoogle('captain@example.com')).rejects.toThrow(
      'Google account email does not match the requested login email',
    )

    expect(mocks.signOut).toHaveBeenCalledWith({ id: 'auth' })
    expect(mocks.saveSiteUser).not.toHaveBeenCalled()
  })

  it('does not start Google sign-in without an email', async () => {
    await useAuth().logonWithGoogle(undefined)

    expect(mocks.axiosGet).not.toHaveBeenCalled()
    expect(mocks.signInWithPopup).not.toHaveBeenCalled()
  })

  it('signs out of Firebase when logging out', () => {
    useAuth().logout()

    expect(mocks.signOut).toHaveBeenCalledWith({ id: 'auth' })
  })

  it('guards routes based on the current user store state', async () => {
    const auth = useAuth()

    expect(await auth.authGuard()).toBe(false)
    expect(await auth.unauthGuard()).toBe(true)

    mocks.userStore.user = { id: 'user-1' }

    expect(await auth.authGuard()).toBe(true)
    expect(await auth.unauthGuard()).toBe(false)
  })

  describe('checkEmailSignInLink', () => {
    it('returns false when the URL is not a sign-in link', async () => {
      mocks.isSignInWithEmailLink.mockReturnValue(false)
      expect(await useAuth().checkEmailSignInLink()).toBe(false)
    })

    it('completes the sign-in when the URL is a valid link and email is in storage', async () => {
      const siteUser = { id: 'site-user-1', path: 'siteuser/site-user-1' }
      mocks.isSignInWithEmailLink.mockReturnValue(true)
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('captain@example.com')
      const removeItem = vi.spyOn(Storage.prototype, 'removeItem')
      mocks.axiosGet.mockResolvedValue({ data: siteUser })

      expect(await useAuth().checkEmailSignInLink()).toBe(true)

      expect(mocks.signInWithEmailLink).toHaveBeenCalledWith(
        { id: 'auth' },
        'captain@example.com',
        window.location.href,
      )
      expect(removeItem).toHaveBeenCalledWith('emailForSignIn')
      expect(mocks.setUser).toHaveBeenCalledWith({ uid: 'firebase-uid' })
    })

    it('prompts for email when not in storage', async () => {
      mocks.isSignInWithEmailLink.mockReturnValue(true)
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)
      const prompt = vi.spyOn(window, 'prompt').mockReturnValue('prompted@example.com')
      mocks.axiosGet.mockResolvedValue({ data: { id: 'su-1' } })

      expect(await useAuth().checkEmailSignInLink()).toBe(true)
      expect(prompt).toHaveBeenCalled()
      expect(mocks.signInWithEmailLink).toHaveBeenCalledWith(
        { id: 'auth' },
        'prompted@example.com',
        window.location.href,
      )
    })
  })
})
