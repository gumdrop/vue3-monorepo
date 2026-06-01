const { createBdd } = require('playwright-bdd')

const { Given } = createBdd()

Given('I am not signed in', async ({ context }) => {
  await context.clearCookies()
})
