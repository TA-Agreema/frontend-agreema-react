import { X, User, Mail } from "lucide-react";

interface SignerTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: "internal" | "external") => void;
}

export default function SignerTypeModal({
  isOpen,
  onClose,
  onSelect,
}: SignerTypeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-900">
              Tambah Penandatangan
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Pilih tipe penandatangan yang ingin ditambahkan:
          </p>

          {/* Options */}
          <div className="space-y-3">
            <button
              onClick={() => {
                onSelect("internal");
                onClose();
              }}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all group text-left">
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                <User className="h-6 w-6 text-gray-400 group-hover:text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900">Pihak Internal</p>
                <p className="text-xs text-gray-500">
                  Staff atau karyawan dari perusahaan
                </p>
              </div>
            </button>

            <button
              onClick={() => {
                onSelect("external");
                onClose();
              }}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all group text-left">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                <Mail className="h-6 w-6 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900">Pihak Eksternal</p>
                <p className="text-xs text-gray-500">
                  Partner dari luar perusahaan (akses via email token)
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
