import { beforeEach, describe, expect, it, vi } from 'vitest'

import useAuth from '../AuthService'
import { REST_ROOT } from '../constants'

const mocks = vi.hoisted(() => ({
  axiosGet: vi.fn(),
  getAuth: vi.fn(),
  googleAuthProvider: vi.fn(function GoogleAuthProvider() {}),
  signInWithPopup: vi.fn(),
  signOut: vi.fn(),
  userStore: {
    user: undefined as unknown,
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
}))

vi.mock('@/stores/app', () => ({
  useUserStore: () => mocks.userStore,
}))

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getAuth.mockReturnValue({ id: 'auth' })
    mocks.signInWithPopup.mockResolvedValue({ user: { email: 'captain@example.com' } })
    mocks.userStore.user = undefined
  })

  it('verifies an email through the site user REST endpoint', async () => {
    const siteUserResponse = { data: { id: 'site-user-1' } }
    mocks.axiosGet.mockResolvedValue(siteUserResponse)

    await expect(useAuth().verifyEmail('captain@example.com')).resolves.toBe(siteUserResponse)

    expect(mocks.axiosGet).toHaveBeenCalledWith(
      `${REST_ROOT}/site-user-for-email/captain@example.com`,
    )
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

  it('starts a Google sign-in after a registered email is found', async () => {
    mocks.axiosGet.mockResolvedValue({ data: { id: 'site-user-1' } })

    await useAuth().logonWithGoogle('captain@example.com')

    expect(mocks.googleAuthProvider).toHaveBeenCalledTimes(1)
    expect(mocks.signInWithPopup).toHaveBeenCalledWith(
      { id: 'auth' },
      expect.any(mocks.googleAuthProvider),
    )
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

  it('guards routes based on the current user store state', () => {
    const auth = useAuth()

    expect(auth.authGuard()).toBe(false)
    expect(auth.unauthGuard()).toBe(true)

    mocks.userStore.user = { id: 'user-1' }

    expect(auth.authGuard()).toBe(true)
    expect(auth.unauthGuard()).toBe(false)
  })
})
