import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log only in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Page error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Optionally reload the page data
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error loading this page</AlertTitle>
            <AlertDescription className="mt-2 space-y-3">
              <p>
                {this.props.fallbackMessage || 
                 "We encountered an error while loading this page. Please try refreshing."}
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <p className="text-sm font-mono bg-red-50 p-2 rounded">
                  {this.state.error.toString()}
                </p>
              )}
              <Button 
                onClick={this.handleReset}
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      );
    }

    return this.props.children;
  }
}

export default PageErrorBoundary;