import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="text-center space-y-6 p-8 max-w-md">
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
                        <FileQuestion className="relative w-24 h-24 text-primary" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-7xl font-bold text-primary">404</h1>
                    <h2 className="text-2xl font-semibold">Halaman Tidak Ditemukan</h2>
                    <p className="text-muted-foreground">
                        Maaf, halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan.
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