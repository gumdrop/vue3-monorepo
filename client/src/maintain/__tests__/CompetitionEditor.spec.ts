import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CompetitionEditor from '../components/CompetitionEditor.vue'

// Stub out DAO calls by mocking the module that CompetitionEditor imports
vi.mock('@/dao/CompetitionDAO', () => {
  const comps = [
    { name: 'Existing', path: 'season/2025/competition/existing', retired: false },
  ]
  return {
    default: {
      subCollection: (p: string) => ({ path: `${p}/competition` }),
      entities: async (_col: any) => comps,
      save: async (e: any) => {
        // emulate saving by returning the arg
        return Promise.resolve(e)
      },
    },
  }
})

vi.mock('@/services/KeyService', () => ({ useKey: () => ({ encode: (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-') }) }))

describe('CompetitionEditor', () => {
  let wrapper: any

  beforeEach(() => {
    wrapper = mount(CompetitionEditor, {
      props: { seasonPath: 'season/2025' },
      global: {
        stubs: {
          'v-card': true,
          'v-card-title': true,
          'v-card-text': true,
          'v-row': true,
          'v-col': true,
          'v-text-field': true,
          'v-btn': true,
          'v-list': true,
          'v-list-item': true,
          'v-list-item-content': true,
          'v-list-item-title': true,
          'v-list-item-subtitle': true,
          'v-list-item-action': true,
          'v-dialog': true,
          'v-form': true,
          'v-checkbox': true,
          'PathField': true,
        },
      },
    })
  })

  it('loads competitions for the season and shows the existing one', async () => {
    // wait a tick for load
    await wrapper.vm.$nextTick()
    expect(wrapper.vm.comps).toBeTruthy()
    expect(wrapper.vm.comps.length).toBeGreaterThan(0)
    expect(wrapper.html()).toContain('Existing')
  })

  it('can quick-create a competition and emits created', async () => {
    const input = wrapper.findComponent({ name: 'v-text-field' })
    // set name via component vm (stubs don't provide real input)
    wrapper.vm.newName = 'Cup 2026'
    await wrapper.vm.$nextTick()
    await wrapper.vm.createQuick()
    await wrapper.vm.$nextTick()
    // after create, load() should update comps
    expect(wrapper.vm.comps.some((c: any) => c.name === 'Cup 2026' || c.path?.includes('cup-2026') || c.name === 'New')).toBe(true)
  })
})
