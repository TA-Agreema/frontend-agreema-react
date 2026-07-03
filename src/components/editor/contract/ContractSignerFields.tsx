import type { ReactNode } from "react";
import { ChevronDown, FileText, Info, Mail, Pen, User, X } from "lucide-react";

export const EDITOR_INPUT_CLASS =
  "w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all";

type ContractFormFieldProps = {
  label: string;
  children: ReactNode;
  required?: boolean;
};

export function ContractFormField({
  label,
  children,
  required = false,
}: ContractFormFieldProps) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-semibold text-gray-600">
        {label}
        {required && (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}

type InternalUserOption = {
  id: number;
  name: string;
  job_title?: string;
};

type ContractSigner = {
  id: string;
  type: "internal" | "external";
  name: string;
  title: string;
  email: string;
  noUserAccount: boolean;
  signaturePath?: string | null;
  signedAt?: string | null;
};

type ContractSignerRowProps = {
  signer: ContractSigner;
  internalUsers: InternalUserOption[];
  onChange: (signer: ContractSigner) => void;
  onRemove: () => void;
  disabled?: boolean;
};

export function ContractSignerRow({
  signer,
  internalUsers,
  onChange,
  onRemove,
  disabled,
}: ContractSignerRowProps) {
  const isExternal = signer.type === "external";

  return (
    <div
      className={`rounded-lg border p-2.5 space-y-2 ${
        isExternal ? "border-blue-100 bg-blue-50/30" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isExternal ? (
            <Mail className="h-3 w-3 text-blue-500" />
          ) : (
            <User className="h-3 w-3 text-emerald-600" />
          )}
          <span
            className={`text-[11px] font-semibold ${
              isExternal ? "text-blue-600" : "text-emerald-700"
            }`}
          >
            {isExternal ? "Pihak Eksternal" : "Pihak Internal"}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled || signer.id === "s1"}
          title={
            signer.id === "s1"
              ? "Penandatangan utama tidak dapat dihapus"
              : undefined
          }
          className={`p-0.5 ${
            disabled || signer.id === "s1"
              ? "text-gray-200 cursor-not-allowed"
              : "text-gray-300 hover:text-red-400"
          } transition-colors rounded`}
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {isExternal ? (
        <input
          type="text"
          placeholder="Nama"
          value={signer.name}
          onChange={(event) =>
            onChange({ ...signer, name: event.target.value })
          }
          className={`${EDITOR_INPUT_CLASS} ${
            disabled ? "opacity-50 bg-gray-100 cursor-not-allowed" : ""
          }`}
          disabled={disabled}
        />
      ) : (
        <div className="relative">
          <select
            value={signer.name}
            onChange={(event) => {
              const userName = event.target.value;
              const user = internalUsers.find((item) => item.name === userName);
              onChange({
                ...signer,
                name: userName,
                title: user?.job_title || "",
              });
            }}
            disabled={disabled}
            className={`${EDITOR_INPUT_CLASS} appearance-none pr-6 ${
              disabled ? "opacity-50 bg-gray-100 cursor-not-allowed" : ""
            }`}
          >
            <option value="">Pilih Nama</option>
            {internalUsers.map((user) => (
              <option key={user.id} value={user.name}>
                {user.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400 pointer-events-none" />
        </div>
      )}

      {isExternal ? (
        <input
          type="text"
          placeholder="Jabatan (Contoh: Direktur)"
          value={signer.title}
          onChange={(event) =>
            onChange({ ...signer, title: event.target.value })
          }
          className={`${EDITOR_INPUT_CLASS} ${
            disabled ? "opacity-50 bg-gray-100 cursor-not-allowed" : ""
          }`}
          disabled={disabled}
        />
      ) : (
        <input
          type="text"
          placeholder="Jabatan"
          value={signer.title}
          readOnly
          className={`${EDITOR_INPUT_CLASS} opacity-70 bg-gray-50 cursor-not-allowed`}
          disabled={disabled}
        />
      )}

      {isExternal && (
        <>
          <input
            type="email"
            placeholder="Email"
            value={signer.email}
            onChange={(event) =>
              onChange({ ...signer, email: event.target.value })
            }
            className={`${EDITOR_INPUT_CLASS} ${
              disabled ? "opacity-50 bg-gray-100 cursor-not-allowed" : ""
            }`}
            disabled={disabled}
          />
          <div
            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-[11px] leading-relaxed ${
              disabled
                ? "border-gray-100 bg-gray-50 text-gray-300"
                : "border-blue-100 bg-blue-50 text-blue-700"
            }`}
          >
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Token akses akan dikirim ke email ini setelah tanda tangan
              internal selesai.
            </span>
          </div>
        </>
      )}
    </div>
  );
}

type ContractSignatureBoxProps = {
  name?: string;
  title?: string;
  email?: string;
  date?: string;
  isExternal?: boolean;
  signaturePath?: string | null;
  signedDocumentUrl?: string | null;
  fontFamily?: string | null;
};

export function ContractSignatureBox({
  name,
  title,
  email,
  date,
  isExternal = false,
  signaturePath,
  signedDocumentUrl,
  fontFamily,
}: ContractSignatureBoxProps) {
  const formattedDate = date
    ? new Date(date)
        .toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
        .replace(/\//g, "/")
    : "[DD/MM/YYYY]";
  const hasSignature = Boolean(signaturePath);

  return (
    <div
      className="flex w-[250px] flex-col items-center gap-2 text-center text-gray-900"
      style={fontFamily ? { fontFamily } : undefined}
    >
      <p className="text-xs leading-none text-gray-700">
        Tanggal: {formattedDate}
      </p>
      <div
        className={`flex h-28 w-full items-center justify-center overflow-hidden ${
          hasSignature
            ? "border-0 bg-transparent"
            : "rounded-md border border-dashed border-gray-300 bg-gray-50/60"
        }`}
      >
        {hasSignature ? (
          <img
            src={signaturePath || undefined}
            alt="Tanda Tangan"
            className="max-h-24 w-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-300">
            {isExternal ? (
              <Mail className="h-6 w-6 stroke-[1.25]" />
            ) : (
              <Pen className="h-6 w-6 stroke-[1.25]" />
            )}
            <span className="text-[10px] tracking-wide font-medium uppercase">
              Belum tersedia
            </span>
          </div>
        )}
      </div>
      <div className="w-full space-y-1">
        <p className="border-b border-gray-900 pb-0.5 text-sm font-bold leading-tight">
          {name ||
            (isExternal ? "[Nama Partner Eksternal]" : "[Nama Penandatangan]")}
        </p>
        <p className="text-xs leading-tight text-gray-700">{title || "Jabatan"}</p>
        {isExternal && (
          <p className="mt-0.5 text-[11px] leading-tight text-gray-500">
            {email || "partner@company.com"}
          </p>
        )}
      </div>
      {signedDocumentUrl && (
        <a
          href={signedDocumentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-emerald-600 hover:underline mt-1"
        >
          <FileText className="h-3 w-3" />
          Lihat Dokumen Fisik
        </a>
      )}
    </div>
  );
}
