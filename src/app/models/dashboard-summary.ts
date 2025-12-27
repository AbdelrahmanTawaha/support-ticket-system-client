export interface DashboardSummary {
  statusCounts: Record<string, number>;
  trend: { day: string; count: number }[];
  topEmployees: {
    id: number;
    name: string;
    assignedCount: number;
    closedCount: number;
    resolvedCount: number;
     imageUrl?: string | null;
  }[];
  ticketsByProduct: {
    productId: number;
    productName: string;
    count: number;
  }[];
  
}
