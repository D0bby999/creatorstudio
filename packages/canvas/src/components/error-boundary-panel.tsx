import { Component, type ReactNode } from 'react'

interface ErrorBoundaryPanelProps {
  children: ReactNode
  panelName: string
  onClose?: () => void
}

interface ErrorBoundaryPanelState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundaryPanel extends Component<ErrorBoundaryPanelProps, ErrorBoundaryPanelState> {
  state: ErrorBoundaryPanelState = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryPanelState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[Canvas] ${this.props.panelName} crashed:`, error, info.componentStack)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={containerStyle}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 4 }}>
            {this.props.panelName} error
          </div>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>
            {this.state.error?.message ?? 'Something went wrong'}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={this.handleRetry} style={btnStyle}>
              Retry
            </button>
            {this.props.onClose && (
              <button onClick={this.props.onClose} style={btnStyle}>
                Close
              </button>
            )}
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const containerStyle: React.CSSProperties = {
  padding: '16px 12px',
  textAlign: 'center',
}

const btnStyle: React.CSSProperties = {
  padding: '4px 12px',
  fontSize: 11,
  fontWeight: 500,
  borderRadius: 4,
  border: '1px solid #ddd',
  background: '#fff',
  cursor: 'pointer',
  color: '#444',
}
