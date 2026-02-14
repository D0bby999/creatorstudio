import type { PluginManifest } from './plugin-manifest-schema'

type PluginEvent = {
  type: string
  payload: unknown
}

type PluginResponse = {
  success: boolean
  result?: unknown
  error?: string
}

class PluginWorkerSandbox {
  private workers: Map<string, Worker> = new Map()
  private pendingCalls: Map<string, Map<number, (value: PluginResponse) => void>> = new Map()
  private callIdCounter = 0

  async loadPlugin(pluginId: string, sourceUrl: string, manifest?: PluginManifest): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('PluginWorkerSandbox can only be used in browser environment')
    }

    if (this.workers.has(pluginId)) {
      console.warn(`Plugin ${pluginId} already loaded`)
      return
    }

    try {
      // Serialize allowed network URLs for worker (empty array = block all)
      const allowedNetworkUrls = JSON.stringify(manifest?.permissions?.network || [])

      const workerCode = `
        let pluginCode = null;
        const allowedNetworkUrls = ${allowedNetworkUrls};

        // Block all network APIs except wrapped fetch
        self.XMLHttpRequest = undefined;
        self.WebSocket = undefined;
        self.importScripts = undefined;
        self.EventSource = undefined;

        // Wrap fetch to enforce network allowlist
        const originalFetch = self.fetch;
        self.fetch = function(url, options) {
          const urlStr = typeof url === 'string' ? url : url.toString();

          // Check if URL is in allowlist
          const isAllowed = allowedNetworkUrls.some(allowed => {
            try {
              const allowedUrl = new URL(allowed);
              const requestUrl = new URL(urlStr);
              // Match origin (protocol + hostname + port)
              return allowedUrl.origin === requestUrl.origin;
            } catch {
              return false;
            }
          });

          if (!isAllowed) {
            const error = new Error('Network request blocked: URL not in manifest permissions.network allowlist: ' + urlStr);
            console.error('[Plugin Security]', error.message);
            return Promise.reject(error);
          }

          return originalFetch.call(self, url, options);
        };

        self.addEventListener('message', async (event) => {
          const { type, callId, payload, sourceUrl } = event.data;

          if (type === 'load') {
            try {
              const response = await originalFetch(sourceUrl);
              const code = await response.text();
              pluginCode = new Function('self', 'postMessage', code);
              pluginCode(self, self.postMessage.bind(self));
              self.postMessage({ callId, success: true });
            } catch (error) {
              self.postMessage({ callId, success: false, error: error.message });
            }
            return;
          }

          if (type === 'event') {
            try {
              if (!pluginCode) {
                throw new Error('Plugin not loaded');
              }
              self.dispatchEvent(new CustomEvent(payload.type, { detail: payload.payload }));
              self.postMessage({ callId, success: true });
            } catch (error) {
              self.postMessage({ callId, success: false, error: error.message });
            }
          }
        });
      `

      const blob = new Blob([workerCode], { type: 'application/javascript' })
      const workerUrl = URL.createObjectURL(blob)
      const worker = new Worker(workerUrl)

      worker.addEventListener('message', (event: MessageEvent<PluginResponse & { callId: number }>) => {
        const { callId, ...response } = event.data
        const resolver = this.pendingCalls.get(pluginId)?.get(callId)
        if (resolver) {
          resolver(response)
          this.pendingCalls.get(pluginId)?.delete(callId)
        }
      })

      worker.addEventListener('error', (error) => {
        console.error(`Plugin ${pluginId} worker error:`, error)
      })

      this.workers.set(pluginId, worker)
      this.pendingCalls.set(pluginId, new Map())

      await this.sendMessage(pluginId, { type: 'load', sourceUrl })
    } catch (error) {
      this.unloadPlugin(pluginId)
      throw new Error(`Failed to load plugin: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async sendEvent(pluginId: string, event: PluginEvent): Promise<unknown> {
    if (!this.workers.has(pluginId)) {
      throw new Error(`Plugin ${pluginId} not loaded`)
    }

    const response = await this.sendMessage(pluginId, { type: 'event', payload: event })
    if (!response.success) {
      throw new Error(`Plugin event failed: ${response.error}`)
    }
    return response.result
  }

  unloadPlugin(pluginId: string): void {
    const worker = this.workers.get(pluginId)
    if (worker) {
      worker.terminate()
      this.workers.delete(pluginId)
    }
    this.pendingCalls.delete(pluginId)
  }

  isLoaded(pluginId: string): boolean {
    return this.workers.has(pluginId)
  }

  private sendMessage(pluginId: string, message: Record<string, unknown>): Promise<PluginResponse> {
    const worker = this.workers.get(pluginId)
    if (!worker) {
      return Promise.reject(new Error(`Plugin ${pluginId} not loaded`))
    }

    const callId = this.callIdCounter = (this.callIdCounter + 1) % Number.MAX_SAFE_INTEGER
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingCalls.get(pluginId)?.delete(callId)
        reject(new Error(`Plugin ${pluginId} timed out after 30s`))
      }, 30_000)

      this.pendingCalls.get(pluginId)?.set(callId, (response) => {
        clearTimeout(timeout)
        resolve(response)
      })
      worker.postMessage({ ...message, callId })
    })
  }
}

export const pluginSandbox = new PluginWorkerSandbox()
