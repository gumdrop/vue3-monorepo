import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useText } from '../TextService'

const mocks = vi.hoisted(() => ({
  applicationContextDAO: {
    getAppContext: vi.fn(),
  },
  globalTextDAO: {
    getData: vi.fn(),
  },
}))

vi.mock('@/dao/ApplicationContextDAO', () => ({
  default: mocks.applicationContextDAO,
}))

vi.mock('@/dao/GlobalTextDAO', () => ({
  default: mocks.globalTextDAO,
}))

describe('TextService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads a named text id from the current application text set', async () => {
    mocks.applicationContextDAO.getAppContext.mockResolvedValue({
      textSet: { id: 'global-text', path: 'globaltext/global-text' },
    })
    mocks.globalTextDAO.getData.mockResolvedValue({
      text: {
        rules: { id: 'rules-text', path: 'text/rules-text' },
      },
    })

    await expect(useText().getNamedTextId('rules')).resolves.toBe('rules-text')
    expect(mocks.globalTextDAO.getData).toHaveBeenCalledWith({
      id: 'global-text',
      path: 'globaltext/global-text',
    })
  })

  it('returns undefined when the named text is unavailable', async () => {
    mocks.applicationContextDAO.getAppContext.mockResolvedValue(undefined)
    mocks.globalTextDAO.getData.mockResolvedValue(undefined)

    await expect(useText().getNamedTextId('rules')).resolves.toBeUndefined()
  })

  it('returns undefined when the current text set does not contain the requested name', async () => {
    mocks.applicationContextDAO.getAppContext.mockResolvedValue({
      textSet: { id: 'global-text', path: 'globaltext/global-text' },
    })
    mocks.globalTextDAO.getData.mockResolvedValue({
      text: {
        login: { id: 'login-text', path: 'text/login-text' },
      },
    })

    await expect(useText().getNamedTextId('help-content-mobiles')).resolves.toBeUndefined()
  })
})
