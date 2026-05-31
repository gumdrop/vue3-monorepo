import { defineComponent, h, onMounted, type PropType } from 'vue'

type SelectItem = Record<string, unknown>
type SelectItemKey = string | ((item: SelectItem) => unknown)

const passthrough = (tag = 'div') =>
  defineComponent({
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      return () => h(tag, attrs, slots.default?.())
    },
  })

const itemValue = (item: SelectItem, key: SelectItemKey) => {
  const value = typeof key === 'function' ? key(item) : item[key]
  return value == null ? '' : String(value)
}

export const maintenanceComponentStubs = {
  RouterView: passthrough(),
  TextEdit: defineComponent({
    props: {
      modelValue: Object,
    },
    emits: ['save', 'update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h(
          'button',
          { 'data-test': 'text-edit-save', onClick: () => emit('save', props.modelValue) },
          'Save Text',
        )
    },
  }),
  EntitySelect: defineComponent({
    props: {
      modelValue: Object,
      label: String,
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      return () =>
        h(
          'button',
          {
            'data-test': 'entity-select',
            onClick: () => emit('update:modelValue', props.modelValue),
          },
          props.label,
        )
    },
  }),
  VAlert: passthrough(),
  VApp: passthrough(),
  VAppBar: passthrough(),
  VAppBarNavIcon: defineComponent({
    inheritAttrs: false,
    setup(_, { attrs }) {
      return () => h('button', attrs, 'Menu')
    },
  }),
  VCard: passthrough(),
  VCardActions: passthrough(),
  VCardText: passthrough(),
  VCardTitle: passthrough(),
  VCol: passthrough(),
  VContainer: passthrough(),
  VDivider: passthrough('hr'),
  VList: passthrough(),
  VListItemTitle: passthrough(),
  VListItemSubtitle: passthrough(),
  VMain: passthrough('main'),
  VNavigationDrawer: defineComponent({
    props: {
      modelValue: Boolean,
    },
    setup(props, { slots }) {
      return () => (props.modelValue ? h('nav', slots.default?.()) : null)
    },
  }),
  VRow: passthrough(),
  VSpacer: passthrough('span'),
  VTable: passthrough('table'),
  VToolbarTitle: passthrough('h1'),
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
  VBtn: defineComponent({
    props: {
      disabled: Boolean,
      icon: String,
      to: String,
    },
    inheritAttrs: false,
    setup(props, { attrs, slots }) {
      return () =>
        h(
          'button',
          { ...attrs, disabled: props.disabled, 'data-to': props.to },
          slots.default?.() || props.icon || '',
        )
    },
  }),
  VCheckbox: defineComponent({
    props: {
      modelValue: Boolean,
      label: String,
    },
    emits: ['update:modelValue'],
    inheritAttrs: false,
    setup(props, { attrs, emit }) {
      return () =>
        h('label', [
          props.label,
          h('input', {
            ...attrs,
            'aria-label': props.label,
            checked: props.modelValue,
            type: 'checkbox',
            onChange: (event: Event) =>
              emit('update:modelValue', (event.target as HTMLInputElement).checked),
          }),
        ])
    },
  }),
  VChip: defineComponent({
    props: {
      closable: Boolean,
    },
    emits: ['click:close'],
    inheritAttrs: false,
    setup(props, { attrs, emit, slots }) {
      return () =>
        h('span', attrs, [
          slots.default?.(),
          props.closable
            ? h(
                'button',
                {
                  'data-test': `${String(attrs['data-test'])}-close`,
                  onClick: () => emit('click:close'),
                },
                'Remove',
              )
            : null,
        ])
    },
  }),
  VDialog: defineComponent({
    props: {
      modelValue: Boolean,
    },
    inheritAttrs: false,
    setup(props, { attrs, slots }) {
      return () => (props.modelValue ? h('div', attrs, slots.default?.()) : null)
    },
  }),
  VListItem: defineComponent({
    props: {
      title: String,
      to: String,
      prependIcon: String,
    },
    inheritAttrs: false,
    setup(props, { attrs, slots }) {
      return () =>
        h('button', { ...attrs, 'data-to': props.to, 'data-title': props.title }, [
          slots.default?.() || props.title,
          slots.append?.(),
        ])
    },
  }),
  VAutocomplete: defineComponent({
    props: {
      modelValue: [Object, String, Number],
      items: {
        type: Array as PropType<SelectItem[]>,
        default: () => [],
      },
      itemTitle: {
        type: [String, Function] as PropType<SelectItemKey>,
        default: 'title',
      },
      itemValue: {
        type: String,
        default: 'value',
      },
      label: String,
      disabled: Boolean,
    },
    emits: ['update:modelValue'],
    inheritAttrs: false,
    setup(props, { attrs, emit }) {
      return () =>
        h('label', [
          props.label ? h('span', props.label) : null,
          h(
            'select',
            {
              'data-test': attrs['data-test'],
              disabled: props.disabled,
              value: (props.modelValue as SelectItem | null)?.[props.itemValue] ?? '',
              onChange: (event: Event) => {
                const value = (event.target as HTMLSelectElement).value
                emit(
                  'update:modelValue',
                  props.items.find((item) => itemValue(item, props.itemValue) === value),
                )
              },
            },
            [
              h('option', { value: '' }, ''),
              ...props.items.map((item) =>
                h(
                  'option',
                  { value: itemValue(item, props.itemValue) },
                  itemValue(item, props.itemTitle),
                ),
              ),
            ],
          ),
        ])
    },
  }),
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
      const optionValue = (item: SelectItem | string) =>
        typeof item === 'string' ? item : itemValue(item, props.itemValue)
      const optionTitle = (item: SelectItem | string) =>
        typeof item === 'string' ? item : itemValue(item, props.itemTitle)
      return () =>
        h('label', [
          props.label ? h('span', props.label) : null,
          h(
            'select',
            {
              'data-test': attrs['data-test'],
              value: props.modelValue ?? '',
              onChange: (event: Event) =>
                emit('update:modelValue', (event.target as HTMLSelectElement).value),
            },
            [
              h('option', { value: '' }, ''),
              ...props.items.map((item) =>
                h('option', { value: optionValue(item) }, optionTitle(item)),
              ),
            ],
          ),
        ])
    },
  }),
  VTextField: defineComponent({
    props: {
      modelValue: [String, Number],
      label: String,
      type: String,
      appendInnerIcon: String,
    },
    emits: ['update:modelValue'],
    inheritAttrs: false,
    setup(props, { attrs, emit }) {
      return () =>
        h('label', [
          h('input', {
            ...attrs,
            'aria-label': props.label,
            type: props.type || 'text',
            value: props.modelValue ?? '',
            onInput: (event: Event) =>
              emit('update:modelValue', (event.target as HTMLInputElement).value),
          }),
          props.appendInnerIcon
            ? h('span', { 'data-test': `${props.label}-append-inner-icon` }, props.appendInnerIcon)
            : null,
        ])
    },
  }),
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
}
