export interface StatusEntry {
    id: number;
    old_status: string;
    new_status: string;
    changed_by: string;
    created_at: string;
}

export interface FeedbackEntry {
    id: number;
    author: string;
    role: string;
    type: "approved" | "revised" | "revision" | "rejected" | "standard" | "urgent" | "resolved";
    typeLabel: string;
    message: string;
    date: string;
    review_document_url?: string | null;
}