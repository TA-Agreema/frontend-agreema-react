import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-6 p-8 max-w-md">
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full" />
                        <ShieldAlert className="relative w-24 h-24 text-orange-500" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-7xl font-bold text-orange-500">403</h1>
                    <h2 className="text-2xl font-semibold">Akses Ditolak</h2>
                    <p className="text-muted-foreground">
                        Anda tidak memiliki izin untuk mengakses halaman ini. Hubungi administrator jika Anda memerlukan akses.
                    </p>
                </div>

                <div className="flex gap-3 justify-center pt-4">
                    <Button
                        variant="outline"
                        onClick={() => navigate(-1)}
                        className="gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali
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
