import api from "@/lib/axios";
import type { ReviewHistory } from "@/types/manager";
import type { ContractRow } from "@/pages/contracts/ContractListPage";

const BASE_PATH = "/manager/contracts";

// Struktur data tanda tangan yang sudah disimpan per signer
export interface SignerReview {
  id: number;
  signer_id: number;
  signature_image: string | null; // base64 atau URL gambar tanda tangan
  signed_at: string | null;
  status: "disetujui" | "ditinjau";
}

// Interface untuk signature item
export interface SignatureItem {
  id: number;
  signature_type: string;
  signature_path: string;
  signed_at: string;
  iteration: number;
}

// Update interface Signer
export interface Signer {
  id: number;
  sequence?:number;
  signer_type: "internal" | "external";
  signer_name: string | null;
  signer_role: string | null;
  external_email: string | null;
  user: { id: number; name: string; job_title: string | null } | null;
  signatures: SignatureItem[];
  reviews: SignerReview[];
}

export interface ManagerContractDetail extends ContractRow {
  content?: string;
  reviews?: ReviewHistory[];
  signed_document_url?: string | null;
  status_logs?: {
    id: number;
    old_status: string;
    new_status: string;
    changed_by: string;
    created_at: string;
  }[];
  signers?: {
    id: number;
    sequence?:number;
    signer_type: "internal" | "external";
    signer_name: string | null;
    signer_role: string | null;
    external_email: string | null;
  user: { id: number; name: string; job_title: string | null } | null;
    signatures?: SignatureItem[];
    reviews?: {
      reviewed_at: string;
      id: number;
      status: string;
      notes: string | null;
      created_at: string;
      review_document_url?: string | null;
      user?: { name: string; job_title?: string | null };
    }[];
  }[];
}

export const fetchManagerContracts = async (
  search?: string,
  status?: string,
): Promise<ContractRow[]> => {
  const res = await api.get<{ data: ContractRow[] }>(BASE_PATH, {
    params: { search, status },
  });
  return res.data.data;
};

export const fetchManagerArchivedContracts = async (
  search?: string,
): Promise<ContractRow[]> => {
  const res = await api.get<{ data: ContractRow[] }>(`${BASE_PATH}/archive`, {
    params: { search },
  });
  return res.data.data;
};

export const fetchManagerContractDetail = async (
  id: number,
): Promise<ManagerContractDetail> => {
  const res = await api.get<{ data: ManagerContractDetail }>(
    `${BASE_PATH}/${id}`,
  );
  return res.data.data;
};

export const downloadManagerContractPdf = async (id: number) => {
  const res = await api.get<Blob>(`${BASE_PATH}/${id}/download`, {
    responseType: "blob",
    validateStatus: () => true,
  });

  if (res.status >= 400) {
    let message = "Gagal mengunduh dokumen.";

    if (res.data instanceof Blob) {
      const text = await res.data.text();
      try {
        const parsed = JSON.parse(text) as { message?: string; error?: string };
        message = parsed.message ?? parsed.error ?? message;
      } catch {
        message = text || message;
      }
    }

    throw {
      response: {
        status: res.status,
        data: { message },
      },
    };
  }

  return res;
};

export const submitContractReview = async (
  id: number,
  payload: { status: "approved" | "revised" | "rejected"; notes: string; reviewDocument?: File | null },
): Promise<ManagerContractDetail> => {
  const formData = new FormData();
  formData.append("status", payload.status);
  if (payload.notes) formData.append("notes", payload.notes);
  if (payload.reviewDocument) formData.append("review_document", payload.reviewDocument);

  const res = await api.post<{ data: ManagerContractDetail }>(
    `${BASE_PATH}/${id}/review`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data.data;
};

export async function submitManagerSignedDocument(
  contractId: number,
  formData: FormData
) {
  const res = await api.post(
    `/manager/contracts/${contractId}/upload-signed`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
};

export const submitManagerContractSignature = async (
  id: number,
  payload:
    | { signature_type: "canvas"; signature_data: string }
    | { signature_type: "upload"; signature_file: File },
): Promise<ManagerContractDetail> => {
  if (payload.signature_type === "upload") {
    const formData = new FormData();
    formData.append("signature_type", payload.signature_type);
    formData.append("signature_file", payload.signature_file);

    const res = await api.post<{ data: ManagerContractDetail }>(
      `${BASE_PATH}/${id}/sign`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data.data;
  }

  const res = await api.post<{ data: ManagerContractDetail }>(
    `${BASE_PATH}/${id}/sign`,
    payload,
  );
  return res.data.data;
};