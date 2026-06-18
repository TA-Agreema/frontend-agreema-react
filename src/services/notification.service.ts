import api from "@/lib/axios";

export interface AppNotification {
  id: number;
  contract_id: number | null;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  contract?: {
    id: number;
    contract_number: string;
    title: string;
    status: string;
  } | null;
}

export interface NotificationResponse {
  data: AppNotification[];
  unread_count: number;
}

export const getNotifications = async (): Promise<NotificationResponse> => {
  const res = await api.get("/notifications");
  return res.data;
};

export const markRead = async (id: number): Promise<void> => {
  await api.patch(`/notifications/${id}/read`);
};

export const markAllRead = async (): Promise<void> => {
  await api.patch("/notifications/read-all");
};

export const deleteNotification = async (id: number): Promise<void> => {
  await api.delete(`/notifications/${id}`);
};