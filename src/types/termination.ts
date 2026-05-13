export interface Termination {
    id: number;
    contract_id: number;
    termination_number: string;
    title: string;
    termination_reason: string;
    termination_note?: string;
    termination_document_path?: string;
    effective_date: string;
    created_at: string;
}

export interface StoreTerminationPayload {
    termination_number: string;
    title: string;
    termination_reason: string;
    termination_note?: string;
    effective_date: string;
    document?: File;
}
