import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // You can log error to an external service here
    console.error('[ErrorBoundary] caught error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24 }}>
          <h2 style={{ color: '#b91c1c' }}>Something went wrong.</h2>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>{String(this.state.error)}</pre>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
