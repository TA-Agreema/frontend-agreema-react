import api from "@/lib/axios";
import type { ContractRow } from "@/pages/contracts/ContractListPage";
import type { PaperSize } from "@/lib/editor-paper";

export interface InternalSigner {
  id: number;
  name: string;
  job_title?: string | null;
  email?: string | null;
}

const BASE_PATH = "/contracts";

export interface CreateContractPayload {
  contract_number?: string | null;
  external_contract_number?: string | null;
  title: string;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
  template_id?: number | null;
  category_id?: number | null;
  parent_contract_id?: number | null;
  content?: string | null;
  paper_size?: PaperSize | null;
  field_values?: Array<{
    field_definition_id: number;
    value?: string | null;
  }>;
  signers?: Array<{
    type: string;
    name: string;
    title?: string;
    email?: string;
    noUserAccount?: boolean;
  }>;
}

export type UpdateContractPayload = Partial<CreateContractPayload>;

export interface CreatePartnerContractPayload {
  title: string;
  contract_number: string;
  external_contract_number?: string | null;
  partner_name: string;
  status: "signed" | "active";
  start_date?: string | null;
  end_date?: string | null;
  document: File;
  notes?: string | null;
}
 
export const createPartnerContract = async (
  payload: CreatePartnerContractPayload,
): Promise<ContractRow> => {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("contract_number", payload.contract_number);
  if (payload.external_contract_number) formData.append("external_contract_number", payload.external_contract_number);
  formData.append("partner_name", payload.partner_name);
  formData.append("status", payload.status);
  if (payload.start_date) formData.append("start_date", payload.start_date);
  if (payload.end_date) formData.append("end_date", payload.end_date);
  formData.append("document", payload.document);
  if (payload.notes) formData.append("notes", payload.notes);
 
  const res = await api.post<{ data: ContractRow }>("/partner-contracts", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
};


export const generateContractNumber = async (
  categoryId?: number | null,
): Promise<string> => {
  const url = categoryId
    ? `${BASE_PATH}/generate-number?category_id=${categoryId}`
    : `${BASE_PATH}/generate-number`;
  const res = await api.get<{ contract_number: string }>(url);
  return res.data.contract_number;
};

export const fetchSigners = async (): Promise<InternalSigner[]> => {
  const res = await api.get<{ data: InternalSigner[] }>("/signers/internal");
  return res.data.data;
};

export const fetchPartners = async (): Promise<
  { id: number; display_name: string }[]
> => {
  const res = await api.get<{ data: { id: number; display_name: string }[] }>(
    "/partners",
  );
  return res.data.data;
};

// Mengambil daftar kontrak
export const fetchContracts = async (
  search?: string,
  archive?: boolean,
  includeExternal?: boolean,
): Promise<ContractRow[]> => {
  const params: Record<string, any> = {};
  if (search) params.search = search;
  if (archive !== undefined) params.archive = archive;
  if (includeExternal) params.include_external = true;

  const res = await api.get<{ data: ContractRow[] }>(BASE_PATH, { params });
    return res.data.data;
  };

// Mengambil daftar kontrak mitra eksternal
export const fetchPartnerContracts = async (
  search?: string,
): Promise<ContractRow[]> => {
  const params: Record<string, any> = {};
  if (search) params.search = search;

  const res = await api.get<{ data: ContractRow[] }>("/partner-contracts", { params });
  return res.data.data;
}; 

// Mengambil detail kontrak berdasarkan ID
export const fetchContract = async (id: number): Promise<ContractRow> => {
  const res = await api.get<{ data: ContractRow }>(`${BASE_PATH}/${id}`);
  return res.data.data;
};

export const createContract = async (
  payload: CreateContractPayload,
): Promise<ContractRow> => {
  const res = await api.post<{ data: ContractRow }>(BASE_PATH, payload);
  return res.data.data;
};

export const updateContract = async (
  id: number,
  payload: UpdateContractPayload,
): Promise<ContractRow> => {
  const res = await api.patch<{ data: ContractRow }>(
    `${BASE_PATH}/${id}`,
    payload,
  );
  return res.data.data;
};

export const deleteContract = async (id: number): Promise<void> => {
  await api.delete(`${BASE_PATH}/${id}`);
};

export const downloadContractPdf = async (id: number) => {
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

export const updateContractStatus = async (
  id: number,
  status: string,
): Promise<ContractRow> => {
  const res = await api.patch<{ data: ContractRow }>(
    `${BASE_PATH}/${id}/toggle-status`,
    { status },
  );
  return res.data.data;
};

export const submitContract = async (id: number): Promise<ContractRow> => {
  const res = await api.post<{ data: ContractRow }>(
    `${BASE_PATH}/${id}/submit`,
  );
  return res.data.data;
};
