export interface ReviewHistory {
    id: number;
    contract_id: number;
    iteration: number;
    user_id: number;
    status: "approved" | "revised" | "rejected";
    notes?: string;
    created_at: string;
    user?: {
        name: string;
        job_title?: string;
    };
}