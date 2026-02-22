/**
 * Versioned prompt template registry
 */

export interface PromptEntry {
  name: string
  version: string
  template: string
  metadata: { author?: string; description?: string; createdAt: number }
}

// Module-level registry
const registry = new Map<string, PromptEntry[]>()

/**
 * Register a prompt template
 */
export function registerPrompt(entry: PromptEntry): void {
  const existing = registry.get(entry.name) || []
  existing.push(entry)

  // Sort by version descending (latest first)
  existing.sort((a, b) => b.version.localeCompare(a.version))

  registry.set(entry.name, existing)
}

/**
 * Get a prompt by name and optional version
 */
export function getPrompt(name: string, version?: string): PromptEntry | undefined {
  const entries = registry.get(name)
  if (!entries || entries.length === 0) {
    return undefined
  }

  if (version) {
    return entries.find(e => e.version === version)
  }

  // Return latest (first)
  return entries[0]
}

/**
 * List all versions of a prompt
 */
export function listPromptVersions(name: string): PromptEntry[] {
  return registry.get(name) || []
}

/**
 * Render a prompt with variable substitution
 */
export function renderPrompt(
  name: string,
  variables: Record<string, string>,
  version?: string
): string {
  const entry = getPrompt(name, version)
  if (!entry) {
    throw new Error(`Prompt not found: ${name}${version ? ` (version ${version})` : ''}`)
  }

  let rendered = entry.template

  // Replace {{key}} with values
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`
    rendered = rendered.split(placeholder).join(value)
  }

  return rendered
}

/**
 * Clear registry (for testing)
 */
export function clearRegistry(): void {
  registry.clear()
}
