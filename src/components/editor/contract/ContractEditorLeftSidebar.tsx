import { ArrowLeft, GripVertical, Plus } from "lucide-react";
import type { Category } from "@/types/category";
import type { TemplateOption } from "@/components/modal/template/TemplateSelectModal";
import {
  ContractFormField,
  ContractSignerRow,
  EDITOR_INPUT_CLASS as inputCls,
} from "@/components/editor/contract/ContractSignerFields";

export type SignerType = "internal" | "external";

export type ContractEditorSigner = {
  id: string;
  type: SignerType;
  name: string;
  title: string;
  email: string;
  noUserAccount: boolean;
  signaturePath?: string | null;
  signedAt?: string | null;
};

export type InternalSignerUser = {
  id: number;
  name: string;
  job_title?: string;
  email?: string;
};

type ContractEditorLeftSidebarProps = {
  contractNumber: string;
  externalContractNumber: string;
  title: string;
  startDate: string;
  endDate: string;
  selectedPartnerName: string;
  selectedTemplate: TemplateOption | null;
  categories: Category[];
  signers: ContractEditorSigner[];
  internalUsers: InternalSignerUser[];
  isEdit: boolean;
  disabled: boolean;
  onBack: () => void;
  onContractNumberChange: (value: string) => void;
  onExternalContractNumberChange: (value: string) => void;
  onTitleChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onPartnerNameChange: (value: string) => void;
  onRegenerateContractNumber: () => void;
  onUpdateSigner: (id: string, signer: ContractEditorSigner) => void;
  onRemoveSigner: (id: string) => void;
  onAddSignerClick: () => void;
};

