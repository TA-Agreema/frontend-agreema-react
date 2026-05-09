import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: undefined });
        window.location.href = "/dashboard";
    };

    private handleRefresh = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background">
                    <div className="text-center space-y-6 p-8 max-w-lg">
                        <div className="flex justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-destructive/20 blur-3xl rounded-full" />
                                <AlertTriangle className="relative w-24 h-24 text-destructive" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold">Terjadi Kesalahan</h1>
                            <p className="text-muted-foreground">
                                Maaf, terjadi kesalahan yang tidak terduga. Silakan refresh halaman atau kembali ke dashboard.
                            </p>
                            {import.meta.env.DEV && this.state.error && (
                                <div className="mt-4 p-4 bg-muted rounded-lg text-left">
                                    <p className="text-sm font-mono text-destructive">
                                        {this.state.error.message}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 justify-center pt-4">
                            <Button
                                variant="outline"
                                onClick={this.handleRefresh}
                                className="gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Refresh
                            </Button>
                            <Button
                                onClick={this.handleReset}
                                className="gap-2"
                            >
                                <Home className="w-4 h-4" />
                                Ke Dashboard
                            </Button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;