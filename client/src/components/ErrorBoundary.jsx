import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center h-screen bg-black text-white p-8">
                    <div className="max-w-2xl">
                        <h1 className="text-2xl font-bold text-red-400 mb-4">Something went wrong</h1>
                        <pre className="bg-zinc-900 p-4 rounded-lg text-sm overflow-auto">
                            {this.state.error?.toString()}
                        </pre>
                        <button
                            onClick={() => window.location.href = '/home'}
                            className="mt-4 px-4 py-2 bg-white text-black rounded-lg"
                        >
                            Go to Home
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
