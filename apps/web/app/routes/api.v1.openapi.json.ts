import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export async function loader() {
  const openapiPath = resolve(process.cwd(), 'public/api/v1/openapi.json')
  const spec = readFileSync(openapiPath, 'utf-8')

  return new Response(spec, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
