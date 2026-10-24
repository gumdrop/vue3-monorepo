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
})
