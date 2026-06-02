const assert = require('node:assert/strict')
const { createBdd } = require('playwright-bdd')

const { Then, When } = createBdd()

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const namedLink = (page, label) =>
  page.getByRole('link', { name: new RegExp(`^\\s*${escapeRegExp(label)}\\s*$`, 'i') })

const competitionRoutes = {
  'Challenge Cup': '/competition/season|season-2025-2026|competition|cup-main/cup',
  'Individual Quiz Night':
    '/competition/season|season-2025-2026|competition|individual-quiz/singleton',
  'League Championship': '/competition/season|season-2025-2026|competition|league-main/league',
  'Plate League': '/competition/season|season-2025-2026|competition|subsidiary-main/subsidiary',
}

When('I open the QuizLeague home page', async ({ page }) => {
  await page.goto('/home')
})

When('I open the competitions page', async ({ page }) => {
  await page.goto('/competition')
})

When('I open the results page', async ({ page }) => {
  await page.goto('/results')
})

When('I open the all results page', async ({ page }) => {
  await page.goto('/results/all')
})

When('I open the all fixtures page', async ({ page }) => {
  await page.goto('/fixtures/all')
})

When('I open the questions page', async ({ page }) => {
  await page.goto('/results/questions')
})

When('I open the submit result instructions page', async ({ page }) => {
  await page.goto('/results/submit/instructions')
})

When('I open the teams page', async ({ page }) => {
  await page.goto('/team')
})

When('I open the venues page', async ({ page }) => {
  await page.goto('/venue')
})

When('I open the rules page', async ({ page }) => {
  await page.goto('/rules')
})

When('I open the links page', async ({ page }) => {
  await page.goto('/links')
})

When('I open the contact page', async ({ page }) => {
  await page.goto('/contact')
})

When('I open the help page', async ({ page }) => {
  await page.goto('/help')
})

When('I open the {string} team page', async ({ page }, teamId) => {
  await page.goto(`/team/${teamId}`)
})

When('I open the {string} team statistics page', async ({ page }, teamId) => {
  await page.goto(`/team/${teamId}/stats`)
})

When('I open the {string} competition page', async ({ page }, competitionName) => {
  const route = competitionRoutes[competitionName]
  assert.ok(route, `No competition route configured for "${competitionName}"`)
  await page.goto(route)
})

When('I choose {string} from the competitions menu', async ({ page }, label) => {
  await namedLink(page, label).last().click()
})

When('I choose {string} from the results menu', async ({ page }, label) => {
  await namedLink(page, label).last().click()
})

When('I choose {string} from the teams menu', async ({ page }, label) => {
  await namedLink(page, label).last().click()
})

When('I choose {string} from the venues menu', async ({ page }, label) => {
  await namedLink(page, label).last().click()
})

When('I choose {string} from the contact page', async ({ page }, label) => {
  await page
    .getByRole('button', { name: new RegExp(`^\\s*${escapeRegExp(label)}\\s*$`, 'i') })
    .click()
})

When('I choose the {string} home tab', async ({ page }, label) => {
  await page.getByRole('tab', { name: label, exact: true }).click()
})

Then('I should be on the {string} page', async ({ page }, expectedPath) => {
  const pathName = (url) => decodeURIComponent(new URL(url).pathname)
  await page.waitForURL((url) => pathName(url) === expectedPath)
  assert.equal(pathName(page.url()), expectedPath)
})

Then('I should see the {string} title', async ({ page }, title) => {
  await page.getByRole('heading', { name: title, exact: true }).first().waitFor({
    state: 'visible',
  })
})

Then('I should see text matching {string}', async ({ page }, pattern) => {
  await page
    .getByText(new RegExp(pattern))
    .filter({ visible: true })
    .first()
    .waitFor({ state: 'visible' })
})

Then('I should not see text matching {string}', async ({ page }, pattern) => {
  await page
    .getByText(new RegExp(pattern))
    .filter({ visible: true })
    .first()
    .waitFor({ state: 'hidden' })
})

Then('the {string} field should be visible', async ({ page }, label) => {
  await page.getByLabel(label, { exact: true }).waitFor({ state: 'visible' })
})

Then('the {string} button should be visible', async ({ page }, label) => {
  await page
    .getByRole('button', { name: new RegExp(`^\\s*${escapeRegExp(label)}\\s*$`, 'i') })
    .waitFor({ state: 'visible' })
})

Then('the {string} link should target {string}', async ({ page }, label, expectedHref) => {
  const link = namedLink(page, label).first()
  await link.waitFor({ state: 'visible' })
  assert.equal(await link.getAttribute('href'), expectedHref)
})

Then('the main navigation includes:', async ({ page }, dataTable) => {
  for (const [label] of dataTable.raw()) {
    await namedLink(page, label).first().waitFor({ state: 'visible' })
  }
})

Then('the results menu includes:', async ({ page }, dataTable) => {
  for (const [label] of dataTable.raw()) {
    await namedLink(page, label).last().waitFor({ state: 'visible' })
  }
})

Then('the competitions menu includes:', async ({ page }, dataTable) => {
  for (const [label] of dataTable.raw()) {
    await namedLink(page, label).last().waitFor({ state: 'visible' })
  }
})

Then('the {string} league table includes:', async ({ page }, tableName, dataTable) => {
  const table = page.getByRole('table', {
    name: new RegExp(`^\\s*${escapeRegExp(tableName)}\\s*$`, 'i'),
  })
  await table.waitFor({ state: 'visible' })

  for (const expectedCells of dataTable.raw()) {
    const teamName = expectedCells[1]
    const row = table.locator('tbody tr', { hasText: teamName }).first()
    await row.waitFor({ state: 'visible' })

    const actualCells = (await row.locator('td').allInnerTexts()).map((cell) =>
      cell.replace(/\s+/g, ' ').trim(),
    )
    assert.deepEqual(actualCells, expectedCells)
  }
})

Then('the teams menu includes:', async ({ page }, dataTable) => {
  for (const [label] of dataTable.raw()) {
    await namedLink(page, label).last().waitFor({ state: 'visible' })
  }
})

Then('the venues menu includes:', async ({ page }, dataTable) => {
  for (const [label] of dataTable.raw()) {
    await namedLink(page, label).last().waitFor({ state: 'visible' })
  }
})

Then('the help menu includes:', async ({ page }, dataTable) => {
  for (const [label] of dataTable.raw()) {
    await page.getByText(label, { exact: true }).first().waitFor({ state: 'visible' })
  }
})

Then('the home page tabs include:', async ({ page }, dataTable) => {
  for (const [label] of dataTable.raw()) {
    await page.getByRole('tab', { name: label, exact: true }).waitFor({ state: 'visible' })
  }
})

Then('the team statistics tabs include:', async ({ page }, dataTable) => {
  for (const [label] of dataTable.raw()) {
    await page.getByRole('tab', { name: label, exact: true }).waitFor({ state: 'visible' })
  }
})
