import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import QlMarkdown from '../text/QlMarkdown.vue'
import QlNamedText from '../text/QlNamedText.vue'
import QlText from '../text/QlText.vue'
import TextEdit from '../text/TextEdit.vue'
import { siteComponentStubs } from './componentStubs'

const mocks = vi.hoisted(() => ({
  getNamedTextId: vi.fn(),
  textById: new Map<string, unknown>(),
}))

vi.mock('@/dao/TextDAO', () => ({
  default: {
    getById: (id: string) => ({
      id,
      path: `text/${id}`,
      __data: mocks.textById.get(id),
    }),
  },
}))

vi.mock('@/services/TextService', () => ({
  useText: () => ({
    getNamedTextId: mocks.getNamedTextId,
  }),
}))

vi.mock('vuefire', async () => {
  const { ref } = await import('vue')

  return {
    useDocument: (source: unknown) => {
      const resolved = typeof source === 'function' ? source() : source
      const value = (resolved as { __data?: unknown } | undefined)?.__data
      const holder = ref(value)
      return Object.assign(holder, {
        error: undefined,
        pending: false,
      })
    },
  }
})

vi.mock('@vueup/vue-quill', async () => {
  const { defineComponent, h } = await import('vue')

  return {
    QuillEditor: defineComponent({
      props: {
        content: String,
      },
      emits: ['update:content'],
      setup(props, { emit }) {
        return () =>
          h('textarea', {
            'aria-label': 'HTML',
            value: props.content ?? '',
            onInput: (event: Event) =>
              emit('update:content', (event.target as HTMLTextAreaElement).value),
          })
      },
    }),
  }
})

beforeEach(() => {
  vi.clearAllMocks()
  mocks.textById.clear()
  mocks.getNamedTextId.mockResolvedValue('rules-text')
})

describe('text site components', () => {
  it('keeps QlMarkdown in sync with text prop changes', async () => {
    const wrapper = mount(QlMarkdown, {
      props: {
        text: '# Heading',
      },
      global: {
        stubs: siteComponentStubs,
      },
    })

    expect(wrapper.get('[data-test="markdown"]').text()).toBe('# Heading')

    await wrapper.setProps({
      text: 'Updated copy',
    })

    expect(wrapper.get('[data-test="markdown"]').text()).toBe('Updated copy')
  })

  it('renders text/plain, text/html and text/markdown content by mime type', () => {
    mocks.textById.set('plain', {
      id: 'plain',
      text: 'Plain copy',
      mimeType: 'text/plain',
    })
    mocks.textById.set('html', {
      id: 'html',
      text: '<p><strong>HTML copy</strong></p>',
      mimeType: 'text/html',
    })
    mocks.textById.set('markdown', {
      id: 'markdown',
      text: '**Markdown copy**',
      mimeType: 'text/markdown',
    })

    const plain = mount(QlText, {
      props: {
        id: 'plain',
      },
      global: {
        stubs: siteComponentStubs,
      },
    })
    const html = mount(QlText, {
      props: {
        id: 'html',
      },
      global: {
        stubs: siteComponentStubs,
      },
    })
    const markdown = mount(QlText, {
      props: {
        id: 'markdown',
      },
      global: {
        stubs: siteComponentStubs,
      },
    })

    expect(plain.text()).toContain('Plain copy')
    expect(html.html()).toContain('<strong>HTML copy</strong>')
    expect(markdown.get('[data-test="markdown"]').text()).toBe('**Markdown copy**')
  })

  it('shows a skeleton while text content is unresolved', () => {
    const wrapper = mount(QlText, {
      props: {
        id: 'missing',
      },
      global: {
        stubs: siteComponentStubs,
      },
    })

    expect(wrapper.get('[data-skeleton-type="paragraph"]').exists()).toBe(true)
  })

  it('resolves named text ids before rendering QlText', async () => {
    const qlTextStub = defineComponent({
      props: {
        id: String,
      },
      setup(props) {
        return () => h('span', { 'data-test': 'ql-text-id' }, props.id)
      },
    })

    const wrapper = mount(QlNamedText, {
      props: {
        textName: 'rules-text',
      },
      global: {
        stubs: {
          ...siteComponentStubs,
          QlText: qlTextStub,
        },
      },
    })
    await flushPromises()

    expect(mocks.getNamedTextId).toHaveBeenCalledWith('rules-text')
    expect(wrapper.get('[data-test="ql-text-id"]').text()).toBe('rules-text')
  })

  it('copies text edits locally and emits updates plus saves', async () => {
    const wrapper = mount(TextEdit, {
      props: {
        modelValue: {
          id: 'text-1',
          path: 'text/text-1',
          text: 'Original text',
          mimeType: 'text/plain',
        },
      },
      global: {
        stubs: siteComponentStubs,
      },
    })

    await wrapper.get('select').setValue('text/markdown')
    await nextTick()
    await wrapper.get('textarea[aria-label="Markdown"]').setValue('**Updated**')
    await nextTick()
    await wrapper.get('button').trigger('click')

    expect(wrapper.emitted('update:modelValue')).toContainEqual([
      expect.objectContaining({
        id: 'text-1',
        text: '**Updated**',
        mimeType: 'text/markdown',
      }),
    ])
    expect(wrapper.emitted('save')).toEqual([
      [
        expect.objectContaining({
          id: 'text-1',
          text: '**Updated**',
          mimeType: 'text/markdown',
        }),
      ],
    ])
  })

  it('renders an empty state when no text model is selected', () => {
    const wrapper = mount(TextEdit, {
      global: {
        stubs: siteComponentStubs,
      },
    })

    expect(wrapper.text()).toContain('No text selected')
  })
})
