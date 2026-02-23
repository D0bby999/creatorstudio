// WebSocket monitoring utility for canvas collaboration
// In-memory metrics tracking, no external dependencies

interface WebSocketSnapshot {
  totalConnections: number
  activeRooms: number
  messagesByType: Record<string, number>
  errorCount: number
  roomStats: Record<string, { connectionCount: number; messageCount: number }>
}

/**
 * WebSocket metrics tracker
 * Tracks connections, messages, and errors per room
 */
export class WebSocketMetrics {
  private connectionCount = 0
  private activeRooms = new Set<string>()
  private messagesByType = new Map<string, number>()
  private errorCount = 0
  private roomConnections = new Map<string, number>()
  private roomMessages = new Map<string, number>()

  /**
   * Track a new connection to a room
   */
  trackConnection(roomId: string): void {
    this.connectionCount++
    this.activeRooms.add(roomId)

    const current = this.roomConnections.get(roomId) || 0
    this.roomConnections.set(roomId, current + 1)
  }

  /**
   * Track a disconnection from a room
   */
  trackDisconnection(roomId: string): void {
    const current = this.roomConnections.get(roomId) || 0
    const newCount = Math.max(0, current - 1)

    if (newCount === 0) {
      this.roomConnections.delete(roomId)
      this.activeRooms.delete(roomId)
    } else {
      this.roomConnections.set(roomId, newCount)
    }
  }

  /**
   * Track a message by type and room
   */
  trackMessage(roomId: string, type: string): void {
    // Track by message type
    const typeCount = this.messagesByType.get(type) || 0
    this.messagesByType.set(type, typeCount + 1)

    // Track by room
    const roomCount = this.roomMessages.get(roomId) || 0
    this.roomMessages.set(roomId, roomCount + 1)
  }

  /**
   * Track an error occurrence
   */
  trackError(roomId: string, error: string): void {
    this.errorCount++
  }

  /**
   * Get current metrics snapshot
   */
  getSnapshot(): WebSocketSnapshot {
    const roomStats: Record<string, { connectionCount: number; messageCount: number }> = {}

    for (const roomId of this.activeRooms) {
      roomStats[roomId] = {
        connectionCount: this.roomConnections.get(roomId) || 0,
        messageCount: this.roomMessages.get(roomId) || 0,
      }
    }

    return {
      totalConnections: this.connectionCount,
      activeRooms: this.activeRooms.size,
      messagesByType: Object.fromEntries(this.messagesByType),
      errorCount: this.errorCount,
      roomStats,
    }
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.connectionCount = 0
    this.activeRooms.clear()
    this.messagesByType.clear()
    this.errorCount = 0
    this.roomConnections.clear()
    this.roomMessages.clear()
  }
}

// Singleton instance for global metrics
export const globalWebSocketMetrics = new WebSocketMetrics()
