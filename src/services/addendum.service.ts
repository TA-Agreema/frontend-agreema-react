import api from "@/lib/axios";
import type { AddendumPayload, ContractAddendumData } from "@/types/addendum";

const BASE_PATH = "/contracts";

export const createAddendum = async (
    contractId: number,
    payload: AddendumPayload,
): Promise<ContractAddendumData> => {
    const form = new FormData();
    form.append("title", payload.title);
    form.append("addendum_number", payload.addendum_number);
    if (payload.description) form.append("description", payload.description);
    if (payload.document) form.append("document", payload.document);
    if (payload.effective_date) form.append("effective_date", payload.effective_date);

    const res = await api.post<{ data: ContractAddendumData }>(
        `${BASE_PATH}/${contractId}/addendums`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
    );
    return res.data.data;
};
