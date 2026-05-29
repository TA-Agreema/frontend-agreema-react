import api from "@/lib/axios";
import type { Termination, StoreTerminationPayload } from "@/types/termination";

export const fetchTerminations = async (contractId: number): Promise<Termination[]> => {
    const response = await api.get(`/contracts/${contractId}/terminations`);
    return response.data.data;
};

export const createTermination = async (
    contractId: number,
    payload: StoreTerminationPayload
): Promise<Termination> => {
    const formData = new FormData();
    formData.append("termination_number", payload.termination_number);
    formData.append("title", payload.title);
    formData.append("termination_reason", payload.termination_reason);
    formData.append("effective_date", payload.effective_date);
    if (payload.termination_note) {
        formData.append("termination_note", payload.termination_note);
    }
    if (payload.document) {
        formData.append("document", payload.document);
    }

    const response = await api.post(`/contracts/${contractId}/terminations`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return response.data.data;
};

export const deleteTermination = async (
    contractId: number,
    terminationId: number
): Promise<void> => {
    await api.delete(`/contracts/${contractId}/terminations/${terminationId}`);
};
