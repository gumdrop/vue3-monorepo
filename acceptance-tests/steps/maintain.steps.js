const assert = require('node:assert/strict')
const { Given, Then, When } = require('@cucumber/cucumber')

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const fieldValue = async (locator, page) => {
  const deadline = Date.now() + Number(process.env.CUCUMBER_TIMEOUT ?? 30000)
  let value = ''

  while (Date.now() < deadline) {
    value = await locator.inputValue()
    if (value) return value
    await page.waitForTimeout(250)
  }

  return value
}

const inputValues = async (locator) => {
  const values = []
  const count = await locator.count()
  for (let index = 0; index < count; index += 1) {
    values.push(await locator.nth(index).inputValue())
  }
  return values
}

Given('maintenance authentication is bypassed for acceptance tests', function () {
  assert.equal(
    process.env.ACCEPTANCE_MAINTAIN_AUTH_BYPASS,
    'true',
    'Set ACCEPTANCE_MAINTAIN_AUTH_BYPASS=true for the Cucumber run and build/start the client with VITE_MAINTAIN_AUTH_BYPASS=true.',
  )
})

When('I open the maintenance application context page', async function () {
  await this.goto('/maintain/#/applicationcontext')
})

When('I open the maintenance {string} page', async function (route) {
  await this.goto(`/maintain/#${route}`)
})

When('I open the maintenance teams page', async function () {
  await this.goto('/maintain/#/team')
})

When('I open the maintenance venues page', async function () {
  await this.goto('/maintain/#/venue')
})

When('I open the maintenance users page', async function () {
  await this.goto('/maintain/#/user')
})

When('I open the maintenance site users page', async function () {
  await this.goto('/maintain/#/siteuser')
})

When('I open the maintenance global text page', async function () {
  await this.goto('/maintain/#/globaltext')
})

When('I open the maintenance competition statistics page', async function () {
  await this.goto('/maintain/#/competitionstatistics')
})

When('I open the maintenance statistics page', async function () {
  await this.goto('/maintain/#/statistics')
})

When('I choose {string} from the maintain team list', async function (teamName) {
  await this.page.getByText(teamName, { exact: true }).first().click()
})

When('I choose {string} from the maintain season list', async function (seasonName) {
  await this.page.getByText(seasonName, { exact: true }).first().click()
})

When('I choose {string} from the maintain venue list', async function (venueName) {
  await this.page.getByText(venueName, { exact: true }).first().click()
})

When('I choose {string} from the maintain user list', async function (userName) {
  await this.page.getByText(userName, { exact: true }).first().click()
})

When('I choose {string} from the maintain site user list', async function (handle) {
  await this.page.getByText(handle, { exact: true }).first().click()
})

When('I choose {string} from the maintain global text list', async function (textName) {
  await this.page.getByText(textName, { exact: true }).first().click()
})

When(
  'I choose {string} from the maintain competition statistics list',
  async function (competitionName) {
    await this.page.getByText(competitionName, { exact: true }).first().click()
  },
)

When('I click the {string} button', async function (label) {
  await this.page.getByRole('button', { name: label, exact: true }).click()
})

Then('I should be on the maintenance {string} page', async function (expectedRoute) {
  const routePath = (url) => {
    const parsedUrl = new URL(url)
    return `${decodeURIComponent(parsedUrl.pathname)}${decodeURIComponent(parsedUrl.hash)}`
  }
  const expectedPath = `/maintain/#${expectedRoute}`

  await this.page.waitForURL((url) => routePath(url) === expectedPath)
  assert.equal(routePath(this.page.url()), expectedPath)
})

Then('the maintain navigation includes:', async function (dataTable) {
  for (const [label] of dataTable.raw()) {
    await this.page.getByRole('link', { name: label, exact: true }).waitFor({ state: 'visible' })
  }
})

Then('the maintain team list includes:', async function (dataTable) {
  for (const [teamName, shortName] of dataTable.raw()) {
    await this.page.getByText(teamName, { exact: true }).first().waitFor({ state: 'visible' })
    await this.page.getByText(shortName, { exact: true }).first().waitFor({ state: 'visible' })
  }
})

Then('the maintain season list includes:', async function (dataTable) {
  for (const [seasonName] of dataTable.raw()) {
    await this.page.getByText(seasonName, { exact: true }).first().waitFor({ state: 'visible' })
  }
})

