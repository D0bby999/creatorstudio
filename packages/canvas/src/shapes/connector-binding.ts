/**
 * Connector binding logic via editor sideEffects.
 *
 * Tldraw 4.3.1 BindingUtil is tightly coupled to TLArrowBinding.
 * Instead, we track bindings in a Map and use sideEffects handlers
 * to update connector endpoints when bound shapes change.
 */
import type { Editor, TLShapeId } from 'tldraw'
import { anchorToPagePoint, type NormalizedAnchor } from '../lib/connector-anchor-utils'

export interface ConnectorBindingRecord {
  connectorId: TLShapeId
  targetId: TLShapeId
  terminal: 'start' | 'end'
  normalizedAnchor: NormalizedAnchor
}

// Module-level binding store (one per editor instance, keyed by connector ID + terminal)
const bindingStores = new WeakMap<Editor, Map<string, ConnectorBindingRecord>>()

function getBindings(editor: Editor): Map<string, ConnectorBindingRecord> {
  let store = bindingStores.get(editor)
  if (!store) {
    store = new Map()
    bindingStores.set(editor, store)
  }
  return store
}

function bindingKey(connectorId: TLShapeId, terminal: 'start' | 'end'): string {
  return `${connectorId}:${terminal}`
}

export function createBinding(
  editor: Editor,
  record: ConnectorBindingRecord,
): void {
  const store = getBindings(editor)
  store.set(bindingKey(record.connectorId, record.terminal), record)
}

export function removeBinding(
  editor: Editor,
  connectorId: TLShapeId,
  terminal: 'start' | 'end',
): void {
  const store = getBindings(editor)
  store.delete(bindingKey(connectorId, terminal))
}

export function removeAllBindingsForShape(
  editor: Editor,
  shapeId: TLShapeId,
): void {
  const store = getBindings(editor)
  for (const [key, binding] of store) {
    if (binding.connectorId === shapeId || binding.targetId === shapeId) {
      store.delete(key)
    }
  }
}

/** Register sideEffects to update connectors when bound shapes change */
export function registerConnectorBindingHandlers(editor: Editor): () => void {
  const store = getBindings(editor)

  const handleAfterChange = editor.sideEffects.registerAfterChangeHandler(
    'shape',
    (_prev, next) => {
      // Check if any binding targets this changed shape
      for (const binding of store.values()) {
        if (binding.targetId !== next.id) continue

        const connector = editor.getShape(binding.connectorId)
        if (!connector) continue

        const point = anchorToPagePoint(editor, binding.targetId, binding.normalizedAnchor)
        if (!point) continue

        const connectorBounds = editor.getShapePageBounds(binding.connectorId)
        if (!connectorBounds) continue

        const localX = point.x - connectorBounds.x
        const localY = point.y - connectorBounds.y

        const xProp = binding.terminal === 'start' ? 'startX' : 'endX'
        const yProp = binding.terminal === 'start' ? 'startY' : 'endY'

        editor.updateShape({
          id: binding.connectorId,
          type: 'connector',
          props: { [xProp]: localX, [yProp]: localY },
        })
      }
    },
  )

  const handleBeforeDelete = editor.sideEffects.registerBeforeDeleteHandler(
    'shape',
    (shape) => {
      removeAllBindingsForShape(editor, shape.id)
    },
  )

  return () => {
    handleAfterChange()
    handleBeforeDelete()
  }
}
