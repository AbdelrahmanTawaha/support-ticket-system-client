import { TicketStatus } from "./ticket-status";

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status:  TicketStatus;   
  createdAt: string;
  updatedAt?: string | null;

  clientName?: string | null;
  assignedEmployeeName?: string | null;
  productName?: string | null;
}
  