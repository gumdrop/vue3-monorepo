const { defineConfig } = require('@playwright/test')
const { cucumberReporter, defineBddConfig } = require('playwright-bdd')

const testDir = defineBddConfig({
  features: 'features/**/*.feature',
  steps: 'steps/**/*.js',
  outputDir: '.features-gen',
})

module.exports = defineConfig({
  testDir,
  timeout: Number(process.env.ACCEPTANCE_TEST_TIMEOUT ?? 120000),
  reporter: [
    ['list'],
    cucumberReporter('html', {
      outputFile: 'reports/cucumber-report.html',
      externalAttachments: true,
    }),
  ],
  use: {
    baseURL: process.env.ACCEPTANCE_BASE_URL || 'http://127.0.0.1:5173',
    headless: process.env.PW_HEADLESS !== 'false',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    viewport: { width: 1280, height: 900 },
  },
})
