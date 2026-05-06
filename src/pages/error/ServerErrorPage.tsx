import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, RefreshCw, ServerCrash } from "lucide-react";

export default function ServerErrorPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const errorMessage = (location.state as { message?: string })?.message;

    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-6 p-8 max-w-md">
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-destructive/20 blur-3xl rounded-full" />
                        <ServerCrash className="relative w-24 h-24 text-destructive" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-7xl font-bold text-destructive">500</h1>
                    <h2 className="text-2xl font-semibold">Server Error</h2>
                    <p className="text-muted-foreground">
                        {errorMessage || "Terjadi kesalahan pada server. Silakan coba beberapa saat lagi."}
                    </p>
                </div>

                <div className="flex gap-3 justify-center pt-4">
                    <Button
                        variant="outline"
                        onClick={handleRefresh}
                        className="gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>
                    <Button
                        onClick={() => navigate("/dashboard")}
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