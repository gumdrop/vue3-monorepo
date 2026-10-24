import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { siteComponentStubs } from '../../__tests__/componentStubs'
import QuizMasterMain from '../QuizMasterMain.vue'

const mocks = vi.hoisted(() => ({
  user: { siteUser: { user: { id: 'u1' } } },
  setSidemenu: vi.fn(),
  setResumeStep: vi.fn(),
  finishResume: vi.fn(),
}))

vi.mock('@/stores/app', () => ({
  useUserStore: () => ({ user: mocks.user }),
  useSideMenuStore: () => ({ setSidemenu: mocks.setSidemenu }),
}))

vi.mock('@/stores/quizmaster', () => ({
  useQuizmasterStore: () => ({
    resumeStep: 2,
    setResumeStep: mocks.setResumeStep,
    finishResume: mocks.finishResume,
  }),
}))

vi.mock('../QuizMasterSetup.vue', () => ({ default: { render: () => null } }))
vi.mock('../QuizMasterReview.vue', () => ({ default: { render: () => null } }))
vi.mock('../QuizMasterMatch.vue', () => ({ default: { render: () => null } }))
vi.mock('../QuizMasterResult.vue', () => ({ default: { render: () => null } }))

describe('QuizMasterMain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('hides the left-hand side menu like the home page', () => {
    mount(QuizMasterMain, {
      global: { stubs: siteComponentStubs },
    })

    expect(mocks.setSidemenu).toHaveBeenCalledWith(false)
  })
})
