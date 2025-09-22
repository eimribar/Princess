import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }
    
    // Update state with error details
    this.setState(prevState => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // TODO: Send error to logging service in production
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    
    // If the error keeps happening, redirect to home
    if (this.state.errorCount > 3) {
      window.location.href = '/';
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Something went wrong
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                {this.state.errorCount > 2 
                  ? "This error keeps occurring. Please try refreshing the page or returning home."
                  : "An unexpected error occurred. You can try to recover or return to the home page."}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Show error details only in development */}
              {isDevelopment && this.state.error && (
                <div className="bg-gray-100 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Error Details:</p>
                  <p className="text-sm text-red-600 font-mono">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="cursor-pointer">
                      <summary className="text-sm text-gray-600 hover:text-gray-800">
                        View stack trace
                      </summary>
                      <pre className="mt-2 text-xs text-gray-600 overflow-auto max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
              
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={this.handleReset}
                  className="gap-2"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </Button>
                
                <Button
                  onClick={this.handleGoHome}
                  className="gap-2"
                  variant="outline"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </div>
              
              {this.state.errorCount > 1 && (
                <p className="text-center text-sm text-gray-500">
                  This error has occurred {this.state.errorCount} times
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;