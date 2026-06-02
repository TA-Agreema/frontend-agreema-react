import React, { useState } from "react";
import { X, UploadCloud, AlertCircle } from "lucide-react";
import { createTermination } from "@/services/termination.service";
import type { ContractRow } from "@/pages/contracts/ContractListPage";
import type { Termination } from "@/types/termination";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/button";

interface Props {
    contract: ContractRow;
    onClose: () => void;
    onSuccess: (contractId: number, termination: Termination) => void;
}

export default function TerminationModal({ contract, onClose, onSuccess }: Props) {
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        termination_number: "",
        title: "",
        termination_reason: "",
        termination_note: "",
        effective_date: "",
    });
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg(null);

        try {
            const result = await createTermination(contract.id, {
                ...formData,
                document: file || undefined,
            });
            onSuccess(contract.id, result);
            onClose();
        } catch (err: unknown) {
            if (isAxiosError(err) && err.response?.data?.message) {
                setErrorMsg(err.response.data.message);
            } else {
                setErrorMsg("Gagal membuat terminasi. Coba lagi.");
            }
        } finally {
            setLoading(false);
        }
    };

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
                    {errorMsg && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-start gap-2 text-sm">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    <form id="terminationForm" onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Terminasi <span className="text-red-500">*</span></label>
                            <input required type="text" value={formData.termination_number} onChange={(e) => setFormData(p => ({ ...p, termination_number: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Terminasi <span className="text-red-500">*</span></label>
                            <input required type="text" value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Alasan Terminasi <span className="text-red-500">*</span></label>
                            <select required value={formData.termination_reason} onChange={(e) => setFormData(p => ({ ...p, termination_reason: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none bg-white">
                                <option value="">Pilih Alasan</option>
                                <option value="mutual_agreement">Kesepakatan Bersama</option>
                                <option value="breach_of_contract">Pelanggaran Kontrak</option>
                                <option value="force_majeure">Force Majeure</option>
                                <option value="other">Lainnya</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Tambahan</label>
                            <textarea value={formData.termination_note} onChange={(e) => setFormData(p => ({ ...p, termination_note: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none min-h-[80px]" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Efektif <span className="text-red-500">*</span></label>
                            <input required type="date" value={formData.effective_date} onChange={(e) => setFormData(p => ({ ...p, effective_date: e.target.value }))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Dokumen Pendukung</label>
                            <div className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-gray-50 transition-colors">
                                <input type="file" id="file" className="hidden" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                                <label htmlFor="file" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                                    <UploadCloud className="w-8 h-8 text-gray-400" />
                                    <span className="text-sm text-gray-600">{file ? file.name : "Klik untuk unggah dokumen (PDF)"}</span>
                                </label>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                    <Button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">Batal</Button>
                    <Button type="submit" form="terminationForm" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                        {loading ? "Memproses..." : "Terminasi Kontrak"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