Then('the maintain season competitions include:', async function (dataTable) {
  for (const [competitionName] of dataTable.raw()) {
    await this.page
      .getByText(competitionName, { exact: true })
      .first()
      .waitFor({ state: 'visible' })
  }
})

Then('the maintain competition league tables include:', async function (dataTable) {
  for (const [tableDescription] of dataTable.raw()) {
    await this.page
      .getByText(tableDescription, { exact: true })
      .first()
      .waitFor({ state: 'visible' })
  }
})

Then('the maintain competition fixture groups include:', async function (dataTable) {
  for (const [description, date] of dataTable.raw()) {
    await this.page
      .getByText(`${description} - ${date}`, { exact: true })
      .first()
      .waitFor({ state: 'visible' })
  }
})

Then('the maintain fixture list includes:', async function (dataTable) {
  for (const [fixtureLabel] of dataTable.raw()) {
    await this.page.getByText(fixtureLabel, { exact: true }).first().waitFor({ state: 'visible' })
  }
})

Then('the maintain league table teams include:', async function (dataTable) {
  for (const [teamName] of dataTable.raw()) {
    await this.page.getByText(teamName, { exact: true }).first().waitFor({ state: 'visible' })
  }
})

Then('the maintain venue list includes:', async function (dataTable) {
  for (const [venueName, address] of dataTable.raw()) {
    await this.page.getByText(venueName, { exact: true }).first().waitFor({ state: 'visible' })
    await this.page.getByText(address, { exact: true }).first().waitFor({ state: 'visible' })
  }
})

Then('the maintain user list includes:', async function (dataTable) {
  for (const [userName, email] of dataTable.raw()) {
    await this.page.getByText(userName, { exact: true }).first().waitFor({ state: 'visible' })
    await this.page.getByText(email, { exact: true }).first().waitFor({ state: 'visible' })
  }
})

Then('the maintain site user list includes:', async function (dataTable) {
  for (const [handle] of dataTable.raw()) {
    await this.page.getByText(handle, { exact: true }).first().waitFor({ state: 'visible' })
  }
})

Then('the maintain global text list includes:', async function (dataTable) {
  for (const [textName] of dataTable.raw()) {
    await this.page.getByText(textName, { exact: true }).first().waitFor({ state: 'visible' })
  }
})

Then('the global text references include:', async function (dataTable) {
  const fields = this.page.getByLabel('Text Name', { exact: true })

  for (const [referenceName] of dataTable.raw()) {
    const deadline = Date.now() + Number(process.env.CUCUMBER_TIMEOUT ?? 30000)
    let found = false

    while (Date.now() < deadline) {
      if ((await inputValues(fields)).includes(referenceName)) {
        found = true
        break
      }
      await this.page.waitForTimeout(250)
    }

    assert.equal(found, true, `Global text reference "${referenceName}" was not visible`)
  }
})

Then('the maintain competition statistics list includes:', async function (dataTable) {
  for (const [competitionName, resultCount] of dataTable.raw()) {
    await this.page
      .getByText(competitionName, { exact: true })
      .first()
      .waitFor({ state: 'visible' })
    await this.page.getByText(resultCount, { exact: true }).first().waitFor({ state: 'visible' })
  }
})

Then('the {string} field should contain {string}', async function (label, expectedValue) {
  const field = this.page.getByLabel(label, { exact: true }).first()
  await field.waitFor({ state: 'visible' })
  assert.equal(await fieldValue(field, this.page), expectedValue)
})

Then('the {string} selection should display {string}', async function (label, expectedValue) {
  await this.page.getByLabel(label, { exact: true }).first().waitFor({ state: 'visible' })
  await this.page.getByText(expectedValue, { exact: true }).first().waitFor({ state: 'visible' })
})

Then('the {string} checkbox should be unchecked', async function (label) {
  const checkbox = this.page.getByLabel(label, { exact: true }).first()
  await checkbox.waitFor({ state: 'visible' })
  assert.equal(await checkbox.isChecked(), false)
})

Then('the {string} button should be disabled', async function (label) {
  const button = this.page
    .getByRole('button', { name: new RegExp(`^\\s*${escapeRegExp(label)}\\s*$`, 'i') })
    .first()
  await button.waitFor({ state: 'visible' })
  assert.equal(await button.isDisabled(), true)
})
