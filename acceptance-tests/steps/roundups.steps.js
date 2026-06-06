const assert = require('node:assert/strict')
const { createBdd } = require('playwright-bdd')

const { Then, When } = createBdd()

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

When('I open the results roundups page', async ({ page }) => {
  await page.goto('/results/roundups')
})

When('I click the {string} button', async ({ page }, label) => {
  await page
    .getByRole('button', { name: new RegExp(`^\\s*${escapeRegExp(label)}\\s*$`, 'i') })
    .click()
})

Then('the {string} popup should be visible', async ({ page }, title) => {
  await page.getByRole('dialog', { name: new RegExp(title, 'i') }).waitFor({ state: 'visible' })
})

Then('I should see the roundup content in a text box', async ({ page }) => {
  const textBox = page.getByRole('textbox') // Adjust if necessary based on QlTextBox implementation
  await textBox.waitFor({ state: 'visible' })
  const content = await textBox.innerText()
  assert.ok(content.length > 0, 'Roundup content should not be empty')
})
