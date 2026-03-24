import { describe, it, expect } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import App from '../components/App.vue'

describe('Maintain App', () => {
  it('renders the maintenance title', () => {
    const wrapper = shallowMount(App, {
      global: {
        stubs: {
          'v-app': true,
          'v-app-bar': true,
          'v-toolbar-title': true,
          'v-navigation-drawer': true,
          'v-main': true,
          'v-container': true,
          'v-row': true,
          'v-col': true,
          'v-card': true,
          'v-card-title': true,
          'v-divider': true,
          'v-list': true,
          'v-list-item': true,
          'v-list-item-content': true,
          'v-list-item-title': true,
          'v-list-item-subtitle': true,
          'v-chip-group': true,
          'v-chip': true,
          'v-text-field': true,
          'v-textarea': true,
          'v-btn': true,
          'v-dialog': true,
          'v-card-text': true,
          'v-card-actions': true,
          'v-snackbar': true,
        },
      },
    })

    expect(wrapper.html()).toContain('Quizleague Data Maintenance')
  })
})
