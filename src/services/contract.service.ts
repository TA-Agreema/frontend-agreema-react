import api from "@/lib/axios";
import type { ContractRow } from "@/pages/contracts/ContractListPage";

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
  signers?: Array<{
    type: string;
    name: string;
    title?: string;
    email?: string;
    noUserAccount?: boolean;
  }>;
}

export type UpdateContractPayload = Partial<CreateContractPayload>;

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

export const fetchContracts = async (
  search?: string,
): Promise<ContractRow[]> => {
  const res = await api.get<{ data: ContractRow[] }>(BASE_PATH, {
    params: search ? { search } : {},
  });
  return res.data.data;
};

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
