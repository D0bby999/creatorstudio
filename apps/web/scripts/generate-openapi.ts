import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { generateOpenApiDocument } from '../app/lib/openapi/openapi-registry'

async function main() {
  console.log('Generating OpenAPI specification...')

  const doc = generateOpenApiDocument()
  const outputPath = resolve(process.cwd(), 'public/api/v1/openapi.json')

  // Ensure directory exists
  mkdirSync(dirname(outputPath), { recursive: true })

  // Write OpenAPI spec
  writeFileSync(outputPath, JSON.stringify(doc, null, 2), 'utf-8')

  console.log(`✓ OpenAPI spec generated at: ${outputPath}`)
  console.log(`  Title: ${doc.info.title}`)
  console.log(`  Version: ${doc.info.version}`)
  console.log(`  Endpoints: ${Object.keys(doc.paths || {}).length}`)
}

main().catch((error) => {
  console.error('Failed to generate OpenAPI spec:', error)
  process.exit(1)
})
