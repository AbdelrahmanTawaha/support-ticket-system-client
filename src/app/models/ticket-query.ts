import { TicketStatus } from "./ticket-status";

export interface TicketQuery {
  pageNumber: number;
  pageSize: number;

  searchTerm?: string;
  status?: TicketStatus | '';

  
  clientId?: number | null;
  assignedEmployeeId?: number | null;
}
