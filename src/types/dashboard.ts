export interface DashboardMetrics {
  total_contracts?: number;
  active_contracts?: number; // legacy?
  total_system_active?: number;
  my_contracts?: number;
  action_needed?: number;
  waiting_review?: number;
  waiting_signature?: number;
  waiting_approval?: number;
  approved?: number;
  approved_this_month?: number;
  revision_requested_this_month?: number;
}

export interface DashboardDistribution {
  status: string;
  total: number;
}

export interface DashboardLog {
  id: number;
  contract_id: number;
  old_status: string;
  new_status: string;
  changed_by: number;
  created_at: string;
  contract?: { id: number; title: string; contract_number: string };
  changed_by_user?: { id: number; name: string };
}

export interface DashboardExpiringContract {
  id: number;
  title: string;
  contract_number: string;
  end_date: string;
  parties?: any[];
}

export interface DashboardTopWaiting {
  id: number;
  title: string;
  contract_number: string;
  created_by: number;
  created_at: string;
  creator?: { id: number; name: string };
}

export interface DashboardData {
  role: 'admin' | 'hrd' | 'manager' | 'internal';
  metrics: DashboardMetrics;
  distribution?: DashboardDistribution[];
  system_distribution?: DashboardDistribution[];
  recent_logs?: DashboardLog[];
  expiring_contracts?: DashboardExpiringContract[];
  top_waiting?: DashboardTopWaiting[];
}