export function ContractEditorLeftSidebar({
  contractNumber,
  externalContractNumber,
  title,
  startDate,
  endDate,
  selectedPartnerName,
  selectedTemplate,
  categories,
  signers,
  internalUsers,
  isEdit,
  disabled,
  onBack,
  onContractNumberChange,
  onExternalContractNumberChange,
  onTitleChange,
  onStartDateChange,
  onEndDateChange,
  onPartnerNameChange,
  onRegenerateContractNumber,
  onUpdateSigner,
  onRemoveSigner,
  onAddSignerClick,
}: ContractEditorLeftSidebarProps) {
  const formatDate = (value: string) => {
    if (!value) return "";
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return value;
    return `${day}/${month}/${year}`;
  };

  const draggableChips = [
    {
      label: "Judul Kontrak",
      value: title,
    },
    {
      label: "Nomor Kontrak Internal",
      value: contractNumber,
    },
    {
      label: "Nomor Kontrak Eksternal",
      value: externalContractNumber,
    },
    {
      label: "Tanggal Mulai",
      value: formatDate(startDate),
    },
    {
      label: "Tanggal Selesai",
      value: formatDate(endDate),
    },
    {
      label: "Mitra",
      value: selectedPartnerName,
    },
  ];

  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200 overflow-hidden">
      <div className="relative flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-gray-700 transition-colors shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-800">
                Detail Kontrak
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-2.5 space-y-1.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Seret ke Dokumen
            </p>
            {draggableChips.map((chip) => (
              <div
                key={chip.label}
                draggable={!disabled && Boolean(chip.value)}
                onDragStart={(event) => {
                  if (disabled || !chip.value) return;
                  event.dataTransfer.setData("text/plain", chip.value);
                  event.dataTransfer.effectAllowed = "copy";
                }}
                title={
                  disabled
                    ? "Tidak dapat diseret karena kontrak sedang ditinjau"
                    : !chip.value
                      ? "Isi data terlebih dahulu sebelum diseret"
                    : `Seret untuk menyisipkan ${chip.label}`
                }
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-white border text-xs transition-all select-none group ${disabled || !chip.value ? "border-gray-200 text-gray-300 cursor-not-allowed opacity-60" : "border-emerald-200 cursor-grab active:cursor-grabbing hover:border-emerald-400 hover:shadow-sm"}`}
              >
                <span className="text-emerald-700 font-medium shrink-0">
                  {chip.label}
                </span>
                <span className="text-gray-500 truncate flex-1 text-right text-[10px] font-mono bg-gray-50 px-1 rounded">
                  {chip.value}
                </span>
                <GripVertical className="h-3.5 w-3.5 text-gray-300 group-hover:text-emerald-400 shrink-0" />
              </div>
            ))}
          </div>

          <ContractFormField label="Nomor Kontrak Internal">
            <div className="flex gap-1.5">
              <input
                value={contractNumber}
                onChange={(event) =>
                  onContractNumberChange(event.target.value)
                }
                placeholder="PKS-001/SLAB/V/2026"
                className={`${inputCls} flex-1 ${disabled ? "opacity-50 bg-gray-100 cursor-not-allowed" : ""}`}
                disabled={disabled}
              />
              {!isEdit && !disabled && (
                <button
                  type="button"
                  title="Generate ulang nomor kontrak"
                  onClick={onRegenerateContractNumber}
                  className="px-2 py-1.5 border border-gray-200 rounded-md text-gray-400 hover:text-emerald-600 hover:border-emerald-400 transition-colors text-xs shrink-0"
                >
                  ↺
                </button>
              )}
            </div>
          </ContractFormField>

          <ContractFormField label="Nomor Kontrak Eksternal (Opsional)">
            <input
              value={externalContractNumber}
              onChange={(event) =>
                onExternalContractNumberChange(event.target.value)
              }
              placeholder="Nomor dari pihak mitra"
              className={`${inputCls} ${disabled ? "opacity-50 bg-gray-100 cursor-not-allowed" : ""}`}
              disabled={disabled}
            />
            {externalContractNumber && (
              <p className="text-[10px] text-gray-400 mt-0.5 pl-0.5">
                Dapat diseret ke dokumen sebagai{" "}
                <span>Nomor Kontrak Eksternal</span>
              </p>
            )}
          </ContractFormField>

          <ContractFormField label="Judul Dokumen">
            <input
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
              placeholder="Kontrak Sewa Vendor"
              className={`${inputCls} ${disabled ? "opacity-50 bg-gray-100 cursor-not-allowed" : ""}`}
              disabled={disabled}
            />
          </ContractFormField>

          <ContractFormField label="Tanggal Mulai">
            <input
              type="date"
              min={getTodayString()}
              value={startDate}
              onChange={(event) => onStartDateChange(event.target.value)}
              className={`${inputCls} pr-7 [color-scheme:light] ${disabled ? "opacity-50 bg-gray-100 cursor-not-allowed" : ""}`}
              disabled={disabled}
            />
          </ContractFormField>

          <ContractFormField label="Tanggal Selesai">
            <input
              type="date"
              value={endDate}
              onChange={(event) => onEndDateChange(event.target.value)}
              className={`${inputCls} pr-7 [color-scheme:light] ${disabled ? "opacity-50 bg-gray-100 cursor-not-allowed" : ""}`}
              disabled={disabled}
            />
          </ContractFormField>

          <ContractFormField label="Mitra">
            <input
              type="text"
              value={selectedPartnerName}
              onChange={(event) => onPartnerNameChange(event.target.value)}
              disabled={disabled}
              placeholder="Ketik nama Mitra"
              className={`${inputCls} pr-8 ${disabled ? "opacity-50 bg-gray-100 cursor-not-allowed" : ""}`}
            />
          </ContractFormField>

          <ContractFormField label="Kategori Kontrak">
            {selectedTemplate ? (
              <div className="text-sm px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
                {categories.find((c) => c.id === selectedTemplate.category_id)
                  ?.name || "Tidak ada kategori"}
              </div>
            ) : (
              <div className="text-sm px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-gray-400 italic">
                Pilih template terlebih dahulu
              </div>
            )}
          </ContractFormField>

          <div className="space-y-2.5 pt-0.5">
            <p className="text-xs font-bold text-gray-700">Penandatangan</p>
            {signers.map((signer) => (
              <ContractSignerRow
                key={signer.id}
                signer={signer}
                internalUsers={internalUsers}
                onChange={(updated) => onUpdateSigner(signer.id, updated)}
                onRemove={() => onRemoveSigner(signer.id)}
                disabled={disabled}
              />
            ))}
            <button
              onClick={onAddSignerClick}
              disabled={disabled || signers.length >= 2}
              title={
                signers.length >= 2 ? "Maksimal 2 penandatangan" : undefined
              }
              className={`w-full flex items-center justify-center gap-1.5 py-2 text-xs border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors ${disabled || signers.length >= 2 ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <Plus className="h-3.5 w-3.5" /> Tambah Penandatangan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
