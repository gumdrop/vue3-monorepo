import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import LeagueTableRow from '../LeagueTableRow.vue'
import { useUserStore } from '@/stores/app'

// Mock the store
vi.mock('@/stores/app', () => ({
  useUserStore: vi.fn(),
}))

// Mock vuefire
vi.mock('vuefire', () => ({
  useDocument: vi.fn(),
}))

describe('LeagueTableRow', () => {
  it('highlights the row if it is the user\'s team', () => {
    // Setup mock
    const mockUserStore = {
      user: {
        team: { id: 'team-1' }
      }
    }
    vi.mocked(useUserStore).mockReturnValue(mockUserStore as any)

    const row = {
      team: { id: 'team-1' },
      position: '1',
      played: 1,
      won: 1,
      lost: 0,
      drawn: 0,
      leaguePoints: 2,
      matchPointsFor: 10,
      matchPointsAgainst: 0
    }

    const wrapper = mount(LeagueTableRow, {
      props: { row },
      global: {
        stubs: {
          RouterLink: true,
          ResponsiveTeamName: true
        }
      }
    })

    expect(wrapper.classes()).toContain('highlight-team')
  })

  it('does not highlight the row if it is not the user\'s team', () => {
    // Setup mock
    const mockUserStore = {
      user: {
        team: { id: 'team-2' }
      }
    }
    vi.mocked(useUserStore).mockReturnValue(mockUserStore as any)

    const row = {
      team: { id: 'team-1' },
      position: '1',
      played: 1,
      won: 1,
      lost: 0,
      drawn: 0,
      leaguePoints: 2,
      matchPointsFor: 10,
      matchPointsAgainst: 0
    }

    const wrapper = mount(LeagueTableRow, {
      props: { row },
      global: {
        stubs: {
          RouterLink: true,
          ResponsiveTeamName: true
        }
      }
    })

    expect(wrapper.classes()).not.toContain('highlight-team')
  })
})
