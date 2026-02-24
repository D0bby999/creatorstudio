export interface Guide {
  id: string
  orientation: 'horizontal' | 'vertical'
  position: number
}

const STORAGE_KEY = 'canvas-guides'

class GuideManager {
  private guides: Guide[] = []
  private listeners: Set<() => void> = new Set()

  constructor() {
    this.loadFromStorage()
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        this.guides = JSON.parse(stored)
      }
    } catch (e) {
      console.warn('Failed to load guides from storage:', e)
      this.guides = []
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.guides))
    } catch (e) {
      console.warn('Failed to save guides to storage:', e)
    }
  }

  private notifyListeners() {
    this.listeners.forEach(fn => fn())
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getGuides(): Guide[] {
    return [...this.guides]
  }

  addGuide(orientation: 'horizontal' | 'vertical', position: number): Guide {
    const guide: Guide = {
      id: `guide-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      orientation,
      position: Math.round(position),
    }
    this.guides.push(guide)
    this.saveToStorage()
    this.notifyListeners()
    return guide
  }

  removeGuide(id: string): void {
    const index = this.guides.findIndex(g => g.id === id)
    if (index !== -1) {
      this.guides.splice(index, 1)
      this.saveToStorage()
      this.notifyListeners()
    }
  }

  moveGuide(id: string, newPosition: number): void {
    const guide = this.guides.find(g => g.id === id)
    if (guide) {
      guide.position = Math.round(newPosition)
      this.saveToStorage()
      this.notifyListeners()
    }
  }

  getSnapPoints(): { horizontal: number[]; vertical: number[] } {
    const horizontal = this.guides
      .filter(g => g.orientation === 'horizontal')
      .map(g => g.position)
    const vertical = this.guides
      .filter(g => g.orientation === 'vertical')
      .map(g => g.position)
    return { horizontal, vertical }
  }

  clearAll(): void {
    this.guides = []
    this.saveToStorage()
    this.notifyListeners()
  }
}

// Singleton instance
export const guideManager = new GuideManager()
