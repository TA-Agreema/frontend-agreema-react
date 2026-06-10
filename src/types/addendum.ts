export interface AddendumPayload {
    title: string;
    addendum_number: string;
    description?: string;
    document?: File | null;
    effective_date?: string;
}

export interface ContractAddendumData {
    id: number;
    contract_id: number;
    addendum_number: string;
    title: string;
    description?: string;
    document_path?: string;
    effective_date?: string;
    created_at: string;
}
