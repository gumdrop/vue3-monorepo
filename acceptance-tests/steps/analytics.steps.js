const assert = require('node:assert/strict')
const { createBdd } = require('playwright-bdd')

const { Then, When } = createBdd()

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const analyticsCompetitionSelector = (page) => page.locator('.analytics-competition-select')

const analyticsMenuLink = (page, label) =>
  page.getByRole('link', {
    name: new RegExp(`^\\s*${escapeRegExp(label)}\\s*$`, 'i'),
  })

When('I open the analytics page', async ({ page }) => {
  await page.goto('/analytics')
})

When('I select {string} from the analytics competition selector', async ({ page }, label) => {
  await analyticsCompetitionSelector(page).locator('.v-field').click()
  await page.getByRole('option', { name: label, exact: true }).click()
})

When('I choose {string} from the analytics menu', async ({ page }, label) => {
  await analyticsMenuLink(page, label).last().click()
})

Then('the analytics competition selector should show {string}', async ({ page }, expectedValue) => {
  const selectorInput = analyticsCompetitionSelector(page).locator('input')
  await selectorInput.waitFor({ state: 'visible' })
  await page.waitForFunction(
    ({ expectedValue }) => {
      const input = document.querySelector('.analytics-competition-select input')
      return input?.value === expectedValue
    },
    { expectedValue },
  )
  assert.equal(await selectorInput.inputValue(), expectedValue)
})

Then('the analytics menu includes:', async ({ page }, dataTable) => {
  for (const [label] of dataTable.raw()) {
    await analyticsMenuLink(page, label).last().waitFor({ state: 'visible' })
  }
})
