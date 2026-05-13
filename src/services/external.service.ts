import api from "@/lib/axios";
import type { ExternalContractDetail } from "@/types/external";

export const fetchExternalContractPreview = async (
  token: string
): Promise<ExternalContractDetail> => {
  const response = await api.get(`/external/contracts/preview?token=${token}`);
  return response.data;
};

export const submitExternalContractReview = async (payload: {
  token: string;
  status: "approved" | "revised";
  notes?: string;
}) => {
  const response = await api.post("/external/contracts/review", payload);
  return response.data;
};
