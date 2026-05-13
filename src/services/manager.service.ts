import api from "@/lib/axios";
import type { ReviewHistory } from "@/types/manager";
import type { ContractRow } from "@/pages/contracts/ContractListPage";

const BASE_PATH = "/manager/contracts";

export interface ManagerContractDetail extends ContractRow {
  content?: string;
  reviews?: ReviewHistory[];
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

export const fetchManagerContractDetail = async (
  id: number,
): Promise<ManagerContractDetail> => {
  const res = await api.get<{ data: ManagerContractDetail }>(
    `${BASE_PATH}/${id}`,
  );
  return res.data.data;
};

export const submitContractReview = async (
  id: number,
  payload: { status: "approved" | "revised" | "rejected"; notes: string },
): Promise<ManagerContractDetail> => {
  const res = await api.post<{ data: ManagerContractDetail }>(
    `${BASE_PATH}/${id}/review`,
    payload,
  );
  return res.data.data;
};
