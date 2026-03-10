import React from "react";

/**
 * Global Error Boundary - catches React rendering errors
 * Prevents blank pages from uncaught component exceptions
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-700 mb-4">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <details className="mb-6 bg-gray-50 p-4 rounded border border-gray-200">
              <summary className="font-semibold text-gray-800 cursor-pointer">
                Error details
              </summary>
              <pre className="mt-2 text-xs overflow-auto text-gray-600">
                {this.state.error?.toString()}
              </pre>
            </details>
            <button
              onClick={() => (window.location.href = "/")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Go Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
