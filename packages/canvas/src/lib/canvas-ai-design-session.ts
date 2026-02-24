/**
 * Client-side session state for AI design multi-turn refinement
 */

interface DesignLayout {
  title: string
  width: number
  height: number
  backgroundColor?: string
  elements: any[]
}

export interface DesignSession {
  sessionId: string | null
  currentLayout: DesignLayout | null
  turnCount: number
  isRefining: boolean
}

export function createDesignSession(): DesignSession {
  return { sessionId: null, currentLayout: null, turnCount: 0, isRefining: false }
}

export function updateDesignSession(
  session: DesignSession,
  sessionId: string,
  layout: DesignLayout,
): DesignSession {
  return {
    sessionId,
    currentLayout: layout,
    turnCount: session.turnCount + 1,
    isRefining: true,
  }
}

export function resetDesignSession(): DesignSession {
  return createDesignSession()
}

export function canRefine(session: DesignSession): boolean {
  return session.isRefining && session.turnCount < 5 && session.sessionId !== null
}
