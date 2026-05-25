import { beforeEach, describe, expect, it, vi } from 'vitest'

import useTitleService from '../TitleService'

const mocks = vi.hoisted(() => ({
  applicationContextDAO: {
    get: vi.fn(),
  },
  getDoc: vi.fn(),
}))

vi.mock('@/dao/ApplicationContextDAO', () => ({
  default: mocks.applicationContextDAO,
}))

vi.mock('firebase/firestore', () => ({
  getDoc: mocks.getDoc,
}))

describe('TitleService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.title = ''
    mocks.applicationContextDAO.get.mockReturnValue({ path: 'applicationcontext/singleton' })
  })

  it('prefixes the page title with the league name from application context', async () => {
    mocks.getDoc.mockResolvedValue({
      data: () => ({ leagueName: 'Quiz League' }),
    })

    await useTitleService().setTitle('Fixtures')

    expect(document.title).toBe('Quiz League - Fixtures')
    expect(mocks.getDoc).toHaveBeenCalledWith({ path: 'applicationcontext/singleton' })
  })
})
