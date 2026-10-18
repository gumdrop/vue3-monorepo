// Renders <u>...</u> markers from the quiz parser as real underlines, escaping
// everything else to avoid injecting arbitrary HTML.
export const underlineHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&lt;u&gt;/g, '<u>')
    .replace(/&lt;\/u&gt;/g, '</u>')
