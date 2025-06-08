const hashtagRegex = /(#[a-zA-Z0-9]+)g/
const handleRegex = /(@[a-zA-Z0-9]+)g/

const hashtagExtension = {
  type: 'output',
  filter: (text: string) => text.replace(hashtagRegex, '<a>$1</a>'),
}

const handleExtension = {
  type: 'lang',
  filter: (text: string) => text.replace(handleRegex, '<a>$1</a>'),
}

enum Flavor {
  github = 'github',
}

export const settings = {
  flavor: Flavor.github,
  vueTemplate: false,
  options: { emoji: true, table: true },
  extensions: [hashtagExtension, handleExtension],
}
