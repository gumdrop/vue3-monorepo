const assert = require('node:assert/strict')
const { Then } = require('@cucumber/cucumber')
const axe = require('axe-core')

const axeOptions = {
  iframes: false,
  rules: {
    'aria-progressbar-name': { enabled: false },
    'aria-required-children': { enabled: false },
    'aria-required-parent': { enabled: false },
    'color-contrast': { enabled: false },
  },
}

const violationSummary = (violations) =>
  violations.map(({ id, impact, help, nodes }) => ({
    id,
    impact,
    help,
    targets: nodes.map((node) => node.target),
    failureSummaries: nodes.map((node) => node.failureSummary),
  }))

Then('the page should have no detectable accessibility violations', async function () {
  await this.page.waitForLoadState('domcontentloaded')
  await this.page.addScriptTag({ content: axe.source })

  const siteContent = this.page.locator('.main-view-container').first()
  const mainContent =
    (await siteContent.count()) > 0 ? siteContent : this.page.locator('main, [role="main"]').first()
  await mainContent.waitFor({ state: 'visible' })

  const results = await mainContent.evaluate(
    async (element, options) => window.axe.run(element, options),
    axeOptions,
  )

  assert.deepEqual(violationSummary(results.violations), [])
})
