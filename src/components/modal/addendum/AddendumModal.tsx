import { useState, useRef, useEffect } from "react";
import { X, FileSignature, Upload, Loader2 } from "lucide-react";
import { createAddendum } from "@/services/addendum.service";
import { toast } from "sonner";
import type { ContractRow, Addendum } from "@/pages/contracts/ContractListPage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";


interface AddendumFormData {
  title: string;
  addendum_number: string;
  description: string;
  document: File | null;
  effective_date?: string;
}

const ADDENDUM_EMPTY: AddendumFormData = {
  title: "",
  addendum_number: "",
  description: "",
  document: null,
  effective_date: "",
};

export default function AddendumModal({
  contract,
  onClose,
  onSuccess,
}: {
  contract: ContractRow;
  onClose: () => void;
  onSuccess: (contractId: number, addendum: Addendum) => void;
}) {
  const [form, setForm] = useState<AddendumFormData>(ADDENDUM_EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (field: keyof AddendumFormData, value: string | File | null) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.title.trim() || !form.addendum_number.trim()) {
      setError("Judul dan Nomor Addendum wajib diisi.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await createAddendum(contract.id, {
        title: form.title.trim(),
        addendum_number: form.addendum_number.trim(),
        description: form.description.trim() || undefined,
        document: form.document || undefined,
        effective_date: form.effective_date || undefined,
      });
      onSuccess(contract.id, {
        id: result.id,
        addendum_number: result.addendum_number,
        title: result.title,
        description: result.description ?? "",
        created_at: new Date(result.created_at).toLocaleDateString("id-ID"),
        effective_date: result.effective_date
          ? new Date(result.effective_date).toLocaleDateString("id-ID")
          : "-",
        document_path: result.document_path,
      });

      toast.success("Addendum berhasil dibuat!", {
        description: `Addendum ${form.addendum_number} - ${form.title} telah ditambahkan ke ${contract.title}.`,
        duration: 5000,
      });

      onClose();
    } catch (err: unknown) {
      let msg = "Gagal menyimpan addendum.";
      if (typeof err === "object" && err !== null) {
        // @ts-expect-error axios shape
        msg = err?.response?.data?.message ?? err?.message ?? msg;
      }
      setError(msg);

      toast.error("Gagal membuat addendum.", { description: msg });
    } finally {
      setSubmitting(false);
    }
  };

  // const getTodayString = () => {
  //   const today = new Date();
  //   const year = today.getFullYear();
  //   const month = String(today.getMonth() + 1).padStart(2, '0');
  //   const day = String(today.getDate()).padStart(2, '0');
  //   return `${year}-${month}-${day}`;
  // };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg mx-4 rounded-2xl border bg-card shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
              <FileSignature className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Buat Addendum</h2>
              <p className="text-xs text-muted-foreground">{contract.contract_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Template Addendum */}
        <div className="px-6 py-4 border-b bg-muted/30 space-y-2">
          <h3 className="text-sm font-medium text-foreground">Template Addendum</h3>
          <p className="text-xs text-muted-foreground">
            Gunakan template addendum yang tersedia untuk mempercepat proses pembuatan.
          </p>
          <div>
            <a
              href="/templates/template_addendum.docx"
              download="Template_Addendum_Terbaru.docx"
              className="inline-flex items-center justify-center rounded-md text-xs font-medium h-9 px-3 bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow"
            >
              Download Template
            </a>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-6 py-5 overflow-y-auto max-h-[70vh]">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
              {error}
            </div>
          )}

          {/* Nomor*/}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="add-number">
              Nomor Addendum <span className="text-red-500">*</span>
            </label>
            <Input
              id="add-number"
              type="text"
              placeholder="cth. ADD-001"
              value={form.addendum_number}
              onChange={(e) => set("addendum_number", e.target.value)}
            />
          </div>

          {/* Judul */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="add-title">
              Judul Addendum <span className="text-red-500">*</span>
            </label>
            <Input
              id="add-title"
              type="text"
              placeholder="Perubahan klausul pembayaran"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
            />
          </div>

          {/* Deskripsi*/}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="add-desc">
              Deskripsi
            </label>
            <textarea
              id="add-desc"
              rows={3}
              placeholder="Jelaskan perubahan yang dilakukan..."
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="w-full rounded-md border border-gray-200 bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none"
            />
          </div>

          {/* Tanggal Efektif */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="effective-date">
              Tanggal Efektif
            </label>
            <div className="relative flex items-center">
              <Input
                id="effective-date"
                type="date"
                // min={getTodayString()}
                value={form.effective_date}
                onChange={(e) => set("effective_date", e.target.value)}
              />
            </div>
          </div>

          {/* Upload Dokumen */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Dokumen Addendum</label>
            <div
              onClick={() => fileRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors py-5 px-4 text-center"
            >
              <Upload className="h-6 w-6 text-muted-foreground" />
              {form.document ? (
                <p className="text-sm text-foreground font-medium">{form.document.name}</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">Klik untuk upload dokumen</p>
                  <p className="text-xs text-muted-foreground/60">PDF — maks. 10 MB</p>
                </>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => set("document", e.target.files?.[0] ?? null)}
            />
            {form.document && (
              <button
                type="button"
                onClick={() => { set("document", null); if (fileRef.current) fileRef.current.value = ""; }}
                className="text-xs text-red-500 hover:underline"
              >
                Hapus file
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-3 pt-2 border-t">
            <Button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2 text-sm rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60 font-medium"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? "Menyimpan..." : "Simpan Addendum"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}