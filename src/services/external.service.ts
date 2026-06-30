import api from "@/lib/axios";
import type { ExternalContractDetail } from "@/types/external";

export const fetchExternalContractPreview = async (
  token: string
): Promise<ExternalContractDetail> => {
  const response = await api.get(`/external/contracts/preview?token=${token}`);
  return response.data;
};

export const downloadExternalContractPdf = async (token: string) => {
  const res = await api.get<Blob>(`/external/contracts/download?token=${token}`, {
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

export const submitExternalContractReview = async (payload: {
  token: string;
  status: "approved" | "revised" | "confirmed";
  notes?: string;
  reviewDocument?: File | null;
}) => {
  const formData = new FormData();
  formData.append("token", payload.token);
  formData.append("status", payload.status);
  if (payload.notes) formData.append("notes", payload.notes);
  if (payload.reviewDocument) formData.append("review_document", payload.reviewDocument);

  const response = await api.post("/external/contracts/review", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export interface ExternalSignatureResponse {
  message: string;
  // Status kontrak setelah TTD — 'active' berarti semua sudah TTD
  contract_status: "active" | "review" | "approved" | string;
};

export async function submitExternalSignedDocument(
  token: string,
  formData: FormData
) {
  const res = await api.post(`/external/contracts/upload-signed`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      "X-External-Token": token,
    },
  });
  return res.data;
};

export async function submitExternalContractSignature(
  token: string,
  payload:
    | { signature_type: "canvas"; signature_data: string }
    | { signature_type: "upload"; signature_file: File }
): Promise<ExternalSignatureResponse> {
  const formData = new FormData();
  formData.append("token", token);
  formData.append("signature_type", payload.signature_type);

  if (payload.signature_type === "canvas") {
    formData.append("signature_data", payload.signature_data);
  } else {
    formData.append("signature_file", payload.signature_file);
  }

  const res = await api.post<ExternalSignatureResponse>(
    "/external/contracts/sign",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return res.data;
}