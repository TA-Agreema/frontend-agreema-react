export interface ExternalSignerSignature {
  id: number;
  signature_type: "canvas" | "upload";
  signature_path: string;
  signed_at: string;
  iteration: number;
}

export interface ExternalContractDetail {
    message: string;
    iteration: number;
    signer_id: number;
    data: {
        id: number;
        contract_number: string;
        title: string;
        content: string;
        status: string;
        created_by: string;
        template_id: number;
        signed_document_url?: string | null;
        signers: Array<{
            id: number;
            type: string;
            signer_type: "internal" | "external";
            name: string;
            title: string;
            email: string;
            signer_name?: string | null;
            signer_role?: string | null;
            external_email?: string | null;
            user?: { name: string; job_title?: string | null } | null;
            signatures?: ExternalSignerSignature[];
            reviews: Array<{
                id: number;
                status: string;
                notes: string;
                iteration: number;
                reviewed_at: string;
                user?: { name: string };
                review_document_url?: string | null;
            }>;
        }>;
    };
}