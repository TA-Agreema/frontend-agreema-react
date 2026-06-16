import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar";
import { Separator } from "@/components/ui/separator";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="min-w-0">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex-1">
                        <h1 className="text-lg font-semibold">Agreema</h1>
                    </div>
                </header>
                <main className="flex-1 p-4 md:p-6 min-w-0 overflow-hidden">
                    {children}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}

