const { setDefaultTimeout, setWorldConstructor } = require('@cucumber/cucumber')
const { chromium } = require('playwright')

class QuizLeagueWorld {
  constructor({ attach, parameters }) {
    this.attach = attach
    this.baseUrl =
      process.env.ACCEPTANCE_BASE_URL || parameters.baseUrl || 'http://127.0.0.1:5173'
    this.headless = process.env.PW_HEADLESS !== 'false'
  }

  async openBrowser() {
    if (this.browser) return

    this.browser = await chromium.launch({ headless: this.headless })
    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 900 },
    })
    this.page = await this.context.newPage()
  }

  async goto(path) {
    await this.openBrowser()
    await this.page.goto(new URL(path, this.baseUrl).toString())
  }

  async closeBrowser() {
    await this.context?.close()
    await this.browser?.close()
    this.page = undefined
    this.context = undefined
    this.browser = undefined
  }
}

setDefaultTimeout(Number(process.env.CUCUMBER_TIMEOUT ?? 30000))
setWorldConstructor(QuizLeagueWorld)
