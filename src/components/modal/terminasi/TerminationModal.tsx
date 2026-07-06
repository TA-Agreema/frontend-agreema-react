import React, { useState } from "react";
import {
    X,
    UploadCloud,
    // AlertCircle 
} from "lucide-react";
import { createTermination } from "@/services/termination.service";
import type { ContractRow } from "@/pages/contracts/ContractListPage";
import type { Termination } from "@/types/termination";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TerminationFormData {
    termination_number: string;
    title: string;
    termination_reason: string;
    termination_note: string;
    effective_date: string;
    document: File | null;
}

const TERMINATION_EMPTY: TerminationFormData = {
    termination_number: "",
    title: "",
    termination_reason: "",
    termination_note: "",
    effective_date: "",
    document: null,
};

type LaravelValidationErrors = Partial<Record<keyof TerminationFormData, string[]>>;

export default function TerminationModal({
    contract,
    onClose,
    onSuccess
}: {
    contract: ContractRow;
    onClose: () => void;
    onSuccess: (contractId: number, termination: Termination) => void;
}) {
    const [form, setForm] = useState<TerminationFormData>(TERMINATION_EMPTY);
    const [loading, setLoading] = useState(false);
    // const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<LaravelValidationErrors>({});

    const set = (field: keyof TerminationFormData, value: string | File | null) => {
        setForm((prev) => ({ ...prev, [field]: value }));

        setFieldErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        // setErrorMsg(null);
        setFieldErrors({});

        try {
            const result = await createTermination(contract.id, {
                termination_number: form.termination_number.trim(),
                title: form.title.trim(),
                termination_reason: form.termination_reason.trim(),
                termination_note: form.termination_note.trim() || undefined,
                effective_date: form.effective_date,
                document: form.document || undefined,
            });

            onSuccess(contract.id, result);

            toast.success("Terminasi Berhasil Diajukan!", {
                description: `${contract.title} akan dihentikan pada ${form.effective_date}.`,
                duration: 5000,
            });

            onClose();
        } catch (err: unknown) {
            let msg = "Gagal membuat terminasi. Coba lagi.";

            if (isAxiosError(err)) {
                msg = err.response?.data?.message ?? msg;

                if (err.response?.status === 422 && err.response.data?.errors) {
                    setFieldErrors(err.response.data.errors);
                }
            }

            // setErrorMsg(msg);
            toast.error("Gagal membuat terminasi.", { description: msg });
        } finally {
            setLoading(false);
        }
    };

    // const getTodayString = () => {
    //     const today = new Date();
    //     const year = today.getFullYear();
    //     const month = String(today.getMonth() + 1).padStart(2, '0');
    //     const day = String(today.getDate()).padStart(2, '0');
    //     return `${year}-${month}-${day}`;
    // };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Terminasi Kontrak</h3>
                        <p className="text-sm text-gray-500">{contract.contract_number} - {contract.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Template Terminasi */}
                <div className="px-6 py-4 border-b bg-muted/30 space-y-2">
                    <h3 className="text-sm font-medium text-foreground">Template Terminasi</h3>
                    <p className="text-xs text-muted-foreground">
                        Gunakan template terminasi yang tersedia untuk mempercepat proses pembuatan.
                    </p>
                    <div>
                        <a
                            href="/templates/template_terminasi.docx"
                            download="Template_Terminasi_Terbaru.docx"
                            className="inline-flex items-center justify-center rounded-md text-xs font-medium h-9 px-3 bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow"
                        >
                            Download Template
                        </a>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {/* {errorMsg && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-sm">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )} */}

                    <form id="terminationForm" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nomor Terminasi <span className="text-red-500">*</span>
                            </label>

                            <Input
                                type="text"
                                placeholder="Contoh: TERM-001"
                                value={form.termination_number}
                                onChange={(e) => set("termination_number", e.target.value)}
                                className={
                                    fieldErrors.termination_number
                                        ? "border-red-500 focus-visible:ring-red-500"
                                        : ""
                                }
                            />

                            {fieldErrors.termination_number && (
                                <p className="text-xs text-red-500 mt-1">
                                    {fieldErrors.termination_number[0]}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Terminasi <span className="text-red-500">*</span></label>
                            <Input
                                required
                                type="text"
                                placeholder="Masukkan judul terminasi"
                                value={form.title}
                                onChange={(e) => set("title", e.target.value)}
                                className={
                                    fieldErrors.title
                                        ? "border-red-500 focus-visible:ring-red-500"
                                        : ""
                                }
                            />

                            {fieldErrors.title && (
                                <p className="text-xs text-red-500 mt-1">
                                    {fieldErrors.title[0]}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Terminasi <span className="text-red-500">*</span></label>
                            <select required value={form.termination_reason} onChange={(e) => set("termination_reason", e.target.value)} className="w-full border rounded-lg px-3 h-9 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white border-gray-200">
                                <option value="">Pilih Alasan</option>
                                <option value="Kesepakatan Bersama">Kesepakatan Bersama</option>
                                <option value="Pelanggaran Kontrak">Pelanggaran Kontrak</option>
                                <option value="Force Majeure">Force Majeure</option>
                                <option value="Lainnya">Lainnya</option>
                            </select>

                            {fieldErrors.termination_reason && (
                                <p className="text-xs text-red-500 mt-1">
                                    {fieldErrors.termination_reason[0]}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Tambahan</label>
                            <textarea value={form.termination_note} onChange={(e) => set("termination_note", e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none min-h-[80px] border-gray-200" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Efektif <span className="text-red-500">*</span></label>
                            <Input
                                required
                                type="date"
                                // min={getTodayString()}
                                value={form.effective_date}
                                onChange={(e) => set("effective_date", e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Dokumen Pendukung <span className="text-red-500">*</span>
                            </label>

                            <div
                                className={`border-2 border-dashed rounded-lg p-4 text-center hover:bg-gray-50 transition-colors ${fieldErrors.document ? "border-red-500" : "border-gray-200"
                                    }`}
                            >
                                <input
                                    type="file"
                                    id="file"
                                    className="hidden"
                                    accept=".pdf,application/pdf"
                                    onChange={(e) => set("document", e.target.files?.[0] ?? null)}
                                />

                                <label
                                    htmlFor="file"
                                    className="cursor-pointer flex flex-col items-center justify-center gap-2"
                                >
                                    <UploadCloud className="w-8 h-8 text-gray-400" />
                                    <span className="text-sm text-gray-600">
                                        {form.document ? form.document.name : "Klik untuk unggah dokumen PDF"}
                                    </span>
                                </label>
                            </div>

                            {fieldErrors.document && (
                                <p className="text-xs text-red-500 mt-1">
                                    {fieldErrors.document[0]}
                                </p>
                            )}
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t bg-gray-50 flex items-center justify-between gap-3">
                    <Button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Batal</Button>
                    <Button type="submit" form="terminationForm" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                        {loading ? "Memproses..." : "Terminasi Kontrak"}
                    </Button>
                </div>
            </div>
        </div>
    );
}