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

const appYaml = `runtime: nodejs22

env_variables:
  GEMINI_API_KEY: ${yamlString(apiKey)}
  GEMINI_MODEL: ${yamlString(geminiModel)}
`

writeFileSync(appYamlPath, appYaml, { mode: 0o600 })
console.log('Wrote server/deploy/app.yaml using gemini-api-key.txt')
