import { Component } from 'react';
import ServerError from '../pages/ServerError';

// A screen that throws while rendering shows the 500 view instead of a blank page.
// App remounts this boundary on every route change, so navigating away also recovers.
class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) return <ServerError onRetry={() => this.setState({ error: null })} />;
    return this.props.children;
  }
}

export default ErrorBoundary;
