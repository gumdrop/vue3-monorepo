import { defineComponent, h, inject, onMounted, provide, type PropType } from 'vue'

type SelectItem = Record<string, unknown>
const buttonToggleSymbol = Symbol('button-toggle')

const passthrough = (tag = 'div') =>
  defineComponent({
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(tag, attrs, slots.default?.())
    },
  })

const itemValue = (item: SelectItem | string, key: string) =>
  typeof item === 'string' ? item : (item[key] as string | number | undefined)

export const siteComponentStubs = {
  RouterLink: defineComponent({
    props: {
      to: [String, Object],
    },
    setup(props, { slots }) {
      return () => h('a', { href: String(props.to) }, slots.default?.())
    },
  }),
  RouterView: passthrough(),
  VueShowdown: defineComponent({
    props: {
      markdown: String,
    },
    setup(props) {
      return () => h('div', { 'data-test': 'markdown' }, props.markdown)
    },
  }),
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
  QlChat: passthrough(),
  VAlert: defineComponent({
    props: {
      modelValue: {
        type: Boolean,
        default: true,
      },
      modelValueDefault: Boolean,
      type: String,
    },
    setup(props, { slots }) {
      return () =>
        props.modelValue ? h('div', { 'data-alert-type': props.type }, slots.default?.()) : null
    },
  }),
  VApp: passthrough(),
  VAppBar: passthrough(),
  VAppBarNavIcon: defineComponent({
    inheritAttrs: false,
    setup(_, { attrs }) {
      return () => h('button', attrs, 'Menu')
    },
  }),
  VAvatar: defineComponent({
    props: {
      image: String,
    },
    setup(props, { slots }) {
      return () => h('span', { 'data-image': props.image }, slots.default?.())
    },
  }),
  VBtn: defineComponent({
    props: {
      disabled: Boolean,
      icon: [Boolean, String],
      to: String,
      href: String,
      title: String,
      value: [String, Number],
    },
    inheritAttrs: false,
    setup(props, { attrs, slots }) {
      const updateToggle = inject<((value: string | number) => void) | undefined>(
        buttonToggleSymbol,
        undefined,
      )
      return () =>
        h(
          'button',
          {
            ...attrs,
            disabled: props.disabled,
            'data-to': props.to,
            'data-href': props.href,
            'data-title': props.title,
            value: props.value,
            onClick: (event: MouseEvent) => {
              if (props.value !== undefined) {
                updateToggle?.(props.value)
              }
              const clickHandler = attrs.onClick
              if (Array.isArray(clickHandler)) {
                clickHandler.forEach((handler) => handler(event))
              } else if (typeof clickHandler === 'function') {
                clickHandler(event)
              }
            },
          },
          slots.default?.() || props.icon || '',
        )
    },
  }),
  VBtnToggle: defineComponent({
    props: {
      modelValue: [String, Number],
    },
    emits: ['update:modelValue'],
    setup(_, { emit, slots }) {
      provide(buttonToggleSymbol, (value: string | number) => {
        emit('update:modelValue', value)
      })
      return () => h('div', slots.default?.())
    },
  }),
  VCard: passthrough(),
  VCardActions: passthrough(),
  VCardSubtitle: passthrough(),
  VCardText: passthrough(),
  VCardTitle: passthrough('h2'),
  VChip: passthrough('span'),
  VCol: passthrough(),
  VCombobox: defineComponent({
    props: {
      items: {
        type: Array as PropType<(SelectItem | string)[]>,
        default: () => [],
      },
      label: String,
      modelValue: Array,
    },
    emits: ['update:modelValue'],
    setup(props) {
      return () =>
        h('label', [
          props.label ? h('span', props.label) : null,
          h(
            'select',
            { multiple: true, 'aria-label': props.label },
            props.items.map((item) =>
              h(
                'option',
                { value: itemValue(item, 'id') ?? itemValue(item, 'value') },
                String(itemValue(item, 'title') ?? item),
              ),
            ),
          ),
        ])
    },
  }),
  VContainer: passthrough(),
  VDataTable: defineComponent({
    props: {
      headers: Array,
      items: {
        type: Array as PropType<SelectItem[]>,
        default: () => [],
      },
    },
    setup(props) {
      return () =>
        h('table', { 'data-test': 'data-table' }, [
          h(
            'tbody',
            props.items.map((item) =>
              h(
                'tr',
                Object.values(item).map((value) => h('td', String(value))),
              ),
            ),
          ),
        ])
    },
  }),
  VDialog: defineComponent({
    props: {
      modelValue: Boolean,
    },
    setup(props, { slots }) {
      return () => (props.modelValue ? h('div', slots.default?.()) : null)
    },
  }),
  VDivider: passthrough('hr'),
  VExpandTransition: passthrough(),
  'v-expand-transition': passthrough(),
  ExpandTransition: passthrough(),
  VFileInput: defineComponent({
    props: {
      label: String,
    },
    emits: ['change'],
    inheritAttrs: false,
    setup(props, { attrs, emit }) {
      return () =>
        h('input', {
          ...attrs,
          'aria-label': props.label,
          type: 'file',
          onChange: (event: Event) => emit('change', event),
        })
    },
  }),
  VFlex: passthrough(),
  VForm: defineComponent({
    props: {
      modelValue: Boolean,
    },
    emits: ['update:modelValue'],
    setup(_, { emit, slots }) {
      onMounted(() => emit('update:modelValue', true))
      return () => h('form', slots.default?.())
    },
  }),
  VIcon: passthrough('span'),
  VImg: passthrough('img'),
  VLazy: passthrough(),
  VLayout: passthrough(),
  VList: passthrough(),
  VListGroup: defineComponent({
    props: {
      value: String,
    },
    setup(props, { slots }) {
      return () =>
        h('div', [
          slots.activator?.({ props: { 'data-open-value': props.value } }),
          slots.default?.(),
        ])
    },
  }),
  VListItem: defineComponent({
    props: {
      title: String,
      to: String,
      href: String,
      prependIcon: String,
    },
    inheritAttrs: false,
    setup(props, { attrs, slots }) {
      return () =>
        h(
          props.href ? 'a' : 'button',
          {
            ...attrs,
            'data-to': props.to,
            href: props.href,
            'data-title': props.title,
            onClick: (event: MouseEvent) => {
              const clickHandler = attrs.onClick
              if (Array.isArray(clickHandler)) {
                clickHandler.forEach((handler) => handler(event))
              } else if (typeof clickHandler === 'function') {
                clickHandler(event)
              }
            },
          },
          slots.default?.() || props.title,
        )
    },
  }),
  VListItemTitle: passthrough(),
  'v-list-item-title': passthrough(),
  VMain: passthrough('main'),
  VMenu: defineComponent({
    setup(_, { slots }) {
      return () =>
        h('div', [
          slots.activator?.({ props: { 'data-menu-activator': 'true' } }),
          slots.default?.(),
        ])
    },
  }),
  VNavigationDrawer: defineComponent({
    props: {
      modelValue: Boolean,
    },
    setup(props, { slots }) {
      return () => (props.modelValue ? h('nav', slots.default?.()) : null)
    },
  }),
  VProgressCircular: passthrough('progress'),
  VRow: passthrough(),
  VSelect: defineComponent({
    props: {
      modelValue: [String, Number],
      items: {
        type: Array as PropType<(SelectItem | string)[]>,
        default: () => [],
      },
      itemTitle: {
        type: String,
        default: 'title',
      },
      itemValue: {
        type: String,
        default: 'value',
      },
      label: String,
    },
    emits: ['update:modelValue'],
    inheritAttrs: false,
    setup(props, { attrs, emit }) {
      const title = (item: SelectItem | string) => itemValue(item, props.itemTitle) ?? item
      const value = (item: SelectItem | string) => itemValue(item, props.itemValue) ?? item
      return () =>
        h('label', [
          props.label ? h('span', props.label) : null,
          h(
            'select',
            {
              ...attrs,
              'aria-label': props.label,
              value: props.modelValue ?? '',
              onChange: (event: Event) =>
                emit('update:modelValue', (event.target as HTMLSelectElement).value),
            },
            [
              h('option', { value: '' }, ''),
              ...props.items.map((item) =>
                h('option', { value: value(item) }, String(title(item))),
              ),
            ],
          ),
        ])
    },
  }),
  VSheet: passthrough(),
  VSkeletonLoader: defineComponent({
    props: {
      type: String,
    },
    setup(props) {
      return () => h('div', { 'data-skeleton-type': props.type }, 'Loading')
    },
  }),
  VSlideYTransition: passthrough(),
  'v-slide-y-transition': passthrough(),
  SlideYTransition: passthrough(),
  VSpacer: passthrough('span'),
  VTab: passthrough('button'),
  VTabs: passthrough(),
  VTabsWindow: passthrough(),
  VTabsWindowItem: passthrough(),
  VTable: passthrough('table'),
  VTextarea: defineComponent({
    props: {
      modelValue: String,
      label: String,
    },
    emits: ['update:modelValue'],
    inheritAttrs: false,
    setup(props, { attrs, emit }) {
      return () =>
        h('textarea', {
          ...attrs,
          'aria-label': props.label,
          value: props.modelValue ?? '',
          onInput: (event: Event) =>
            emit('update:modelValue', (event.target as HTMLTextAreaElement).value),
        })
    },
  }),
  VTextField: defineComponent({
    props: {
      modelValue: [String, Number],
      label: String,
      type: String,
    },
    emits: ['update:modelValue'],
    inheritAttrs: false,
    setup(props, { attrs, emit }) {
      return () =>
        h('input', {
          ...attrs,
          'aria-label': props.label,
          type: props.type || 'text',
          value: props.modelValue ?? '',
          onInput: (event: Event) =>
            emit('update:modelValue', (event.target as HTMLInputElement).value),
        })
    },
  }),
  VToolbar: passthrough(),
  VToolbarTitle: passthrough('h1'),
  VTooltip: defineComponent({
    props: {
      text: String,
    },
    setup(props, { slots }) {
      return () => h('span', [slots.activator?.({ props: { title: props.text } })])
    },
  }),
  VWindow: passthrough(),
  VWindowItem: passthrough(),
}
