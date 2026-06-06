const { createBdd } = require('playwright-bdd')

const { When } = createBdd()

When('I open the results roundups page', async ({ page }) => {
  await page.goto('/results/roundups')
})
