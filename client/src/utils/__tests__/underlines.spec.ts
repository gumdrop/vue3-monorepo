import { describe, expect, it } from 'vitest'
import { underlineHtml } from '../underlines'

describe('underlineHtml', () => {
  it('renders <u> markers as real underline tags', () => {
    expect(underlineHtml('The <u>Third</u> or <u>Eroica</u>')).toBe(
      'The <u>Third</u> or <u>Eroica</u>',
    )
  })

  it('escapes other HTML', () => {
    expect(underlineHtml('a <script>x</script> & <u>safe</u>')).toBe(
      'a &lt;script&gt;x&lt;/script&gt; &amp; <u>safe</u>',
    )
  })
})
