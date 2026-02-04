export interface Contract {
    id: number;
    contractNumber: string;
    title: string;
    startDate: string;
    endDate: string;
    status: "draft" | "active" | "expired" | "terminated";
    templateId: number;
    createdBy: number;
    parentContractId?: number;
    createdAt: string;
    updatedAt: string;
}