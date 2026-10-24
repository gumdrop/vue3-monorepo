import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { siteComponentStubs } from '../../__tests__/componentStubs'
import IndividualRoundSetup from '../IndividualRoundSetup.vue'

vi.mock('@/stores/quizmaster', () => ({
  useQuizmasterStore: () => ({
    fixture: { homeName: 'Home Team', awayName: 'Away Team' },
    homePlayers: ['Alice', 'Bob', 'Carol'],
    awayPlayers: ['Dave', 'Eve', 'Frank'],
  }),
}))

const round = { round: 'ROUND ONE', subjects: ['History', 'Geography', 'Science'] }

const mountSetup = () =>
  mount(IndividualRoundSetup, {
    props: { roundIndex: 0, round },
    global: { stubs: siteComponentStubs },
  })

describe('IndividualRoundSetup', () => {
  it('removes a selected player from the other contestant dropdowns', async () => {
    const wrapper = mountSetup()
    const selects = wrapper.findAll('select')

    // Contestant selects come first (one home/away pair per subject); the two
    // joker selects come last.
    const homeSelects = [selects[0], selects[2], selects[4]]
    const awaySelects = [selects[1], selects[3], selects[5]]

    const optionTexts = (select: (typeof selects)[number]) =>
      select.findAll('option').map((option) => option.text())

    await homeSelects[0].setValue('Alice')
    await awaySelects[0].setValue('Dave')

    expect(optionTexts(homeSelects[1])).not.toContain('Alice')
    expect(optionTexts(homeSelects[1])).toEqual(expect.arrayContaining(['Bob', 'Carol']))
    expect(optionTexts(homeSelects[2])).not.toContain('Alice')

    expect(optionTexts(awaySelects[1])).not.toContain('Dave')
    expect(optionTexts(awaySelects[1])).toEqual(expect.arrayContaining(['Eve', 'Frank']))
    expect(optionTexts(awaySelects[2])).not.toContain('Dave')
  })

  it('enables Start round only once both jokers are allocated', async () => {
    const wrapper = mountSetup()
    const selects = wrapper.findAll('select')

    const homeSelects = [selects[0], selects[2], selects[4]]
    const awaySelects = [selects[1], selects[3], selects[5]]
    const homeJokerSelect = selects[6]
    const awayJokerSelect = selects[7]

    const startButton = () => {
      const button = wrapper
        .findAll('button')
        .find((candidate) => candidate.text().includes('Start round'))
      expect(button, 'button with text "Start round"').toBeDefined()
      return button!
    }

    await homeSelects[0].setValue('Alice')
    await homeSelects[1].setValue('Bob')
    await homeSelects[2].setValue('Carol')
    await awaySelects[0].setValue('Dave')
    await awaySelects[1].setValue('Eve')
    await awaySelects[2].setValue('Frank')

    // All contestants assigned but jokers still on the default "None".
    expect(startButton().attributes('disabled')).toBeDefined()

    await homeJokerSelect.setValue('History')
    await awayJokerSelect.setValue('Geography')

    expect(startButton().attributes('disabled')).toBeUndefined()
  })

  it('lets a short-handed team assign one player to two categories', async () => {
    const wrapper = mount(IndividualRoundSetup, {
      props: {
        roundIndex: 0,
        round: {
          round: 'ROUND ONE',
          subjects: ['History', 'Geography', 'Science', 'Music'],
        },
      },
      global: { stubs: siteComponentStubs },
    })
    const selects = wrapper.findAll('select')
    const homeSelects = [selects[0], selects[2], selects[4], selects[6]]

    await homeSelects[0].setValue('Alice')

    const optionTexts = (select: (typeof selects)[number]) =>
      select.findAll('option').map((option) => option.text())

    // Only 3 players for 4 categories, so a chosen player may be reused in the
    // remaining categories rather than being excluded.
    expect(optionTexts(homeSelects[3])).toContain('Alice')
  })

  it('allows starting with a category left unassigned once jokers are set', async () => {
    const wrapper = mount(IndividualRoundSetup, {
      props: {
        roundIndex: 0,
        round: {
          round: 'ROUND ONE',
          subjects: ['History', 'Geography', 'Science', 'Music'],
        },
      },
      global: { stubs: siteComponentStubs },
    })
    const selects = wrapper.findAll('select')
    const homeSelects = [selects[0], selects[2], selects[4], selects[6]]
    const awaySelects = [selects[1], selects[3], selects[5], selects[7]]
    const homeJokerSelect = selects[8]
    const awayJokerSelect = selects[9]

    const startButton = () => {
      const button = wrapper
        .findAll('button')
        .find((candidate) => candidate.text().includes('Start round'))
      expect(button, 'button with text "Start round"').toBeDefined()
      return button!
    }

    await homeSelects[0].setValue('Alice')
    await homeSelects[1].setValue('Bob')
    await homeSelects[2].setValue('Carol')
    // homeSelects[3] (Music) deliberately left unassigned.

    await awaySelects[0].setValue('Dave')
    await awaySelects[1].setValue('Eve')
    await awaySelects[2].setValue('Frank')
    // awaySelects[3] (Music) deliberately left unassigned too.

    await homeJokerSelect.setValue('History')
    await awayJokerSelect.setValue('Geography')

    expect(startButton().attributes('disabled')).toBeUndefined()
  })
})
