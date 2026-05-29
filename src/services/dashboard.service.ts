import api from "@/lib/axios";
import type { DashboardData } from '../types/dashboard';

export const fetchDashboardData = async (): Promise<DashboardData> => {
  const response = await api.get('/dashboard');
  return response.data;
};
