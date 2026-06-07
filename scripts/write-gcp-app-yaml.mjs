import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import Path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = Path.resolve(Path.dirname(fileURLToPath(import.meta.url)), '..')
const apiKeyPath = Path.join(repoRoot, 'gemini-api-key.txt')
const appYamlPath = Path.join(repoRoot, 'server', 'deploy', 'app.yaml')

if (!existsSync(apiKeyPath)) {
  throw new Error('Missing gemini-api-key.txt in the project root')
}

const apiKey = readFileSync(apiKeyPath, 'utf8').trim()
if (!apiKey) {
  throw new Error('gemini-api-key.txt is empty')
}

const yamlString = (value) => JSON.stringify(value)
const geminiModel = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash'
const sendgridApiKey = process.env.SENDGRID_API_KEY?.trim()

if (!sendgridApiKey) {
  throw new Error('Missing SENDGRID_API_KEY in the build environment')
}

const appYaml = `runtime: nodejs22
instance_class: F1

env_variables:
  SENDGRID_API_KEY: ${yamlString(sendgridApiKey)}
  GEMINI_API_KEY: ${yamlString(apiKey)}
  GEMINI_MODEL: ${yamlString(geminiModel)}
automatic_scaling:
  max_instances: 1
handlers:
  - url: /.*
    secure: always
    redirect_http_response_code: 301
    script: auto
`

writeFileSync(appYamlPath, appYaml, { mode: 0o600 })
console.log('Wrote server/deploy/app.yaml using legacy app.yaml settings and build secrets')
