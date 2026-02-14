export type HookName =
  | 'post.creating'
  | 'post.created'
  | 'post.publishing'
  | 'post.published'
  | 'export.completed'
  | 'canvas.saved'
  | 'canvas.loaded'

export type HookPayload = {
  'post.creating': { content: string; mediaUrls: string[] }
  'post.created': { postId: string; content: string }
  'post.publishing': { postId: string; platform: string }
  'post.published': { postId: string; platformPostId: string }
  'export.completed': { type: string; url: string }
  'canvas.saved': { projectId: string; snapshot: unknown }
  'canvas.loaded': { projectId: string }
}

class PluginEventSystem {
  private listeners: Map<HookName, Set<string>> = new Map()

  register(pluginId: string, hooks: HookName[]): void {
    for (const hook of hooks) {
      if (!this.listeners.has(hook)) {
        this.listeners.set(hook, new Set())
      }
      this.listeners.get(hook)?.add(pluginId)
    }
  }

  unregister(pluginId: string): void {
    for (const listeners of this.listeners.values()) {
      listeners.delete(pluginId)
    }
  }

  async dispatch<T extends HookName>(hook: T, payload: HookPayload[T]): Promise<void> {
    const listeners = this.listeners.get(hook)
    if (!listeners || listeners.size === 0) {
      return
    }

    const pluginIds = Array.from(listeners)
    const { pluginSandbox } = await import('./plugin-worker-sandbox')

    const promises = pluginIds.map(async (pluginId) => {
      try {
        if (!pluginSandbox.isLoaded(pluginId)) {
          console.warn(`Plugin ${pluginId} not loaded, skipping hook ${hook}`)
          return
        }
        await pluginSandbox.sendEvent(pluginId, { type: hook, payload })
      } catch (error) {
        console.error(`Error dispatching ${hook} to plugin ${pluginId}:`, error)
      }
    })

    await Promise.allSettled(promises)
  }

  getRegisteredPlugins(hook: HookName): string[] {
    return Array.from(this.listeners.get(hook) || [])
  }

  clear(): void {
    this.listeners.clear()
  }

  getAllRegistrations(): Map<HookName, string[]> {
    const result = new Map<HookName, string[]>()
    for (const [hook, listeners] of this.listeners.entries()) {
      result.set(hook, Array.from(listeners))
    }
    return result
  }
}

export const pluginEvents = new PluginEventSystem()
