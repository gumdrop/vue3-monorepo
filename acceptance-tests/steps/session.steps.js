const { Given } = require('@cucumber/cucumber')

Given('I am not signed in', async function () {
  await this.context.clearCookies()
})
