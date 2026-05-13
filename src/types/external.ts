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
        signers: Array<{
            id: number;
            type: string;
            name: string;
            title: string;
            email: string;
            reviews: Array<{
                id: number;
                status: string;
                notes: string;
                iteration: number;
                created_at: string;
                user?: { name: string };
            }>;
        }>;
    };
}