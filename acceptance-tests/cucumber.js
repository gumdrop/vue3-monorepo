module.exports = {
  default: [
    '--require support/**/*.js',
    '--require steps/**/*.js',
    '--format progress',
    '--format html:reports/cucumber-report.html',
    'features/**/*.feature',
  ].join(' '),
}
