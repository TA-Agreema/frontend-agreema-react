import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    // DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { MoreHorizontalIcon, PlusIcon } from "lucide-react";

export default function ContractListPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Kontrak Saya</h1>
                    <p className="text-muted-foreground mt-1">
                        Kelola dan tinjau semua kontrak yang telah Anda buat atau terlibat di dalamnya.
                    </p>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger>
                        <Button>
                            <PlusIcon className="h-4 w-4" />
                            Buat Kontrak Baru
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <a href="/contracts/create/manual">Buat Kontrak Manual</a>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <a href="/contracts/create/template">Buat dari Template</a>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Judul Kontrak</TableHead>
                            <TableHead>Pihak Terlibat</TableHead>
                            <TableHead>Tanggal Mulai</TableHead>
                            <TableHead>Tanggal Berakhir</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Revisi</TableHead>
                            <TableHead>Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {/* Example Row */}
                        <TableRow>
                            <TableCell className="whitespace-normal">Kontrak Kerja Sama PT. ABC Kontrak Kerja Sama PT. ABC</TableCell>
                            <TableCell>PT. ABC, John Doe</TableCell>
                            <TableCell>2024-01-01</TableCell>
                            <TableCell>2024-12-31</TableCell>
                            <TableCell>active</TableCell>
                            <TableCell className="whitespace-normal">Perbaiki pada pasal 12 seharusnya berbunyi "Lorem ipsum dolor sit amet consectetur adipisicing elit. Alias, nihil saepe modi dolorem omnis debitis eligendi. Cumque, sunt alias laudantium eius veniam voluptate atque recusandae maxime fugiat ab officia nisi."</TableCell>
                            <TableCell>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontalIcon className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem>Edit</DropdownMenuItem>
                                        <DropdownMenuItem>Tambah Approver</DropdownMenuItem>
                                        <DropdownMenuItem>Perpanjang</DropdownMenuItem>
                                        <DropdownMenuItem>Batalkan</DropdownMenuItem>
                                        <DropdownMenuItem>Perbaiki Revisi</DropdownMenuItem>
                                        <DropdownMenuItem>Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}