const assert = require('node:assert/strict')
const { Then, When } = require('@cucumber/cucumber')

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

When('I open the QuizLeague home page', async function () {
  await this.goto('/home')
})

When('I open the competitions page', async function () {
  await this.goto('/competition')
})

When('I open the results page', async function () {
  await this.goto('/results')
})

When('I open the all results page', async function () {
  await this.goto('/results/all')
})

When('I open the all fixtures page', async function () {
  await this.goto('/fixtures/all')
})

When('I open the questions page', async function () {
  await this.goto('/results/questions')
})

When('I open the submit result instructions page', async function () {
  await this.goto('/results/submit/instructions')
})

When('I open the teams page', async function () {
  await this.goto('/team')
})

When('I open the venues page', async function () {
  await this.goto('/venue')
})

When('I open the rules page', async function () {
  await this.goto('/rules')
})

When('I open the links page', async function () {
  await this.goto('/links')
})

When('I open the contact page', async function () {
  await this.goto('/contact')
})

When('I open the help page', async function () {
  await this.goto('/help')
})

When('I open the {string} team page', async function (teamId) {
  await this.goto(`/team/${teamId}`)
})

When('I open the {string} team statistics page', async function (teamId) {
  await this.goto(`/team/${teamId}/stats`)
})

When('I open the {string} competition page', async function (competitionName) {
  const route = competitionRoutes[competitionName]
  assert.ok(route, `No competition route configured for "${competitionName}"`)
  await this.goto(route)
})

When('I choose {string} from the competitions menu', async function (label) {
  await namedLink(this.page, label).last().click()
})

When('I choose {string} from the results menu', async function (label) {
  await namedLink(this.page, label).last().click()
})

When('I choose {string} from the teams menu', async function (label) {
  await namedLink(this.page, label).last().click()
})

When('I choose {string} from the venues menu', async function (label) {
  await namedLink(this.page, label).last().click()
})

When('I choose {string} from the contact page', async function (label) {
  await this.page
    .getByRole('button', { name: new RegExp(`^\\s*${escapeRegExp(label)}\\s*$`, 'i') })
    .click()
})

When('I choose the {string} home tab', async function (label) {
  await this.page.getByRole('tab', { name: label, exact: true }).click()
})

Then('I should be on the {string} page', async function (expectedPath) {
  const pathName = (url) => decodeURIComponent(new URL(url).pathname)
  await this.page.waitForURL((url) => pathName(url) === expectedPath)
  assert.equal(pathName(this.page.url()), expectedPath)
})

Then('I should see the {string} title', async function (title) {
  await this.page.getByRole('heading', { name: title, exact: true }).first().waitFor({
    state: 'visible',
  })
})

Then('I should see text matching {string}', async function (pattern) {
  await this.page.getByText(new RegExp(pattern)).first().waitFor({ state: 'visible' })
})

Then('I should not see text matching {string}', async function (pattern) {
  await this.page.getByText(new RegExp(pattern)).first().waitFor({ state: 'hidden' })
})

Then('the {string} field should be visible', async function (label) {
  await this.page.getByLabel(label, { exact: true }).waitFor({ state: 'visible' })
})

Then('the {string} button should be visible', async function (label) {
  await this.page
    .getByRole('button', { name: new RegExp(`^\\s*${escapeRegExp(label)}\\s*$`, 'i') })
    .waitFor({ state: 'visible' })
})

Then('the {string} link should target {string}', async function (label, expectedHref) {
  const link = namedLink(this.page, label).first()
  await link.waitFor({ state: 'visible' })
  assert.equal(await link.getAttribute('href'), expectedHref)
})

Then('the main navigation includes:', async function (dataTable) {
  for (const [label] of dataTable.raw()) {
    await namedLink(this.page, label).first().waitFor({ state: 'visible' })
  }
})

Then('the results menu includes:', async function (dataTable) {
  for (const [label] of dataTable.raw()) {
    await namedLink(this.page, label).last().waitFor({ state: 'visible' })
  }
})

Then('the competitions menu includes:', async function (dataTable) {
  for (const [label] of dataTable.raw()) {
    await namedLink(this.page, label).last().waitFor({ state: 'visible' })
  }
})

Then('the teams menu includes:', async function (dataTable) {
  for (const [label] of dataTable.raw()) {
    await namedLink(this.page, label).last().waitFor({ state: 'visible' })
  }
})

Then('the venues menu includes:', async function (dataTable) {
  for (const [label] of dataTable.raw()) {
    await namedLink(this.page, label).last().waitFor({ state: 'visible' })
  }
})

Then('the help menu includes:', async function (dataTable) {
  for (const [label] of dataTable.raw()) {
    await this.page.getByText(label, { exact: true }).first().waitFor({ state: 'visible' })
  }
})

Then('the home page tabs include:', async function (dataTable) {
  for (const [label] of dataTable.raw()) {
    await this.page.getByRole('tab', { name: label, exact: true }).waitFor({ state: 'visible' })
  }
})

Then('the team statistics tabs include:', async function (dataTable) {
  for (const [label] of dataTable.raw()) {
    await this.page.getByRole('tab', { name: label, exact: true }).waitFor({ state: 'visible' })
  }
})
